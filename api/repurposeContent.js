import { createRepurposedPack } from '../lib/repurposeContent.js';

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
    const apiKey = String(body.apiKey || req.headers['x-openai-api-key'] || process.env.OPENAI_API_KEY || '').trim();
    const pack = await createRepurposedPack({
      content: body.content,
      formats: body.formats,
      style: body.style,
      audience: body.audience,
      theme: body.theme,
      sourceUrl: body.sourceUrl,
      apiKey,
    });
    return res.status(200).json(pack);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Repurpose failed.' });
  }
}
