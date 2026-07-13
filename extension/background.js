/* CalmClick extension — local checks only; no network host permissions */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "calmclick-check-link",
      title: "Check with CalmClick",
      contexts: ["link"]
    });
    chrome.contextMenus.create({
      id: "calmclick-check-selection",
      title: "Check this text with CalmClick",
      contexts: ["selection"]
    });
  });
});

/**
 * Pass payload via session storage (not URL query) so pastes/links
 * are less likely to linger in history or logs.
 */
async function openChecker(payload) {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  const key = "check_" + id;
  await chrome.storage.session.set({ [key]: payload });
  await chrome.tabs.create({
    url: chrome.runtime.getURL("checker.html?id=" + encodeURIComponent(id))
  });
}

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "calmclick-check-link" && info.linkUrl) {
    openChecker({ type: "link", value: info.linkUrl, ts: Date.now() });
  }
  if (info.menuItemId === "calmclick-check-selection" && info.selectionText) {
    openChecker({
      type: "message",
      value: String(info.selectionText).slice(0, 8000),
      ts: Date.now()
    });
  }
});

// Popup uses the same path
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "calmclick-open-check" && msg.payload) {
    openChecker(msg.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
  return false;
});
