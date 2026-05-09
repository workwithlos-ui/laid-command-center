import { callLLM, stripDisallowedDashes } from './llm.js';
import { newsFinderPrompt } from './prompts.js';

const candidateSchema = {
  name: 'news_candidates_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['candidates'],
    properties: {
      candidates: {
        type: 'array',
        minItems: 1,
        maxItems: 6,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'tool_name',
            'update_title',
            'source_url',
            'source_type',
            'publish_date',
            'summary',
            'why_it_matters',
            'founder_use_cases',
            'freshness_score',
            'workflow_impact_score',
            'story_potential_score',
          ],
          properties: {
            tool_name: { type: 'string' },
            update_title: { type: 'string' },
            source_url: { type: 'string' },
            source_type: { type: 'string' },
            publish_date: { type: 'string' },
            summary: { type: 'string' },
            why_it_matters: { type: 'string' },
            founder_use_cases: { type: 'array', items: { type: 'string' } },
            freshness_score: { type: 'number' },
            workflow_impact_score: { type: 'number' },
            story_potential_score: { type: 'number' },
          },
        },
      },
    },
  },
};

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.max(1, Math.min(10, number));
}

function validUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeCandidate(candidate) {
  return stripDisallowedDashes({
    tool_name: String(candidate.tool_name || 'AI update').trim(),
    update_title: String(candidate.update_title || 'Recent AI update').trim(),
    source_url: String(candidate.source_url || '').trim(),
    source_type: String(candidate.source_type || 'news').trim(),
    publish_date: String(candidate.publish_date || new Date().toISOString().slice(0, 10)).trim().slice(0, 10),
    summary: String(candidate.summary || '').trim(),
    why_it_matters: String(candidate.why_it_matters || '').trim(),
    founder_use_cases: Array.isArray(candidate.founder_use_cases)
      ? candidate.founder_use_cases.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
      : [],
    freshness_score: clampScore(candidate.freshness_score),
    workflow_impact_score: clampScore(candidate.workflow_impact_score),
    story_potential_score: clampScore(candidate.story_potential_score),
  });
}

export function scoreCandidate(candidate) {
  return candidate.workflow_impact_score * 3 + candidate.story_potential_score * 2 + candidate.freshness_score;
}

export async function getNewsCandidates({ theme, audience, apiKey }) {
  const payload = await callLLM({
    apiKey,
    prompt: newsFinderPrompt({ theme, audience }),
    schema: candidateSchema,
    allowSearch: true,
  });

  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  return candidates
    .map(normalizeCandidate)
    .filter((candidate) => candidate.tool_name && candidate.summary && validUrl(candidate.source_url))
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
}
