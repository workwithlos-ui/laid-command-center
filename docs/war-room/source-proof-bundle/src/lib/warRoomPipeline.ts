import { buildDeterministicBrief, buildDeterministicSourceIntelligence, resolveSourceText } from './sourceIntelligence';
import { buildMemoryContext, persistAgentRuns, persistContentPack, persistEditorScore, persistPromptVersions, persistSourceBrief } from './warRoomMemory';
import { callAgent, isValidApiKey } from './openai';
import type { OpenAIConfig } from './openai';
import {
  contentPipelineAgents,
  editorAgent,
  engagementCheckerAgent,
  marketRadarAgent,
  ideaScorerAgent,
  optimizerAgent,
  organizerAgent,
  renderAgentPrompt,
  researcherAgent,
  sourceCheckerAgent,
  tonalityCheckerAgent,
  writerAgent,
} from '@/agents';
import type {
  CheckedClaim,
  ContentBrief,
  ContentPack,
  GenerationProgress,
  GenerationRequest,
  PipelineAgentRun,
  QualityScores,
  SourceIntelligence,
  SourcePreparation,
  WarRoomOutput,
} from '@/data/types';
import { formatLabels } from '@/data/types';

export interface PipelineOptions {
  openaiKey: string;
  perplexityKey?: string;
  model?: string;
  audience?: string;
  voiceTraining?: string;
  previousPackContext?: string;
}

export interface PipelineResult {
  success: boolean;
  pack?: ContentPack;
  error?: string;
  stageLogs: PipelineAgentRun[];
  tokensUsed: number;
}

export interface MarketRadarOutput {
  topic: string;
  trend_summary: string;
  radar_items: Array<{ trend: string; platform_signal: string; why_it_is_trending: string; conversation_gap: string; content_opportunity: string }>;
  competitor_angle_analysis: Array<{ competitor_angle: string; why_it_performs: string; weakness_to_exploit: string; superior_version: string }>;
  content_opportunities: Array<{ idea: string; hook: string; platform_fit: string; first_move: string }>;
}

export interface IdeaScoringOutput {
  top_pick: string;
  scoring_notes: string;
  scored_ideas: Array<{
    idea: string;
    composite_score: number;
    virality_potential: number;
    monetization_potential: number;
    authority_building_potential: number;
    unfair_advantage: number;
    recommendation: string;
    reasoning: string;
  }>;
}

type AgentPayload = Record<string, unknown>;

const MINIMUMS = {
  blogWords: 1500,
  linkedinCharacters: 1200,
  threadTweets: 7,
};

function nowId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function clampScore(value: unknown, fallback = 8): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return Math.max(1, Math.min(10, Math.round(parsed)));
  return fallback;
}

function summarizeOutput(output: AgentPayload | string | null | undefined): string {
  if (!output) return 'No output returned.';
  if (typeof output === 'string') return output.slice(0, 240);
  const keys = Object.keys(output).slice(0, 5);
  return keys.map((key) => `${key}: ${JSON.stringify(output[key]).slice(0, 120)}`).join(' | ');
}

function issueList(output: AgentPayload | null | undefined): string[] {
  if (!output) return [];
  const fromIssues = Array.isArray(output.issuesCaught) ? output.issuesCaught : Array.isArray(output.issues_caught) ? output.issues_caught : [];
  const fromRisks = Array.isArray(output.riskFlags) ? output.riskFlags : Array.isArray(output.risk_flags) ? output.risk_flags : [];
  return [...fromIssues, ...fromRisks].map(String).slice(0, 8);
}

function setAgentStatus(agents: PipelineAgentRun[], key: string, patch: Partial<PipelineAgentRun>): PipelineAgentRun[] {
  return agents.map((agent) => (agent.key === key ? { ...agent, ...patch } : agent));
}

function createInitialRuns(): PipelineAgentRun[] {
  return contentPipelineAgents.map((agent) => ({
    key: agent.key,
    name: agent.name,
    status: 'waiting',
    produced: '',
    issuesCaught: [],
    score: 0,
    timeSpentMs: 0,
    promptVersion: agent.promptVersion,
  }));
}

