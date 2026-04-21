// ─── Filter Rule Definitions ────────────────────────────────────────────────
// Each filter returns { matched: bool, reason: string, confidence: 0-1 }

const FILTERS = {

  aiWritten: {
    id: 'aiWritten',
    label: 'AI-written posts',
    defaultEnabled: true,
    check(text) {
      const signals = [
        // Dead giveaway openers
        /^in today['']s (fast-paced|ever-changing|digital|competitive)/i,
        /^as (we|I) navigate/i,
        /^in a world where/i,
        /^the (truth|reality|fact) is[,\s]/i,
        /^let['']s (talk|be honest|dive)/i,
        /^here['']s (what|the thing|a secret|why)/i,
        /^unpopular opinion:/i,
        /^hot take:/i,
        /^\d+\s+(things|ways|reasons|tips|lessons|steps|habits|mistakes)/i,

        // Closing flourishes
        /let that sink in\.?$/im,
        /food for thought\.?$/im,
        /just my (two cents|thoughts)\.?$/im,
        /drop a .{1,3} if you agree/i,
        /what['']s your (take|thought)\?/i,
        /thoughts\? 👇/i,
        /agree\? (let me know|comment below)/i,

        // Structural tells
        /^(p\.?s\.?|pss?)\b/im,
        /^→/m,
        /^\✅/m,
        /^\d+[.)]\s+\p{Emoji}/mu,
      ];

      // Em-dash overuse (AI loves these)
      const emDashCount = (text.match(/—/g) || []).length;
      const wordCount = text.split(/\s+/).length;
      const emDashDensity = emDashCount / wordCount;

      // Detect heavy line-break formatting (one sentence per line, AI style)
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const shortLineRatio = lines.filter(l => l.trim().split(/\s+/).length < 12).length / (lines.length || 1);

      let score = 0;
      const matchedSignals = [];

      for (const pattern of signals) {
        if (pattern.test(text)) {
          score += 0.25;
          matchedSignals.push(pattern.toString().slice(1, 40));
        }
      }

      if (emDashDensity > 0.03) { score += 0.2; matchedSignals.push('em-dash overuse'); }
      if (lines.length > 6 && shortLineRatio > 0.8) { score += 0.2; matchedSignals.push('choppy line breaks'); }

      const confidence = Math.min(score, 1);
      return {
        matched: confidence >= 0.4,
        reason: 'AI-written',
        confidence,
        signals: matchedSignals,
      };
    },
  },

  everydayLessons: {
    id: 'everydayLessons',
    label: 'Life lessons from random encounters',
    defaultEnabled: true,
    check(text) {
      const patterns = [
        /my (uber|ola|cab|taxi|auto|rickshaw) driver (taught|told|showed|reminded)/i,
        /my (barista|waiter|server|delivery guy|maid|cook|watchman) (taught|told|showed)/i,
        /a (stranger|random person|old man|old woman|elderly) (taught|told|showed|reminded)/i,
        /my (kid|son|daughter|child|nephew|niece) said something/i,
        /\b(this|it) happened to me\b/i,
        /true story:/i,
        /not clickbait/i,
        /years? ago[,\s].{0,60}(never forget|changed me|taught me)/i,
        /i was (standing|sitting|waiting|walking).{0,80}(realized|thought|learned)/i,
        /overheard (someone|a conversation|this)/i,
        /the (janitor|security guard|peon|office boy) taught me/i,
      ];

      const matched = patterns.some(p => p.test(text));
      return {
        matched,
        reason: 'Everyday encounter life lesson',
        confidence: matched ? 0.85 : 0,
        signals: matched ? ['everyday-lesson-pattern'] : [],
      };
    },
  },

  selfiePost: {
    id: 'selfiePost',
    label: 'Selfies with no context',
    defaultEnabled: true,
    // Called separately with { text, hasImage, imageCount }
    check(text, meta = {}) {
      const { hasImage = false, imageCount = 0 } = meta;
      if (!hasImage) return { matched: false, reason: '', confidence: 0, signals: [] };

      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      const firstPersonCount = (text.match(/\b(I|me|my|myself|I'm|I've|I'll)\b/gi) || []).length;
      const firstPersonDensity = firstPersonCount / (wordCount || 1);

      // Generic caption patterns
      const genericCaptions = [
        /^(blessed|grateful|humbled|excited|thrilled|honoured|honored)\b/i,
        /^great (time|meeting|event|day|experience|opportunity)/i,
        /^amazing (time|meeting|event|day|experience)/i,
        /^lovely (time|meeting|event|day)/i,
        /^had (an amazing|a great|a wonderful|a lovely)/i,
        /^so (grateful|blessed|humbled|excited|thrilled)/i,
        /^what an (amazing|incredible|wonderful|inspiring)/i,
        /^feeling (blessed|grateful|humbled|excited)/i,
      ];

      const isGenericCaption = genericCaptions.some(p => p.test(text.trim()));
      const isShortPost = wordCount < 60;

      let score = 0;
      const signals = [];

      if (isGenericCaption) { score += 0.5; signals.push('generic-caption'); }
      if (isShortPost && firstPersonDensity > 0.15) { score += 0.3; signals.push('short-first-person-heavy'); }
      if (imageCount === 1 && wordCount < 30) { score += 0.3; signals.push('single-image-minimal-text'); }

      const confidence = Math.min(score, 1);
      return {
        matched: confidence >= 0.5,
        reason: 'Selfie / low-context photo post',
        confidence,
        signals,
      };
    },
  },

  wordSalad: {
    id: 'wordSalad',
    label: 'Generic word salad / motivational fluff',
    defaultEnabled: true,
    check(text) {
      const fluffPhrases = [
        /\bwork(ing)? smarter,?\s+not harder\b/i,
        /\bgrowth mindset\b/i,
        /\bhustle (culture|hard|harder)\b/i,
        /\byour (vibe|energy|mindset) attracts/i,
        /\bmanifest(ing)? (your|success|dreams|goals)\b/i,
        /\bdone is better than perfect\b/i,
        /\bembrace (the|your) journey\b/i,
        /\bleveling? up\b/i,
        /\boutside (your|the) comfort zone\b/i,
        /\bimposter syndrome\b/i,
        /\bfail(ing)? forward\b/i,
        /\bno (pain|risk),?\s+no (gain|reward)\b/i,
        /\b(be|stay) authentic\b/i,
        /\bown your (story|narrative|journey)\b/i,
        /\bdisrupt(ing)? (the|an?) industry\b/i,
        /\bsynergize?\b/i,
        /\bthought leader(ship)?\b/i,
        /\bpassion(ate)? about making (a|an?) (impact|difference)\b/i,
      ];

      const matched = fluffPhrases.filter(p => p.test(text));
      const score = Math.min(matched.length * 0.3, 1);

      return {
        matched: score >= 0.3,
        reason: 'Generic motivational word salad',
        confidence: score,
        signals: matched.map(p => p.toString().slice(1, 40)),
      };
    },
  },

  eventRegurgitation: {
    id: 'eventRegurgitation',
    label: 'Event / news regurgitation (no original take)',
    defaultEnabled: true,
    check(text) {
      // Signals: news-report style language with no personal perspective
      const reportingVerbs = [
        /\b(announced|confirmed|revealed|reported|said|stated|declared|unveiled)\b/i,
        /\baccording to\b/i,
        /\bsources (say|confirm|report)\b/i,
        /\bbreaking:/i,
        /\bofficial(ly)?\b/i,
      ];

      const personalPerspective = [
        /\b(I think|I believe|in my opinion|my take|my view|I feel|personally)\b/i,
        /\bhere['']s why this matters to me\b/i,
        /\bwhat this means for\b/i,
        /\bmy (experience|story|journey)\b/i,
      ];

      const reportingCount = reportingVerbs.filter(p => p.test(text)).length;
      const hasPerspective = personalPerspective.some(p => p.test(text));

      // High reporting + no personal angle = regurgitation
      const isRegurgitation = reportingCount >= 2 && !hasPerspective;
      const confidence = isRegurgitation ? Math.min(0.4 + reportingCount * 0.1, 0.9) : 0;

      return {
        matched: isRegurgitation,
        reason: 'Event / news regurgitation',
        confidence,
        signals: isRegurgitation ? [`${reportingCount} reporting verbs, no personal take`] : [],
      };
    },
  },
};

// Expose to content script
if (typeof window !== 'undefined') window.LFF_FILTERS = FILTERS;
