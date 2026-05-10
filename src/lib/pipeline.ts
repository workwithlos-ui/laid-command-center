import type { ContentPack, GenerationProgress, GenerationRequest } from '@/data/types';
import {
  buildEditorPrompt,
  buildLongPostWriterPrompt,
  buildNewsFinderPrompt,
  buildRelevanceFilterPrompt,
  buildRepurposerPrompt,
  buildStrategistPrompt,
} from './agents';
import type {
  EditorOutput,
  LongPostOutput,
  NewsCandidate,
  NewsFinderOutput,
  RelevanceFilterOutput,
  RepurposerOutput,
  StrategistOutput,
  StrategyBrief,
} from './agents';
import { callAgent, isValidApiKey } from './openai';
import type { OpenAIConfig } from './openai';
import { generateMockPack } from './mockGeneration';
import { buildFixPrompt, runQualityGate } from './qualityGate';

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
  stageLogs: StageLog[];
  tokensUsed: number;
}

export interface StageLog {
  stage: string;
  status: 'running' | 'done' | 'error';
  rawOutput?: string;
  tokensUsed?: number;
  durationMs: number;
}

type RunnableStage<T> = {
  index: number;
  start: number;
  stage: string;
  label: string;
  result?: T;
};

function finishStage(stageLogs: StageLog[], stage: RunnableStage<unknown>, status: 'done' | 'error', rawOutput?: unknown, tokensUsed?: number) {
  stageLogs[stage.index] = {
    stage: stage.stage,
    status,
    rawOutput: typeof rawOutput === 'string' ? rawOutput : rawOutput ? JSON.stringify(rawOutput, null, 2) : undefined,
    tokensUsed,
    durationMs: performance.now() - stage.start,
  };
}

function startStage(stageLogs: StageLog[], stage: string): RunnableStage<unknown> {
  const entry = { stage, status: 'running' as const, durationMs: 0 };
  stageLogs.push(entry);
  return { index: stageLogs.length - 1, start: performance.now(), stage, label: stage };
}

function createCustomCandidate(customPrompt: string, sourceUrl: string): NewsCandidate {
  return {
    tool_name: customPrompt.split(/\s+/).slice(0, 5).join(' ') || 'User Provided Update',
    update_title: customPrompt,
    source_url: sourceUrl || 'User-provided content',
    source_type: 'user',
    publish_date: new Date().toISOString().slice(0, 10),
    summary: customPrompt,
    why_it_matters: customPrompt,
    supply_demand_gap_score: 10,
    creator_duplication_notes: 'User-provided prompt, no creator duplication check needed.',
    contrarian_angle: 'Turn the user prompt into a practical operator playbook.',
    founder_use_cases: [customPrompt, 'Turn the update into a practical workflow.', 'Use it as a source-backed operator playbook.'],
    freshness_score: 10,
    workflow_impact_score: 10,
    story_potential_score: 10,
    trend_velocity_score: 10,
  };
}

function safeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'content-pack';
}

function buildMemoryAddendum(): string {
  if (typeof localStorage === 'undefined') return '';
  try {
    const memoryRaw = localStorage.getItem('agentMemory');
    const previousRaw = localStorage.getItem('laid-content-packs') || localStorage.getItem('laid-generated-packs');
    const memory = memoryRaw ? JSON.parse(memoryRaw) : null;
    const previous = previousRaw ? JSON.parse(previousRaw) : [];
    const corrections = Array.isArray(memory?.corrections) ? memory.corrections.slice(-5) : [];
    const bestPatterns = Array.isArray(memory?.bestPatterns) ? [...memory.bestPatterns].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5) : [];
    const ratedTop = Array.isArray(previous) ? previous.filter((pack) => pack.rating === 'up' || pack.user_rating === 'up').slice(-5) : [];

    const lines: string[] = [];
    if (corrections.length) {
      lines.push('LESSONS FROM PAST GENERATIONS, avoid these issues:');
      corrections.forEach((c: { date?: string; agent?: string; score?: number | string; issue?: string; summary?: string }) => lines.push(`- ${c.date || 'unknown date'}, ${c.agent || 'agent'}, score ${c.score || 'N/A'}: ${c.issue || c.summary || 'quality issue'}`));
    }
    if (bestPatterns.length) {
      lines.push('TOP PATTERNS ADDENDUM:');
      bestPatterns.forEach((p) => lines.push(`- ${p.hookType || p.hook_type || 'hook'} on ${p.topic || 'topic'}, ${p.score || 'N/A'}/40.`));
    }
    if (ratedTop.length) {
      lines.push('USER-RATED TOP PACKS HAD THESE CHARACTERISTICS:');
      ratedTop.forEach((p) => lines.push(`- ${p.hookType || p.hook_type || p.strategy?.hook_type || 'hook'}, ${p.desireMapping || p.desire_mapping || p.strategy?.desire_mapping || 'desire'}, ${p.style || 'style'}, ${p.title || p.tool_name || 'topic'}.`));
    }
    return lines.length ? `\n${lines.join('\n')}` : '';
  } catch {
    return '';
  }
}

