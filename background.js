let pendingNavigations = new Map();

// Listen for all navigation types
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'linkClicked') {
    const fromTitle = message.fromTitle;
    const targetUrl = message.targetUrl;
    
    // Store this navigation attempt
    pendingNavigations.set(targetUrl, {
      fromTitle: fromTitle,
      timestamp: Date.now()
    });
    
    console.log('Stored pending navigation:', {fromTitle, targetUrl});
  }
  return true;
});

// Listen for navigation completion
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('wikipedia.org/wiki/')) {
    const pending = pendingNavigations.get(tab.url);
    if (pending && (Date.now() - pending.timestamp) < 10000) {
      chrome.tabs.sendMessage(tabId, {
        type: 'processNavigation',
        fromTitle: pending.fromTitle
      });
      pendingNavigations.delete(tab.url);
    }
  }
});