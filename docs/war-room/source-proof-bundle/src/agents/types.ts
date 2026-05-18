
export type WarRoomAgentKey =
  | 'researcher'
  | 'organizer'
  | 'optimizer'
  | 'writer'
  | 'source-checker'
  | 'editor'
  | 'tonality-checker'
  | 'engagement-checker'
  | 'market-radar'
  | 'idea-scorer'
  | 'conversion';

export interface AgentContract {
  input: string[];
  output: string[];
}

export interface QualityCriterion {
  name: string;
  description: string;
}

export interface AgentDefinition {
  key: WarRoomAgentKey;
  name: string;
  role: string;
  promptVersion: string;
  systemPrompt: string;
  contract: AgentContract;
  qualityCriteria: QualityCriterion[];
}

export function renderAgentPrompt(agent: AgentDefinition, taskContext: unknown): string {
  return JSON.stringify(
    {
      agent: agent.name,
      promptVersion: agent.promptVersion,
      role: agent.role,
      systemPrompt: agent.systemPrompt,
      inputContract: agent.contract.input,
      outputContract: agent.contract.output,
      qualityCriteria: agent.qualityCriteria,
      taskContext,
    },
    null,
    2
  );
}
