// Content Script
// Captures selected text on web pages so the extension can analyze it.

document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 0) {
    sessionStorage.setItem("lastSelection", selectedText);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelection") {
    const text = window.getSelection().toString().trim() || sessionStorage.getItem("lastSelection") || "";
    sendResponse({ selectedText: text });
  }
});