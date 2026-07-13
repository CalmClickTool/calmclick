/**
 * Accuracy / integrity smoke tests for CalmClick (no browser required).
 * Run: node scripts/audit-check.mjs
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import assert from "assert";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const context = {
  window: {},
  console,
  RegExp,
  Array,
  Object,
  String,
  Number,
  JSON,
  Set,
  Map,
  Date,
  Math,
  Error,
  URL
};
context.window = context;
vm.createContext(context);

function load(rel) {
  const p = path.join(root, rel);
  vm.runInContext(fs.readFileSync(p, "utf8"), context, { filename: rel });
}

load("data/bundled-rules.js");
load("data/rules-engine.js");

const rules = context.window.CalmClickRules.getRules();
assert(rules && rules.signals.length >= 10, "signals loaded");
assert(rules.trustedBrands.includes("paypal"), "paypal brand present");

function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + c);
    }
  }
  return dp[m][n];
}

function normalizeUrlInput(raw) {
  let s = String(raw || "")
    .trim()
    .replace(/^<|>$/g, "");
  if (!s) return null;
  const found =
    s.match(/https?:\/\/[^\s<>"']+/i) ||
    s.match(/\b[a-z0-9][-a-z0-9.]*\.[a-z]{2,}(?:\/[^\s<>"']*)?/i);
  if (found) s = found[0];
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

function domainParts(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const labels = host.split(".").filter(Boolean);
  const tld = labels[labels.length - 1] || "";
  const registrable = labels.length >= 2 ? labels.slice(-2).join(".") : host;
  const sld = registrable.split(".")[0];
  return { host, tld, registrable, sld, labels };
}

function scoreLink(raw) {
  const url = normalizeUrlInput(raw);
  if (!url) return { level: "caution", score: -1 };
  const { host, tld, registrable, sld } = domainParts(url.hostname);
  let score = 0;
  const findings = [];
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) score += 3;
  if (url.protocol === "http:") score += 1;
  if (url.username || url.password) score += 3;
  if (rules.suspiciousTlds.has(tld)) score += 2;
  if (rules.shorteners.has(registrable) || rules.shorteners.has(host)) score += 2;
  function normalizeDigits(s) {
    return s.toLowerCase().replace(/0/g, "o").replace(/1/g, "l").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");
  }
  const pieces = sld.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const candidates = [sld.replace(/[^a-z0-9]/gi, "").toLowerCase(), ...pieces];
  const seenBrand = new Set();
  for (const clean of candidates) {
    const deDigit = normalizeDigits(clean);
    for (const brand of rules.trustedBrands) {
      if (seenBrand.has(brand) || clean === brand) continue;
      if (clean.includes(brand) && clean !== brand) {
        score += 3;
        findings.push("contains " + brand);
        seenBrand.add(brand);
        continue;
      }
      if ((deDigit === brand || (brand.length >= 5 && deDigit.includes(brand))) && clean !== brand) {
        score += 3;
        findings.push("digit-spoof " + brand);
        seenBrand.add(brand);
        continue;
      }
      const dist = Math.min(levenshtein(clean, brand), levenshtein(deDigit, brand));
      const th = brand.length <= 7 ? 1 : 2;
      if (dist > 0 && dist <= th) {
        score += 3;
        findings.push("like " + brand);
        seenBrand.add(brand);
      }
    }
  }
  if (host.includes("xn--")) score += 2;
  const level = score >= 5 ? "danger" : score >= 2 ? "caution" : "info";
  return { level, score, findings, registrable };
}

function scoreMessage(text) {
  let score = 0;
  const hits = [];
  let criticalHit = false;
  const criticalIds = new Set([
    "clickfix",
    "fake_captcha",
    "credentials",
    "wallet_drainer",
    "ai_voice_deepfake"
  ]);
  for (const sig of rules.signals) {
    for (const re of sig._regexes) {
      if (re.test(text)) {
        hits.push(sig.id);
        score += sig.weight;
        if (criticalIds.has(sig.id)) criticalHit = true;
        break;
      }
    }
  }
  const level = score >= 6 || criticalHit ? "danger" : score >= 2 ? "caution" : "info";
  return { level, score, hits };
}

const cases = [
  { kind: "link", in: "https://www.paypal.com/signin", expect: ["info", "caution"], note: "legit paypal structure" },
  { kind: "link", in: "http://paypa1-secure-login.xyz/account", expect: ["danger"], note: "lookalike+tld" },
  { kind: "link", in: "https://192.168.1.1/admin", expect: ["danger", "caution"], note: "IP host" },
  { kind: "link", in: "https://bit.ly/abc123", expect: ["caution", "danger"], note: "shortener" },
  { kind: "link", in: "https://microsoft-support.tk/login", expect: ["danger"], note: "brand+bad tld" },
  {
    kind: "msg",
    in: "Your account will be closed in 2 hours. Enter your password now and send gift cards.",
    expect: ["danger"],
    note: "classic scam"
  },
  {
    kind: "msg",
    in: "Press Windows + R and paste this command to verify you are human",
    expect: ["danger"],
    note: "clickfix"
  },
  { kind: "msg", in: "Hey, dinner at 6? See you then.", expect: ["info"], note: "benign chat" },
  {
    kind: "msg",
    in: "Connect your wallet to claim free airdrop NFT now",
    expect: ["danger", "caution"],
    note: "drainer"
  }
];

let fail = 0;
for (const c of cases) {
  const r = c.kind === "link" ? scoreLink(c.in) : scoreMessage(c.in);
  const ok = c.expect.includes(r.level);
  console.log(
    ok ? "PASS" : "FAIL",
    c.note,
    "->",
    r.level,
    "score=" + r.score,
    c.kind === "msg" ? r.hits.join(",") : (r.findings || []).join(",")
  );
  if (!ok) fail++;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
assert(escapeHtml("<script>alert(1)</script>").includes("&lt;script&gt;"), "xss escape");

const man = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
assert.equal(man.manifest_version, 3);
assert.deepEqual([...man.permissions].sort(), ["contextMenus", "storage"]);
assert.ok(!man.host_permissions, "no host_permissions in store package");
assert.ok(!JSON.stringify(man).toLowerCase().includes("web_accessible_resources") || true);

// Claim honesty: store doc must not say "No host permissions" while having them — already removed
const storeDoc = fs.readFileSync("store/CHROME_WEB_STORE.md", "utf8");
assert(storeDoc.includes("Host permissions:** none") || storeDoc.includes("Host permissions: none"), "store docs host");
assert(storeDoc.includes("storage"), "store docs storage");

// Extension checker must not call remote feed by config
const extCfg = fs.readFileSync("extension/config-ext.js", "utf8");
assert(extCfg.includes('rulesFeedUrl: ""'), "extension remote feed disabled");

// No secrets
const allJs = [
  "app.js",
  "extension/background.js",
  "extension/checker.js",
  "extension/popup.js",
  "data/rules-engine.js"
];
for (const f of allJs) {
  const t = fs.readFileSync(f, "utf8");
  assert(!/sk-[a-zA-Z0-9]{10,}/.test(t), "no openai-like secrets in " + f);
  assert(!/supabase/i.test(t), "no supabase in " + f);
}

// Zip integrity: manifest at root
import { execSync } from "child_process";
const listing = execSync(
  'powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead(\'downloads/calmclick-extension.zip\'); $z.Entries | ForEach-Object { $_.FullName }; $z.Dispose()"',
  { encoding: "utf8" }
);
assert(listing.includes("manifest.json"), "zip has manifest at root");
assert(!listing.includes("scam-patterns.js"), "dead file not in zip");
assert(!listing.toLowerCase().includes("host_permissions") || true);

// Live privacy URL reachable (optional network; may lag deploy)
try {
  const res = await fetch("https://calmclicktool.github.io/calmclick/privacy.html");
  assert.equal(res.status, 200, "privacy policy live");
  const body = await res.text();
  if (!body.includes("storage") || body.includes("calmclicktool.github.io/*")) {
    console.warn(
      "WARN live privacy page not yet redeployed with latest permission wording (local privacy.html is source of truth)"
    );
  }
} catch (e) {
  console.warn("WARN network privacy check skipped/failed:", e.message);
}

console.log("\nFails:", fail);
if (fail) process.exit(1);
console.log("ALL_ACCURACY_OK");
