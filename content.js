console.log('Content script loaded on Wikipedia page');

function getWikipediaTitle() {
  const titleElement = document.getElementById('firstHeading');
  const title = titleElement ? titleElement.textContent.trim() : null;
  console.log('Current Wikipedia page title:', title);
  return title;
}

// Track clicks on Wikipedia links
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href*="/wiki/"]');
  if (!link) return;

  const fromTitle = getWikipediaTitle();
  console.log('Wikipedia link clicked:', { fromTitle, targetUrl: link.href });

  chrome.storage.local.get(['navigationHistory'], function(result) {
    const history = result.navigationHistory || [];
    const navigation = {
      from: fromTitle,
      to: link.title || link.textContent.trim(),
      timestamp: new Date().toISOString()
    };
    history.push(navigation);
    console.log('Adding navigation to history:', navigation);
    console.log('New history length:', history.length);

    chrome.storage.local.set({ navigationHistory: history }, function() {
      console.log('Navigation history saved successfully');
    });
  });
});

// Log initial page load
window.addEventListener('load', function() {
  console.log('Wikipedia page loaded, checking storage...');
  chrome.storage.local.get(['navigationHistory'], function(result) {
    console.log('Current navigation history:', result.navigationHistory);
  });
});

// Listen for storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.navigationHistory) {
    console.log('Navigation history updated:', changes.navigationHistory.newValue);
  }
});