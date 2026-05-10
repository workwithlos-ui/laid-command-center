import { appendPack } from './storage.js';
import { callLLM, stripDisallowedDashes } from './llm.js';
import { getNewsCandidates, scoreCandidate } from './news.js';
import {
  aiSlopTransitions,
  bannedWords,
  criticPrompt,
  deadOpeners,
  fixLongPostPrompt,
  fixRepurposedPrompt,
  longPostPrompt,
  repurposerPrompt,
} from './prompts.js';

export const longPostSchema = {
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

export const repurposedSchema = {
  name: 'repurposed_content_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['x_thread', 'ig_caption', 'carousel', 'short_script', 'linkedin_post'],
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
      linkedin_post: {
        type: 'object',
        additionalProperties: false,
        required: ['hook', 'body', 'cta'],
        properties: {
          hook: { type: 'string' },
          body: { type: 'string' },
          cta: { type: 'string' },
        },
      },
    },
  },
};

const criticSchema = {
  name: 'critic_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['hard_fail', 'requires_rework', 'requires_full_rewrite', 'total_score', 'scores', 'issues', 'corrective_notes'],
    properties: {
      hard_fail: { type: 'boolean' },
      requires_rework: { type: 'boolean' },
      requires_full_rewrite: { type: 'boolean' },
      total_score: { type: 'number' },
      scores: { type: 'object' },
      issues: { type: 'array', items: { type: 'string' } },
      corrective_notes: { type: 'array', items: { type: 'string' } },
    },
  },
};

