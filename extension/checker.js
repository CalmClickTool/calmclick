/* CalmClick extension checker — packaged rules only; no remote fetch */
(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

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

  function levenshtein(a, b) {
    const m = a.length,
      n = b.length;
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
    return { host, tld, registrable, sld };
  }

  function analyzeLink(raw) {
    const url = normalizeUrlInput(raw);
    if (!url) {
      return {
        level: "caution",
        title: "Couldn’t read that as a web address",
        body: "Try pasting the full link.",
        findings: [],
        meta: {},
        next: ["Don’t open links you can’t verify."]
      };
    }
    const { host, tld, registrable, sld } = domainParts(url.hostname);
    const findings = [];
    let score = 0;
    const brands = trustedBrands();
    const tlds = suspiciousTlds();
    const shorts = shorteners();

    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      score += 3;
      findings.push("Uses a raw IP address instead of a normal website name.");
    }
    if (url.protocol === "http:") {
      score += 1;
      findings.push("Uses http (not https). Avoid passwords on non‑secure pages.");
    }
    if (url.username || url.password) {
      score += 3;
      findings.push("Contains username/password inside the URL — highly risky.");
    }
    if (tlds.has(tld)) {
      score += 2;
      findings.push("Ends with ." + tld + ", which scammers use more often.");
    }
    if (shorts.has(registrable) || shorts.has(host)) {
      score += 2;
      findings.push("Shortened link — the real destination is hidden.");
    }
    function normalizeDigits(s) {
      return String(s)
        .toLowerCase()
        .replace(/0/g, "o")
        .replace(/1/g, "l")
        .replace(/3/g, "e")
        .replace(/4/g, "a")
        .replace(/5/g, "s")
        .replace(/7/g, "t");
    }
    const pieces = sld.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const candidates = [sld.replace(/[^a-z0-9]/gi, "").toLowerCase()].concat(pieces);
    const seenBrand = {};
    for (let c = 0; c < candidates.length; c++) {
      const clean = candidates[c];
      if (!clean) continue;
      const deDigit = normalizeDigits(clean);
      for (let i = 0; i < brands.length; i++) {
        const brand = brands[i];
        if (seenBrand[brand] || clean === brand) continue;
        if (clean.indexOf(brand) !== -1 && clean !== brand) {
          score += 3;
          findings.push(
            "Contains “" + brand + "” but is not the official domain (" + registrable + ")."
          );
          seenBrand[brand] = 1;
          continue;
        }
        if (
          (deDigit === brand || (brand.length >= 5 && deDigit.indexOf(brand) !== -1)) &&
          clean !== brand
        ) {
          score += 3;
          findings.push("Looks like “" + brand + "” with number tricks.");
          seenBrand[brand] = 1;
          continue;
        }
        const dist = Math.min(levenshtein(clean, brand), levenshtein(deDigit, brand));
        const threshold = brand.length <= 7 ? 1 : 2;
        if (dist > 0 && dist <= threshold) {
          score += 3;
          findings.push("Looks similar to “" + brand + "” (possible fake).");
          seenBrand[brand] = 1;
        }
      }
    }
    if (host.indexOf("xn--") !== -1) {
      score += 2;
      findings.push("Uses special international characters that can mimic brands.");
    }

    let level, title, body;
    if (score >= 5) {
      level = "danger";
      title = "Be careful — this link looks risky";
      body = "Do not enter passwords or card numbers here. This is a pattern check, not a live virus scan.";
    } else if (score >= 2) {
      level = "caution";
      title = "Pause — a few things look off";
      body = "Double‑check before signing in or paying.";
    } else {
      level = "info";
      title = "No major red flags in the address";
      body =
        "The address structure looks ordinary. That does not prove the whole website is safe — only that we didn’t see classic URL tricks.";
    }

    return {
      level: level,
      title: title,
      body: body,
      findings: findings,
      meta: { Destination: url.href, "Website name": registrable },
      next:
        level === "danger"
          ? [
              "Don’t click if you can avoid it.",
              "Open banks/email by typing the address yourself.",
              "Ask someone you trust before sending money."
            ]
          : [
              "Prefer your own bookmarks for important sites.",
              "Ignore pressure and “act now” messages."
            ]
    };
  }

  function analyzeMessage(text) {
    const raw = String(text || "").trim();
    if (!raw) {
      return {
        level: "caution",
        title: "Nothing to check",
        body: "Paste a message first.",
        findings: [],
        next: []
      };
    }
    const r = rules();
    const signals = (r && r.signals) || [];
    const hits = [];
    let score = 0;
    let criticalHit = false;
    const criticalIds = {
      clickfix: 1,
      fake_captcha: 1,
      credentials: 1,
      wallet_drainer: 1,
      ai_voice_deepfake: 1
    };
    for (let i = 0; i < signals.length; i++) {
      const sig = signals[i];
      const regs = sig._regexes || [];
      for (let j = 0; j < regs.length; j++) {
        try {
          if (regs[j].test(raw)) {
            hits.push(sig.label);
            score += sig.weight || 1;
            if (criticalIds[sig.id]) criticalHit = true;
            break;
          }
        } catch (_e) {
          /* ignore bad regex */
        }
      }
    }
    const urls = raw.match(/https?:\/\/[^\s<>"']+/gi) || [];
    if (urls[0]) {
      const link = analyzeLink(urls[0]);
      if (link.level === "danger") {
        score += 3;
        hits.push("Contains a risky-looking link");
      } else if (link.level === "caution") {
        score += 1;
        hits.push("Contains an unusual link");
      }
    }

    let level, title, body;
    if (score >= 6 || criticalHit) {
      level = "danger";
      title = "This looks like a scam or high‑pressure trap";
      body =
        "Serious scam patterns showed up. Treat it as dangerous until verified another way. Pattern matching can miss new scams.";
    } else if (score >= 2) {
      level = "caution";
      title = "Be cautious — scam‑like signs present";
      body = "Verify before you click, reply, or pay.";
    } else {
      level = "info";
      title = "No strong scam patterns found";
      body =
        "We didn’t match common scam wording. New scams appear often — still use judgment.";
    }

    const unique = [];
    for (let k = 0; k < hits.length; k++) {
      if (unique.indexOf(hits[k]) === -1) unique.push(hits[k]);
    }

    return {
      level: level,
      title: title,
      body: body,
      findings: unique,
      meta: { "Links found": String(urls.length) },
      next: [
        "Don’t pay with gift cards or crypto because a message told you to.",
        "Call companies using numbers from your bill or official site."
      ]
    };
  }

  function render(result) {
    const el = document.getElementById("result");
    const status = document.getElementById("status");
    status.textContent = "Result";
    const cls =
      result.level === "danger"
        ? "result-danger"
        : result.level === "caution"
          ? "result-caution"
          : "result-info";
    el.hidden = false;
    el.className = "result " + cls;
    el.innerHTML =
      "<h1>" +
      escapeHtml(result.title) +
      "</h1><p>" +
      escapeHtml(result.body) +
      "</p>" +
      (result.findings && result.findings.length
        ? "<p><strong>What we noticed</strong></p><ul>" +
          result.findings.map((f) => "<li>" + escapeHtml(f) + "</li>").join("") +
          "</ul>"
        : "") +
      (result.meta
        ? '<div class="meta">' +
          Object.keys(result.meta)
            .map(function (k) {
              return (
                "<div><strong>" +
                escapeHtml(k) +
                ":</strong> " +
                escapeHtml(result.meta[k]) +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        : "") +
      (result.next && result.next.length
        ? "<p><strong>What you should do</strong></p><ul>" +
          result.next.map((n) => "<li>" + escapeHtml(n) + "</li>").join("") +
          "</ul>"
        : "");
  }

  function showRulesLine() {
    const line = document.getElementById("rulesLine");
    if (!line || !window.CalmClickRules) return;
    const s = window.CalmClickRules.getStatus();
    line.textContent =
      "Packaged protection list " +
      s.rulesVersion +
      " · " +
      s.signalCount +
      " pattern groups · updates ship with extension versions";
  }

  async function loadPayload() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id && chrome.storage && chrome.storage.session) {
      const key = "check_" + id;
      const bag = await chrome.storage.session.get(key);
      const payload = bag[key];
      await chrome.storage.session.remove(key);
      if (payload && payload.type && payload.value) return payload;
    }
    // Legacy fallback (older builds may still use query params)
    if (params.get("link")) return { type: "link", value: params.get("link") };
    if (params.get("message")) return { type: "message", value: params.get("message") };
    return null;
  }

  async function boot() {
    showRulesLine();
    const payload = await loadPayload();
    if (!payload) {
      document.getElementById("status").textContent =
        "Use the popup or right‑click a link/selection to check something.";
      return;
    }
    if (payload.type === "link") render(analyzeLink(payload.value));
    else render(analyzeMessage(payload.value));
  }

  boot();
})();
