type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type VercelRequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponseLike = {
  status: (statusCode: number) => VercelResponseLike;
  setHeader: (name: string, value: string) => VercelResponseLike;
  send: (body: string) => unknown;
};

type ChatRequestBody = {
  model?: unknown;
  messages?: unknown;
  temperature?: unknown;
  response_format?: unknown;
  max_tokens?: unknown;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    (item.role === 'system' || item.role === 'user' || item.role === 'assistant') &&
    typeof item.content === 'string'
  );
}

function sendJson(res: VercelResponseLike, status: number, body: unknown) {
  return res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'POST only' });
  }

  const apiKey = req.headers['x-openai-key'];
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-')) {
    return sendJson(res, 400, { error: 'Missing or malformed OpenAI key header' });
  }

  const { model, messages, temperature, response_format, max_tokens } = (req.body ?? {}) as ChatRequestBody;
  if (typeof model !== 'string' || !Array.isArray(messages) || !messages.every(isChatMessage)) {
    return sendJson(res, 400, { error: 'model and valid messages required' });
  }

  const forwardedBody: Record<string, unknown> = { model, messages };
  if (typeof temperature === 'number') forwardedBody.temperature = temperature;
  if (typeof max_tokens === 'number') forwardedBody.max_tokens = max_tokens;
  if (response_format && typeof response_format === 'object') forwardedBody.response_format = response_format;

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(forwardedBody),
  });

  const text = await openaiResponse.text();
  return res.status(openaiResponse.status).setHeader('Content-Type', 'application/json').send(text);
}
