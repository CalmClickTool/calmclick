document.getElementById("go").addEventListener("click", () => {
  const text = document.getElementById("q").value.trim();
  if (!text) return;
  const looksLikeUrl =
    /^(https?:\/\/|www\.)/i.test(text) || (!/\s/.test(text) && text.includes("."));
  const payload = looksLikeUrl
    ? { type: "link", value: text, ts: Date.now() }
    : { type: "message", value: text.slice(0, 8000), ts: Date.now() };

  chrome.runtime.sendMessage({ type: "calmclick-open-check", payload }, () => {
    // Close popup after handoff
    window.close();
  });
});
