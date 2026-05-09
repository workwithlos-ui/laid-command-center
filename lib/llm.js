const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

export function stripDisallowedDashes(value) {
  if (typeof value === 'string') {
    return value.replaceAll('\u2014', ',').replaceAll('\u2013', '-');
  }
  if (Array.isArray(value)) return value.map(stripDisallowedDashes);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stripDisallowedDashes(item)]));
  }
  return value;
}

export function extractJson(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw new Error('The AI response was empty.');
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return JSON.parse(fenced[1]);
  const objectMatch = trimmed.match(/(\{[\s\S]*\})/);
  if (objectMatch) return JSON.parse(objectMatch[1]);
  throw new Error('The AI response did not include JSON.');
}

function outputTextFromResponses(data) {
  if (data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) chunks.push(content.text);
      if (content.type === 'output_text' && content.text) chunks.push(content.text);
    }
  }
  return chunks.join('\n');
}

function schemaFormat(schema) {
  return {
    type: 'json_schema',
    name: schema.name || 'laid_json_response',
    schema: schema.schema || schema,
    strict: false,
  };
}

async function callResponses({ apiKey, prompt, schema, allowSearch }) {
  const body = {
    model: DEFAULT_MODEL,
    input: [
      {
        role: 'system',
        content: 'Return valid JSON only. Use real sources when asked. Never use em dash characters.',
      },
      { role: 'user', content: prompt },
    ],
    text: { format: schemaFormat(schema) },
  };

  if (allowSearch) body.tools = [{ type: 'web_search_preview' }];

  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'OpenAI Responses request failed.');
  return extractJson(outputTextFromResponses(data));
}

async function callChat({ apiKey, prompt }) {
  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Return valid JSON only. Never use em dash characters. If asked for news, use only real public AI updates with source URLs and dates.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'OpenAI Chat request failed.');
  return extractJson(data.choices?.[0]?.message?.content || '');
}

export async function callLLM({ prompt, schema, apiKey, allowSearch = false }) {
  const key = String(apiKey || process.env.OPENAI_API_KEY || '').trim();
  if (!key) throw new Error('OpenAI API key is required.');

  let payload;
  try {
    payload = await callResponses({ apiKey: key, prompt, schema, allowSearch });
  } catch (error) {
    if (allowSearch) throw error;
    payload = await callChat({ apiKey: key, prompt });
  }

  return stripDisallowedDashes(payload);
}
