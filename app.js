/* CalmClick — all analysis runs locally in the browser */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function rules() {
    if (window.CalmClickRules) return window.CalmClickRules.getRules();
    return window.CALMCLICK_RULES || null;
  }

  function trustedBrands() {
    const r = rules();
    return (r && r.trustedBrands) || [];
  }

  function suspiciousTlds() {
    const r = rules();
    return (r && r.suspiciousTlds) || new Set();
  }

  function shorteners() {
    const r = rules();
    return (r && r.shorteners) || new Set();
  }

  function scamSignals() {
    const r = rules();
    if (r && r.signals) return r.signals;
    return (window.CALMCLICK_SCAM && window.CALMCLICK_SCAM.signals) || [];
  }

  // ——— UI: tabs ———
  function initTabs() {
    const tabs = $$(".tool-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tool = tab.dataset.tool;
        tabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", on ? "true" : "false");
        });
        $$(".tool-panel").forEach((panel) => {
          const on = panel.id === `panel-${tool}`;
          panel.classList.toggle("is-active", on);
          panel.hidden = !on;
        });
      });
    });
  }

  // ——— Text size ———
  function initTextSize() {
    const btn = $("#textSizeBtn");
    const key = "calmclick-text-large";
    const apply = (on) => {
      document.body.classList.toggle("text-large", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      try {
        localStorage.setItem(key, on ? "1" : "0");
      } catch (_) { /* ignore */ }
    };
    try {
      apply(localStorage.getItem(key) === "1");
    } catch (_) { /* ignore */ }
    btn.addEventListener("click", () => {
      apply(!document.body.classList.contains("text-large"));
    });
  }

  // ——— Helpers ———
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeUrlInput(raw) {
    let s = String(raw || "").trim();
    if (!s) return null;
    // strip common wrappers
    s = s.replace(/^<|>$/g, "").replace(/^["']|["']$/g, "");
    // if user pasted "go to example.com" grab first url-ish token
    const found = s.match(/https?:\/\/[^\s<>"']+/i) || s.match(/\b[a-z0-9][-a-z0-9.]*\.[a-z]{2,}(?:\/[^\s<>"']*)?/i);
    if (found) s = found[0];
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    try {
      return new URL(s);
    } catch {
      return null;
    }
  }

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  function domainParts(hostname) {
    const host = hostname.toLowerCase().replace(/\.$/, "");
    const labels = host.split(".").filter(Boolean);
    const tld = labels[labels.length - 1] || "";
    // crude eTLD+1 for common cases
    let registrable = host;
    if (labels.length >= 2) {
      const multi = new Set(["co.uk", "com.au", "co.jp", "com.br", "co.in", "com.mx"]);
      const lastTwo = labels.slice(-2).join(".");
      if (multi.has(lastTwo) && labels.length >= 3) {
        registrable = labels.slice(-3).join(".");
      } else {
        registrable = lastTwo;
      }
    }
    const sld = registrable.split(".")[0];
    return { host, tld, registrable, sld, labels };
  }

  function hasHomoglyphs(host) {
    // non-ascii or mixed weirdness
    if (/[^\x00-\x7F]/.test(host)) return true;
    // digits that often spoof letters in brands
    return false;
  }

  function normalizeDigits(s) {
    return s
      .toLowerCase()
      .replace(/0/g, "o")
      .replace(/1/g, "l")
      .replace(/3/g, "e")
      .replace(/4/g, "a")
      .replace(/5/g, "s")
      .replace(/7/g, "t");
  }

  function lookalikeHits(sld) {
    const hits = [];
    // Check full SLD and each hyphen piece (paypa1-secure-login)
    const pieces = String(sld)
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter(Boolean);
    const candidates = [sld.replace(/[^a-z0-9]/gi, "").toLowerCase(), ...pieces.map((p) => p.replace(/[^a-z0-9]/gi, ""))];

    for (const clean of candidates) {
      if (!clean) continue;
      const deDigit = normalizeDigits(clean);
      for (const brand of trustedBrands()) {
        if (clean === brand) continue;
        if (clean.includes(brand) && clean !== brand) {
          hits.push({ brand, reason: `contains “${brand}” but is not the official domain` });
          continue;
        }
        if (deDigit === brand && clean !== brand) {
          hits.push({ brand, reason: `looks like “${brand}” with numbers swapped for letters` });
          continue;
        }
        if (deDigit.includes(brand) && clean !== brand && brand.length >= 5) {
          hits.push({ brand, reason: `contains a “${brand}”-like spelling with number tricks` });
          continue;
        }
        const dist = Math.min(levenshtein(clean, brand), levenshtein(deDigit, brand));
        const threshold = brand.length <= 4 ? 1 : brand.length <= 7 ? 1 : 2;
        if (dist > 0 && dist <= threshold) {
          hits.push({ brand, reason: `looks similar to “${brand}” (possible typo‑squat)` });
        }
      }
    }
    // Dedupe by brand
    const seen = new Set();
    return hits.filter((h) => {
      if (seen.has(h.brand)) return false;
      seen.add(h.brand);
      return true;
    });
  }

  /** Free hosts often abused for phishing kits (2024–2026). */
  const ABUSE_HOST_MARKERS = [
    "web.app", "firebaseapp.com", "pages.dev", "netlify.app", "vercel.app",
    "github.io", "gitlab.io", "blogspot.com", "workers.dev", "trycloudflare.com",
    "ngrok.io", "ngrok-free.app", "loca.lt", "duckdns.org", "000webhostapp.com",
    "infinityfreeapp.com", "weebly.com", "square.site", "godaddysites.com"
  ];

  // ——— Link analysis ———
  function analyzeLink(raw) {
    const url = normalizeUrlInput(raw);
    if (!url) {
      return {
        level: "caution",
        title: "We couldn’t read that as a web address",
        body: "Try pasting the full link, like https://www.example.com. If it came from a message, right‑click the link and choose “Copy link.”",
        findings: [],
        meta: {},
        next: ["Double‑check you copied the whole link.", "If you’re unsure, don’t open it."]
      };
    }

    const { host, tld, registrable, sld } = domainParts(url.hostname);
    const findings = [];
    let score = 0;

    // IP address host
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":")) {
      score += 3;
      findings.push("Uses a raw number address (IP) instead of a normal website name — common in phishing.");
    }

    // Not HTTPS
    if (url.protocol === "http:") {
      score += 1;
      findings.push("Uses http (not https). Login or payment pages should almost always use the lock / https.");
    }

    // Credentials in URL
    if (url.username || url.password) {
      score += 3;
      findings.push("The link includes a username/password inside the address — highly unusual and risky.");
    }

    // @ trick: https://bank.com@evil.com/
    if (url.href.includes("@") && url.username) {
      score += 3;
      findings.push("Contains an “@” pattern that can hide the real destination.");
    }

    // Suspicious TLD
    if (suspiciousTlds().has(tld)) {
      score += 2;
      findings.push(`Ends with .${tld}, which scammers use more often than big banks or stores.`);
    }

    // Shortener
    if (shorteners().has(registrable) || shorteners().has(host)) {
      score += 2;
      findings.push("This is a shortened link. The real destination is hidden until you open it (or expand it with a trusted tool).");
    }

    // Free hosting / tunneling often used for phishing kits
    for (const marker of ABUSE_HOST_MARKERS) {
      if (host === marker || host.endsWith("." + marker)) {
        // github.io can be legit — only warn, don't max score alone
        score += marker === "github.io" || marker === "pages.dev" ? 1 : 2;
        findings.push(
          `Hosted on “${marker}”, a free/share host. Banks and big companies almost never use these for real logins.`
        );
        break;
      }
    }

    // Double extension style paths / exe-looking
    if (/\.(exe|scr|msi|bat|cmd|ps1|js|vbs|apk)(\?|$)/i.test(url.pathname)) {
      score += 3;
      findings.push("Path points at a program/install file. Be very careful downloading executables from unexpected links.");
    }

    // Punycode already handled below; also flag userinfo @ trick without username parse
    if (/https?:\/\/[^/]*@/i.test(raw)) {
      score += 3;
      findings.push("Uses an “@” in the web address, which can hide where the link really goes.");
    }

    // Very long / many subdomains
    if (domainParts(host).labels.length >= 4) {
      score += 1;
      findings.push("Has many subdomain pieces (words before the main site name). That can make a fake site look official.");
    }

    // Lookalikes
    const looks = lookalikeHits(sld);
    for (const hit of looks.slice(0, 3)) {
      score += 3;
      findings.push(`Domain “${registrable}” ${hit.reason}. Official sites rarely need extra words in the name.`);
    }

    // Brand name only in path/query while domain is unrelated
    const full = url.href.toLowerCase();
    for (const brand of trustedBrands()) {
      if (full.includes(brand) && !host.includes(brand) && sld !== brand) {
        score += 2;
        findings.push(`Mentions “${brand}” in the link text/path, but the real website name is “${registrable}.”`);
        break;
      }
    }

    // Punycode / internationalized domain
    if (host.includes("xn--") || hasHomoglyphs(host)) {
      score += 2;
      findings.push("Uses special international characters in the name, which can look like a familiar brand but go somewhere else.");
    }

    // Data / javascript schemes already blocked by URL parser with https force, but check original
    if (/^\s*javascript:/i.test(raw) || /^\s*data:/i.test(raw)) {
      score += 4;
      findings.push("This is not a normal website link (script/data). Do not open it.");
    }

    // Excessive length
    if (url.href.length > 200) {
      score += 1;
      findings.push("Unusually long link — sometimes used to hide the real site among gibberish.");
    }

    let level;
    let title;
    let body;
    if (score >= 5) {
      level = "danger";
      title = "Be careful — this link looks risky";
      body =
        "Several warning signs showed up. Do not enter passwords, codes, or card numbers here. This is a pattern check, not a live website safety scan.";
    } else if (score >= 2) {
      level = "caution";
      title = "Pause — a few things look off";
      body = "It might still be legitimate, but double‑check before signing in or paying.";
    } else {
      level = "info";
      title = "No major red flags in the address";
      body =
        "The link structure looks ordinary. That does not prove the whole website is safe — only that we didn’t see classic URL tricks.";
    }

    const next =
      level === "danger"
        ? [
            "Do not click it if you can avoid it.",
            "If it claims to be your bank, open a new tab and type the bank’s address yourself (or use your bookmark).",
            "Ask a trusted person before sending money or personal info.",
            "Delete or ignore unexpected “urgent” messages that pushed this link."
          ]
        : level === "caution"
          ? [
              "Hover or re‑read the domain name out loud: does it match the real company?",
              "Prefer opening the service from your own bookmark.",
              "Never type a password on a page you reached from a surprise text or email without verifying."
            ]
          : [
              "Still only log in if you expected this site.",
              "If the message felt pushy or scary, verify with the company another way.",
              "Keep your browser updated for extra protection."
            ];

    return {
      level,
      title,
      body,
      findings,
      meta: {
        "Shown destination": url.href,
        "Website name": registrable,
        "Full host": host,
        Protocol: url.protocol.replace(":", "").toUpperCase()
      },
      next
    };
  }

  function renderResult(el, result) {
    const levelClass =
      result.level === "danger"
        ? "result-danger"
        : result.level === "caution"
          ? "result-caution"
          : result.level === "info"
            ? "result-info"
            : "result-safe";

    const badge =
      result.level === "danger" ? "🛑" : result.level === "caution" ? "⚠️" : result.level === "info" ? "ℹ️" : "✅";

    let findingsHtml = "";
    if (result.findings && result.findings.length) {
      findingsHtml = `<p><strong>What we noticed:</strong></p><ul class="result-list">${result.findings
        .map((f) => `<li>${escapeHtml(f)}</li>`)
        .join("")}</ul>`;
    }

    let metaHtml = "";
    if (result.meta && Object.keys(result.meta).length) {
      metaHtml =
        `<div class="result-meta">` +
        Object.entries(result.meta)
          .map(([k, v]) => `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`)
          .join("") +
        `</div>`;
    }

    let nextHtml = "";
    if (result.next && result.next.length) {
      nextHtml = `<div class="do-next"><h3>What you should do</h3><ul class="result-list">${result.next
        .map((n) => `<li>${escapeHtml(n)}</li>`)
        .join("")}</ul></div>`;
    }

    el.hidden = false;
    el.className = `result ${levelClass}`;
    el.innerHTML = `
      <h3 class="result-title"><span class="result-badge" aria-hidden="true">${badge}</span><span>${escapeHtml(
        result.title
      )}</span></h3>
      <p>${escapeHtml(result.body)}</p>
      ${findingsHtml}
      ${metaHtml}
      ${result.extraHtml || ""}
      ${nextHtml}
    `;
    el.focus?.();
    el.setAttribute("tabindex", "-1");
    el.focus();
  }

  // ——— Message analysis ———
  function analyzeMessage(text) {
    const raw = String(text || "").trim();
    if (!raw) {
      return {
        level: "caution",
        title: "Paste a message first",
        body: "Copy the email, text, or chat message you’re unsure about, then paste it in the box.",
        findings: [],
        next: ["Include the subject line if you have it — scammers love scary subjects."]
      };
    }

    const signals = scamSignals();
    const hits = [];
    let score = 0;
    let criticalHit = false;
    // These alone mean “do not follow the instructions”
    const criticalIds = new Set([
      "clickfix",
      "fake_captcha",
      "credentials",
      "wallet_drainer",
      "ai_voice_deepfake"
    ]);

    for (const sig of signals) {
      const regs = sig._regexes || sig.patterns || [];
      for (const re of regs) {
        if (re && typeof re.test === "function" && re.test(raw)) {
          hits.push(sig.label);
          score += sig.weight || 1;
          if (criticalIds.has(sig.id)) criticalHit = true;
          break;
        }
      }
    }

    // URL presence
    const urls = raw.match(/https?:\/\/[^\s<>"']+/gi) || [];
    if (urls.length) {
      // analyze first url lightly
      const link = analyzeLink(urls[0]);
      if (link.level === "danger") {
        score += 3;
        hits.push("Contains a link with strong warning signs");
      } else if (link.level === "caution") {
        score += 1;
        hits.push("Contains a link that looks a bit unusual");
      }
    }

    // ALL CAPS shouting
    const letters = raw.replace(/[^a-zA-Z]/g, "");
    const caps = raw.replace(/[^A-Z]/g, "");
    if (letters.length > 20 && caps.length / letters.length > 0.55) {
      score += 1;
      hits.push("Lots of CAPITAL LETTERS — often used to create panic");
    }

    let level, title, body;
    if (score >= 6 || criticalHit) {
      level = "danger";
      title = "This looks like a scam or high‑pressure trap";
      body =
        "Serious scam patterns showed up. Treat it as dangerous until proven otherwise through a channel you trust. Pattern matching can miss brand‑new scams.";
    } else if (score >= 3) {
      level = "caution";
      title = "Be cautious — this has scam‑like signs";
      body = "It might be legitimate, but pressure tactics are a favorite tool of scammers. Verify before you act.";
    } else if (score >= 1) {
      level = "caution";
      title = "A couple of things to double‑check";
      body = "Not a clear scam by itself, but worth a second look before clicking or replying.";
    } else {
      level = "info";
      title = "No strong scam patterns found";
      body =
        "We didn’t match common scam wording. That is not a safety certificate — new scams appear all the time.";
    }

    const uniqueHits = [...new Set(hits)];

    return {
      level,
      title,
      body,
      findings: uniqueHits,
      meta: urls.length
        ? { "Links found": String(urls.length), "First link": urls[0] }
        : { "Links found": "0" },
      next:
        level === "danger" || level === "caution"
          ? [
              "Do not click links or open unexpected attachments.",
              "Do not pay with gift cards, crypto, or wire transfer because a message told you to.",
              "Contact the company using a phone number from your statement or their official site — not from this message.",
              "When in doubt, ask a trusted friend or family member before sending money."
            ]
          : [
              "If anything still feels “off,” trust that feeling and verify another way.",
              "Keep personal codes (2FA / banking) private — no legitimate support needs them."
            ]
    };
  }

  // ——— Error analysis ———
  function analyzeError(text) {
    const raw = String(text || "").trim();
    if (!raw) {
      return {
        level: "info",
        title: "Describe the error first",
        body: "Paste the message on the screen, or tap one of the common errors above.",
        findings: [],
        next: []
      };
    }

    const catalog = window.CALMCLICK_ERRORS || [];
    let best = null;
    for (const entry of catalog) {
      for (const re of entry.match) {
        if (re.test(raw)) {
          best = entry;
          break;
        }
      }
      if (best) break;
    }

    if (!best) {
      return {
        level: "info",
        title: "We don’t have a specific match yet",
        body: "That doesn’t mean it’s hopeless — most errors are temporary or need a simple restart.",
        findings: [
          "Write down the exact words (or take a screenshot).",
          "Note whether the internet works for other sites.",
          "Try restarting the browser, then the computer."
        ],
        next: [
          "Search the exact error text on your browser only if you stay on well‑known help sites.",
          "Avoid “call this number” ads that appear next to search results — many are scams.",
          "A local library, community tech volunteer, or trusted shop can help with the screenshot."
        ]
      };
    }

    return {
      level: best.id === "virus-scare" ? "danger" : "info",
      title: best.title,
      body: best.summary,
      findings: [best.meaning, best.safe],
      next: best.steps
    };
  }

  function initLinkTool() {
    const input = $("#linkInput");
    const btn = $("#checkLinkBtn");
    const out = $("#linkResult");
    const run = () => renderResult(out, analyzeLink(input.value));
    btn.addEventListener("click", run);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        run();
      }
    });

    // Pre-fill from ?link= or ?url= query (for extension / share)
    try {
      const params = new URLSearchParams(location.search);
      const pre = params.get("link") || params.get("url");
      if (pre) {
        input.value = pre;
        // switch to link tab
        $("#tab-link")?.click();
        run();
      }
    } catch (_) { /* ignore */ }
  }

  function initMessageTool() {
    const input = $("#messageInput");
    const btn = $("#checkMessageBtn");
    const out = $("#messageResult");
    btn.addEventListener("click", () => renderResult(out, analyzeMessage(input.value)));
  }

  function initErrorTool() {
    const input = $("#errorInput");
    const btn = $("#checkErrorBtn");
    const out = $("#errorResult");
    const chips = $("#errorChips");
    const catalog = window.CALMCLICK_ERRORS || [];

    // unique chip labels
    const seen = new Set();
    catalog.forEach((entry) => {
      (entry.chips || []).slice(0, 1).forEach((label) => {
        if (seen.has(label)) return;
        seen.add(label);
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = label;
        chip.addEventListener("click", () => {
          input.value = label;
          renderResult(out, analyzeError(label));
        });
        chips.appendChild(chip);
      });
    });

    btn.addEventListener("click", () => renderResult(out, analyzeError(input.value)));
  }

  // ——— How-tos ———
  function initHowtos() {
    const grid = $("#howtoGrid");
    const detail = $("#howtoDetail");
    const items = window.CALMCLICK_HOWTOS || [];

    items.forEach((item) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "howto-card";
      card.innerHTML = `
        <span class="card-icon" aria-hidden="true">${item.icon}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.blurb)}</span>
      `;
      card.addEventListener("click", () => showHowto(item));
      grid.appendChild(card);
    });

    function showHowto(item) {
      detail.hidden = false;
      detail.innerHTML = `
        <header>
          <h3>${item.icon} ${escapeHtml(item.title)}</h3>
          <button type="button" class="close-btn" id="howtoClose">Close</button>
        </header>
        <ol class="steps">
          ${item.steps
            .map(
              (s) =>
                `<li><strong>${escapeHtml(s.title)}</strong>${escapeHtml(s.body)}</li>`
            )
            .join("")}
        </ol>
        ${
          item.tip
            ? `<p class="howto-tip"><strong>Friendly tip:</strong> ${escapeHtml(item.tip)}</p>`
            : ""
        }
      `;
      $("#howtoClose", detail).addEventListener("click", () => {
        detail.hidden = true;
        detail.innerHTML = "";
      });
      detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ——— Protection list status + privacy-safe updates ———
  function formatWhen(ts) {
    if (!ts) return "not yet";
    try {
      return new Date(ts).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch {
      return "recently";
    }
  }

  function renderProtectionStatus(extraMsg) {
    const el = $("#protectionStatus");
    if (!el || !window.CalmClickRules) return;
    const s = window.CalmClickRules.getStatus();
    const sourceLabel =
      s.source === "remote"
        ? "updated list from CalmClick"
        : s.source === "cache"
          ? "saved update on this device"
          : s.source === "bundled"
            ? "built-in list (works offline)"
            : "unknown";

    el.innerHTML = `
      <div class="protection-grid">
        <div>
          <strong>Protection list</strong>
          <div class="protection-meta">Version <code>${escapeHtml(s.rulesVersion)}</code> · ${escapeHtml(sourceLabel)}</div>
          <div class="protection-meta">${s.signalCount} scam pattern groups · ${s.brandCount} brand names watched</div>
          <div class="protection-meta">Last list check: ${escapeHtml(formatWhen(s.lastCheckAt))}</div>
          ${extraMsg ? `<div class="protection-msg">${extraMsg}</div>` : ""}
        </div>
        <div class="protection-actions">
          <button type="button" class="btn btn-secondary" id="updateRulesBtn">Update protection lists</button>
          <p class="hint protection-hint">Only downloads a public pattern file. Never uploads what you paste.</p>
        </div>
      </div>
    `;

    const btn = $("#updateRulesBtn", el);
    if (btn) {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "Checking…";
        const result = await window.CalmClickRules.checkForUpdates({ force: true });
        btn.disabled = false;
        btn.textContent = "Update protection lists";
        let msg;
        if (result.ok && result.isNewer) {
          msg = `✅ Updated to <strong>${escapeHtml(result.rulesVersion)}</strong>. New checks are active on this device.`;
        } else if (result.ok && result.updated && !result.isNewer) {
          msg = `✅ Lists refreshed (version <strong>${escapeHtml(result.rulesVersion)}</strong>). You’re current.`;
        } else if (result.ok && !result.updated) {
          msg = `✅ Already up to date (<strong>${escapeHtml(result.rulesVersion)}</strong>).`;
        } else if (result.skipped) {
          msg = `Lists were checked recently. You’re on <strong>${escapeHtml(result.rulesVersion)}</strong>.`;
        } else {
          msg = `⚠️ Couldn’t reach the update list (offline or blocked). Built-in protection still works.`;
        }
        renderProtectionStatus(msg);
      });
    }
  }

  async function initProtectionUpdates() {
    renderProtectionStatus("");
    if (!window.CalmClickRules) return;

    // Quiet auto-check when running on a real website (not file:// offline copy)
    const onlinePage = location.protocol === "http:" || location.protocol === "https:";
    if (!onlinePage) {
      renderProtectionStatus(
        "Offline / local copy: using built-in lists. Open the website later and tap <strong>Update protection lists</strong> to refresh."
      );
      return;
    }

    const result = await window.CalmClickRules.checkForUpdates({ force: false });
    if (result.ok && result.isNewer) {
      renderProtectionStatus(
        `✅ Protection lists auto-updated to <strong>${escapeHtml(result.rulesVersion)}</strong>.`
      );
    } else if (result.ok) {
      renderProtectionStatus("");
    } else {
      renderProtectionStatus("Using built-in lists (update check unavailable right now).");
    }
  }

  // ——— Get / install CTAs ———
  function initGetSection() {
    const cfg = window.CALMCLICK_CONFIG || {};
    const localBtn = $("#downloadLocalBtn");
    const extBtn = $("#downloadExtBtn");
    const storeBtn = $("#chromeStoreBtn");
    const storeNote = $("#extensionCtaNote");
    const storeBlock = $("#storeInstallBlock");
    const sideloadBlock = $("#sideloadInstallBlock");
    const storeLink = $("#storeInstallLink");

    if (localBtn && cfg.localZipUrl) {
      localBtn.setAttribute("href", cfg.localZipUrl);
    }
    if (extBtn && cfg.extensionZipUrl) {
      extBtn.setAttribute("href", cfg.extensionZipUrl);
    }

    const storeUrl = (cfg.chromeStoreUrl || "").trim();
    if (storeUrl) {
      if (storeBtn) {
        storeBtn.setAttribute("href", storeUrl);
        storeBtn.setAttribute("target", "_blank");
        storeBtn.setAttribute("rel", "noopener");
        storeBtn.textContent = "Add to Chrome — free";
      }
      if (storeNote) storeNote.textContent = "Official Chrome Web Store · also works in Edge";
      if (storeBlock) storeBlock.hidden = false;
      if (storeLink) {
        storeLink.setAttribute("href", storeUrl);
      }
      // Keep sideload available but secondary
    } else {
      if (storeBtn) {
        storeBtn.setAttribute("href", "#extension-install");
        storeBtn.removeAttribute("target");
        storeBtn.textContent = "Get the free extension";
      }
      if (storeNote) storeNote.textContent = "Free install · Chrome or Edge · 2 minutes";
      if (storeBlock) storeBlock.hidden = true;
    }
  }

  // ——— Boot ———
  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initTextSize();
    initLinkTool();
    initMessageTool();
    initErrorTool();
    initHowtos();
    initGetSection();
    initProtectionUpdates();
  });
})();
