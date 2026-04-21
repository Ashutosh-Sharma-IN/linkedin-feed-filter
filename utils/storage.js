// ─── Storage Helpers ─────────────────────────────────────────────────────────

const LFF_STORAGE = {
  DEFAULTS: {
    enabledFilters: {
      aiWritten: true,
      everydayLessons: true,
      selfiePost: true,
      wordSalad: true,
      eventRegurgitation: true,
    },
    customWords: [],       // user-added trigger words
    blockedAccounts: [],   // user-blocked account names/handles
    customPatterns: [],    // user-added regex strings
    stats: {
      totalFiltered: 0,
      byFilter: {},
      sessionFiltered: 0,
    },
    proLicenseKey: null,
    showFilteredCount: true,
    collapseInstead: false, // if true, collapse post instead of hiding
  },

  async get() {
    return new Promise(resolve => {
      chrome.storage.sync.get(LFF_STORAGE.DEFAULTS, resolve);
    });
  },

  async set(data) {
    return new Promise(resolve => {
      chrome.storage.sync.set(data, resolve);
    });
  },

  async incrementStat(filterId) {
    const data = await LFF_STORAGE.get();
    data.stats.totalFiltered += 1;
    data.stats.sessionFiltered += 1;
    data.stats.byFilter[filterId] = (data.stats.byFilter[filterId] || 0) + 1;
    await LFF_STORAGE.set({ stats: data.stats });
  },

  async addCustomWord(word) {
    const data = await LFF_STORAGE.get();
    const words = [...new Set([...data.customWords, word.toLowerCase().trim()])];
    await LFF_STORAGE.set({ customWords: words });
    return words;
  },

  async removeCustomWord(word) {
    const data = await LFF_STORAGE.get();
    const words = data.customWords.filter(w => w !== word.toLowerCase().trim());
    await LFF_STORAGE.set({ customWords: words });
    return words;
  },

  async blockAccount(handle) {
    const data = await LFF_STORAGE.get();
    const accounts = [...new Set([...data.blockedAccounts, handle.toLowerCase().trim()])];
    await LFF_STORAGE.set({ blockedAccounts: accounts });
    return accounts;
  },

  async unblockAccount(handle) {
    const data = await LFF_STORAGE.get();
    const accounts = data.blockedAccounts.filter(a => a !== handle.toLowerCase().trim());
    await LFF_STORAGE.set({ blockedAccounts: accounts });
    return accounts;
  },
};

if (typeof window !== 'undefined') window.LFF_STORAGE = LFF_STORAGE;
