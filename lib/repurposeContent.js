import { appendPack } from './storage.js';
import { stripDisallowedDashes } from './llm.js';
import { repurposeContent, validStyle, writeLongPost } from './generateContentPack.js';

function slugify(parts) {
  const base = parts.filter(Boolean).join(' ');
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 90);
}

function normalizeFormats(formats) {
  const allowed = new Set(['long_post', 'x_thread', 'ig_caption', 'carousel', 'short_script', 'linkedin_post']);
  if (!Array.isArray(formats) || !formats.length) return [...allowed];
  return formats.map((format) => String(format)).filter((format) => allowed.has(format));
}

export async function createRepurposedPack(input) {
  const content = String(input?.content || '').trim();
  const apiKey = String(input?.apiKey || process.env.OPENAI_API_KEY || '').trim();
  const style = validStyle(input?.style);
  const audience = String(input?.audience || '$3M-$50M founders and operators').trim();
  const theme = String(input?.theme || 'Repurposed operator content').trim();
  const formats = normalizeFormats(input?.formats);
  const now = new Date();
  const published = now.toISOString().slice(0, 10);

  if (!content) throw new Error('Content is required.');
  if (content.length < 40) throw new Error('Paste at least 40 characters of source content.');
  if (!apiKey) throw new Error('OpenAI API key is required.');

  const candidate = {
    tool_name: 'User-provided content',
    update_title: theme,
    source_url: String(input?.sourceUrl || 'user-provided').trim(),
    source_type: 'user_content',
    source_kind: 'user_content',
    publish_date: published,
    summary: content.slice(0, 1800),
    why_it_matters: 'The user supplied source material that should be converted into operator-ready content assets.',
    founder_use_cases: [
      'Turn one source into a full content cascade.',
      'Create platform-native assets without running external research.',
      'Keep the same LOS voice and ELIOS quality gate.',
    ],
    freshness_score: 7,
    workflow_impact_score: 8,
    story_potential_score: 8,
  };

  const { longPost, criticScore: longScore } = await writeLongPost({ apiKey, candidate, theme, style, audience });
  const { repurposed, criticScore: repurposedScore } = await repurposeContent({ apiKey, candidate, theme, style, audience, longPost, formats });

  const pack = stripDisallowedDashes({
    id: slugify(['repurposed', published, Date.now().toString(36)]),
    tool_name: candidate.tool_name,
    source_url: candidate.source_url,
    source_date: candidate.publish_date,
    source_kind: candidate.source_kind,
    summary: content.slice(0, 320),
    audience,
    theme,
    style,
    created_at: now.toISOString(),
    impact_score: candidate.workflow_impact_score,
    adoption_score: candidate.freshness_score,
    story_score: candidate.story_potential_score,
    critic_score: Math.round(((longScore + repurposedScore) / 80) * 100),
    selected_formats: formats,
    long_post: longPost,
    ...repurposed,
  });

  await appendPack(pack);
  return pack;
}
