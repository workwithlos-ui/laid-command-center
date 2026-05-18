
import type { ContentBrief, GenerationRequest, ProofSnippet, SourceClaim, SourceIntelligence, VideoTranscriptSource } from '@/data/types';
import { fetchYouTubeTranscript, isYouTubeUrl } from './youtubeTranscript';

function splitPastedContentIntoSegments(transcript: string): VideoTranscriptSource['segments'] {
  const paragraphs = transcript
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const chunks = paragraphs.length ? paragraphs : [transcript.trim()];
  return chunks.map((text, index) => ({ index, text, start: index * 30, duration: 30 }));
}

export function createPastedTranscriptSource(pastedContent: string, theme: string, sourceUrl: string): VideoTranscriptSource {
  const transcript = pastedContent.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return {
    videoId: 'pasted-content',
    url: sourceUrl.trim() || 'pasted-content',
    title: theme ? `Pasted Content: ${theme}` : 'Pasted Content',
    source: 'pasted',
    language: 'user-provided',
    fetchedAt: new Date().toISOString(),
    durationSeconds: Math.max(30, splitPastedContentIntoSegments(transcript).length * 30),
    transcript,
    segments: splitPastedContentIntoSegments(transcript),
  };
}

export async function resolveSourceText(request: GenerationRequest, openaiKey: string): Promise<VideoTranscriptSource> {
  const pasted = request.pastedContent?.trim() || '';
  const sourceUrl = request.sourceUrl?.trim() || '';
  if (pasted.length >= 80) return createPastedTranscriptSource(pasted, request.theme, sourceUrl);
  if (sourceUrl && isYouTubeUrl(sourceUrl)) return fetchYouTubeTranscript(sourceUrl, openaiKey);
  throw new Error('No source context found. Paste source material or provide a YouTube URL before generation.');
}

function sentenceSplit(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24);
}

function extractLinks(text: string, fallback: string): string[] {
  const links = text.match(/https?:\/\/[^\s)]+/g) || [];
  return Array.from(new Set([...(fallback ? [fallback] : []), ...links])).filter(Boolean);
}

function extractDates(text: string): string[] {
  const matches = text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) || [];
  return Array.from(new Set(matches));
}

function classifyClaim(sentence: string): SourceClaim['category'] {
  if (/\$?\d|\b\d+%\b|\b\d+x\b/i.test(sentence)) return 'number';
  if (/["“”]/.test(sentence)) return 'quote';
  if (/acquired|implemented|launched|built|hired|fired|grew|went from|story/i.test(sentence)) return 'story';
  if (/\b\d{4}-\d{2}-\d{2}\b|\bday|month|year|week\b/i.test(sentence)) return 'date';
  if (/https?:\/\//.test(sentence)) return 'link';
  return 'claim';
}

export function buildDeterministicSourceIntelligence(transcriptSource: VideoTranscriptSource, request: GenerationRequest): SourceIntelligence {
  const text = transcriptSource.transcript.trim();
  const sentences = sentenceSplit(text);
  const claimCandidates = sentences.filter((sentence) => /\$?\d|%|went from|increased|decreased|implemented|acquired|learned|key was|because|after|before|previous|owner|customer|revenue|lead|AI/i.test(sentence)).slice(0, 18);
  const exactClaims: SourceClaim[] = claimCandidates.map((claim, index) => ({
    id: `claim-${index + 1}`,
    claim,
    quote: claim.length <= 220 ? claim : undefined,
    source: transcriptSource.title,
    sourceReference: `${transcriptSource.source}:${index + 1}`,
    status: 'verified',
    category: classifyClaim(claim),
  }));
  const proofSnippets: ProofSnippet[] = exactClaims.slice(0, 10).map((claim, index) => ({
    id: `proof-${index + 1}`,
    text: claim.quote || claim.claim,
    sourceReference: claim.sourceReference,
    strength: claim.status,
  }));
  const lower = text.toLowerCase();
  const painLanguage = sentences.filter((sentence) => /paper|spreadsheet|manual|missed|slow|chaos|bottleneck|follow-up|lead|schedule|owner|team|customer/i.test(sentence)).slice(0, 8);
  const themes = [
    lower.includes('ai') ? 'AI implementation that amplifies staff' : 'Operator system improvement',
    lower.includes('revenue') ? 'Revenue lift from process change' : 'Business process improvement',
    lower.includes('paper') || lower.includes('spreadsheet') ? 'Legacy operations modernization' : 'Operational clarity',
  ];
  const risks: string[] = [];
  if (!exactClaims.length) risks.push('The source has few explicit claims, so the draft must stay conservative.');
  if (!/\$?\d|%|\b\d+x\b/i.test(text)) risks.push('The source has limited numeric proof.');
  if (!request.offerContext?.trim()) risks.push('Offer context is limited, so CTAs should stay soft.');

  return {
    id: `source-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    primarySourceLinks: extractLinks(text, request.sourceUrl || transcriptSource.url),
    publishDates: extractDates(text),
    exactClaims,
    proofSnippets,
    competitorAngles: ['Most creators would frame this as AI replacing labor.', 'Most operators would focus on software rather than adoption.'],
    audiencePainLanguage: painLanguage,
    whatEveryoneIsSaying: ['AI automation cuts headcount.', 'Legacy businesses need modern software.', 'Speed comes from replacing manual work.'],
    whatLosShouldSayDifferently: ['The win is not replacing people, it is giving the existing team superpowers.', 'The first ninety days should focus on bottlenecks that already touch revenue.'],
    keyThemes: Array.from(new Set(themes)),
    uniqueInsights: sentences.filter((sentence) => /key was|not replacing|superpowers|90 days|implemented/i.test(sentence)).slice(0, 6),
    riskFlags: risks,
    sourceText: text,
    transcriptSource,
  };
}

export function buildDeterministicBrief(sourceIntelligence: SourceIntelligence, request: GenerationRequest, audience: string): ContentBrief {
  const bestProof = sourceIntelligence.proofSnippets.map((proof) => proof.text).slice(0, 4);
  const firstTheme = sourceIntelligence.keyThemes[0] || request.theme || 'Operator content sprint';
  return {
    id: `brief-${Date.now().toString(36)}`,
    angle: sourceIntelligence.whatLosShouldSayDifferently[0] || `Turn ${firstTheme} into a practical operator lesson.`,
    targetAudience: audience,
    hookPromise: bestProof[0] ? `Show the exact source-backed lesson behind: ${bestProof[0]}` : 'Show the specific operator lesson from the source material.',
    whyNow: 'AI adoption is moving from tools to operating systems, and operators need proof-backed examples instead of hype.',
    proofAvailable: bestProof,
    contentStructure: ['Open with the strongest result or tension.', 'Show the messy before state.', 'Explain the system change.', 'Extract tactical lessons.', 'End with a practical CTA.'],
    cta: request.offerContext?.trim() ? `Connect the lesson to this offer: ${request.offerContext.trim()}` : 'Invite the reader to ask for the operating checklist or implementation map.',
    riskFlags: sourceIntelligence.riskFlags,
  };
}
