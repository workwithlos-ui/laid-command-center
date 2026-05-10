import { callLLM, stripDisallowedDashes } from './llm.js';
import { newsFinderPrompt } from './prompts.js';

const GITHUB_SEARCH_URL = 'https://api.github.com/search/repositories';
const GITHUB_KEYWORDS = [
  'ai',
  'llm',
  'gpt',
  'claude',
  'agent',
  'machine-learning',
  'deep-learning',
  'generative',
  'copilot',
  'assistant',
  'automation',
  'dev-tool',
  'developer-tool',
  'cli',
  'mcp',
];

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

function isoDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

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

function normalizeSource(source) {
  if (source === 'github') return 'github';
  if (source === 'both') return 'both';
  return 'llm';
}

function normalizeCandidate(candidate) {
  return stripDisallowedDashes({
    tool_name: String(candidate.tool_name || 'AI update').trim(),
    update_title: String(candidate.update_title || 'Recent AI update').trim(),
    source_url: String(candidate.source_url || '').trim(),
    source_type: String(candidate.source_type || 'news').trim(),
    source_kind: String(candidate.source_kind || candidate.source_type || 'llm_news').trim(),
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

function relevanceScore(repo) {
  const haystack = `${repo.name || ''} ${repo.full_name || ''} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  return GITHUB_KEYWORDS.reduce((total, keyword) => (haystack.includes(keyword.toLowerCase()) ? total + 1 : total), 0);
}

function scoreStars(stars) {
  const value = Number(stars || 0);
  if (value >= 5000) return 10;
  if (value >= 2000) return 9;
  if (value >= 1000) return 8;
  if (value >= 500) return 7;
  if (value >= 250) return 6;
  if (value >= 100) return 5;
  if (value >= 50) return 4;
  return 3;
}

function daysSince(value) {
  const time = Date.parse(value || '');
  if (!Number.isFinite(time)) return 30;
  return Math.max(0, Math.round((Date.now() - time) / 86400000));
}

function githubCandidate(repo, windowDays) {
  const relevance = relevanceScore(repo);
  const repoDate = String(repo.pushed_at || repo.created_at || new Date().toISOString()).slice(0, 10);
  const freshness = windowDays === 7 ? 10 : Math.max(5, 10 - Math.floor(daysSince(repo.pushed_at || repo.created_at) / 4));
  const workflowImpact = clampScore(Math.min(10, 4 + relevance + (repo.topics || []).length / 4));
  const storyPotential = clampScore(Math.max(scoreStars(repo.stargazers_count) - 1, 4 + relevance));
  const topics = Array.isArray(repo.topics) && repo.topics.length ? ` Topics include ${(repo.topics || []).slice(0, 5).join(', ')}.` : '';

  return normalizeCandidate({
    tool_name: repo.full_name || repo.name || 'GitHub AI repo',
    update_title: `${repo.name || 'AI repo'} is trending on GitHub over the last ${windowDays} days`,
    source_url: repo.html_url,
    source_type: 'github_trending',
    source_kind: 'github_trending',
    publish_date: repoDate,
    summary: `${repo.description || 'A fast-moving open source AI or developer tool repository.'} It has ${repo.stargazers_count || 0} stars and ${repo.forks_count || 0} forks.${topics}`,
    why_it_matters: `Open source traction is a strong signal that builders are adopting this workflow now. Founders can study the repo, test the tool, and turn the pattern into an operator system before it becomes common.` ,
    founder_use_cases: [
      'Audit the repo for one workflow that saves founder or operator time this week.',
      'Turn the README into a practical checklist for sales, ops, product, or content teams.',
      'Test the tool against one real business process and capture before and after numbers.',
    ],
    freshness_score: freshness,
    workflow_impact_score: workflowImpact,
    story_potential_score: storyPotential,
  });
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  const result = [];
  for (const candidate of candidates) {
    const key = `${candidate.source_url || ''}`.toLowerCase() || `${candidate.tool_name}:${candidate.update_title}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

async function githubSearch({ query, token }) {
  const url = new URL(GITHUB_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('sort', 'stars');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', '10');

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'laid-command-center',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'GitHub Trending source failed.');
  return Array.isArray(data.items) ? data.items : [];
}

export function scoreCandidate(candidate) {
  const githubBoost = candidate.source_kind === 'github_trending' || candidate.source_type === 'github_trending' ? 2 : 0;
  return candidate.workflow_impact_score * 3 + candidate.story_potential_score * 2 + candidate.freshness_score + githubBoost;
}

export async function getGithubTrendingCandidates({ githubToken } = {}) {
  const token = String(githubToken || process.env.GITHUB_TOKEN || '').trim();
  const windows = [7, 30];
  const keywordGroups = [
    ['ai', 'llm', 'gpt', 'claude'],
    ['agent', 'automation', 'assistant', 'copilot'],
    ['machine-learning', 'deep-learning', 'generative'],
    ['dev-tool', 'developer-tool', 'cli', 'mcp'],
  ];
  const repos = [];

  for (const days of windows) {
    const createdAfter = isoDaysAgo(days);
    for (const group of keywordGroups) {
      const terms = group.join(' OR ');
      const query = `${terms} in:name,description,topics created:>=${createdAfter} stars:>10 archived:false`;
      const items = await githubSearch({ query, token });
      repos.push(...items.map((repo) => ({ repo, days })));
    }
  }

  return uniqueCandidates(
    repos
      .filter(({ repo }) => relevanceScore(repo) > 0)
      .map(({ repo, days }) => githubCandidate(repo, days))
      .filter((candidate) => candidate.tool_name && candidate.summary && validUrl(candidate.source_url))
  ).sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
}

export async function getLLMNewsCandidates({ theme, audience, apiKey }) {
  const payload = await callLLM({
    apiKey,
    prompt: newsFinderPrompt({ theme, audience }),
    schema: candidateSchema,
    allowSearch: true,
  });

  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  return candidates
    .map((candidate) => normalizeCandidate({ ...candidate, source_kind: 'llm_news' }))
    .filter((candidate) => candidate.tool_name && candidate.summary && validUrl(candidate.source_url))
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
}

export async function getNewsCandidates({ theme, audience, apiKey, source = 'llm', githubToken }) {
  const normalizedSource = normalizeSource(source);
  const tasks = [];

  if (normalizedSource === 'llm' || normalizedSource === 'both') {
    tasks.push(getLLMNewsCandidates({ theme, audience, apiKey }));
  }
  if (normalizedSource === 'github' || normalizedSource === 'both') {
    tasks.push(getGithubTrendingCandidates({ githubToken }));
  }

  const settled = await Promise.allSettled(tasks);
  const candidates = settled.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));
  if (!candidates.length) {
    const firstError = settled.find((item) => item.status === 'rejected');
    if (firstError?.reason) throw firstError.reason;
  }

  return uniqueCandidates(candidates).sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
}
