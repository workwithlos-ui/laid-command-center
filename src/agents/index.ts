
export type { AgentContract, AgentDefinition, QualityCriterion, WarRoomAgentKey } from './types';
export { renderAgentPrompt } from './types';
export { researcherAgent } from './researcher';
export { organizerAgent } from './organizer';
export { optimizerAgent } from './optimizer';
export { writerAgent } from './writer';
export { sourceCheckerAgent } from './source-checker';
export { editorAgent } from './editor';
export { tonalityCheckerAgent } from './tonality-checker';
export { engagementCheckerAgent } from './engagement-checker';
export { marketRadarAgent } from './market-radar';
export { ideaScorerAgent } from './idea-scorer';
export { conversionAgent } from './conversion';

import type { AgentDefinition } from './types';
import { researcherAgent } from './researcher';
import { organizerAgent } from './organizer';
import { optimizerAgent } from './optimizer';
import { writerAgent } from './writer';
import { sourceCheckerAgent } from './source-checker';
import { editorAgent } from './editor';
import { tonalityCheckerAgent } from './tonality-checker';
import { engagementCheckerAgent } from './engagement-checker';
import { marketRadarAgent } from './market-radar';
import { ideaScorerAgent } from './idea-scorer';
import { conversionAgent } from './conversion';

export const contentPipelineAgents: AgentDefinition[] = [
  researcherAgent,
  organizerAgent,
  optimizerAgent,
  writerAgent,
  sourceCheckerAgent,
  editorAgent,
  tonalityCheckerAgent,
  engagementCheckerAgent,
];

export const allWarRoomAgents: AgentDefinition[] = [
  ...contentPipelineAgents,
  marketRadarAgent,
  ideaScorerAgent,
  conversionAgent,
];

export function getAgentByKey(key: string): AgentDefinition | undefined {
  return allWarRoomAgents.find((agent) => agent.key === key);
}
