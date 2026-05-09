/**
 * src/lib/sevenFactors.ts
 * Implements the 7 factors from seven-factors-framework.md as a scoring function.
 *
 * Scoring: each factor 0–10, total 0–70.
 * Suggestions: plain-english improvement hints when a factor scores below 6.
 */

export interface ScriptInput {
  hook: string;        // The verbal/written hook text
  topic: string;       // The specific subniche topic
  format: string;      // Video format (e.g. "talking-head", "voiceover", "whiteboard")
  length: string;      // Intended video length (e.g. "15s", "30s", "60s", "90s")
  visual_idea: string; // What the viewer SEES in the first 3 seconds
  sound_idea: string;  // Audio/music approach or description
  cta: string;         // Call to action text
}

export interface FactorScores {
  hook: number;
  topic: number;
  format: number;
  length: number;
  visual: number;
  sound: number;
  cta: number;
}

export interface ScoringResult {
  scores: FactorScores;
  total: number;       // 0–70
  suggestions: string[];
  grade: string;       // A–F
}

// ─── Factor scoring helpers ───────────────────────────────

/**
 * Factor 2 — Hook (0–10)
 * Checks: has template-level specificity, creates curiosity, under 120 chars,
 * avoids fluff words, has placeholder-filled content.
 */
function scoreHook(hook: string): { score: number; suggestion: string | null } {
  if (!hook || hook.trim().length < 5) {
    return { score: 0, suggestion: 'Write a hook — it\'s the most important factor. Use a template from the Hooks Library.' };
  }

  let score = 5; // baseline for non-empty hook

  // Length check: 20–120 chars is the sweet spot
  const len = hook.trim().length;
  if (len >= 20 && len <= 80) score += 2;
  else if (len >= 80 && len <= 120) score += 1;
  else if (len > 120) score -= 1;

  // Curiosity signals: question marks, "you", "this", "why", "how"
  const curiosityWords = /\b(why|how|this|secret|never|stop|mistake|wrong|actually|shocking|truth|proven|without|instead)\b/i;
  if (curiosityWords.test(hook)) score += 1;

  // Specificity signals: numbers, percentages, dollar amounts, time frames
  const specificityPattern = /(\$[\d,]+|\d+%|\d+[kKmM]?\s*(days?|weeks?|months?|years?|hours?|seconds?|minutes?|steps?|ways?))/i;
  if (specificityPattern.test(hook)) score += 1;

  // Target audience call-out
  if (/\b(if you|for you|you're|you are|you have|you want)\b/i.test(hook)) score += 1;

  // Penalize fluff
  const fluffWords = /\b(amazing|incredible|awesome|crazy|insane|mindblowing|literally|literally)\b/i;
  if (fluffWords.test(hook)) score -= 1;

  // Unfilled placeholders — deduct
  const hasUnfilled = /\(insert [^)]+\)/i.test(hook);
  if (hasUnfilled) score -= 2;

  score = Math.max(0, Math.min(10, score));

  const suggestion =
    score < 6
      ? 'Strengthen the hook: add specificity (numbers, timeframes), a curiosity gap, or a direct audience call-out. Keep it under 80 chars.'
      : null;

  return { score, suggestion };
}

/**
 * Factor 1 — Topic (0–10)
 * Checks: specific subniche (not broad), mentions a clear subject.
 */
function scoreTopic(topic: string): { score: number; suggestion: string | null } {
  if (!topic || topic.trim().length < 3) {
    return { score: 0, suggestion: 'Define a specific subniche topic. E.g. "n8n lead gen automations" not just "AI".' };
  }

  let score = 5;
  const words = topic.trim().split(/\s+/);

  // More specific = higher score (2+ words = subniche)
  if (words.length >= 2) score += 2;
  if (words.length >= 3) score += 1;

  // Penalize single broad terms
  const broadTerms = /^(ai|business|fitness|health|money|marketing|sales|content|social media|instagram|tiktok|youtube)$/i;
  if (broadTerms.test(topic.trim())) score -= 2;

  // Reward specificity signals
  if (/\d/.test(topic)) score += 1; // contains numbers
  if (/\b(for|with|using|without|vs\.?|versus)\b/i.test(topic)) score += 1;

  score = Math.max(0, Math.min(10, score));

  const suggestion =
    score < 6
      ? 'Make the topic more specific — one clear subniche, not your broad niche. "AI agency pricing for coaches" beats "AI business".'
      : null;

  return { score, suggestion };
}

/**
 * Factor 6 — Format (0–10)
 * Validated against the 11 proven formats from the framework.
 */
const KNOWN_FORMATS = [
  'talking back and forth',
  'talking-back-and-forth',
  'visual',
  'props',
  'voiceover',
  'voice over',
  'multitasking',
  'setting change',
  'shot change',
  'angle change',
  'clone',
  'whiteboard',
  'q&a',
  'qa',
  'green screen',
  'greenscreen',
  'reaction',
  'talking head',
  'talking-head',
  'b-roll',
  'broll',
  'testimonial',
];

function scoreFormat(format: string): { score: number; suggestion: string | null } {
  if (!format || format.trim().length < 2) {
    return { score: 0, suggestion: 'Pick a filming format. Talking-head only is outdated — try voiceover, whiteboard, props, or setting changes.' };
  }

  const f = format.toLowerCase();
  let score = 5;

  const isKnown = KNOWN_FORMATS.some((kf) => f.includes(kf));
  if (isKnown) score += 3;

  // Dynamic formats score higher
  const dynamicFormats = ['whiteboard', 'setting change', 'clone', 'green screen', 'reaction', 'multitasking', 'props', 'visual'];
  const isDynamic = dynamicFormats.some((df) => f.includes(df));
  if (isDynamic) score += 2;

  score = Math.max(0, Math.min(10, score));

  const suggestion =
    score < 6
      ? 'Use one of the 11 proven formats: whiteboard, voiceover, reaction, clone, setting change, props, multitasking, etc. Avoid static talking-head only.'
      : null;

  return { score, suggestion };
}

/**
 * Factor 3+4 (collapsed to "length") — Value & Script Angle signaled via length (0–10)
 * Short-form sweet spots: 15s (TikTok hook-only), 30s, 60s (optimal), 90s (max).
 */
function scoreLength(length: string): { score: number; suggestion: string | null } {
  if (!length || length.trim().length < 1) {
    return { score: 3, suggestion: 'Specify the intended video length. 60s is the proven sweet spot for retention + value delivery.' };
  }

  const l = length.toLowerCase().replace(/\s/g, '');

  // Extract numeric seconds
  let seconds = 0;
  const secMatch = l.match(/^(\d+)s(ec)?$/);
  const minMatch = l.match(/^(\d+)(m|min)$/);
  const rangeMatch = l.match(/^(\d+)-(\d+)s?$/);

  if (secMatch) seconds = parseInt(secMatch[1]);
  else if (minMatch) seconds = parseInt(minMatch[1]) * 60;
  else if (rangeMatch) seconds = (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
  else if (/15/.test(l)) seconds = 15;
  else if (/30/.test(l)) seconds = 30;
  else if (/45/.test(l)) seconds = 45;
  else if (/60/.test(l)) seconds = 60;
  else if (/90/.test(l)) seconds = 90;
  else if (/2m/.test(l) || /120/.test(l)) seconds = 120;

  let score = 5;

  if (seconds === 0) score = 4; // unrecognized but specified
  else if (seconds >= 45 && seconds <= 75) score = 10; // sweet spot
  else if (seconds >= 30 && seconds < 45) score = 8;
  else if (seconds > 75 && seconds <= 90) score = 7;
  else if (seconds >= 15 && seconds < 30) score = 6;
  else if (seconds > 90 && seconds <= 120) score = 5;
  else if (seconds > 120) score = 3; // too long for short-form
  else if (seconds < 15) score = 4; // hook-only, rarely enough value

  const suggestion =
    score < 6
      ? 'Aim for 45–75 seconds. Long enough to deliver value, short enough to maintain 100% retention. Under 30s often can\'t deliver measurable value.'
      : null;

  return { score, suggestion };
}

/**
 * Factor 7 — Visual (editing style / visual hook) (0–10)
 */
function scoreVisual(visual_idea: string): { score: number; suggestion: string | null } {
  if (!visual_idea || visual_idea.trim().length < 5) {
    return { score: 0, suggestion: 'Define the visual hook — what does the viewer SEE in the first 3 seconds? Setting, action, prop, or expression.' };
  }

  let score = 5;
  const v = visual_idea.toLowerCase();

  // Action-oriented visual signals
  const actionSignals = /\b(hold|show|display|pointing|writing|walking|cooking|looking|comparing|demonstrating|screen|whiteboard|prop|split.?screen|b.?roll)\b/i;
  if (actionSignals.test(v)) score += 2;

  // Pattern interrupts (unexpected visual)
  const patternInterrupt = /\b(unexpected|surprising|shocking|contrast|mismatch|weird|odd)\b/i;
  if (patternInterrupt.test(v)) score += 2;

  // Specific vs vague
  if (v.split(' ').length >= 5) score += 1;

  score = Math.max(0, Math.min(10, score));

  const suggestion =
    score < 6
      ? 'Make the visual hook specific and action-oriented. The viewer should be immediately curious in the first 0.5 seconds — describe exactly what they see.'
      : null;

  return { score, suggestion };
}

/**
 * Factor 7b — Sound (0–10)
 */
function scoreSound(sound_idea: string): { score: number; suggestion: string | null } {
  if (!sound_idea || sound_idea.trim().length < 3) {
    return { score: 2, suggestion: 'Describe the audio approach — trending audio, voiceover, music genre, or signature sound. Audio drives 30% of retention.' };
  }

  let score = 5;
  const s = sound_idea.toLowerCase();

  // Known good sound signals
  const trendingSignal = /\b(trending|viral|popular|known|recognizable|original)\b/i;
  if (trendingSignal.test(s)) score += 2;

  const voiceoverSignal = /\b(voiceover|narration|speaking|talking|my voice|commentary)\b/i;
  if (voiceoverSignal.test(s)) score += 1;

  const musicGenre = /\b(lo.?fi|hip.?hop|ambient|upbeat|cinematic|energetic|piano|trap|drill|pop)\b/i;
  if (musicGenre.test(s)) score += 2;

  // Specificity
  if (s.split(' ').length >= 3) score += 1;

  score = Math.max(0, Math.min(10, score));

  const suggestion =
    score < 6
      ? 'Be specific about audio — trending sound, original voiceover, or music genre. Saying "background music" is too vague. Pick a specific vibe.'
      : null;

  return { score, suggestion };
}

/**
 * Factor 5 — CTA (0–10)
 * Checks: has a verb, specific action, optional keyword for automation.
 */
function scoreCTA(cta: string): { score: number; suggestion: string | null } {
  if (!cta || cta.trim().length < 3) {
    return { score: 0, suggestion: 'Add a CTA — what do you want viewers to do? Follow, save, comment a keyword, or DM you. Always close with action.' };
  }

  let score = 5;
  const c = cta.toLowerCase();

  // Action verbs
  const actionVerbs = /\b(follow|save|comment|share|dm|click|subscribe|like|tag|reply|watch|go to|check out|grab|download|visit)\b/i;
  if (actionVerbs.test(c)) score += 2;

  // Keyword automation (ManyChat style)
  const keywordPattern = /\b(comment|type|reply|say|drop)\b.{0,30}\b([A-Z]{2,8}|"[^"]+"|keyword)\b/i;
  if (keywordPattern.test(c)) score += 3;

  // Urgency/specificity
  if (/\b(now|today|first \d+|part 2|free)\b/i.test(c)) score += 1;

  // Lead gen CTA (highest value)
  if (/\b(freebie|guide|template|checklist|resource|link|pdf)\b/i.test(c)) score += 1;

  score = Math.max(0, Math.min(10, score));

  const suggestion =
    score < 6
      ? 'Upgrade the CTA: use comment-trigger automation ("Comment KEYWORD and I\'ll DM you the guide"), or a specific ask ("Save this for later"). Generic "follow me" CTAs convert poorly.'
      : null;

  return { score, suggestion };
}

// ─── Grade mapping ─────────────────────────────────────────
function getGrade(total: number): string {
  if (total >= 63) return 'A+';
  if (total >= 56) return 'A';
  if (total >= 49) return 'B';
  if (total >= 42) return 'C';
  if (total >= 35) return 'D';
  return 'F';
}

// ─── Main scoring function ────────────────────────────────
/**
 * scoreScript — scores a short-form video concept across all 7 factors.
 *
 * @param input - The script details to score
 * @returns ScoringResult with per-factor scores, total (0–70), and suggestions
 */
export function scoreScript(input: ScriptInput): ScoringResult {
  const hookResult   = scoreHook(input.hook);
  const topicResult  = scoreTopic(input.topic);
  const formatResult = scoreFormat(input.format);
  const lengthResult = scoreLength(input.length);
  const visualResult = scoreVisual(input.visual_idea);
  const soundResult  = scoreSound(input.sound_idea);
  const ctaResult    = scoreCTA(input.cta);

  const scores: FactorScores = {
    hook:   hookResult.score,
    topic:  topicResult.score,
    format: formatResult.score,
    length: lengthResult.score,
    visual: visualResult.score,
    sound:  soundResult.score,
    cta:    ctaResult.score,
  };

  const total = Object.values(scores).reduce((sum, s) => sum + s, 0);

  const suggestions = [
    hookResult.suggestion,
    topicResult.suggestion,
    formatResult.suggestion,
    lengthResult.suggestion,
    visualResult.suggestion,
    soundResult.suggestion,
    ctaResult.suggestion,
  ].filter((s): s is string => s !== null);

  return {
    scores,
    total,
    suggestions,
    grade: getGrade(total),
  };
}

// ─── Factor metadata (used in ScriptScoreCard) ─────────────
export const FACTOR_LABELS: Record<keyof FactorScores, string> = {
  hook:   'Hook (Factor 2)',
  topic:  'Topic (Factor 1)',
  format: 'Format (Factor 6)',
  length: 'Length / Value (Factor 3)',
  visual: 'Visual (Factor 7)',
  sound:  'Sound (Factor 7)',
  cta:    'CTA (Factor 5)',
};

export const FACTOR_DESCRIPTIONS: Record<keyof FactorScores, string> = {
  hook:   'Verbal + written hook — first 3 seconds',
  topic:  'Specific subniche (not broad niche)',
  format: 'Filming format — talking-head, whiteboard, voiceover, etc.',
  length: 'Target video length (45–75s is optimal)',
  visual: 'Visual hook — what viewer sees in first 3 seconds',
  sound:  'Audio approach — trending sound, voiceover, music',
  cta:    'Call to action — what viewer does after watching',
};
