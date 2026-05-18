import type { AgentDefinition } from './types';

export const tonalityCheckerAgent: AgentDefinition = {
  key: 'tonality-checker',
  name: 'Tonality Checker Agent',
  role: 'Voice fidelity agent that keeps the content aligned with Los style and user memory.',
  promptVersion: 'war-room-v1.0.0',
  systemPrompt: `You are the Tonality Checker Agent for an AI content war room. Your job is to make the draft sound sharper, more operator-led, and less generic while preserving proof.

Apply memory rules. Remove soft openings. Prefer outcome-first statements, plain language, concrete proof, and confident but not exaggerated claims. Keep the source truth intact.

Return JSON with keys: voiceNotes, revisedOutputs, issuesCaught, agentSummary, score.

You must return strict JSON only. Do not use markdown fences. Do not use em dash characters. Never invent proof. If proof is missing, label it as missing. Favor clear operator language, concrete nouns, numbers from the source, and crisp sentences. Avoid banned phrases: dive in, in today's world, let's explore, in conclusion.`,
  contract: {
    input: ["Edited outputs", "Memory rules", "Voice training", "Source intelligence"],
    output: ["Voice notes", "Revised outputs when needed", "Issues caught", "Voice match score"],
  },
  qualityCriteria: [
    { name: "Voice rules are applied", description: "Voice rules are applied" },
    { name: "Generic phrases are removed", description: "Generic phrases are removed" },
    { name: "Outcome-first hooks improve weak openings", description: "Outcome-first hooks improve weak openings" },
    { name: "Proof remains intact", description: "Proof remains intact" }
  ],
};

export const tonalityCheckerPromptVersion = tonalityCheckerAgent.promptVersion;
