// ═══════════════════════════════════════════════════════════════════════════════
// Quality Gate — Enforces 6 Gate Principles on Generated Content
// ═══════════════════════════════════════════════════════════════════════════════

export interface QualityReport {
  passed: boolean;
  score: number; // 0-100
  violations: Violation[];
  fixInstructions: string[];
}

export interface Violation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  location: string;
}

// Buzzwords that violate the voice rules
const BUZZWORDS = [
  'synergy', 'holistic', 'robust', 'leverage', 'scalable',
  'disruptive', 'game-changer', 'revolutionary', 'cutting-edge',
  'best-in-class', 'world-class', 'innovative', 'transformative',
  'paradigm', 'deep dive', 'circle back', 'move the needle',
  'boil the ocean', 'low-hanging fruit', 'think outside the box',
  'synergize', 'ideate', 'pivot', 'optimize', 'streamline',
  'maximize', 'monetize', 'actionable', 'impactful',
  'next-generation', 'state-of-the-art', 'groundbreaking',
];

// Phrases that indicate invented stats
const INVENTED_STAT_PATTERNS = [
  /according to (my|our) research/i,
  /studies show that \d+%/i,
  /research suggests/i,
  /it's estimated that \d+/i,
  /imagine if \d+/i,
  /imagine a world where/i,
  /picture this:/i,
];

/**
 * Run the full quality gate on a content pack's long post.
 * Returns a report with pass/fail, score, and fix instructions.
 */
