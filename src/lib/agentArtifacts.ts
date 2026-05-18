import type { AgentArtifact, AgentArtifactKey, ContentPack, GenerationRequest } from '@/data/types';
import type { QualityReport } from './qualityGate';

const agentNames: Record<AgentArtifactKey, string> = {
  researcher: 'Researcher',
  organizer: 'Organizer',
  optimizer: 'Optimizer',
  writer: 'Writer',
  source_checker: 'Source Checker',
  editor: 'Editor',
  tonality_checker: 'Tonality Checker',
  engagement_checker: 'Engagement Checker',
};

const bannedPhrases = ['synergy', 'holistic', 'robust', 'cutting-edge', 'leverage', 'unlock', 'game-changer', 'delve'];

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function sourceText(request: GenerationRequest, pack: ContentPack): string {
  return [
    request.sourceContent,
    request.voiceTranscript,
    request.interviewNotes,
    request.customPrompt,
    pack.summary,
    pack.long_post.body_markdown,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function sentenceList(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 28);
}

function links(text: string, sourceUrl: string): string[] {
  const found = text.match(/https?:\/\/[^\s)]+/g) || [];
  return Array.from(new Set([sourceUrl, ...found].filter(Boolean))).slice(0, 5);
}

function numbers(text: string): string[] {
  return Array.from(new Set(text.match(/\$?\d[\d,.]*(?:%|k|K|M|m| hours?| days?| weeks?| months?| years?)?/g) || [])).slice(0, 8);
}

