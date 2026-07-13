/* Site config — set chromeStoreUrl after the extension is published to the Chrome Web Store */
window.CALMCLICK_CONFIG = {
  version: "1.1.0",
  /* Paste the Chrome Web Store URL here when live, e.g. https://chromewebstore.google.com/detail/... */
  chromeStoreUrl: "",
  localZipUrl: "downloads/calmclick-offline.zip",
  extensionZipUrl: "downloads/calmclick-extension.zip",
  githubUrl: "https://github.com/CalmClickTool/calmclick",
  /* Public pattern feed only (GET). Never receives user pastes. */
  rulesFeedUrl: "https://calmclicktool.github.io/calmclick/updates/rules-latest.json"
};
