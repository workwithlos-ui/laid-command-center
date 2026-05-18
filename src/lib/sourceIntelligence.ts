import type { ContentBriefSummary, GenerationInputMode, GenerationRequest, SourceIntelligenceSummary } from '@/data/types';

function activeSourceText(request: GenerationRequest): string {
  return [
    request.sourceContent,
    request.voiceTranscript,
    request.interviewNotes,
    request.customPrompt,
    request.sourceUrl,
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

function extractLinks(text: string, sourceUrl?: string): string[] {
  const links = text.match(/https?:\/\/[^\s)]+/g) || [];
  return Array.from(new Set([sourceUrl || '', ...links].filter(Boolean))).slice(0, 8);
}

function extractDates(text: string): string[] {
  const dates = text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) || [];
  return Array.from(new Set(dates)).slice(0, 8);
}

function isProofSentence(sentence: string): boolean {
  return /\$?\d|%|customer|client|founder|operator|revenue|lead|cost|time|saved|built|tested|launched|manual|workflow|system|AI/i.test(sentence);
}

function extractPain(sentences: string[]): string[] {
  return sentences
    .filter((sentence) => /manual|slow|missed|bottleneck|expensive|inconsistent|lead|follow-up|content|sales|busy|team|customer|operator/i.test(sentence))
    .slice(0, 6);
}

function modeLabel(mode?: GenerationInputMode): string {
  if (mode === 'youtube_url') return 'YouTube URL';
  if (mode === 'voice_record') return 'Voice transcript';
  if (mode === 'interview') return 'Interview notes';
  return 'Pasted content';
}

export function buildSourceIntelligence(request: GenerationRequest): SourceIntelligenceSummary {
  const text = activeSourceText(request);
  const sentences = splitSentences(text);
  const proofSentences = sentences.filter(isProofSentence).slice(0, 10);
  const primaryLinks = extractLinks(text, request.sourceUrl);
  const publishDates = extractDates(text);
  const exactClaims = proofSentences.map((claim, index) => ({
    claim,
    status: primaryLinks.length || request.inputMode !== 'youtube_url' ? 'verified' as const : 'weak' as const,
    sourceReference: `${modeLabel(request.inputMode)} ${index + 1}`,
  }));
  const riskFlags: string[] = [];

  if (text.length < 250) riskFlags.push('Source material is short. Add more raw detail for better outputs.');
  if (!primaryLinks.length && request.inputMode === 'youtube_url') riskFlags.push('YouTube mode needs a valid source URL.');
  if (exactClaims.length < 3) riskFlags.push('Few source-backed claims found. The writer must stay conservative.');
  if (!/\$?\d|%|\b\d+x\b|\b\d+ (?:hours?|days?|weeks?|months?)\b/i.test(text)) riskFlags.push('Limited numeric proof found.');

  return {
    sourceMode: request.inputMode || 'paste_content',
    sourceLength: text.length,
    primaryLinks,
    publishDates,
    exactClaims,
    proofSnippets: exactClaims.slice(0, 6).map((claim) => claim.claim),
    audiencePainLanguage: extractPain(sentences),
    marketNarrative: [
      'Most content stops at AI news or generic productivity claims.',
      'Buyers respond better to proof, operating context, and clear next steps.',
    ],
    differentiatedAngles: [
      'Frame the content around an operator problem, not the tool.',
      'Show what changed, what to do next, and what risk to avoid.',
    ],
    riskFlags,
  };
}

export function buildContentBrief(source: SourceIntelligenceSummary, request: GenerationRequest, audience: string): ContentBriefSummary {
  const firstProof = source.proofSnippets[0] || request.customPrompt || request.theme;
  const angle = source.differentiatedAngles[0] || `Turn ${request.theme} into a practical operator lesson.`;

  return {
    angle,
    targetAudience: audience,
    hookPromise: firstProof ? `Show the source-backed lesson behind: ${firstProof.slice(0, 180)}` : 'Show a practical operator lesson with proof.',
    whyNow: 'Companies are moving from AI tools to AI operating systems, and buyers need proof-backed examples instead of generic advice.',
    proofAvailable: source.proofSnippets.slice(0, 5),
    contentStructure: [
      'Open with the strongest result, tension, or operator pain.',
      'Show the real context from the source.',
      'Break down the workflow or decision.',
      'Give tactical steps the reader can use.',
      'End with a CTA tied to the offer or next action.',
    ],
    cta: 'Invite the reader to ask for the workflow, audit, checklist, or implementation map.',
    riskFlags: source.riskFlags,
  };
}

export function buildSourcePreparation(request: GenerationRequest, audience: string) {
  const sourceIntelligence = buildSourceIntelligence(request);
  const contentBrief = buildContentBrief(sourceIntelligence, request, audience);
  return { sourceIntelligence, contentBrief };
}
