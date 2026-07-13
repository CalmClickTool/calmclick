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

  function compilePattern(src) {
    try {
      return new RegExp(src, "i");
    } catch {
      return null;
    }
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
    if (!rawRules || !rawRules.signals) return false;
    const copy = deepClone(rawRules);
    copy._source = source;
    activeRules = compileRules(copy);
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
      activate(cached, "cache");
    } else if (bundled) {
      activate(bundled, "bundled");
    } else if (cached) {
      activate(cached, "cache");
    }
    return activeRules;
  }

  function rulesFeedUrl() {
    const c = cfg();
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

    const base = rulesFeedUrl();
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
      if (!remote || remote.schemaVersion !== 1 || !Array.isArray(remote.signals)) {
        return {
          ok: false,
          error: "invalid-feed",
          source: activeRules && activeRules._source
        };
      }

      const currentVer = (activeRules && activeRules.rulesVersion) || versionOf(getBundled());
      const remoteVer = remote.rulesVersion || "";
      const isNewer = remoteVer > currentVer;

      if (isNewer || force) {
        saveCache(remote);
        activate(remote, "remote");
        return {
          ok: true,
          updated: true,
          isNewer: isNewer,
          rulesVersion: remoteVer,
          changelog: remote.changelog || [],
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