async function runJsonAgent<T extends AgentPayload>(config: OpenAIConfig, agent: typeof researcherAgent, context: unknown, isWriter = false): Promise<{ data: T; tokensUsed: number }> {
  const result = await callAgent<T>(config, renderAgentPrompt(agent, context), { isWriter, label: agent.name });
  if (!result.success || !result.data) throw new Error(result.error || `${agent.name} failed.`);
  return { data: result.data, tokensUsed: result.tokensUsed || 0 };
}

function mergeResearch(base: SourceIntelligence, agentOutput: AgentPayload): SourceIntelligence {
  const claims = Array.isArray(agentOutput.claims) ? agentOutput.claims : Array.isArray(agentOutput.exactClaims) ? agentOutput.exactClaims : [];
  const proof = Array.isArray(agentOutput.proofSnippets) ? agentOutput.proofSnippets : Array.isArray(agentOutput.proof_snippets) ? agentOutput.proof_snippets : [];
  return {
    ...base,
    exactClaims: claims.length ? claims.map((item, index) => ({
      id: `claim-ai-${index + 1}`,
      claim: String((item as AgentPayload).claim || item),
      quote: String((item as AgentPayload).quote || (item as AgentPayload).claim || item).slice(0, 300),
      source: String((item as AgentPayload).source || base.transcriptSource?.title || 'User source'),
      sourceReference: String((item as AgentPayload).sourceReference || (item as AgentPayload).source_reference || `agent:${index + 1}`),
      status: ((item as AgentPayload).status === 'unsupported' || (item as AgentPayload).status === 'weak' ? (item as AgentPayload).status : 'verified') as SourceIntelligence['exactClaims'][number]['status'],
      category: 'claim',
    })) : base.exactClaims,
    proofSnippets: proof.length ? proof.map((item, index) => ({
      id: `proof-ai-${index + 1}`,
      text: String((item as AgentPayload).text || item),
      sourceReference: String((item as AgentPayload).sourceReference || (item as AgentPayload).source_reference || `agent:${index + 1}`),
      strength: 'verified',
    })) : base.proofSnippets,
    audiencePainLanguage: Array.isArray(agentOutput.audiencePain) ? agentOutput.audiencePain.map(String) : base.audiencePainLanguage,
    whatEveryoneIsSaying: Array.isArray(agentOutput.marketNarrative) ? agentOutput.marketNarrative.map(String) : base.whatEveryoneIsSaying,
    whatLosShouldSayDifferently: Array.isArray(agentOutput.differentiatedAngle) ? agentOutput.differentiatedAngle.map(String) : base.whatLosShouldSayDifferently,
    riskFlags: Array.isArray(agentOutput.riskFlags) ? agentOutput.riskFlags.map(String) : base.riskFlags,
  };
}

function mergeBrief(base: ContentBrief, agentOutput: AgentPayload): ContentBrief {
  const brief = (agentOutput.contentBrief || agentOutput.brief || agentOutput) as AgentPayload;
  return {
    ...base,
    angle: String(brief.angle || base.angle),
    targetAudience: String(brief.targetAudience || brief.target_audience || base.targetAudience),
    hookPromise: String(brief.hookPromise || brief.hook_promise || base.hookPromise),
    whyNow: String(brief.whyNow || brief.why_now || base.whyNow),
    proofAvailable: Array.isArray(brief.proofAvailable) ? brief.proofAvailable.map(String) : base.proofAvailable,
    contentStructure: Array.isArray(brief.contentStructure) ? brief.contentStructure.map(String) : base.contentStructure,
    cta: String(brief.cta || base.cta),
    riskFlags: Array.isArray(brief.riskFlags) ? brief.riskFlags.map(String) : base.riskFlags,
  };
}

