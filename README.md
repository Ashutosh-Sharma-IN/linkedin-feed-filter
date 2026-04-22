# LinkedIn Feed Filter

> A free, open-source Chrome extension that silently filters low-quality posts from your LinkedIn feed. Runs 100% locally — no data ever leaves your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green)](https://chrome.google.com/webstore/detail/linkedin-feed-filter/opajafchlmemihhchimkldhkpeeofjcn)
[![GitHub Stars](https://img.shields.io/github/stars/Ashutosh-Sharma-IN/linkedin-feed-filter?style=social)](https://github.com/Ashutosh-Sharma-IN/linkedin-feed-filter)

**[🌐 Website](https://ashutosh-sharma-in.github.io/linkedin-feed-filter) · [📦 Install from Chrome Web Store](https://chrome.google.com/webstore/detail/linkedin-feed-filter/opajafchlmemihhchimkldhkpeeofjcn) · [☕ Support this project](https://rzp.io/rzp/o63uXOP)**

---

## What it filters

| Filter | What it catches | Tier |
|--------|----------------|------|
| 🤖 AI-written posts | Em-dashes, "In today's fast-paced world", numbered emoji lists, "let that sink in" | Free |
| ☕ Everyday life lessons | "My Uber driver taught me...", stranger-on-the-street wisdom posts | Free |
| 🤳 Context-free selfies | Photo + generic "Blessed!" caption with no substance | Free |
| 🥗 Motivational word salad | Hustle, manifest, synergize, disrupt — detected via 18+ pattern rules | Free |
| 📰 News regurgitation | Restating public events with no original perspective | Free |
| ✏️ Custom words & accounts | Block any word, phrase, or LinkedIn handle you choose | Free |
| 🧠 AI-assisted scoring | LLM classification for nuanced edge cases | Pro |
| 🔍 Regex patterns | Write your own filter rules | Pro |
| 📊 Analytics dashboard | Per-filter stats over time | Pro |

---

## Install (3 ways)

### Option A — Chrome Web Store (recommended)
*

### Option B — Load unpacked (for developers / early testers)

```bash
git clone https://github.com/Ashutosh-Sharma-IN/linkedin-feed-filter.git
```

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (toggle, top right)
3. Click **Load unpacked**
4. Select the cloned folder
5. Go to LinkedIn — the extension is active immediately

### Option C — Fork and customise
Fork this repo, modify `filters/rules.js` to your taste, and load your own version.

---

## How it works

The extension uses a **MutationObserver** to watch LinkedIn's feed as it loads (including infinite scroll). Each new post is passed through a chain of rule-based filter functions. Matched posts are either hidden or collapsed into a thin "Show anyway" bar — your choice.

All filtering runs in memory in your browser tab. Post text is read and immediately discarded — never stored, never sent anywhere.

Settings (which filters are on, your custom words, blocked accounts) are saved via `chrome.storage.sync` — local to your Chrome profile, synced across your devices via your Google account. We have no access to this data.

---

## File structure

```
manifest.json          Chrome extension config (Manifest V3)
content.js             MutationObserver feed watcher + filter runner
content.css            Minimal CSS for collapsed-post bar
background.js          Service worker — badge counter, welcome page on install
filters/rules.js       All 5 rule-based filter definitions
utils/storage.js       chrome.storage.sync helpers
popup/                 Extension popup UI (filter toggles, custom filters, stats)
welcome/               Onboarding page shown on first install
docs/                  GitHub Pages website (index, privacy, terms)
.github/               Issue templates + contributing guide
legal/                 Canonical privacy policy + terms of service
```

---

## Pricing

| | Free | Pro ($3/mo) | Team ($2/seat/mo) |
|---|---|---|---|
| Core 5 filters | ✓ | ✓ | ✓ |
| Custom words & accounts | ✓ | ✓ | ✓ |
| AI-assisted scoring | ✗ | ✓ | ✓ |
| Regex patterns | ✗ | ✓ | ✓ |
| Analytics | ✗ | ✓ | ✓ |
| Shared team blocklist | ✗ | ✗ | ✓ |

[→ Full pricing details](https://ashutosh-sharma-in.github.io/linkedin-feed-filter/#pricing)

---

## Contributing

PRs welcome — especially new filter patterns. See [CONTRIBUTING.md](.github/CONTRIBUTING.md).

Quick contribution loop:
1. Fork → clone
2. Edit `filters/rules.js`
3. Load unpacked in Chrome
4. Test on your LinkedIn feed
5. Open a PR

---

## Feedback & support

- 💬 [Give feedback or suggest a filter](https://github.com/Ashutosh-Sharma-IN/linkedin-feed-filter/issues/new?template=feedback.md)
- 🐛 [Report a bug](https://github.com/Ashutosh-Sharma-IN/linkedin-feed-filter/issues/new?template=bug_report.md)
- ☕ [Buy me a coffee](https://rzp.io/rzp/o63uXOP)
- 📧 [cherry.cheeku@gmail.com](mailto:cherry.cheeku@gmail.com)

---

## Legal

- [Privacy Policy](https://ashutosh-sharma-in.github.io/linkedin-feed-filter/privacy.html)
- [Terms of Service](https://ashutosh-sharma-in.github.io/linkedin-feed-filter/terms.html)
- Not affiliated with LinkedIn Corporation. "LinkedIn" is a registered trademark of LinkedIn Corporation.
- MIT Licence — see [LICENSE](LICENSE)
