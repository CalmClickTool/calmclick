/* CalmClick extension — opens the built-in checker with the selected link/text */

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

function buildCheckerUrl(params) {
  const base = chrome.runtime.getURL("checker.html");
  const q = new URLSearchParams(params);
  return `${base}?${q.toString()}`;
}

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "calmclick-check-link" && info.linkUrl) {
    chrome.tabs.create({ url: buildCheckerUrl({ link: info.linkUrl }) });
  }
  if (info.menuItemId === "calmclick-check-selection" && info.selectionText) {
    const text = info.selectionText.slice(0, 8000);
    chrome.tabs.create({ url: buildCheckerUrl({ message: text }) });
  }
});