export function validStyle(style) {
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

function phraseIssues(text, phrases, label) {
  const lower = String(text || '').toLowerCase();
  return phrases.filter((phrase) => lower.includes(phrase)).map((phrase) => `${label}: ${phrase}.`);
}

function lowerText(text) {
  return String(text || '').toLowerCase();
}

function mapsToHorseman(text) {
  const value = lowerText(text);
  const desirePatterns = [
    /\b(money|profit|revenue|sales|cash|cost|expensive|save|saved|roi|margin|pipeline|offer)\b/,
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
  const audienceTerms = ['founder', 'operator', 'team', 'business', 'workflow', 'content', 'sales', 'ops', 'agency'];
  const toolName = String(candidate?.tool_name || '').split(/[\/\s]/)[0].toLowerCase();

  if (!mapsToHorseman(value)) issues.push('Hook does not map to Money, Time, Health, or Status.');
  if (!audienceTerms.some((term) => lower.includes(term)) && !lower.includes(toolName) && !lower.includes(String(audience || '').toLowerCase().split(' ')[0])) {
    issues.push('Hook misses audience alignment.');
  }
  if (!containsDigit(value) && !/\b(today|now|fast|faster|minutes|hours|days|this|how|before)\b/.test(lower)) {
    issues.push('Hook has weak speed to value.');
  }
  if (words < 4 || words > 32) issues.push('Hook lacks clarity because it is too short or too long.');
  if (!/[?]/.test(value) && !/\b(why|what|how|nobody|mistake|cost|expensive|changed|before|after|stop|steal|hidden|difference)\b/.test(lower)) {
    issues.push('Hook lacks curiosity.');
  }
  return issues;
}

function longPostStructureIssues(body) {
  const text = String(body || '');
  const issues = [];
  if (!/^#\s+/m.test(text)) issues.push('Long post needs an H1 title in the body.');
  if (!/\*\*[^*]+\*\*/.test(text)) issues.push('Long post needs a bold hook sentence.');
  if (!/^##\s+.+\?/m.test(text)) issues.push('Long post needs H2 question headers.');
  if (!/FAQ/i.test(text)) issues.push('Long post needs an FAQ section.');
  if (!/CTA|next move|next step/i.test(text)) issues.push('Long post needs a CTA block or clear next move.');
  return issues;
}

function hardTextIssues(text, label) {
  const issues = [];
  const banned = bannedWordIssues(text);
  if (banned.length) issues.push(`${label} uses banned words: ${banned.join(', ')}.`);
  if (containsDisallowedDash(text)) issues.push(`${label} uses a disallowed dash character.`);
  issues.push(...phraseIssues(text, deadOpeners, `${label} uses a dead opener`));
  issues.push(...phraseIssues(text, aiSlopTransitions, `${label} uses an AI-slop transition`));
  return issues;
}

function longPostIssues(longPost, audience, candidate) {
  const text = `${longPost?.title || ''}\n${longPost?.body_markdown || ''}`;
  const issues = [];
  if (wordCount(longPost?.body_markdown) < 500) issues.push('Long post is under 500 words.');
  if (!containsDigit(text)) issues.push('Long post does not contain a number.');
  if (!String(longPost?.title || '').trim()) issues.push('Long post title is empty.');
  if (!String(longPost?.body_markdown || '').trim()) issues.push('Long post body is empty.');
  issues.push(...hardTextIssues(text, 'Long post'));
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
  if (!serialized.includes('visual')) issues.push('Carousel needs at least one visual note.');
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
  if (!serialized.includes('reels') && !serialized.includes('shorts') && !serialized.includes('tiktok')) issues.push('Short script needs platform notes.');
  return issues;
}

function linkedinIssues(linkedin) {
  const issues = [];
  const text = `${linkedin?.hook || ''}\n${linkedin?.body || ''}\n${linkedin?.cta || ''}`;
  const length = text.trim().length;
  if (!String(linkedin?.hook || '').trim()) issues.push('LinkedIn hook is empty.');
  if (!String(linkedin?.body || '').trim()) issues.push('LinkedIn body is empty.');
  if (!String(linkedin?.cta || '').trim()) issues.push('LinkedIn CTA is empty.');
  if (length < 500 || length > 1800) issues.push('LinkedIn post should stay near 800 to 1500 characters.');
  if (!/comment|reply|dm/i.test(String(linkedin?.cta || ''))) issues.push('LinkedIn CTA needs a keyword action.');
  return issues;
}

function repurposedIssues(repurposed, audience, candidate) {
  const text = JSON.stringify(repurposed || {});
  const issues = [];
  const xHook = String(repurposed?.x_thread?.hook || '').trim();
  const igHook = String(repurposed?.ig_caption?.hook || '').trim();
  if (!xHook) issues.push('X hook is empty.');
  if (!Array.isArray(repurposed?.x_thread?.tweets) || repurposed.x_thread.tweets.length < 5) issues.push('X thread needs at least 5 tweets.');
  if ((repurposed?.x_thread?.tweets || []).some((tweet) => String(tweet).length > 220)) issues.push('X tweets should be concise and close to 140 characters.');
  if (!String(repurposed?.ig_caption?.cta || '').trim()) issues.push('IG CTA is empty.');
  if (xHook) issues.push(...hookCommandmentIssues(xHook, audience, candidate).map((issue) => `X hook issue: ${issue}`));
  if (igHook && !mapsToHorseman(igHook)) issues.push('IG hook does not map to Money, Time, Health, or Status.');
  issues.push(...carouselIssues(repurposed?.carousel?.slides || []));
  issues.push(...shortScriptIssues(repurposed?.short_script?.beats || []));
  issues.push(...linkedinIssues(repurposed?.linkedin_post || {}));
  issues.push(...hardTextIssues(text, 'Repurposed content'));
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
    linkedin_post: {
      hook: String(payload?.linkedin_post?.hook || '').trim(),
      body: String(payload?.linkedin_post?.body || '').trim(),
      cta: String(payload?.linkedin_post?.cta || '').trim(),
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

function normalizeCritic(payload) {
  const total = Number(payload?.total_score || 0);
  const notes = [
    ...(Array.isArray(payload?.issues) ? payload.issues : []),
    ...(Array.isArray(payload?.corrective_notes) ? payload.corrective_notes : []),
  ].map((item) => String(item).trim()).filter(Boolean);
  return {
    hard_fail: Boolean(payload?.hard_fail),
    requires_rework: Boolean(payload?.requires_rework) || total < 28,
    requires_full_rewrite: Boolean(payload?.requires_full_rewrite) || total < 24,
    total_score: Number.isFinite(total) && total > 0 ? total : 28,
    notes,
  };
}

async function critique({ apiKey, candidate, audience, contentType, content }) {
  const payload = await callLLM({
    apiKey,
    prompt: criticPrompt({ candidate, audience, contentType, content }),
    schema: criticSchema,
  });
  return normalizeCritic(payload);
}

function mergeCriticIssues(existing, critic) {
  const issues = [...existing];
  if (critic.hard_fail) issues.push('Critic found a Layer 1 hard fail.');
  if (critic.requires_full_rewrite) issues.push('Critic score is below 24 and requires a full rewrite.');
  else if (critic.requires_rework) issues.push('Critic score is below 28 and requires rework.');
  issues.push(...critic.notes);
  return [...new Set(issues)].filter(Boolean);
}

export async function writeLongPost({ apiKey, candidate, theme, style, audience }) {
  let payload = await callLLM({
    apiKey,
    prompt: longPostPrompt({ candidate, theme, style, audience }),
    schema: longPostSchema,
  });
  let longPost = normalizeLongPost(payload);
  let critic = await critique({ apiKey, candidate, audience, contentType: 'long post', content: longPost });
  let issues = mergeCriticIssues(longPostIssues(longPost, audience, candidate), critic);

  for (let attempt = 0; issues.length && attempt < 2; attempt += 1) {
    payload = await callLLM({
      apiKey,
      prompt: fixLongPostPrompt({ issues, candidate, theme, style, audience, longPost }),
      schema: longPostSchema,
    });
    longPost = normalizeLongPost(payload);
    critic = await critique({ apiKey, candidate, audience, contentType: 'long post', content: longPost });
    issues = mergeCriticIssues(longPostIssues(longPost, audience, candidate), critic);
  }

  if (issues.length) throw new Error(`Long post failed quality gate: ${issues.join(' ')}`);
  return { longPost, criticScore: critic.total_score };
}

export async function repurposeContent({ apiKey, candidate, theme, style, audience, longPost, formats = [] }) {
  let payload = await callLLM({
    apiKey,
    prompt: repurposerPrompt({ candidate, theme, style, audience, longPost, formats }),
    schema: repurposedSchema,
  });
  let repurposed = normalizeRepurposed(payload);
  let critic = await critique({ apiKey, candidate, audience, contentType: 'repurposed content', content: repurposed });
  let issues = mergeCriticIssues(repurposedIssues(repurposed, audience, candidate), critic);

  for (let attempt = 0; issues.length && attempt < 2; attempt += 1) {
    payload = await callLLM({
      apiKey,
      prompt: fixRepurposedPrompt({ issues, candidate, theme, style, audience, longPost, repurposed, formats }),
      schema: repurposedSchema,
    });
    repurposed = normalizeRepurposed(payload);
    critic = await critique({ apiKey, candidate, audience, contentType: 'repurposed content', content: repurposed });
    issues = mergeCriticIssues(repurposedIssues(repurposed, audience, candidate), critic);
  }

  if (issues.length) throw new Error(`Repurposed content failed quality gate: ${issues.join(' ')}`);
  return { repurposed, criticScore: critic.total_score };
}

export async function generateContentPack(input) {
  const theme = String(input?.theme || 'AI tools for $3M-$50M founders').trim();
  const audience = String(input?.audience || '$3M-$50M founders and operators').trim();
  const style = validStyle(input?.style);
  const source = validSource(input?.source);
  const apiKey = String(input?.apiKey || process.env.OPENAI_API_KEY || '').trim();
  const githubToken = String(input?.githubToken || process.env.GITHUB_TOKEN || '').trim();
  if (!apiKey) throw new Error('OpenAI API key is required.');

  const candidates = await getNewsCandidates({ theme, audience, apiKey, source, githubToken });
  const candidate = chooseCandidate(candidates);
  const { longPost, criticScore: longScore } = await writeLongPost({ apiKey, candidate, theme, style, audience });
  const { repurposed, criticScore: repurposedScore } = await repurposeContent({ apiKey, candidate, theme, style, audience, longPost });

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
    critic_score: Math.round(((longScore + repurposedScore) / 80) * 100),
    long_post: longPost,
    ...repurposed,
  });

  await appendPack(pack);
  return pack;
}
