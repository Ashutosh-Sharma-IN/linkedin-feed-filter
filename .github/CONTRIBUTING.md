# Contributing to LinkedIn Feed Filter

Thank you for wanting to help make LinkedIn less noisy for everyone.

## Ways to contribute

- **New filter patterns** — spotted a new type of low-quality post LinkedIn is full of? Open an issue or PR with the pattern.
- **Improve existing rules** — if a filter is catching posts it shouldn't (false positives), or missing obvious ones, file a feedback issue.
- **Translations** — the popup UI currently only supports English.
- **Bug fixes** — especially around LinkedIn DOM changes (they update class names frequently).

## Adding a new filter rule

Rules live in `filters/rules.js`. Each filter has a `check(text, meta)` function that returns:

```js
{ matched: bool, reason: string, confidence: 0–1, signals: string[] }
```

Add your regex patterns to the relevant filter's `signals` array, or create a new filter object if it's a new category. Keep rules focused — one pattern should not try to do too many things.

## Running locally

1. Clone the repo
2. Open `chrome://extensions` → enable Developer mode
3. Click "Load unpacked" → select the repo folder
4. Go to LinkedIn — the extension runs immediately
5. Make changes → click the refresh icon on the extensions page to reload

## Pull request checklist

- [ ] Patterns tested against at least 5 real examples of posts they should catch
- [ ] Tested that false-positive rate seems reasonable (run against your own feed)
- [ ] No new external dependencies added
- [ ] Popup UI still works if you changed storage schema

## Code style

- Vanilla JS only — no build step, no frameworks
- No comments explaining what code does; only add comments for non-obvious WHY
- Keep filter confidence scores honest — don't inflate them

## Licence

By contributing you agree your changes are released under the MIT Licence.
