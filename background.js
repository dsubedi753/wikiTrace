let navigationHistory = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'navigation') {
    navigationHistory.push({
      from: message.from,
      to: message.to,
      timestamp: message.timestamp
    });
    chrome.storage.local.set({ navigationHistory });
  }
});