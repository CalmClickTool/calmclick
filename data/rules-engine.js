/* CalmClick rules engine — bundled rules + optional privacy-safe list updates
 *
 * Privacy: updates only GET a public JSON file of patterns. Never uploads
 * what the user pastes. Offline always works from bundled rules.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "calmclick-rules-cache-v1";
  const STORAGE_META = "calmclick-rules-meta-v1";
  const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

  /** @type {object|null} */
  let activeRules = null;

  function cfg() {
    return window.CALMCLICK_CONFIG || {};
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const MAX_SIGNALS = 80;
  const MAX_PATTERNS_PER_SIGNAL = 40;
  const MAX_PATTERN_LEN = 240;
  const MAX_LIST = 400;

  function compilePattern(src) {
    if (typeof src !== "string" || !src || src.length > MAX_PATTERN_LEN) return null;
    // Reject a few nested-quantifier shapes that often cause catastrophic backtracking.
    // Do not treat literal "\+" / "\*" as quantifiers.
    const stripped = src.replace(/\\./g, " "); // remove escaped pairs (e.g. \+, \d, \b)
    if (/([+*])\s*[+*]/.test(stripped)) return null;
    if (/\([^)]{0,80}[+*][^)]{0,80}\)[+*]/.test(stripped)) return null;
    try {
      return new RegExp(src, "i");
    } catch {
      return null;
    }
  }

  /** Validate & trim a rules object (bundled or remote). Rejects junk feeds. */
  function sanitizeRawRules(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (raw.schemaVersion !== 1) return null;
    if (!Array.isArray(raw.signals) || raw.signals.length === 0) return null;
    if (raw.signals.length > MAX_SIGNALS) return null;

    const signals = [];
    for (let i = 0; i < raw.signals.length; i++) {
      const sig = raw.signals[i];
      if (!sig || typeof sig !== "object") continue;
      if (typeof sig.id !== "string" || typeof sig.label !== "string") continue;
      const patterns = Array.isArray(sig.patterns) ? sig.patterns : [];
      if (patterns.length > MAX_PATTERNS_PER_SIGNAL) continue;
      const cleanPatterns = [];
      for (let j = 0; j < patterns.length; j++) {
        if (typeof patterns[j] === "string" && patterns[j].length <= MAX_PATTERN_LEN) {
          cleanPatterns.push(patterns[j]);
        }
      }
      if (!cleanPatterns.length) continue;
      const weight = Number(sig.weight);
      signals.push({
        id: sig.id.slice(0, 64),
        label: sig.label.slice(0, 160),
        weight: weight >= 1 && weight <= 10 ? weight : 1,
        patterns: cleanPatterns
      });
    }
    if (!signals.length) return null;

    function cleanStrList(list, maxItem) {
      if (!Array.isArray(list)) return [];
      const out = [];
      for (let i = 0; i < list.length && out.length < MAX_LIST; i++) {
        const s = String(list[i] || "")
          .toLowerCase()
          .trim()
          .slice(0, maxItem);
        if (s && /^[a-z0-9][a-z0-9._-]*$/.test(s)) out.push(s);
      }
      return out;
    }

    return {
      schemaVersion: 1,
      rulesVersion: String(raw.rulesVersion || "unknown").slice(0, 32),
      updatedAt: String(raw.updatedAt || "").slice(0, 32),
      changelog: Array.isArray(raw.changelog)
        ? raw.changelog.slice(0, 20).map((c) => String(c).slice(0, 240))
        : [],
      trustedBrands: cleanStrList(raw.trustedBrands, 48),
      suspiciousTlds: cleanStrList(raw.suspiciousTlds, 24),
      shorteners: cleanStrList(raw.shorteners, 48),
      signals: signals
    };
  }

  function compileRules(rules) {
    const signals = (rules.signals || []).map((sig) => {
      const regs = (sig.patterns || []).map(compilePattern).filter(Boolean);
      return Object.assign({}, sig, { _regexes: regs });
    });
    return {
      schemaVersion: rules.schemaVersion,
      rulesVersion: rules.rulesVersion,
      updatedAt: rules.updatedAt,
      changelog: rules.changelog || [],
      trustedBrands: (rules.trustedBrands || []).map((b) => String(b).toLowerCase()),
      suspiciousTlds: new Set((rules.suspiciousTlds || []).map((t) => String(t).toLowerCase())),
      shorteners: new Set((rules.shorteners || []).map((s) => String(s).toLowerCase())),
      signals: signals,
      _source: rules._source || "bundled"
    };
  }

  function getBundled() {
    return window.CALMCLICK_BUNDLED_RULES || null;
  }

  function loadCached() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveCache(rules) {
    try {
      const clean = deepClone(rules);
      delete clean._source;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      localStorage.setItem(
        STORAGE_META,
        JSON.stringify({
          savedAt: Date.now(),
          rulesVersion: rules.rulesVersion || "unknown",
          updatedAt: rules.updatedAt || null
        })
      );
    } catch {
      /* private mode / quota */
    }
  }

  function touchMeta() {
    try {
      const m = getMeta();
      m.savedAt = Date.now();
      localStorage.setItem(STORAGE_META, JSON.stringify(m));
    } catch {
      /* ignore */
    }
  }

  function getMeta() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_META) || "null") || {};
    } catch {
      return {};
    }
  }

  function versionOf(rules) {
    return (rules && rules.rulesVersion) || "";
  }

  function activate(rawRules, source) {
    const cleaned = sanitizeRawRules(rawRules);
    if (!cleaned) return false;
    cleaned._source = source;
    activeRules = compileRules(cleaned);
    window.CALMCLICK_RULES = activeRules;
    window.CALMCLICK_SCAM = {
      signals: activeRules.signals.map((s) => ({
        id: s.id,
        label: s.label,
        weight: s.weight,
        patterns: s._regexes
      }))
    };
    return true;
  }

  function initFromLocal() {
    const bundled = getBundled();
    const cached = loadCached();
    if (cached && versionOf(cached) > versionOf(bundled)) {
      if (!activate(cached, "cache") && bundled) activate(bundled, "bundled");
    } else if (bundled) {
      activate(bundled, "bundled");
    } else if (cached) {
      activate(cached, "cache");
    }
    return activeRules;
  }

  function rulesFeedUrl() {
    const c = cfg();
    // Explicit empty string disables remote updates (used by the Chrome extension package)
    if (Object.prototype.hasOwnProperty.call(c, "rulesFeedUrl") && !c.rulesFeedUrl) {
      return "";
    }
    if (c.rulesFeedUrl) return c.rulesFeedUrl;
    try {
      if (location.protocol === "http:" || location.protocol === "https:") {
        return new URL("updates/rules-latest.json", location.href).href;
      }
    } catch {
      /* ignore */
    }
    return "https://calmclicktool.github.io/calmclick/updates/rules-latest.json";
  }

  /**
   * Fetch public rules feed. Does NOT send any user paste content.
   * @param {{ force?: boolean }} opts
   */
  async function checkForUpdates(opts) {
    const force = !!(opts && opts.force);
    const base = rulesFeedUrl();
    if (!base) {
      return {
        ok: true,
        skipped: true,
        reason: "remote-disabled",
        rulesVersion: activeRules && activeRules.rulesVersion,
        source: activeRules && activeRules._source
      };
    }

    const meta = getMeta();
    if (!force && meta.savedAt && Date.now() - meta.savedAt < CHECK_INTERVAL_MS) {
      return {
        ok: true,
        skipped: true,
        reason: "recently-checked",
        rulesVersion: activeRules && activeRules.rulesVersion,
        source: activeRules && activeRules._source
      };
    }

    if (typeof fetch !== "function") {
      return { ok: false, error: "fetch-unavailable" };
    }

    const url = base + (base.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();

    try {
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer"
      });
      if (!res.ok) {
        return {
          ok: false,
          error: "http-" + res.status,
          source: activeRules && activeRules._source
        };
      }
      const remote = await res.json();
      const cleaned = sanitizeRawRules(remote);
      if (!cleaned) {
        return {
          ok: false,
          error: "invalid-feed",
          source: activeRules && activeRules._source
        };
      }

      const currentVer = (activeRules && activeRules.rulesVersion) || versionOf(getBundled());
      const remoteVer = cleaned.rulesVersion || "";
      const isNewer = remoteVer > currentVer;

      if (isNewer || force) {
        saveCache(cleaned);
        activate(cleaned, "remote");
        return {
          ok: true,
          updated: true,
          isNewer: isNewer,
          rulesVersion: remoteVer,
          changelog: cleaned.changelog || [],
          source: "remote"
        };
      }

      touchMeta();
      return {
        ok: true,
        updated: false,
        isNewer: false,
        rulesVersion: currentVer,
        source: activeRules && activeRules._source
      };
    } catch (err) {
      return {
        ok: false,
        error: "network",
        message: String(err && err.message ? err.message : err),
        source: activeRules && activeRules._source
      };
    }
  }

  function getStatus() {
    const meta = getMeta();
    return {
      rulesVersion: (activeRules && activeRules.rulesVersion) || "unknown",
      updatedAt: (activeRules && activeRules.updatedAt) || meta.updatedAt || null,
      source: (activeRules && activeRules._source) || "none",
      signalCount: activeRules && activeRules.signals ? activeRules.signals.length : 0,
      brandCount: activeRules && activeRules.trustedBrands ? activeRules.trustedBrands.length : 0,
      lastCheckAt: meta.savedAt || null,
      feedUrl: rulesFeedUrl(),
      changelog: (activeRules && activeRules.changelog) || []
    };
  }

  function getRules() {
    if (!activeRules) initFromLocal();
    return activeRules;
  }

  window.CalmClickRules = {
    initFromLocal: initFromLocal,
    checkForUpdates: checkForUpdates,
    getStatus: getStatus,
    getRules: getRules,
    CHECK_INTERVAL_MS: CHECK_INTERVAL_MS
  };

  initFromLocal();
})();
