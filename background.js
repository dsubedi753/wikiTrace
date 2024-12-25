chrome.runtime.onInstalled.addListener(function() {
  console.log('Wikipedia Navigation Tree installed');
  // Initialize empty tree
  chrome.storage.local.set({ wikiTree: {} });
});