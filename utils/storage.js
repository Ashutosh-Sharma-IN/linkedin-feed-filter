// ─── Storage Helpers ─────────────────────────────────────────────────────────

const SECONDS_PER_POST = 18; // estimated reading/scrolling time saved per filtered post

const LFF_STORAGE = {
  DEFAULTS: {
    enabledFilters: {
      aiWritten: true,
      everydayLessons: true,
      selfiePost: true,
      wordSalad: true,
      eventRegurgitation: true,
    },
    customWords: [],
    blockedAccounts: [],
    customPatterns: [],
    stats: {
      totalFiltered: 0,
      byFilter: {},
      // dailyBuckets: { "YYYY-MM-DD": { total: N, byFilter: {} } }
      // kept rolling 7 days to avoid blowing storage quota
      dailyBuckets: {},
    },
    proLicenseKey: null,
    showFilteredCount: true,
    collapseInstead: false,
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

  todayKey() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  },

  pruneOldBuckets(buckets) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    return Object.fromEntries(
      Object.entries(buckets).filter(([day]) => day >= cutoffKey)
    );
  },

  async incrementStat(filterId) {
    const data = await LFF_STORAGE.get();
    const today = LFF_STORAGE.todayKey();

    // lifetime totals
    data.stats.totalFiltered += 1;
    data.stats.byFilter[filterId] = (data.stats.byFilter[filterId] || 0) + 1;

    // daily bucket
    const buckets = data.stats.dailyBuckets || {};
    if (!buckets[today]) buckets[today] = { total: 0, byFilter: {} };
    buckets[today].total += 1;
    buckets[today].byFilter[filterId] = (buckets[today].byFilter[filterId] || 0) + 1;

    data.stats.dailyBuckets = LFF_STORAGE.pruneOldBuckets(buckets);
    await LFF_STORAGE.set({ stats: data.stats });
  },

  // Returns { last24h, last7d, allTime, timeSaved24h, timeSaved7d }
  computeStats(stats) {
    const buckets = stats.dailyBuckets || {};
    const today = LFF_STORAGE.todayKey();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    const last24h = (buckets[today]?.total || 0) + (buckets[yesterdayKey]?.total || 0);
    const last7d = Object.values(buckets).reduce((sum, b) => sum + (b.total || 0), 0);

    return {
      last24h,
      last7d,
      allTime: stats.totalFiltered || 0,
      timeSaved24h: last24h * SECONDS_PER_POST,
      timeSaved7d: last7d * SECONDS_PER_POST,
      byFilter: stats.byFilter || {},
    };
  },

  formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
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
