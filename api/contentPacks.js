import { readPacks } from '../lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const packs = await readPacks();
    return res.status(200).json(packs);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to read content packs.' });
  }
}
