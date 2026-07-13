document.getElementById("go").addEventListener("click", () => {
  const text = document.getElementById("q").value.trim();
  if (!text) return;
  const looksLikeUrl = /^(https?:\/\/|www\.)/i.test(text) || (!/\s/.test(text) && text.includes("."));
  const params = looksLikeUrl ? { link: text } : { message: text };
  const url = chrome.runtime.getURL(`checker.html?${new URLSearchParams(params)}`);
  chrome.tabs.create({ url });
});
