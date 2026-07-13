/* Legacy shim — scam signals now live in bundled-rules.js + rules-engine.js.
 * Kept so older bookmarks/scripts that load this file do not break.
 */
window.CALMCLICK_SCAM = window.CALMCLICK_SCAM || { signals: [] };
