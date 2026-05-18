// ═══════════════════════════════════════════════════════════════════════════════
// Content Generation - Public API
// Routes to the real six-agent pipeline (OpenAI API) or mock fallback.
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  ContentPack,
  GenerationProgress,
  GenerationRequest,
} from '@/data/types';
import { isValidApiKey } from './openai';
import { runPipelineWithFallback } from './pipeline';
import { getActiveClientWorkspace } from './clientWorkspace';

export type { GenerationRequest, GenerationProgress } from '@/data/types';

/**
 * Generate a content pack using the six-agent pipeline.
 * If an OpenAI API key is configured, uses the real pipeline.
 * Otherwise falls back to mock/simulation mode.
 */
export async function generateContentPack(
  request: GenerationRequest,
  onProgress: (progress: GenerationProgress) => void
): Promise<ContentPack> {
  // Read settings from localStorage. The Kimi modal stores ai-content-settings, while
  // the earlier v12 Settings view stores laid-settings. Keep both so upgrades are non-breaking.
  const kimiSettingsRaw = localStorage.getItem('ai-content-settings');
  const laidSettingsRaw = localStorage.getItem('laid-settings');
  const kimiSettings = kimiSettingsRaw ? JSON.parse(kimiSettingsRaw) : {};
  const laidSettings = laidSettingsRaw ? JSON.parse(laidSettingsRaw) : {};
  const activeWorkspace = request.clientWorkspace || kimiSettings.clientWorkspace || laidSettings.clientWorkspace || getActiveClientWorkspace();
  const openaiKey = kimiSettings.apiKeys?.openai || laidSettings.openaiApiKey || '';
  const perplexityKey = kimiSettings.apiKeys?.perplexity || '';
  const audience = activeWorkspace.audience || kimiSettings.audience || laidSettings.audience || '$500K-$10M founders/operators';
  const voiceTraining = [activeWorkspace.voiceRules, activeWorkspace.offer, activeWorkspace.proofAssets, kimiSettings.voiceTraining || laidSettings.voiceTraining || ''].filter(Boolean).join('\n');

  const { pack } = await runPipelineWithFallback(
    { ...request, clientWorkspace: activeWorkspace },
    { openaiKey, perplexityKey, audience, voiceTraining },
    onProgress
  );

  return pack;
}

/**
 * Check if the system is using the real pipeline or mock mode.
 */
export function isUsingRealPipeline(): boolean {
  try {
    const kimiSettingsRaw = localStorage.getItem('ai-content-settings');
    const laidSettingsRaw = localStorage.getItem('laid-settings');
    const kimiSettings = kimiSettingsRaw ? JSON.parse(kimiSettingsRaw) : {};
    const laidSettings = laidSettingsRaw ? JSON.parse(laidSettingsRaw) : {};
    return isValidApiKey(kimiSettings.apiKeys?.openai || laidSettings.openaiApiKey || '');
  } catch {
    return false;
  }
}
