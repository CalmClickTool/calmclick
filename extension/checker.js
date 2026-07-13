/* Self-contained checker for the extension tab */
(function () {
  "use strict";

  const TRUSTED_BRANDS = [
    "google", "gmail", "youtube", "microsoft", "apple", "icloud", "amazon", "paypal",
    "netflix", "facebook", "instagram", "whatsapp", "chase", "wellsfargo", "bankofamerica",
    "ebay", "walmart", "irs", "usps", "ups", "fedex", "venmo", "cashapp"
  ];
  const SUSPICIOUS_TLDS = new Set([
    "zip", "mov", "xyz", "top", "gq", "tk", "ml", "cf", "ga", "work", "click", "loan", "win"
  ]);
  const SHORTENERS = new Set([
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "rebrand.ly", "ow.ly", "is.gd", "cutt.ly"
  ]);

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
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
    let s = String(raw || "").trim().replace(/^<|>$/g, "");
    if (!s) return null;
    const found = s.match(/https?:\/\/[^\s<>"']+/i) || s.match(/\b[a-z0-9][-a-z0-9.]*\.[a-z]{2,}(?:\/[^\s<>"']*)?/i);
    if (found) s = found[0];
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    try { return new URL(s); } catch { return null; }
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
    if (SUSPICIOUS_TLDS.has(tld)) {
      score += 2;
      findings.push(`Ends with .${tld}, which scammers use more often.`);
    }
    if (SHORTENERS.has(registrable) || SHORTENERS.has(host)) {
      score += 2;
      findings.push("Shortened link — the real destination is hidden.");
    }
    const clean = sld.replace(/[^a-z0-9]/gi, "").toLowerCase();
    for (const brand of TRUSTED_BRANDS) {
      if (clean === brand) continue;
      if (clean.includes(brand) && clean !== brand) {
        score += 3;
        findings.push(`Contains “${brand}” but is not the official domain (${registrable}).`);
      } else {
        const dist = levenshtein(clean, brand);
        const threshold = brand.length <= 7 ? 1 : 2;
        if (dist > 0 && dist <= threshold) {
          score += 3;
          findings.push(`Looks similar to “${brand}” (possible fake).`);
        }
      }
    }
    if (host.includes("xn--")) {
      score += 2;
      findings.push("Uses special international characters that can mimic brands.");
    }

    let level, title, body;
    if (score >= 5) {
      level = "danger";
      title = "Be careful — this link looks risky";
      body = "Do not enter passwords or card numbers here.";
    } else if (score >= 2) {
      level = "caution";
      title = "Pause — a few things look off";
      body = "Double‑check before signing in or paying.";
    } else {
      level = "safe";
      title = "No major red flags in the address";
      body = "Structure looks ordinary. Still only log in if you expected this site.";
    }

    return {
      level,
      title,
      body,
      findings,
      meta: {
        Destination: url.href,
        "Website name": registrable
      },
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
      return { level: "caution", title: "Nothing to check", body: "Paste a message first.", findings: [], next: [] };
    }
    const signals = (window.CALMCLICK_SCAM && window.CALMCLICK_SCAM.signals) || [];
    const hits = [];
    let score = 0;
    for (const sig of signals) {
      for (const re of sig.patterns) {
        if (re.test(raw)) {
          hits.push(sig.label);
          score += sig.weight;
          break;
        }
      }
    }
    const urls = raw.match(/https?:\/\/[^\s<>"']+/gi) || [];
    if (urls[0]) {
      const link = analyzeLink(urls[0]);
      if (link.level === "danger") { score += 3; hits.push("Contains a risky-looking link"); }
      else if (link.level === "caution") { score += 1; hits.push("Contains an unusual link"); }
    }

    let level, title, body;
    if (score >= 6) {
      level = "danger";
      title = "This looks like a scam or high‑pressure trap";
      body = "Treat it as dangerous until verified another way.";
    } else if (score >= 2) {
      level = "caution";
      title = "Be cautious — scam‑like signs present";
      body = "Verify before you click, reply, or pay.";
    } else {
      level = "safe";
      title = "No strong scam patterns found";
      body = "Still use judgment — new scams appear often.";
    }

    return {
      level,
      title,
      body,
      findings: [...new Set(hits)],
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
          : result.level === "info"
            ? "result-info"
            : "result-safe";
    el.hidden = false;
    el.className = `result ${cls}`;
    el.innerHTML = `
      <h1>${escapeHtml(result.title)}</h1>
      <p>${escapeHtml(result.body)}</p>
      ${
        result.findings && result.findings.length
          ? `<p><strong>What we noticed</strong></p><ul>${result.findings
              .map((f) => `<li>${escapeHtml(f)}</li>`)
              .join("")}</ul>`
          : ""
      }
      ${
        result.meta
          ? `<div class="meta">${Object.entries(result.meta)
              .map(([k, v]) => `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`)
              .join("")}</div>`
          : ""
      }
      ${
        result.next && result.next.length
          ? `<p><strong>What you should do</strong></p><ul>${result.next
              .map((n) => `<li>${escapeHtml(n)}</li>`)
              .join("")}</ul>`
          : ""
      }
    `;
  }

  const params = new URLSearchParams(location.search);
  const link = params.get("link");
  const message = params.get("message");
  if (link) render(analyzeLink(link));
  else if (message) render(analyzeMessage(message));
  else {
    document.getElementById("status").textContent = "Paste a link from the extension popup to check it.";
  }
})();
