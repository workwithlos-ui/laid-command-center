const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const PERPLEXITY_CHAT_URL = 'https://api.perplexity.ai/chat/completions';

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['contentPack'],
  properties: {
    contentPack: {
      type: 'object',
      additionalProperties: false,
      required: [
        'id',
        'tool_name',
        'source_url',
        'source_date',
        'summary',
        'audience',
        'theme',
        'style',
        'created_at',
        'impact_score',
        'adoption_score',
        'story_score',
        'long_post',
        'x_thread',
        'ig_caption',
        'carousel',
        'short_script',
      ],
      properties: {
        id: { type: 'string' },
        tool_name: { type: 'string' },
        source_url: { type: 'string' },
        source_date: { type: 'string' },
        summary: { type: 'string' },
        audience: { type: 'string' },
        theme: { type: 'string' },
        style: { type: 'string', enum: ['ai_news', 'workflow', 'system'] },
        created_at: { type: 'string' },
        impact_score: { type: 'number' },
        adoption_score: { type: 'number' },
        story_score: { type: 'number' },
        long_post: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'body_markdown'],
          properties: {
            title: { type: 'string' },
            body_markdown: { type: 'string' },
          },
        },
        x_thread: {
          type: 'object',
          additionalProperties: false,
          required: ['hook', 'tweets'],
          properties: {
            hook: { type: 'string' },
            tweets: { type: 'array', minItems: 6, maxItems: 10, items: { type: 'string' } },
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
              minItems: 6,
              maxItems: 8,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['title', 'bullets'],
                properties: {
                  title: { type: 'string' },
                  bullets: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
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
            beats: { type: 'array', minItems: 6, maxItems: 8, items: { type: 'string' } },
          },
        },
      },
    },
  },
};

function makePrompt({ theme, style, audience }) {
  return `You are building an AI Content Command Center content pack for LAID. Today is 2026-05-09.

Run this exact pipeline and return only JSON that matches the schema.

1. News / Tool Finder agent. Find 2 to 3 real AI tool or AI news updates from the last 1 to 2 weeks related to this theme: ${theme}. Use source URLs from official blogs, release notes, respected AI news sites, or credible tool roundups. Each candidate must have a real URL, a publication or release date, and a one paragraph summary.

2. Relevance Filter agent. Score each candidate for impact on workflow for ${audience}, ease of adoption, and storytelling potential. Choose one candidate with the strongest founder operator angle.

3. Long-Post Writer agent. Write a 500 to 1,500 word long post in this style: ${style}.
Style rules:
- ai_news means what changed, why it matters, 2 to 3 concrete use cases this week.
- workflow means pure tactical SOP.
- system means story, framework, and concrete steps.

4. Repurposer agent. Turn the long post into an X thread with 6 to 10 tweets, an IG caption with hook, body, and CTA, a 6 to 8 slide carousel outline, and a 45 to 60 second short-form script.

Global writing rules:
- Plain language.
- Short sentences.
- Use the audience: ${audience}.
- Long post structure must be Intro, What changed or problem, 3 to 4 concrete steps with tools and prompts, wrap-up.
- AI updates must be real. Include source_url and source_date.
- Never use em dash characters. Use periods, commas, or line breaks instead.
- Do not invent fake product names, dates, URLs, or claims.
- Make the pack practical for founders doing $500k to $10M.
- Make the id lowercase kebab case using tool name and source date.

Return a single object with contentPack only.`;
}

function stripEmDash(value) {
  if (typeof value === 'string') return value.replaceAll('\u2014', ',').replaceAll('\u2013', '-');
  if (Array.isArray(value)) return value.map(stripEmDash);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stripEmDash(item)]));
  }
  return value;
}

function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || trimmed.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error('The AI response did not include JSON.');
  return JSON.parse(match[1]);
}

function normalizePack(payload, { theme, style, audience }) {
  const contentPack = payload.contentPack || payload;
  const now = new Date().toISOString();
  const idBase = `${contentPack.tool_name || 'ai-update'}-${contentPack.source_date || now.slice(0, 10)}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return stripEmDash({
    contentPack: {
      ...contentPack,
      id: contentPack.id || idBase,
      theme,
      style,
      audience,
      created_at: contentPack.created_at || now,
      impact_score: Number(contentPack.impact_score || 88),
      adoption_score: Number(contentPack.adoption_score || 82),
      story_score: Number(contentPack.story_score || 86),
    },
  });
}

async function runOpenAI({ apiKey, theme, style, audience }) {
  const prompt = makePrompt({ theme, style, audience });
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: prompt,
      tools: [{ type: 'web_search_preview' }],
      text: {
        format: {
          type: 'json_schema',
          name: 'content_pack_response',
          schema: jsonSchema,
          strict: true,
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = data?.error?.message || 'OpenAI generation failed.';
    throw new Error(detail);
  }

  const outputText = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || '').join('');
  if (!outputText) throw new Error('OpenAI returned no content.');
  return normalizePack(extractJson(outputText), { theme, style, audience });
}

async function runOpenAIChatFallback({ apiKey, theme, style, audience }) {
  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Return valid JSON only. Never use em dash characters. Use only real AI updates with source URLs and dates. If you cannot verify recency, choose an official release note with the newest date you can verify.',
        },
        { role: 'user', content: makePrompt({ theme, style, audience }) },
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'OpenAI fallback generation failed.');
  return normalizePack(extractJson(data.choices?.[0]?.message?.content || ''), { theme, style, audience });
}

async function runPerplexity({ apiKey, theme, style, audience }) {
  const response = await fetch(PERPLEXITY_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      temperature: 0.35,
      response_format: { type: 'json_schema', json_schema: { schema: jsonSchema } },
      messages: [
        { role: 'system', content: 'You research the live web and return valid JSON only. Never use em dash characters.' },
        { role: 'user', content: makePrompt({ theme, style, audience }) },
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Perplexity generation failed.');
  return normalizePack(extractJson(data.choices?.[0]?.message?.content || ''), { theme, style, audience });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = req.body || {};
    const theme = String(body.theme || '').trim();
    const style = ['ai_news', 'workflow', 'system'].includes(body.style) ? body.style : 'ai_news';
    const audience = String(body.audience || '$500k-$10M founders/operators').trim();
    const provider = body.provider === 'perplexity' ? 'perplexity' : 'openai';
    const apiKey = String(body.apiKey || process.env.OPENAI_API_KEY || '').trim();

    if (!theme) return res.status(400).json({ error: 'Theme is required.' });
    if (!apiKey) return res.status(400).json({ error: 'API key is required.' });

    let result;
    if (provider === 'perplexity') {
      result = await runPerplexity({ apiKey, theme, style, audience });
    } else {
      try {
        result = await runOpenAI({ apiKey, theme, style, audience });
      } catch (error) {
        result = await runOpenAIChatFallback({ apiKey, theme, style, audience });
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown generation error.' });
  }
}