export async function prepareContentBrief(request: GenerationRequest, options: PipelineOptions, onProgress: (progress: GenerationProgress) => void): Promise<SourcePreparation> {
  if (!isValidApiKey(options.openaiKey)) throw new Error('Invalid or missing OpenAI API key. Add it in Settings.');
  const audience = options.audience || '$500K to $10M founders and operators';
  let agents = createInitialRuns();
  onProgress({ stage: 'source_intelligence', message: 'Collecting source evidence before any writing.', agents });
  const transcriptSource = await resolveSourceText(request, options.openaiKey);
  let sourceIntelligence = buildDeterministicSourceIntelligence(transcriptSource, request);
  if (!sourceIntelligence.exactClaims.length && !sourceIntelligence.proofSnippets.length) throw new Error('No source context found. Add claims, quotes, proof, numbers, or a transcript before generation.');

  const researchStart = performance.now();
  agents = setAgentStatus(agents, 'researcher', { status: 'running', produced: 'Extracting claims, proof, market narrative, pain language, and Los angle.' });
  onProgress({ stage: 'research', message: 'Researcher is building the evidence layer.', agents, sourceIntelligence });
  const config = { apiKey: options.openaiKey, model: options.model, temperature: 0.2, maxTokens: 5000 };
  try {
    const research = await runJsonAgent<AgentPayload>(config, researcherAgent, { request, sourceIntelligence, memory: buildMemoryContext() });
    sourceIntelligence = mergeResearch(sourceIntelligence, research.data);
    agents = setAgentStatus(agents, 'researcher', { status: 'done', produced: summarizeOutput(research.data), issuesCaught: issueList(research.data), score: clampScore(research.data.score, 8), timeSpentMs: performance.now() - researchStart });
  } catch (error) {
    agents = setAgentStatus(agents, 'researcher', { status: 'done', produced: 'Used deterministic source extraction because the research model did not return valid JSON.', issuesCaught: [error instanceof Error ? error.message : 'Research model failed.'], score: 7, timeSpentMs: performance.now() - researchStart });
  }

  let contentBrief = buildDeterministicBrief(sourceIntelligence, request, audience);
  const organizeStart = performance.now();
  agents = setAgentStatus(agents, 'organizer', { status: 'running', produced: 'Turning the source evidence into a one-page brief for approval.' });
  onProgress({ stage: 'organize', message: 'Organizer is building the approval brief.', agents, sourceIntelligence, contentBrief });
  try {
    const organized = await runJsonAgent<AgentPayload>(config, organizerAgent, { request, sourceIntelligence, contentBrief, memory: buildMemoryContext() });
    contentBrief = mergeBrief(contentBrief, organized.data);
    agents = setAgentStatus(agents, 'organizer', { status: 'done', produced: summarizeOutput(organized.data), issuesCaught: issueList(organized.data), score: clampScore(organized.data.score, 8), timeSpentMs: performance.now() - organizeStart });
  } catch (error) {
    agents = setAgentStatus(agents, 'organizer', { status: 'done', produced: 'Used deterministic brief because the organizer model did not return valid JSON.', issuesCaught: [error instanceof Error ? error.message : 'Organizer model failed.'], score: 7, timeSpentMs: performance.now() - organizeStart });
  }
  persistSourceBrief(sourceIntelligence, contentBrief);
  onProgress({ stage: 'brief', message: 'Brief ready for approval. Writing is locked until approval.', agents, sourceIntelligence, contentBrief });
  return { sourceIntelligence, contentBrief, agents };
}

function normalizeWriterOutputs(output: AgentPayload, brief: ContentBrief, source: SourceIntelligence): WarRoomOutput[] {
  const sourceProof = source.proofSnippets.map((proof) => proof.text).slice(0, 3).join(' ');
  const fallbackLong = `${brief.angle}\n\n${brief.hookPromise}\n\nThe source proof is simple: ${sourceProof}\n\nThe lesson is not to replace people. The lesson is to identify revenue-touching bottlenecks, give the team better leverage, and measure the result in operating terms.\n\nCTA: ${brief.cta}`;
  const rawOutputs = Array.isArray(output.outputs) ? output.outputs : [];
  const mapped = rawOutputs.map((item) => item as AgentPayload).filter((item) => item.format && item.content);
  const base: WarRoomOutput[] = mapped.map((item) => ({
    format: String(item.format) as WarRoomOutput['format'],
    label: String(item.label || formatLabels[String(item.format) as WarRoomOutput['format']] || item.format),
    title: String(item.title || brief.angle),
    content: String(item.content),
    hook: String(item.hook || '').trim() || undefined,
    cta: String(item.cta || brief.cta),
    version: 1,
  }));
  const required: Array<WarRoomOutput['format']> = ['long_post', 'linkedin_post', 'x_thread', 'ig_caption', 'carousel', 'short_script', 'email', 'blog', 'lead_magnet'];
  required.forEach((format) => {
    if (base.some((item) => item.format === format)) return;
    base.push({ format, label: formatLabels[format], title: brief.angle, content: fallbackLong, hook: brief.hookPromise, cta: brief.cta, version: 1 });
  });
  return base;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function threadCount(output?: WarRoomOutput): number {
  if (!output) return 0;
  return output.content.split(/\n\s*\n|\n(?=\d+[.)])/).filter((part) => part.trim().length > 20).length;
}

