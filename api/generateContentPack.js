import { generateContentPack } from '../lib/generateContentPack.js';

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = readBody(req);
    const theme = String(body.theme || 'AI tools for 500k-10M founders').trim();
    const style = ['ai_news', 'workflow', 'system'].includes(body.style) ? body.style : 'ai_news';
    const audience = String(body.audience || '$500k-$10M founders/operators').trim();
    const apiKey = String(body.apiKey || req.headers['x-openai-api-key'] || process.env.OPENAI_API_KEY || '').trim();

    if (!theme) return res.status(400).json({ error: 'Theme is required.' });
    if (!apiKey) return res.status(400).json({ error: 'OpenAI API key is required.' });

    const pack = await generateContentPack({ theme, style, audience, apiKey });
    return res.status(200).json(pack);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Generation failed.' });
  }
}
