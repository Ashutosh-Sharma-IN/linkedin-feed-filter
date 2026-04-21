// ─── Service Worker ───────────────────────────────────────────────────────────

// Open welcome page on first install
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  }
});

let badgeCount = 0;

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'INCREMENT_BADGE') {
    badgeCount += 1;
    chrome.action.setBadgeText({ text: String(badgeCount), tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#0a66c2', tabId: sender.tab.id });
  }

  if (msg.type === 'RESET_BADGE') {
    badgeCount = 0;
    chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
  }
});

// Reset badge when user navigates away from LinkedIn
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && !changeInfo.url.includes('linkedin.com')) {
    badgeCount = 0;
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