function evaluate(outputs: WarRoomOutput[], source: SourceIntelligence, checkedClaims: CheckedClaim[], agentScores: number[]): QualityScores {
  const longPost = outputs.find((item) => item.format === 'blog') || outputs.find((item) => item.format === 'long_post');
  const linkedin = outputs.find((item) => item.format === 'linkedin_post');
  const thread = outputs.find((item) => item.format === 'x_thread');
  const reasons: string[] = [];
  const hookStrength = outputs.some((item) => item.hook && item.hook.length > 30) ? 8 : 6;
  const specificity = source.exactClaims.length >= 3 ? 9 : 6;
  const proof = source.proofSnippets.length >= 3 && checkedClaims.every((claim) => claim.status !== 'unsupported') ? 9 : 6;
  const usefulness = outputs.some((item) => /step|system|checklist|playbook|framework|SOP/i.test(item.content)) ? 8 : 6;
  const originality = source.whatLosShouldSayDifferently.length ? 8 : 6;
  const voiceMatch = average(agentScores.filter(Boolean)) || 8;
  const ctaStrength = outputs.some((item) => item.cta && item.cta.length > 18) ? 8 : 6;
  const platformFit = threadCount(thread) >= MINIMUMS.threadTweets && (linkedin?.content.length || 0) >= MINIMUMS.linkedinCharacters ? 8 : 6;
  if (longPost && countWords(longPost.content) < MINIMUMS.blogWords) reasons.push(`Blog is under ${MINIMUMS.blogWords} words.`);
  if (linkedin && linkedin.content.length < MINIMUMS.linkedinCharacters) reasons.push(`LinkedIn is under ${MINIMUMS.linkedinCharacters} characters.`);
  if (thread && threadCount(thread) < MINIMUMS.threadTweets) reasons.push(`X thread has fewer than ${MINIMUMS.threadTweets} tweets.`);
  if (!outputs.some((item) => item.content.slice(0, 260).match(/[?]|\$?\d|mistake|lesson|before|after/i))) reasons.push('Hook is not strong enough in the first two sentences.');
  if (!outputs.some((item) => /I |we |client|owner|team|company|acquired|implemented/i.test(item.content))) reasons.push('Draft needs more story or real operating context.');
  checkedClaims.filter((claim) => claim.status === 'unsupported').forEach((claim) => reasons.push(`Unsupported claim: ${claim.claim}`));
  const composite = average([hookStrength, specificity, proof, usefulness, originality, voiceMatch, ctaStrength, platformFit]);
  return { hookStrength, specificity, proof, usefulness, originality, voiceMatch, ctaStrength, platformFit, composite, passed: reasons.length === 0 && composite >= 7.5, reasons: reasons.length ? reasons : ['Passed source, proof, specificity, and platform fit gates.'] };
}

function buildCheckedClaims(source: SourceIntelligence, sourceAgentOutput?: AgentPayload): CheckedClaim[] {
  const modelClaims = Array.isArray(sourceAgentOutput?.checkedClaims) ? sourceAgentOutput?.checkedClaims : Array.isArray(sourceAgentOutput?.claims) ? sourceAgentOutput?.claims : [];
  if (modelClaims.length) {
    return modelClaims.map((item, index) => {
      const row = item as AgentPayload;
      const status = row.status === 'unsupported' || row.status === 'weak' || row.status === 'verified' ? row.status : 'weak';
      return { id: `checked-${index + 1}`, claim: String(row.claim || item), source: String(row.source || row.sourceReference || 'Source brief'), status, note: String(row.note || row.reason || '') };
    });
  }
  return source.exactClaims.map((claim) => ({ id: claim.id, claim: claim.claim, source: claim.sourceReference, status: claim.status, note: claim.status === 'verified' ? 'Matched to source context.' : 'Needs stronger source support.' }));
}

