console.log('Background script loaded');

chrome.runtime.onInstalled.addListener(function() {
  console.log('Extension installed');
  // Initialize empty history
  chrome.storage.local.set({ navigationHistory: [] });
});

// Listen for navigation events
chrome.webNavigation.onCompleted.addListener(function(details) {
  if (details.url.includes('wikipedia.org/wiki/')) {
    console.log('Navigation completed:', details.url);
  }
}, {
  url: [{
    hostContains: '.wikipedia.org'
  }]
});