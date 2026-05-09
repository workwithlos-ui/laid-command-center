import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const FOUNDING_TOTAL = 50;

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase admin env vars missing');
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow public GET — no auth required
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = getSupabaseAdmin();

    const { count, error } = await supabase
      .from('founding_seats')
      .select('seat_number', { count: 'exact', head: true });

    if (error) {
      console.error('[founding-status] query error:', error);
      return res.status(500).json({ error: 'Failed to fetch founding seat status' });
    }

    const claimed = count ?? 0;
    const remaining = Math.max(0, FOUNDING_TOTAL - claimed);

    return res.status(200).json({
      claimed,
      remaining,
      total: FOUNDING_TOTAL,
      // ISO deadline for client-side countdown
      deadline: '2026-05-31T23:59:59Z',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[founding-status] error:', err);
    return res.status(500).json({ error: message });
  }
}
