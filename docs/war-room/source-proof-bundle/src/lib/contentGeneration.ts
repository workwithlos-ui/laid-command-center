import { prepareContentBrief, runIdeaScoringAgent, runMarketRadarAgent, runPipeline } from './warRoomPipeline';
import type { IdeaScoringOutput, MarketRadarOutput, PipelineOptions, PipelineResult } from './warRoomPipeline';
import type { ContentBrief, ContentPack, GenerationProgress, GenerationRequest, SourcePreparation } from '@/data/types';
import { isValidApiKey } from './openai';

const OPENAI_KEY = 'openai_api_key';

function getOpenAIKey() {
  return localStorage.getItem(OPENAI_KEY) || localStorage.getItem('openai_api_key') || '';
}

function readJson(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildOptions(): PipelineOptions {
  const laidSettings = readJson('laid-settings');
  const legacySettings = readJson('ai-content-settings');
  const openaiKey = getOpenAIKey() || laidSettings.openaiApiKey || legacySettings.apiKeys?.openai || '';
  return {
    openaiKey,
    audience: localStorage.getItem('content_command_audience') || laidSettings.audience || legacySettings.audience || '$500K to $10M founders and operators',
    model: laidSettings.model || legacySettings.model || 'gpt-4o-mini',
    voiceTraining: localStorage.getItem('content_command_voice_training') || laidSettings.voiceTraining || legacySettings.voiceTraining || '',
  };
}

export async function prepareGenerationBrief(request: GenerationRequest, onProgress: (progress: GenerationProgress) => void): Promise<SourcePreparation> {
  return prepareContentBrief(request, buildOptions(), onProgress);
}

export async function generateApprovedContentPack(request: GenerationRequest, preparation: SourcePreparation, onProgress: (progress: GenerationProgress) => void): Promise<ContentPack> {
  const result = await runPipeline(request, buildOptions(), onProgress, preparation);
  if (!result.success || !result.pack) throw new Error(result.error || 'Generation failed.');
  return result.pack;
}

export async function generateContentPack(request: GenerationRequest, onProgress: (progress: GenerationProgress) => void): Promise<ContentPack> {
  const preparation = await prepareGenerationBrief(request, onProgress);
  const approvedPreparation = { ...preparation, contentBrief: { ...preparation.contentBrief, approvedAt: new Date().toISOString() } as ContentBrief };
  return generateApprovedContentPack(request, approvedPreparation, onProgress);
}

export function isUsingRealPipeline(): boolean {
  try {
    const options = buildOptions();
    return isValidApiKey(options.openaiKey);
  } catch {
    return false;
  }
}

export { prepareContentBrief, runIdeaScoringAgent, runMarketRadarAgent, runPipeline };
export type { GenerationRequest, GenerationProgress, IdeaScoringOutput, MarketRadarOutput, PipelineOptions, PipelineResult, SourcePreparation };