function buildPack(request: GenerationRequest, options: PipelineOptions, sourceIntelligence: SourceIntelligence, contentBrief: ContentBrief, outputs: WarRoomOutput[], checkedClaims: CheckedClaim[], scores: QualityScores, whyOutput: AgentPayload, agents: PipelineAgentRun[]): ContentPack {
  const longPost = outputs.find((item) => item.format === 'long_post') || outputs[0];
  const blog = outputs.find((item) => item.format === 'blog');
  const linkedin = outputs.find((item) => item.format === 'linkedin_post');
  const thread = outputs.find((item) => item.format === 'x_thread');
  const instagram = outputs.find((item) => item.format === 'ig_caption');
  const email = outputs.find((item) => item.format === 'email');
  const carousel = outputs.find((item) => item.format === 'carousel');
  const script = outputs.find((item) => item.format === 'short_script');
  const packId = nowId('pack');
  return {
    id: packId,
    tool_name: longPost?.title || contentBrief.angle,
    source_url: request.sourceUrl || sourceIntelligence.primarySourceLinks[0] || 'user-provided-source',
    summary: contentBrief.hookPromise,
    audience: options.audience || contentBrief.targetAudience,
    theme: request.theme,
    style: request.style,
    created_at: new Date().toISOString(),
    posted: false,
    long_post: { title: longPost?.title || contentBrief.angle, body_markdown: longPost?.content || blog?.content || '' },
    x_thread: { hook: thread?.hook || contentBrief.hookPromise, tweets: thread?.content.split(/\n\s*\n|\n(?=\d+[.)])/).filter(Boolean) || [] },
    linkedin_post: linkedin ? { hook: linkedin.hook || contentBrief.hookPromise, body: linkedin.content, cta: linkedin.cta || contentBrief.cta } : undefined,
    ig_caption: { hook: instagram?.hook || contentBrief.hookPromise, body: instagram?.content || '', cta: instagram?.cta || contentBrief.cta },
    email: email ? { subject: email.title, preview_text: email.hook || contentBrief.hookPromise, body: email.content, cta: email.cta || contentBrief.cta } : undefined,
    carousel: { slides: carousel?.content.split(/\n\s*\n/).map((slide) => ({ title: slide.split('\n')[0] || 'Slide', bullets: slide.split('\n').slice(1).filter(Boolean) })) || [] },
    short_script: { title: script?.title || contentBrief.angle, beats: script?.content.split(/\n+/).filter(Boolean) || [] },
    quality_score: Math.round(scores.composite * 10),
    source_intelligence: sourceIntelligence,
    content_brief: contentBrief,
    pipeline_agents: agents,
    quality_scores: scores,
    why_this_works: {
      hookType: String(whyOutput.hookType || whyOutput.hook_type || 'Proof-led operator transformation'),
      targetDesire: String(whyOutput.targetDesire || whyOutput.target_desire || 'Grow revenue without adding chaos.'),
      ctaLogic: String(whyOutput.ctaLogic || whyOutput.cta_logic || contentBrief.cta),
      proofUsed: Array.isArray(whyOutput.proofUsed) ? whyOutput.proofUsed.map(String) : sourceIntelligence.proofSnippets.slice(0, 4).map((item) => item.text),
      audiencePainAddressed: Array.isArray(whyOutput.audiencePainAddressed) ? whyOutput.audiencePainAddressed.map(String) : sourceIntelligence.audiencePainLanguage,
      platformLogic: Array.isArray(whyOutput.platformLogic) ? whyOutput.platformLogic.map(String) : outputs.map((item) => `${item.label}: adapted for platform intent.`),
    },
    checked_claims: checkedClaims,
    prompt_version: 'war-room-v1.0.0',
    model: options.model || 'gpt-4o-mini',
    editor_notes: scores.reasons,
    war_room_outputs: outputs,
    transcript_source: sourceIntelligence.transcriptSource,
    agent_log: agents.map((agent) => ({ agent: agent.name, summary: agent.produced, score: agent.score })),
  };
}

