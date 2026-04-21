// ─── LinkedIn Feed Filter — Content Script ───────────────────────────────────

const SELECTORS = {
  // LinkedIn updates its class names often; we use multiple fallbacks
  post: [
    'div[data-urn*="urn:li:activity"]',
    '.feed-shared-update-v2',
    '.occludable-update',
  ].join(', '),
  text: [
    '.feed-shared-update-v2__description',
    '.update-components-text',
    '.feed-shared-text',
    '[data-test-id="main-feed-activity-card"] .break-words',
  ].join(', '),
  actorName: [
    '.feed-shared-actor__name',
    '.update-components-actor__name',
    '.app-aware-link[href*="/in/"]',
  ].join(', '),
  image: 'img.feed-shared-image__image, .update-components-image img',
};

let settings = null;

async function loadSettings() {
  settings = await window.LFF_STORAGE.get();
}

function extractPostData(postEl) {
  const textEl = postEl.querySelector(SELECTORS.text);
  const text = textEl ? textEl.innerText : '';

  const nameEl = postEl.querySelector(SELECTORS.actorName);
  const authorName = nameEl ? nameEl.innerText.trim().toLowerCase() : '';
  const authorHandle = (() => {
    const link = postEl.querySelector('a[href*="/in/"]');
    if (!link) return '';
    const match = link.href.match(/\/in\/([^/?]+)/);
    return match ? match[1].toLowerCase() : '';
  })();

  const images = postEl.querySelectorAll(SELECTORS.image);
  const hasImage = images.length > 0;
  const imageCount = images.length;

  return { text, authorName, authorHandle, hasImage, imageCount };
}

function runFilters(postData) {
  const { text, authorName, authorHandle, hasImage, imageCount } = postData;
  const { enabledFilters, customWords, blockedAccounts, customPatterns } = settings;

  // Custom account block (always runs)
  if (blockedAccounts.length > 0) {
    const isBlocked = blockedAccounts.some(
      a => authorHandle.includes(a) || authorName.includes(a)
    );
    if (isBlocked) return { filtered: true, reason: 'Blocked account', filterId: 'blockedAccount' };
  }

  // Custom word filter
  if (customWords.length > 0) {
    const lowerText = text.toLowerCase();
    const matchedWord = customWords.find(w => lowerText.includes(w));
    if (matchedWord) return { filtered: true, reason: `Custom word: "${matchedWord}"`, filterId: 'customWord' };
  }

  // Custom regex patterns (Pro feature)
  if (customPatterns.length > 0) {
    for (const patternStr of customPatterns) {
      try {
        const re = new RegExp(patternStr, 'i');
        if (re.test(text)) return { filtered: true, reason: `Custom pattern match`, filterId: 'customPattern' };
      } catch (_) { /* invalid regex — skip */ }
    }
  }

  // Core rule-based filters
  const FILTERS = window.LFF_FILTERS;

  for (const [id, filter] of Object.entries(FILTERS)) {
    if (!enabledFilters[id]) continue;

    const result = id === 'selfiePost'
      ? filter.check(text, { hasImage, imageCount })
      : filter.check(text);

    if (result.matched) {
      return { filtered: true, reason: result.reason, filterId: id, confidence: result.confidence };
    }
  }

  return { filtered: false };
}

function hidePost(postEl, reason) {
  if (postEl.dataset.lffProcessed) return;
  postEl.dataset.lffProcessed = 'true';

  if (settings.collapseInstead) {
    // Collapse mode: show a minimal bar the user can click to reveal
    const original = postEl.innerHTML;
    postEl.innerHTML = `
      <div class="lff-collapsed" style="
        padding: 10px 16px;
        background: #f3f2ef;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        margin: 4px 0;
      ">
        <span style="color:#666;font-size:13px;font-family:sans-serif">
          🚫 Post filtered: <em>${reason}</em>
        </span>
        <span style="color:#0a66c2;font-size:12px;font-family:sans-serif">Show anyway</span>
      </div>
    `;
    postEl.querySelector('.lff-collapsed').addEventListener('click', () => {
      postEl.innerHTML = original;
      postEl.dataset.lffProcessed = 'revealed';
    });
  } else {
    postEl.style.display = 'none';
  }
}

async function processPost(postEl) {
  if (postEl.dataset.lffProcessed) return;

  const postData = extractPostData(postEl);
  if (!postData.text && !postData.hasImage) return; // skip empty/ad shells

  const result = runFilters(postData);
  if (result.filtered) {
    hidePost(postEl, result.reason);
    window.LFF_STORAGE.incrementStat(result.filterId);

    // Update badge count
    chrome.runtime.sendMessage({ type: 'INCREMENT_BADGE' }).catch(() => {});
  }
}

function scanFeed() {
  const posts = document.querySelectorAll(SELECTORS.post);
  posts.forEach(processPost);
}

// MutationObserver — catches dynamically loaded posts on scroll
const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue;

      // Check if the node itself is a post
      if (node.matches && node.matches(SELECTORS.post)) {
        processPost(node);
      }

      // Check descendants
      node.querySelectorAll?.(SELECTORS.post).forEach(processPost);
    }
  }
});

// Listen for settings changes from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SETTINGS_UPDATED') {
    loadSettings().then(() => {
      // Re-scan — unhide posts that no longer match after settings change
      document.querySelectorAll('[data-lff-processed]').forEach(el => {
        el.removeAttribute('data-lff-processed');
        if (el.style.display === 'none') el.style.display = '';
      });
      scanFeed();
    });
  }
});

// Boot
(async () => {
  await loadSettings();
  scanFeed();
  observer.observe(document.body, { childList: true, subtree: true });
})();