async function fail<T>(stageLogs: StageLog[], stage: RunnableStage<T>, onProgress: (progress: GenerationProgress) => void, message: string, tokensUsed: number): Promise<PipelineResult> {
  finishStage(stageLogs, stage, 'error', message);
  onProgress({ stage: 'error', message });
  return { success: false, error: message, stageLogs, tokensUsed };
}

export async function runPipeline(
  request: GenerationRequest,
  options: PipelineOptions,
  onProgress: (progress: GenerationProgress) => void
): Promise<PipelineResult> {
  const { sourceUrl = '', theme, style, customPrompt } = request;
  const audience = options.audience || '$500K-$10M founders/operators';
  const stageLogs: StageLog[] = [];
  let totalTokens = 0;

  if (!isValidApiKey(options.openaiKey)) {
    onProgress({ stage: 'error', message: 'Invalid or missing OpenAI API key. Add it in Settings.' });
    return { success: false, error: 'Invalid or missing OpenAI API key', stageLogs, tokensUsed: 0 };
  }

  const openaiConfig: OpenAIConfig = { apiKey: options.openaiKey, model: options.model };
  const memoryAddendum = buildMemoryAddendum();

  const strategyStage = startStage(stageLogs, 'content_strategist');
  onProgress({ stage: 'strategizing', message: 'Agent 1: Content Strategist is mapping angle, audience pain, and revenue goal...' });
  const strategyResult = await callAgent<StrategistOutput>(openaiConfig, buildStrategistPrompt(theme, audience, options.previousPackContext), { label: 'content_strategist' });
  if (!strategyResult.success || !strategyResult.data?.strategy) {
    return fail(stageLogs, strategyStage, onProgress, `Agent 1 failed: ${strategyResult.error || 'missing strategy output'}`, totalTokens);
  }
  totalTokens += strategyResult.tokensUsed || 0;
  const strategy: StrategyBrief = strategyResult.data.strategy;
  finishStage(stageLogs, strategyStage, 'done', strategyResult.data, strategyResult.tokensUsed);

  const researchStage = startStage(stageLogs, 'research_news_finder');
  onProgress({ stage: 'finding', message: 'Agent 2: Research and News Finder is building the source brief...' });
  const newsResult = await callAgent<NewsFinderOutput>(openaiConfig, buildNewsFinderPrompt(theme, audience, strategy), { label: 'research_news_finder' });
  if (!newsResult.success || !newsResult.data?.candidates?.length) {
    return fail(stageLogs, researchStage, onProgress, `Agent 2 failed: ${newsResult.error || 'no candidates returned'}`, totalTokens);
  }
  totalTokens += newsResult.tokensUsed || 0;
  const candidates = [...newsResult.data.candidates];
  if (customPrompt?.trim()) candidates.unshift(createCustomCandidate(customPrompt.trim(), sourceUrl));
  finishStage(stageLogs, researchStage, 'done', newsResult.data, newsResult.tokensUsed);

  const filterStage = startStage(stageLogs, 'relevance_filter');
  onProgress({ stage: 'filtering', message: 'Agent 3: Relevance Filter is scoring for operator usefulness...' });
  const filterResult = await callAgent<RelevanceFilterOutput>(openaiConfig, buildRelevanceFilterPrompt(audience, candidates, strategy), { label: 'relevance_filter' });
  if (!filterResult.success || !filterResult.data?.selected) {
    return fail(stageLogs, filterStage, onProgress, `Agent 3 failed: ${filterResult.error || 'missing selected update'}`, totalTokens);
  }
  totalTokens += filterResult.tokensUsed || 0;
  const selected = filterResult.data.selected;
  finishStage(stageLogs, filterStage, 'done', filterResult.data, filterResult.tokensUsed);

  const writerStage = startStage(stageLogs, 'long_post_writer');
  onProgress({ stage: 'writing', message: `Agent 4: Long-Post Writer is writing the ${style.replace('_', ' ')} post...` });
  const writerPrompt = buildLongPostWriterPrompt(selected, style, audience, theme, strategy, newsResult.data!.source_brief, memoryAddendum, options.voiceTraining);
  const writerResult = await callAgent<LongPostOutput>(openaiConfig, writerPrompt, { isWriter: true, label: 'long_post_writer' });
  if (!writerResult.success || !writerResult.data?.body_markdown) {
    return fail(stageLogs, writerStage, onProgress, `Agent 4 failed: ${writerResult.error || 'missing long post'}`, totalTokens);
  }
  totalTokens += writerResult.tokensUsed || 0;
  let longPost = writerResult.data;
  finishStage(stageLogs, writerStage, 'done', writerResult.data, writerResult.tokensUsed);

  const qualityStage = startStage(stageLogs, 'deterministic_quality_gate');
  onProgress({ stage: 'quality_gate', message: 'Quality Gate: checking tactical value, specificity, structure, and voice...' });
  let qualityReport = runQualityGate(longPost.body_markdown);
  const maxQualityRetries = 2;
  for (let qualityRetries = 1; !qualityReport.passed && qualityRetries <= maxQualityRetries; qualityRetries += 1) {
    onProgress({ stage: 'quality_gate', message: `Quality Gate: score ${qualityReport.score}/100. Auto-fixing issues, attempt ${qualityRetries}/${maxQualityRetries}...` });
    const fixPrompt = buildFixPrompt(writerPrompt, JSON.stringify(longPost), qualityReport);
    const fixResult = await callAgent<LongPostOutput>(openaiConfig, fixPrompt, { isWriter: true, label: 'quality_fix' });
    if (fixResult.success && fixResult.data?.body_markdown) {
      longPost = fixResult.data;
      totalTokens += fixResult.tokensUsed || 0;
    }
    qualityReport = runQualityGate(longPost.body_markdown);
  }
  finishStage(stageLogs, qualityStage, qualityReport.passed ? 'done' : 'error', qualityReport);
  onProgress({ stage: 'quality_gate', message: qualityReport.passed ? `Quality Gate: passed (${qualityReport.score}/100)` : `Quality Gate: best effort after retries (${qualityReport.score}/100)` });

  const repurposeStage = startStage(stageLogs, 'repurposer');
  onProgress({ stage: 'repurposing', message: 'Agent 5: Repurposer is creating X, IG, carousel, and short-form script...' });
  const repurposerResult = await callAgent<RepurposerOutput>(openaiConfig, buildRepurposerPrompt(longPost, strategy, memoryAddendum), { label: 'repurposer' });
  if (!repurposerResult.success || !repurposerResult.data) {
    return fail(stageLogs, repurposeStage, onProgress, `Agent 5 failed: ${repurposerResult.error || 'missing repurposed assets'}`, totalTokens);
  }
  totalTokens += repurposerResult.tokensUsed || 0;
  let repurposed = repurposerResult.data;
  finishStage(stageLogs, repurposeStage, 'done', repurposerResult.data, repurposerResult.tokensUsed);

  const slug = safeSlug(selected.tool_name);
  const buildPackDraft = (): ContentPack => ({
    id: `${slug}-${selected.publish_date || new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`,
    tool_name: selected.tool_name,
    source_url: selected.source_url,
    summary: selected.summary,
    audience,
    theme,
    style,
    created_at: new Date().toISOString(),
    posted: false,
    long_post: { title: longPost.title, body_markdown: longPost.body_markdown },
    x_thread: repurposed.x_thread,
    ig_caption: repurposed.ig_caption,
    carousel: repurposed.carousel,
    short_script: repurposed.short_script,
    strategy,
    source_brief: newsResult.data!.source_brief,
    agent_log: stageLogs.map((log) => ({ agent: log.stage, summary: log.status, score: log.stage === 'deterministic_quality_gate' ? Math.round(qualityReport.score / 2.5) : undefined })),
  });
  let packDraft: ContentPack = buildPackDraft();

  const editorStage = startStage(stageLogs, 'editor_quality_gate');
  onProgress({ stage: 'editing', message: 'Agent 6: Editor is running pass 1 of the 40-point quality gate...' });
  const editorFirstResult = await callAgent<EditorOutput>(openaiConfig, buildEditorPrompt(packDraft, qualityReport, newsResult.data!.source_brief, 1), { label: 'editor_quality_gate_pass_1' });
  if (editorFirstResult.success && editorFirstResult.data) {
    totalTokens += editorFirstResult.tokensUsed || 0;
    const firstScore = editorFirstResult.data.total_points ?? editorFirstResult.data.critic_score;
    const needsRewrite = editorFirstResult.data.decision === 'REJECT' || editorFirstResult.data.rewrite_required || firstScore < 28;
    if (needsRewrite) {
      onProgress({ stage: 'editing', message: `Agent 6: pass 1 scored ${firstScore}/40. Sending precise fix notes back to the Writer...` });
      const fixNotes = [
        ...(editorFirstResult.data.writer_fix_notes || []),
        ...(editorFirstResult.data.revision_notes || []),
      ].filter(Boolean).join('\n- ');
      const rewritePrompt = buildLongPostWriterPrompt(
        selected,
        style,
        audience,
        theme,
        strategy,
        newsResult.data!.source_brief,
        `${memoryAddendum}\nEDITOR PASS 1 FIX NOTES, rewrite the long post and fix every item:\n- ${fixNotes || 'Raise the post above 28/40 and remove all hard fails.'}`,
        options.voiceTraining
      );
      const rewriteResult = await callAgent<LongPostOutput>(openaiConfig, rewritePrompt, { isWriter: true, label: 'editor_directed_rewrite' });
      if (rewriteResult.success && rewriteResult.data?.body_markdown) {
        longPost = rewriteResult.data;
        totalTokens += rewriteResult.tokensUsed || 0;
        qualityReport = runQualityGate(longPost.body_markdown);
        const repurposeRewrite = await callAgent<RepurposerOutput>(openaiConfig, buildRepurposerPrompt(longPost, strategy, memoryAddendum), { label: 'repurposer_after_editor_rewrite' });
        if (repurposeRewrite.success && repurposeRewrite.data) {
          repurposed = repurposeRewrite.data;
          totalTokens += repurposeRewrite.tokensUsed || 0;
        }
        packDraft = buildPackDraft();
      }
    }

    onProgress({ stage: 'editing', message: 'Agent 6: Editor is running pass 2 to confirm fixes...' });
    const editorSecondResult = await callAgent<EditorOutput>(openaiConfig, buildEditorPrompt(packDraft, qualityReport, newsResult.data!.source_brief, 2), { label: 'editor_quality_gate_pass_2' });
    const finalEditor = editorSecondResult.success && editorSecondResult.data ? editorSecondResult.data : editorFirstResult.data;
    totalTokens += editorSecondResult.tokensUsed || 0;
    packDraft.editor_review = { first_pass: editorFirstResult.data, second_pass: editorSecondResult.data || null, final: finalEditor };
    packDraft.critic_score = finalEditor.total_points ?? finalEditor.critic_score;
    packDraft.quality_score = qualityReport.score;
    packDraft.agent_log = [
      ...(packDraft.agent_log || []),
      { agent: 'editor_quality_gate_pass_1', summary: editorFirstResult.data.approved_summary || editorFirstResult.data.decision, score: editorFirstResult.data.total_points ?? editorFirstResult.data.critic_score },
      { agent: 'editor_quality_gate_pass_2', summary: finalEditor.approved_summary || finalEditor.decision, score: finalEditor.total_points ?? finalEditor.critic_score },
    ];
    finishStage(stageLogs, editorStage, finalEditor.decision === 'REJECT' ? 'error' : 'done', packDraft.editor_review, (editorFirstResult.tokensUsed || 0) + (editorSecondResult.tokensUsed || 0));
  } else {
    packDraft.quality_score = qualityReport.score;
    packDraft.critic_score = Math.round(qualityReport.score / 2.5);
    packDraft.agent_log = [
      ...(packDraft.agent_log || []),
      { agent: 'editor_quality_gate', summary: editorFirstResult.error || 'Editor unavailable, deterministic gate used.', score: packDraft.critic_score },
    ];
    finishStage(stageLogs, editorStage, 'error', editorFirstResult.error || 'Editor unavailable');
  }

  onProgress({ stage: 'complete', message: 'Six-agent content pack ready.', pack: packDraft });
  return { success: true, pack: packDraft, stageLogs, tokensUsed: totalTokens };
}

export async function runPipelineWithFallback(
  request: GenerationRequest,
  options: PipelineOptions,
  onProgress: (progress: GenerationProgress) => void
): Promise<{ pack: ContentPack; usedRealPipeline: boolean; stageLogs: StageLog[]; tokensUsed: number }> {
  if (isValidApiKey(options.openaiKey)) {
    const result = await runPipeline(request, options, onProgress);
    if (result.success && result.pack) {
      return { pack: result.pack, usedRealPipeline: true, stageLogs: result.stageLogs, tokensUsed: result.tokensUsed };
    }
    console.warn('Real six-agent pipeline failed, falling back to mock:', result.error);
  }

  onProgress({ stage: 'finding', message: 'Using simulation mode because no API key is configured or the pipeline failed...' });
  const pack = await generateMockPack(request, onProgress);
  return { pack, usedRealPipeline: false, stageLogs: [], tokensUsed: 0 };
}