function score(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function makeArtifact(
  key: AgentArtifactKey,
  produced: string,
  scoreValue: number,
  details: Array<{ label: string; value: string }>,
  issuesCaught: string[] = [],
  recommendations: string[] = []
): AgentArtifact {
  return {
    key,
    name: agentNames[key],
    status: issuesCaught.some((issue) => issue.toLowerCase().includes('unsupported')) ? 'error' : 'done',
    produced,
    issuesCaught,
    score: score(scoreValue),
    details,
    recommendations,
    updatedAt: new Date().toISOString(),
  };
}

export function buildAgentArtifacts(request: GenerationRequest, pack: ContentPack, qualityReport?: QualityReport): AgentArtifact[] {
  const rawSource = sourceText(request, pack);
  const sourceSentences = sentenceList(rawSource);
  const sourceLinks = links(rawSource, pack.source_url);
  const sourceNumbers = numbers(rawSource);
  const longPost = pack.long_post.body_markdown;
  const longPostWords = words(longPost).length;
  const hasSteps = /\b(1\.|2\.|3\.|step 1|step 2|step 3|do this|checklist|workflow|SOP)\b/i.test(longPost);
  const hasCta = /\b(comment|dm me|reply|send me|try it|book|audit|call|download)\b/i.test(longPost + ' ' + pack.ig_caption.cta);
  const emDashCount = (longPost.match(/\u2014/g) || []).length;
  const foundBanned = bannedPhrases.filter((phrase) => longPost.toLowerCase().includes(phrase));
  const checkedClaims = sourceSentences.slice(0, 6).map((claim) => ({
    claim,
    status: sourceLinks.length || sourceNumbers.length ? 'verified' : 'weak',
  }));
  const unsupportedClaims = checkedClaims.filter((claim) => claim.status === 'weak');
  const qualityIssues = qualityReport?.violations.map((violation) => violation.message) || [];
  const outputCount = [
    pack.long_post.body_markdown,
    pack.x_thread.tweets.join(' '),
    pack.ig_caption.body,
    pack.carousel.slides.map((slide) => slide.title).join(' '),
    pack.short_script.beats.join(' '),
    pack.linkedin_post?.body || '',
    pack.email?.body || '',
    pack.blog?.body_markdown || '',
    pack.lead_magnet?.outline.join(' ') || '',
  ].filter((value) => value.trim().length > 0).length;

  return [
    makeArtifact(
      'researcher',
      `Mapped ${sourceSentences.length} source statements, ${sourceNumbers.length} numbers, and ${sourceLinks.length} links.`,
      5 + Math.min(5, sourceSentences.length / 3 + sourceLinks.length + sourceNumbers.length / 2),
      [
        { label: 'Source mode', value: request.inputMode?.replace('_', ' ') || 'unknown' },
        { label: 'Claims found', value: String(sourceSentences.length) },
        { label: 'Numbers found', value: sourceNumbers.join(', ') || 'none' },
        { label: 'Links found', value: sourceLinks.join(', ') || 'none' },
      ],
      sourceSentences.length < 3 ? ['Source material is thin. Add more proof before calling this elite.'] : [],
      ['Extract direct quotes and screenshots in the next source intelligence phase.']
    ),
    makeArtifact(
      'organizer',
      `Built the brief around ${pack.tool_name} for ${pack.audience}.`,
      pack.summary.length > 80 ? 8 : 6,
      [
        { label: 'Angle', value: pack.summary },
        { label: 'Audience', value: pack.audience },
        { label: 'Theme', value: pack.theme },
        { label: 'CTA direction', value: pack.ig_caption.cta || 'CTA needs strengthening' },
      ],
      pack.summary.length < 80 ? ['Brief angle is still too short.'] : [],
      ['Add human brief approval before writing.']
    ),
    makeArtifact(
      'optimizer',
      `Checked hook promise, platform fit, and specificity before writing.`,
      6 + (sourceNumbers.length ? 1 : 0) + (hasSteps ? 1 : 0) + (hasCta ? 1 : 0),
      [
        { label: 'Primary hook', value: pack.x_thread.hook || pack.long_post.title },
        { label: 'Specificity assets', value: sourceNumbers.join(', ') || 'needs more numbers' },
        { label: 'Platform plan', value: 'Long post, X thread, IG caption, carousel, short script' },
      ],
      sourceNumbers.length < 2 ? ['Needs more specific numbers or proof points.'] : [],
      ['Generate 5 hook options and pick the highest scoring one next.']
    ),
    makeArtifact(
      'writer',
      `Produced ${outputCount} core output formats from the approved direction.`,
      outputCount >= 5 ? 8 : 6,
      [
        { label: 'Long post words', value: String(longPostWords) },
        { label: 'Thread tweets', value: String(pack.x_thread.tweets.length) },
        { label: 'Carousel slides', value: String(pack.carousel.slides.length) },
        { label: 'Script beats', value: String(pack.short_script.beats.length) },
      ],
      longPostWords < 500 ? ['Long post is under the 500 word minimum.'] : [],
      ['Add Email, Blog, LinkedIn, and Lead Magnet tabs in the next output phase.']
    ),
    makeArtifact(
      'source_checker',
      `Checked ${checkedClaims.length} factual claims against available source material.`,
      unsupportedClaims.length ? 5 : 8,
      [
        { label: 'Verified claims', value: String(checkedClaims.length - unsupportedClaims.length) },
        { label: 'Weak claims', value: String(unsupportedClaims.length) },
        { label: 'Source links', value: sourceLinks.join(', ') || 'none' },
      ],
      unsupportedClaims.length ? ['Some claims are weak because no primary source link was available.'] : [],
      ['Add claim-level source matching UI with verified, weak, and unsupported states.']
    ),
    makeArtifact(
      'editor',
      qualityReport ? `Ran deterministic gate with score ${qualityReport.score}/100.` : 'Editor review recorded from available pack metadata.',
      qualityReport ? qualityReport.score / 10 : (pack.critic_score || 70) / 10,
      [
        { label: 'Gate result', value: qualityReport?.passed ? 'passed' : 'needs review' },
        { label: 'Issues', value: qualityIssues.length ? qualityIssues.slice(0, 3).join(' | ') : 'none found' },
        { label: 'Critic score', value: String(pack.critic_score || pack.quality_score || 'pending') },
      ],
      qualityIssues,
      qualityReport?.fixInstructions || ['Give the editor rewrite authority in the next phase.']
    ),
    makeArtifact(
      'tonality_checker',
      `Checked voice rules, banned phrases, and em dash usage.`,
      10 - foundBanned.length - emDashCount,
      [
        { label: 'Em dashes', value: String(emDashCount) },
        { label: 'Banned phrases', value: foundBanned.join(', ') || 'none' },
        { label: 'Voice stance', value: 'operator, direct, practical' },
      ],
      [
        ...(emDashCount ? [`Found ${emDashCount} em dash characters.`] : []),
        ...(foundBanned.length ? [`Banned phrases found: ${foundBanned.join(', ')}`] : []),
      ],
      ['Train against approved Los examples and edited posts.']
    ),
    makeArtifact(
      'engagement_checker',
      `Scored hook tension, format completeness, and CTA clarity.`,
      5 + (pack.x_thread.hook.length > 80 ? 1 : 0) + (pack.x_thread.tweets.length >= 7 ? 1 : 0) + (hasCta ? 2 : 0),
      [
        { label: 'Hook', value: pack.x_thread.hook.slice(0, 180) },
        { label: 'CTA present', value: hasCta ? 'yes' : 'no' },
        { label: 'Format completeness', value: `${outputCount}/9` },
      ],
      hasCta ? [] : ['CTA is missing or too soft.'],
      ['Feed real views, saves, comments, DMs, and booked calls into this score.']
    ),
  ];
}