export function runQualityGate(bodyMarkdown: string): QualityReport {
  const violations: Violation[] = [];

  // ── Rule 1: At least one concrete action ──
  const actionPatterns = [
    /\b(step \d|step\d|first,|second,|third,|1\.|2\.|3\.|4\.|5\.)/i,
    /\b(here's how|here is how|do this|try this|set up|connect|open|click|type|paste|upload)/i,
    /\b(workflow|process|SOP|checklist|template)/i,
    /\b(guide|tutorial|walkthrough|setup)/i,
  ];
  const hasConcreteAction = actionPatterns.some(p => p.test(bodyMarkdown));
  if (!hasConcreteAction) {
    violations.push({
      rule: 'concrete_action',
      severity: 'error',
      message: 'No concrete action found. Add a step-by-step instruction, setup guide, or specific workflow someone can follow this week.',
      location: 'body',
    });
  }

  // ── Rule 2: At least 2-3 specific numbers ──
  const numberPattern = /\$?\d{1,3}(,\d{3})*(\.\d+)?\s*(%|minutes?|hours?|days?|weeks?|months?|years?|K|M|k|million)?|\$\d+/gi;
  const numbers = bodyMarkdown.match(numberPattern) || [];
  const significantNumbers = numbers.filter(n => {
    const digits = n.replace(/[^0-9]/g, '');
    return digits.length > 0 && parseInt(digits) > 1;
  });
  if (significantNumbers.length < 2) {
    violations.push({
      rule: 'specific_numbers',
      severity: 'error',
      message: `Only ${significantNumbers.length} specific number(s) found. Add 2-3 specific metrics, dollar amounts, timeframes, or percentages.`,
      location: 'body',
    });
  }

  // ── Rule 3: No corporate buzzwords ──
  const foundBuzzwords: string[] = [];
  const lowerBody = bodyMarkdown.toLowerCase();
  for (const buzz of BUZZWORDS) {
    if (lowerBody.includes(buzz.toLowerCase())) {
      foundBuzzwords.push(buzz);
    }
  }
  if (foundBuzzwords.length > 0) {
    violations.push({
      rule: 'no_buzzwords',
      severity: 'error',
      message: `Corporate buzzwords found: "${foundBuzzwords.join('", "')}". Replace with plain language a 48-year-old business owner would use.`,
      location: 'body',
    });
  }

  // ── Rule 4: Average sentence length under ~20 words ──
  const sentences = bodyMarkdown
    .replace(/\n/g, ' ')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
  if (sentences.length > 0) {
    const avgWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    if (avgWords > 22) {
      violations.push({
        rule: 'sentence_length',
        severity: 'warning',
        message: `Average sentence length is ${Math.round(avgWords)} words (max: 22). Break long sentences into shorter ones.`,
        location: 'body',
      });
    }
  }

  // ── Rule 5: Short paragraphs (1-3 sentences) ──
  const paragraphs = bodyMarkdown.split('\n\n').filter(p => p.trim().length > 10);
  const longParagraphs = paragraphs.filter(p => {
    const sents = p.split(/[.!?]+/).filter(s => s.trim().length > 5);
    return sents.length > 3;
  });
  if (longParagraphs.length > 2) {
    violations.push({
      rule: 'paragraph_length',
      severity: 'warning',
      message: `${longParagraphs.length} paragraphs have 4+ sentences. Keep paragraphs to 1-3 sentences for readability.`,
      location: 'body',
    });
  }

  // ── Rule 6: One clear CTA ──
  const ctaPatterns = [
    /comment \*?\w+\*?/i,
    /DM me/i,
    /reply with/i,
    /send me/i,
    /follow.*for/i,
    /save this/i,
    /try it/i,
    /let me know/i,
  ];
  const hasCTA = ctaPatterns.some(p => p.test(bodyMarkdown));
  if (!hasCTA) {
    violations.push({
      rule: 'clear_cta',
      severity: 'error',
      message: 'No clear call-to-action found. Add a CTA like "Comment GPT55" or "DM me for the guide".',
      location: 'body',
    });
  }

  // ── Rule 7: No invented stats / hypotheticals ──
  const inventedStats: string[] = [];
  for (const pattern of INVENTED_STAT_PATTERNS) {
    const match = bodyMarkdown.match(pattern);
    if (match) inventedStats.push(match[0]);
  }
  if (inventedStats.length > 0) {
    violations.push({
      rule: 'no_invented_stats',
      severity: 'error',
      message: `Invented stats or hypotheticals found: "${inventedStats.join('", "')}". Use only real data from the source or frame as personal opinion.`,
      location: 'body',
    });
  }

  // ── Rule 8: No "imagine if" hypotheticals ──
  const imaginePattern = /imagine (if|a|you could|this)/i;
  if (imaginePattern.test(bodyMarkdown)) {
    violations.push({
      rule: 'no_hypotheticals',
      severity: 'warning',
      message: '"Imagine if" hypotheticals found. Replace with real examples or specific scenarios.',
      location: 'body',
    });
  }

  // ── Calculate Score ──
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

  // ── Generate Fix Instructions ──
  const fixInstructions = violations.map(v => {
    if (v.rule === 'concrete_action') return 'Add a numbered step-by-step process or setup guide that someone can follow this week.';
    if (v.rule === 'specific_numbers') return 'Add specific dollar amounts, time savings, or metric improvements. Use real numbers from the source update.';
    if (v.rule === 'no_buzzwords') return 'Replace buzzwords with plain language. Write like you are explaining to a 48-year-old business owner.';
    if (v.rule === 'sentence_length') return 'Break long sentences into 2 shorter ones. Aim for 15-20 words per sentence.';
    if (v.rule === 'paragraph_length') return 'Split long paragraphs. Each paragraph should be 1-3 sentences max.';
    if (v.rule === 'clear_cta') return 'Add a clear call-to-action at the end (e.g., "Comment KEYWORD for the full guide").';
    if (v.rule === 'no_invented_stats') return 'Remove invented statistics. Only use numbers traceable to the source update.';
    if (v.rule === 'no_hypotheticals') return 'Replace "imagine if" with a real example or concrete scenario.';
    return v.message;
  });

  const passed = score >= 70 && errorCount === 0;

  return {
    passed,
    score,
    violations,
    fixInstructions,
  };
}

/**
 * Build a fix prompt for the writer agent based on quality gate failures.
 */
export function buildFixPrompt(
  originalPrompt: string,
  originalOutput: string,
  report: QualityReport
): string {
  return `${originalPrompt}

IMPORTANT — The previous output failed quality checks (score: ${report.score}/100).
Fix these issues and regenerate:

${report.fixInstructions.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

Previous output for reference (fix the issues, do not copy verbatim):
${originalOutput.slice(0, 500)}

Output JSON only with the same shape as before.`;
}
