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

function validSource(source) {
  if (source === 'github' || source === 'both') return source;
  return 'llm';
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

function lowerText(text) {
  return String(text || '').toLowerCase();
}

function mapsToHorseman(text) {
  const value = lowerText(text);
  const desirePatterns = [
    /\b(money|profit|revenue|sales|cash|cost|expensive|save|saved|roi|margin|pipeline)\b/,
    /\b(time|hours|minutes|days|week|faster|fast|speed|slow|manual|waste|saved)\b/,
    /\b(health|stress|calm|burnout|pressure|fires|energy|sleep|overwhelm)\b/,
    /\b(status|authority|trust|reputation|proof|leader|taste|positioning|seen|category)\b/,
  ];
  return desirePatterns.some((pattern) => pattern.test(value));
}

function hookCommandmentIssues(hook, audience, candidate) {
  const value = String(hook || '').trim();
  const lower = value.toLowerCase();
  const issues = [];
  const words = wordCount(value);
  const audienceTerms = ['founder', 'operator', 'team', 'business', 'workflow', 'content', 'sales', 'ops'];
  const toolName = String(candidate?.tool_name || '').split(/[\/\s]/)[0].toLowerCase();

  if (!mapsToHorseman(value)) issues.push('Hook does not map to Money, Time, Health, or Status.');
  if (!audienceTerms.some((term) => lower.includes(term)) && !lower.includes(toolName) && !lower.includes(String(audience || '').toLowerCase().split(' ')[0])) {
    issues.push('Hook misses audience alignment.');
  }
  if (!containsDigit(value) && !/\b(today|now|fast|faster|minutes|hours|days|this|how)\b/.test(lower)) {
    issues.push('Hook has weak speed to value.');
  }
  if (words < 4 || words > 30) issues.push('Hook lacks clarity because it is too short or too long.');
  if (!/[?]/.test(value) && !/\b(why|what|how|nobody|mistake|cost|expensive|changed|before|after|stop|steal)\b/.test(lower)) {
    issues.push('Hook lacks curiosity.');
  }
  return issues;
}

function longPostStructureIssues(body) {
  const text = String(body || '');
  const issues = [];
  const requiredLabels = ['Intro', 'What Changed / Problem', 'Step 1', 'Step 2', 'Step 3', 'Wrap-up'];
  for (const label of requiredLabels) {
    if (!text.includes(label)) issues.push(`Long post is missing ${label}.`);
  }
  return issues;
}

function longPostIssues(longPost, audience, candidate) {
  const text = `${longPost?.title || ''}\n${longPost?.body_markdown || ''}`;
  const issues = [];
  if (wordCount(longPost?.body_markdown) < 400) issues.push('Long post is under 400 words.');
  if (!containsDigit(text)) issues.push('Long post does not contain a number.');
  const banned = bannedWordIssues(text);
  if (banned.length) issues.push(`Long post uses banned words: ${banned.join(', ')}.`);
  if (containsDisallowedDash(text)) issues.push('Long post uses a disallowed dash character.');
  if (!String(longPost?.title || '').trim()) issues.push('Long post title is empty.');
  if (!String(longPost?.body_markdown || '').trim()) issues.push('Long post body is empty.');
  issues.push(...longPostStructureIssues(longPost?.body_markdown));
  const firstMeaningfulLine = String(longPost?.body_markdown || '').split('\n').map((line) => line.trim()).find((line) => line && !line.startsWith('#')) || '';
  issues.push(...hookCommandmentIssues(firstMeaningfulLine, audience, candidate).map((issue) => `Long post opening issue: ${issue}`));
  return issues;
}

function carouselIssues(slides) {
  const issues = [];
  if (!Array.isArray(slides) || slides.length < 6 || slides.length > 8) {
    issues.push('Carousel needs 6 to 8 slides.');
    return issues;
  }
  const serialized = JSON.stringify(slides).toLowerCase();
  if (!serialized.includes('talking point')) issues.push('Carousel needs at least one talking point note.');
  if (!serialized.includes('visual')) issues.push('Carousel needs at least one visual aid note.');
  return issues;
}

function shortScriptIssues(beats) {
  const issues = [];
  if (!Array.isArray(beats) || beats.length < 6 || beats.length > 8) {
    issues.push('Script needs 6 to 8 beats.');
    return issues;
  }
  const serialized = JSON.stringify(beats).toLowerCase();
  if (!serialized.includes('insight')) issues.push('Short script needs a self-contained insight.');
  if (!serialized.includes('shock') && !serialized.includes('surprise')) issues.push('Short script needs a high shock value moment.');
  if (!serialized.includes('quote') && !serialized.includes('quotable')) issues.push('Short script needs a quotable statement.');
  return issues;
}

function repurposedIssues(repurposed, audience, candidate) {
  const text = JSON.stringify(repurposed || {});
  const issues = [];
  const xHook = String(repurposed?.x_thread?.hook || '').trim();
  const igHook = String(repurposed?.ig_caption?.hook || '').trim();
  if (!xHook) issues.push('X hook is empty.');
  if (!Array.isArray(repurposed?.x_thread?.tweets) || repurposed.x_thread.tweets.length < 5) issues.push('X thread needs at least 5 tweets.');
  if (!String(repurposed?.ig_caption?.cta || '').trim()) issues.push('IG CTA is empty.');
  if (xHook) issues.push(...hookCommandmentIssues(xHook, audience, candidate).map((issue) => `X hook issue: ${issue}`));
  if (igHook && !mapsToHorseman(igHook)) issues.push('IG hook does not map to Money, Time, Health, or Status.');
  issues.push(...carouselIssues(repurposed?.carousel?.slides || []));
  issues.push(...shortScriptIssues(repurposed?.short_script?.beats || []));
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
  let issues = longPostIssues(longPost, audience, candidate);

  for (let attempt = 0; issues.length && attempt < 2; attempt += 1) {
    payload = await callLLM({
      apiKey,
      prompt: fixLongPostPrompt({ issues, candidate, theme, style, audience, longPost }),
      schema: longPostSchema,
    });
    longPost = normalizeLongPost(payload);
    issues = longPostIssues(longPost, audience, candidate);
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
  let issues = repurposedIssues(repurposed, audience, candidate);

  for (let attempt = 0; issues.length && attempt < 2; attempt += 1) {
    payload = await callLLM({
      apiKey,
      prompt: fixRepurposedPrompt({ issues, candidate, theme, style, audience, longPost, repurposed }),
      schema: repurposedSchema,
    });
    repurposed = normalizeRepurposed(payload);
    issues = repurposedIssues(repurposed, audience, candidate);
  }

  if (issues.length) throw new Error(`Repurposed content failed quality gate: ${issues.join(' ')}`);
  return repurposed;
}

export async function generateContentPack(input) {
  const theme = String(input?.theme || 'AI tools for 500k-10M founders').trim();
  const audience = String(input?.audience || '$500k-$10M founders/operators').trim();
  const style = validStyle(input?.style);
  const source = validSource(input?.source);
  const apiKey = String(input?.apiKey || process.env.OPENAI_API_KEY || '').trim();
  const githubToken = String(input?.githubToken || process.env.GITHUB_TOKEN || '').trim();
  if (!apiKey) throw new Error('OpenAI API key is required.');

  const candidates = await getNewsCandidates({ theme, audience, apiKey, source, githubToken });
  const candidate = chooseCandidate(candidates);
  const longPost = await writeLongPost({ apiKey, candidate, theme, style, audience });
  const repurposed = await repurpose({ apiKey, candidate, theme, style, audience, longPost });

  const now = new Date().toISOString();
  const pack = stripDisallowedDashes({
    id: slugify([candidate.tool_name, candidate.publish_date, Date.now().toString(36)]),
    tool_name: candidate.tool_name,
    source_url: candidate.source_url,
    source_date: candidate.publish_date,
    source_kind: candidate.source_kind || candidate.source_type || source,
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
