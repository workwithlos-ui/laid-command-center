import { appendPack } from './storage.js';
import { callLLM, stripDisallowedDashes } from './llm.js';
import { getNewsCandidates, scoreCandidate } from './news.js';
import { bannedWords, fixLongPostPrompt, fixRepurposedPrompt, longPostPrompt, repurposerPrompt } from './prompts.js';

const longPostSchema = {
  name: 'long_post_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['long_post'],
    properties: {
      long_post: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'body_markdown'],
        properties: {
          title: { type: 'string' },
          body_markdown: { type: 'string' },
        },
      },
    },
  },
};

const repurposedSchema = {
  name: 'repurposed_content_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['x_thread', 'ig_caption', 'carousel', 'short_script'],
    properties: {
      x_thread: {
        type: 'object',
        additionalProperties: false,
        required: ['hook', 'tweets'],
        properties: {
          hook: { type: 'string' },
          tweets: { type: 'array', items: { type: 'string' } },
        },
      },
      ig_caption: {
        type: 'object',
        additionalProperties: false,
        required: ['hook', 'body', 'cta'],
        properties: {
          hook: { type: 'string' },
          body: { type: 'string' },
          cta: { type: 'string' },
        },
      },
      carousel: {
        type: 'object',
        additionalProperties: false,
        required: ['slides'],
        properties: {
          slides: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['title', 'bullets'],
              properties: {
                title: { type: 'string' },
                bullets: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      short_script: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'beats'],
        properties: {
          title: { type: 'string' },
          beats: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

function validStyle(style) {
  return ['ai_news', 'workflow', 'system'].includes(style) ? style : 'ai_news';
}

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function containsDigit(text) {
  return /\d/.test(String(text || ''));
}

function containsDisallowedDash(text) {
  return /[\u2014\u2013]/.test(String(text || ''));
}

function bannedWordIssues(text) {
  const lower = String(text || '').toLowerCase();
  return bannedWords.filter((word) => lower.includes(word));
}

function longPostIssues(longPost) {
  const text = `${longPost?.title || ''}\n${longPost?.body_markdown || ''}`;
  const issues = [];
  if (wordCount(longPost?.body_markdown) < 400) issues.push('Long post is under 400 words.');
  if (!containsDigit(text)) issues.push('Long post does not contain a number.');
  const banned = bannedWordIssues(text);
  if (banned.length) issues.push(`Long post uses banned words: ${banned.join(', ')}.`);
  if (containsDisallowedDash(text)) issues.push('Long post uses a disallowed dash character.');
  if (!String(longPost?.title || '').trim()) issues.push('Long post title is empty.');
  if (!String(longPost?.body_markdown || '').trim()) issues.push('Long post body is empty.');
  return issues;
}

function repurposedIssues(repurposed) {
  const text = JSON.stringify(repurposed || {});
  const issues = [];
  if (!String(repurposed?.x_thread?.hook || '').trim()) issues.push('X hook is empty.');
  if (!Array.isArray(repurposed?.x_thread?.tweets) || repurposed.x_thread.tweets.length < 5) issues.push('X thread needs at least 5 tweets.');
  if (!String(repurposed?.ig_caption?.cta || '').trim()) issues.push('IG CTA is empty.');
  const slides = repurposed?.carousel?.slides || [];
  if (!Array.isArray(slides) || slides.length < 6 || slides.length > 8) issues.push('Carousel needs 6 to 8 slides.');
  const beats = repurposed?.short_script?.beats || [];
  if (!Array.isArray(beats) || beats.length < 6 || beats.length > 8) issues.push('Script needs 6 to 8 beats.');
  const banned = bannedWordIssues(text);
  if (banned.length) issues.push(`Repurposed content uses banned words: ${banned.join(', ')}.`);
  if (containsDisallowedDash(text)) issues.push('Repurposed content uses a disallowed dash character.');
  return issues;
}

function normalizeLongPost(payload) {
  const longPost = payload?.long_post || payload || {};
  return stripDisallowedDashes({
    title: String(longPost.title || 'AI update operators can use this week').trim(),
    body_markdown: String(longPost.body_markdown || '').trim(),
  });
}

function normalizeRepurposed(payload) {
  const slides = Array.isArray(payload?.carousel?.slides) ? payload.carousel.slides : [];
  return stripDisallowedDashes({
    x_thread: {
      hook: String(payload?.x_thread?.hook || '').trim(),
      tweets: Array.isArray(payload?.x_thread?.tweets) ? payload.x_thread.tweets.map((item) => String(item).trim()).filter(Boolean).slice(0, 10) : [],
    },
    ig_caption: {
      hook: String(payload?.ig_caption?.hook || '').trim(),
      body: String(payload?.ig_caption?.body || '').trim(),
      cta: String(payload?.ig_caption?.cta || '').trim(),
    },
    carousel: {
      slides: slides.slice(0, 8).map((slide, index) => ({
        title: String(slide?.title || `Slide ${index + 1}`).trim(),
        bullets: Array.isArray(slide?.bullets) ? slide.bullets.map((item) => String(item).trim()).filter(Boolean).slice(0, 4) : [],
      })),
    },
    short_script: {
      title: String(payload?.short_script?.title || 'Use this AI update this week').trim(),
      beats: Array.isArray(payload?.short_script?.beats) ? payload.short_script.beats.map((item) => String(item).trim()).filter(Boolean).slice(0, 8) : [],
    },
  });
}

function slugify(parts) {
  const base = parts.filter(Boolean).join(' ');
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 90);
}

function chooseCandidate(candidates) {
  if (!candidates.length) throw new Error('No real AI update candidates were found.');
  return [...candidates].sort((a, b) => scoreCandidate(b) - scoreCandidate(a))[0];
}

async function writeLongPost({ apiKey, candidate, theme, style, audience }) {
  let payload = await callLLM({
    apiKey,
    prompt: longPostPrompt({ candidate, theme, style, audience }),
    schema: longPostSchema,
  });
  let longPost = normalizeLongPost(payload);
  let issues = longPostIssues(longPost);

  if (issues.length) {
    payload = await callLLM({
      apiKey,
      prompt: fixLongPostPrompt({ issues, candidate, theme, style, audience, longPost }),
      schema: longPostSchema,
    });
    longPost = normalizeLongPost(payload);
    issues = longPostIssues(longPost);
  }

  if (issues.length) throw new Error(`Long post failed quality gate: ${issues.join(' ')}`);
  return longPost;
}

async function repurpose({ apiKey, candidate, theme, style, audience, longPost }) {
  let payload = await callLLM({
    apiKey,
    prompt: repurposerPrompt({ candidate, theme, style, audience, longPost }),
    schema: repurposedSchema,
  });
  let repurposed = normalizeRepurposed(payload);
  let issues = repurposedIssues(repurposed);

  if (issues.length) {
    payload = await callLLM({
      apiKey,
      prompt: fixRepurposedPrompt({ issues, candidate, theme, style, audience, longPost, repurposed }),
      schema: repurposedSchema,
    });
    repurposed = normalizeRepurposed(payload);
    issues = repurposedIssues(repurposed);
  }

  if (issues.length) throw new Error(`Repurposed content failed quality gate: ${issues.join(' ')}`);
  return repurposed;
}

export async function generateContentPack(input) {
  const theme = String(input?.theme || 'AI tools for 500k-10M founders').trim();
  const audience = String(input?.audience || '$500k-$10M founders/operators').trim();
  const style = validStyle(input?.style);
  const apiKey = String(input?.apiKey || process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) throw new Error('OpenAI API key is required.');

  const candidates = await getNewsCandidates({ theme, audience, apiKey });
  const candidate = chooseCandidate(candidates);
  const longPost = await writeLongPost({ apiKey, candidate, theme, style, audience });
  const repurposed = await repurpose({ apiKey, candidate, theme, style, audience, longPost });

  const now = new Date().toISOString();
  const pack = stripDisallowedDashes({
    id: slugify([candidate.tool_name, candidate.publish_date, Date.now().toString(36)]),
    tool_name: candidate.tool_name,
    source_url: candidate.source_url,
    source_date: candidate.publish_date,
    summary: candidate.summary,
    audience,
    theme,
    style,
    created_at: now,
    impact_score: candidate.workflow_impact_score,
    adoption_score: candidate.freshness_score,
    story_score: candidate.story_potential_score,
    long_post: longPost,
    ...repurposed,
  });

  await appendPack(pack);
  return pack;
}
