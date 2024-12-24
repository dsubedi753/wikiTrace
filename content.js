function getWikipediaTitle() {
  const titleElement = document.getElementById('firstHeading');
  return titleElement ? titleElement.textContent.trim() : null;
}

function trackNavigation(fromTitle) {
  const currentTitle = getWikipediaTitle();
  console.log('Tracking navigation from', fromTitle, 'to', currentTitle);
  
  if (currentTitle) {
    const navigation = {
      from: fromTitle,
      to: currentTitle,
      timestamp: new Date().toISOString()
    };
    
    chrome.storage.local.get(['navigationHistory'], function(result) {
      const history = result.navigationHistory || [];
      history.push(navigation);
      chrome.storage.local.set({ navigationHistory: history });
      console.log('Added navigation to history:', navigation);
    });
  }
}

// Capture all types of link activations
document.addEventListener('click', handleLinkClick, true);
document.addEventListener('mousedown', handleLinkClick, true);
document.addEventListener('auxclick', handleLinkClick, true);  // Middle click

function handleLinkClick(e) {
  const link = e.target.closest('a[href*="/wiki/"]');
  if (!link) return;

  // Don't handle right clicks
  if (e.button === 2) return;

  const fromTitle = getWikipediaTitle();
  const targetUrl = link.href;

  // Notify background script about this navigation attempt
  chrome.runtime.sendMessage({
    type: 'linkClicked',
    fromTitle: fromTitle,
    targetUrl: targetUrl
  });

  console.log('Link clicked:', {fromTitle, targetUrl});
}

// Listen for navigation completion message from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'processNavigation') {
    trackNavigation(message.fromTitle);
  }
  return true;
});