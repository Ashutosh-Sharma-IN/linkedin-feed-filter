// ─── Popup Script ─────────────────────────────────────────────────────────────

const FILTER_LABELS = {
  aiWritten: 'AI-written posts',
  everydayLessons: 'Life lessons from random encounters',
  selfiePost: 'Selfies with no context',
  wordSalad: 'Generic motivational word salad',
  eventRegurgitation: 'News / event regurgitation',
};

let settings = null;

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(null, data => {
      resolve({
        enabledFilters: data.enabledFilters || {
          aiWritten: true, everydayLessons: true, selfiePost: true,
          wordSalad: true, eventRegurgitation: true,
        },
        customWords: data.customWords || [],
        blockedAccounts: data.blockedAccounts || [],
        customPatterns: data.customPatterns || [],
        stats: data.stats || { totalFiltered: 0, byFilter: {}, sessionFiltered: 0 },
        collapseInstead: data.collapseInstead || false,
      });
    });
  });
}

async function saveSettings(patch) {
  return new Promise(resolve => {
    chrome.storage.sync.set(patch, resolve);
  });
}

function notifyContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED' }).catch(() => {});
    }
  });
}

function renderFilters(enabledFilters, stats) {
  const list = document.getElementById('filter-list');
  list.innerHTML = '';

  for (const [id, label] of Object.entries(FILTER_LABELS)) {
    const count = stats.byFilter?.[id] || 0;
    const row = document.createElement('div');
    row.className = 'filter-row';
    row.innerHTML = `
      <span class="filter-label">
        ${label}
        ${count > 0 ? `<span class="filter-count">(${count})</span>` : ''}
      </span>
      <label class="switch">
        <input type="checkbox" data-filter="${id}" ${enabledFilters[id] ? 'checked' : ''} />
        <span class="slider"></span>
      </label>
    `;
    list.appendChild(row);
  }

  list.querySelectorAll('input[data-filter]').forEach(input => {
    input.addEventListener('change', async () => {
      settings.enabledFilters[input.dataset.filter] = input.checked;
      await saveSettings({ enabledFilters: settings.enabledFilters });
      notifyContentScript();
    });
  });
}

function renderTags(containerId, items, onRemove) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${item} <span class="remove" data-value="${item}">×</span>`;
    tag.querySelector('.remove').addEventListener('click', () => onRemove(item));
    container.appendChild(tag);
  });
}

async function init() {
  settings = await getSettings();

  // Stats line
  const total = settings.stats.totalFiltered || 0;
  document.getElementById('stats-line').textContent =
    total > 0 ? `${total} posts filtered total` : 'No posts filtered yet';

  // Filters
  renderFilters(settings.enabledFilters, settings.stats);

  // Collapse toggle
  const collapseToggle = document.getElementById('toggle-collapse');
  collapseToggle.checked = settings.collapseInstead;
  collapseToggle.addEventListener('change', async () => {
    settings.collapseInstead = collapseToggle.checked;
    await saveSettings({ collapseInstead: settings.collapseInstead });
    notifyContentScript();
  });

  // Custom words
  renderTags('custom-words-list', settings.customWords, async (word) => {
    settings.customWords = settings.customWords.filter(w => w !== word);
    await saveSettings({ customWords: settings.customWords });
    renderTags('custom-words-list', settings.customWords, arguments.callee);
    notifyContentScript();
  });

  document.getElementById('add-word-btn').addEventListener('click', async () => {
    const input = document.getElementById('custom-word-input');
    const word = input.value.trim().toLowerCase();
    if (!word || settings.customWords.includes(word)) return;
    input.value = '';
    settings.customWords.push(word);
    await saveSettings({ customWords: settings.customWords });
    renderTags('custom-words-list', settings.customWords, async (w) => {
      settings.customWords = settings.customWords.filter(x => x !== w);
      await saveSettings({ customWords: settings.customWords });
      renderTags('custom-words-list', settings.customWords, () => {});
      notifyContentScript();
    });
    notifyContentScript();
  });

  document.getElementById('custom-word-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('add-word-btn').click();
  });

  // Blocked accounts
  renderTags('blocked-accounts-list', settings.blockedAccounts, async (handle) => {
    settings.blockedAccounts = settings.blockedAccounts.filter(a => a !== handle);
    await saveSettings({ blockedAccounts: settings.blockedAccounts });
    renderTags('blocked-accounts-list', settings.blockedAccounts, arguments.callee);
    notifyContentScript();
  });

  document.getElementById('block-account-btn').addEventListener('click', async () => {
    const input = document.getElementById('block-account-input');
    const handle = input.value.trim().toLowerCase();
    if (!handle || settings.blockedAccounts.includes(handle)) return;
    input.value = '';
    settings.blockedAccounts.push(handle);
    await saveSettings({ blockedAccounts: settings.blockedAccounts });
    renderTags('blocked-accounts-list', settings.blockedAccounts, async (h) => {
      settings.blockedAccounts = settings.blockedAccounts.filter(x => x !== h);
      await saveSettings({ blockedAccounts: settings.blockedAccounts });
      renderTags('blocked-accounts-list', settings.blockedAccounts, () => {});
      notifyContentScript();
    });
    notifyContentScript();
  });

  document.getElementById('block-account-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('block-account-btn').click();
  });
}

init();
