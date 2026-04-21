// Background Service Worker
// Handles context menu creation and message passing

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyze-privacy",
    title: "Analyze Privacy Policy",
    contexts: ["selection"],
  });

  console.log("Privacy Policy Analyzer context menu installed");
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyze-privacy") {
    const selectedText = info.selectionText;

    chrome.storage.local.set({
      selectedText: selectedText,
      sourceTabId: tab.id,
      sourceUrl: tab.url,
      timestamp: Date.now()
    }, () => {
      const popupUrl = chrome.runtime.getURL("src/popup/popup.html");
      chrome.windows.create({
        url: popupUrl,
        type: "popup",
        width: 640,
        height: 760,
        focused: true
      });
    });
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    chrome.storage.local.get(["selectedText", "sourceUrl"], (result) => {
      sendResponse({
        selectedText: result.selectedText || "",
        sourceUrl: result.sourceUrl || ""
      });
    });
    return true;
  }

  if (request.action === "clearCache") {
    chrome.storage.local.remove(["selectedText", "sourceTabId", "sourceUrl", "timestamp"]);
    sendResponse({ status: "cleared" });
  }

  if (request.action === "saveAnalysis") {
    chrome.storage.local.get(["analysisHistory"], (result) => {
      const history = result.analysisHistory || [];
      history.unshift({
        ...request.analysis,
        savedAt: new Date().toISOString()
      });
      chrome.storage.local.set({
        analysisHistory: history.slice(0, 50)
      });
    });
    sendResponse({ status: "saved" });
  }
});

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://github.com/balascode/privacy-policy-analyzer-extension" });
  }
});