export async function runPipeline(request: GenerationRequest, options: PipelineOptions, onProgress: (progress: GenerationProgress) => void, prepared?: SourcePreparation): Promise<PipelineResult> {
  if (!prepared) return { success: false, error: 'Approve the content brief before generation.', stageLogs: [], tokensUsed: 0 };
  let agents = prepared.agents.length ? prepared.agents : createInitialRuns();
  let totalTokens = 0;
  const config = { apiKey: options.openaiKey, model: options.model, temperature: 0.35, maxTokens: 6000 };
  let workingContext: AgentPayload = { request, sourceIntelligence: prepared.sourceIntelligence, contentBrief: prepared.contentBrief, memory: buildMemoryContext(), voiceTraining: options.voiceTraining || '' };
  let writerOutputs: WarRoomOutput[] = [];
  let checkedClaims: CheckedClaim[] = [];
  let whyOutput: AgentPayload = {};
  const runOrder = [optimizerAgent, writerAgent, sourceCheckerAgent, editorAgent, tonalityCheckerAgent, engagementCheckerAgent];

  for (const agent of runOrder) {
    const start = performance.now();
    agents = setAgentStatus(agents, agent.key, { status: 'running', produced: `Running ${agent.name}.` });
    onProgress({ stage: agent.key.replace('-', '_') as GenerationProgress['stage'], message: `${agent.name} is running.`, agents, sourceIntelligence: prepared.sourceIntelligence, contentBrief: prepared.contentBrief });
    try {
      const result = await runJsonAgent<AgentPayload>(config, agent, workingContext, agent.key === 'writer');
      totalTokens += result.tokensUsed;
      if (agent.key === 'writer') writerOutputs = normalizeWriterOutputs(result.data, prepared.contentBrief, prepared.sourceIntelligence);
      if (agent.key === 'source-checker') checkedClaims = buildCheckedClaims(prepared.sourceIntelligence, result.data);
      if (agent.key === 'engagement-checker') whyOutput = result.data;
      workingContext = { ...workingContext, [`${agent.key}Output`]: result.data, outputs: writerOutputs, checkedClaims };
      agents = setAgentStatus(agents, agent.key, { status: 'done', produced: summarizeOutput(result.data), issuesCaught: issueList(result.data), score: clampScore(result.data.score || result.data.compositeScore, 8), timeSpentMs: performance.now() - start });
      onProgress({ stage: agent.key.replace('-', '_') as GenerationProgress['stage'], message: `${agent.name} complete.`, agents, sourceIntelligence: prepared.sourceIntelligence, contentBrief: prepared.contentBrief });
    } catch (error) {
      agents = setAgentStatus(agents, agent.key, { status: 'error', produced: 'Agent failed to return valid JSON.', issuesCaught: [error instanceof Error ? error.message : 'Unknown failure'], score: 0, timeSpentMs: performance.now() - start });
      return { success: false, error: error instanceof Error ? error.message : `${agent.name} failed.`, stageLogs: agents, tokensUsed: totalTokens };
    }
  }
  if (!checkedClaims.length) checkedClaims = buildCheckedClaims(prepared.sourceIntelligence);
  const scores = evaluate(writerOutputs, prepared.sourceIntelligence, checkedClaims, agents.map((agent) => agent.score));
  const pack = buildPack(request, options, prepared.sourceIntelligence, { ...prepared.contentBrief, approvedAt: prepared.contentBrief.approvedAt || new Date().toISOString() }, writerOutputs, checkedClaims, scores, whyOutput, agents);
  persistContentPack(pack);
  persistAgentRuns(pack.id, agents);
  persistEditorScore(pack.id, scores, checkedClaims);
  persistPromptVersions(contentPipelineAgents.map((agent) => ({ agent: agent.key, version: agent.promptVersion })));
  onProgress({ stage: 'complete', message: scores.passed ? 'War room pack passed quality gates.' : 'War room pack generated with quality gate warnings.', pack, agents, sourceIntelligence: prepared.sourceIntelligence, contentBrief: prepared.contentBrief });
  return { success: true, pack, stageLogs: agents, tokensUsed: totalTokens };
}

export async function runMarketRadarAgent(input: { topic: string; sourceNotes: string; audience: string; openaiKey: string }): Promise<MarketRadarOutput> {
  const result = await callAgent<MarketRadarOutput>({ apiKey: input.openaiKey, temperature: 0.25, maxTokens: 3500 }, renderAgentPrompt(marketRadarAgent, input));
  if (!result.success || !result.data) throw new Error(result.error || 'Market Radar failed.');
  return result.data;
}

export async function runIdeaScoringAgent(input: { ideas: string; audience: string; positioning: string; openaiKey: string }): Promise<IdeaScoringOutput> {
  const result = await callAgent<IdeaScoringOutput>({ apiKey: input.openaiKey, temperature: 0.25, maxTokens: 3500 }, renderAgentPrompt(ideaScorerAgent, input));
  if (!result.success || !result.data) throw new Error(result.error || 'Idea Scoring failed.');
  return result.data;
}
