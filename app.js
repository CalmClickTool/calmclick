/* CalmClick — all analysis runs locally in the browser */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ——— Known good brands (for lookalike detection) ———
  const TRUSTED_BRANDS = [
    "google", "gmail", "youtube", "microsoft", "apple", "icloud", "amazon", "paypal",
    "netflix", "facebook", "instagram", "whatsapp", "chase", "wellsfargo", "bankofamerica",
    "citibank", "capitalone", "americanexpress", "irs", "usps", "ups", "fedex", "dhl",
    "ebay", "walmart", "target", "costco", "dropbox", "linkedin", "twitter", "x.com",
    "adobe", "zoom", "spotify", "venmo", "cashapp", "zelle", "coinbase", "binance"
  ];

  const SUSPICIOUS_TLDS = new Set([
    "zip", "mov", "xyz", "top", "gq", "tk", "ml", "cf", "ga", "work", "click", "country",
    "stream", "download", "racing", "review", "science", "kim", "men", "loan", "win"
  ]);

  const SHORTENERS = new Set([
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "rebrand.ly", "ow.ly", "is.gd", "buff.ly",
    "cutt.ly", "shorturl.at", "rb.gy", "tiny.cc", "s.id", "v.gd"
  ]);

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

  function lookalikeHits(sld) {
    const hits = [];
    const clean = sld.replace(/[^a-z0-9]/gi, "").toLowerCase();
    for (const brand of TRUSTED_BRANDS) {
      if (clean === brand) continue;
      if (clean.includes(brand) && clean !== brand) {
        // paypal-secure, appleid-verify style
        hits.push({ brand, reason: `contains “${brand}” but is not the official domain` });
        continue;
      }
      const dist = levenshtein(clean, brand);
      const threshold = brand.length <= 4 ? 1 : brand.length <= 7 ? 1 : 2;
      if (dist > 0 && dist <= threshold) {
        hits.push({ brand, reason: `looks similar to “${brand}” (possible typo‑squat)` });
      }
    }
    return hits;
  }

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
    if (SUSPICIOUS_TLDS.has(tld)) {
      score += 2;
      findings.push(`Ends with .${tld}, which scammers use more often than big banks or stores.`);
    }

    // Shortener
    if (SHORTENERS.has(registrable) || SHORTENERS.has(host)) {
      score += 2;
      findings.push("This is a shortened link. The real destination is hidden until you open it (or expand it with a trusted tool).");
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
    for (const brand of TRUSTED_BRANDS) {
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
      body = "Several warning signs showed up. Do not enter passwords, codes, or card numbers here.";
    } else if (score >= 2) {
      level = "caution";
      title = "Pause — a few things look off";
      body = "It might still be legitimate, but double‑check before signing in or paying.";
    } else {
      level = "safe";
      title = "No major red flags in the address";
      body = "The link structure looks ordinary. That does not guarantee the whole website is honest — but there are no classic scam patterns in the URL itself.";
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
    if (score >= 6) {
      level = "danger";
      title = "This looks like a scam or high‑pressure trap";
      body = "Multiple classic scam patterns showed up. Treat it as dangerous until proven otherwise through a channel you trust.";
    } else if (score >= 3) {
      level = "caution";
      title = "Be cautious — this has scam‑like signs";
      body = "It might be legitimate, but pressure tactics are a favorite tool of scammers. Verify before you act.";
    } else if (score >= 1) {
      level = "caution";
      title = "A couple of things to double‑check";
      body = "Not a clear scam by itself, but worth a second look before clicking or replying.";
    } else {
      level = "safe";
      title = "No strong scam patterns found";
      body = "We didn’t see the usual scare tactics. Still use judgment — new scams appear all the time.";
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
  });
})();
