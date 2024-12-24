function getWikipediaTitle() {
  const titleElement = document.getElementById('firstHeading');
  return titleElement ? titleElement.textContent.trim() : null;
}

function trackNavigation(fromTitle) {
  const currentTitle = getWikipediaTitle();
  if (currentTitle) {
    chrome.runtime.sendMessage({
      type: 'navigation',
      from: fromTitle,
      to: currentTitle,
      timestamp: new Date().toISOString()
    });
  }
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href*="/wiki/"]');
  if (link) {
    const fromTitle = getWikipediaTitle();
    sessionStorage.setItem('fromTitle', fromTitle);
  }
});

window.addEventListener('load', () => {
  const fromTitle = sessionStorage.getItem('fromTitle');
  if (fromTitle) {
    trackNavigation(fromTitle);
    sessionStorage.removeItem('fromTitle');
  }
});