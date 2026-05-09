import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FOUNDING_SEAT_LIMIT = 50;

const TIER_PRICE_MAP: Record<string, string | undefined> = {
  founding_lifetime: process.env.STRIPE_PRICE_FOUNDING,
  starter_monthly: process.env.STRIPE_PRICE_STARTER,
  pro_monthly: process.env.STRIPE_PRICE_PRO,
  agency_monthly: process.env.STRIPE_PRICE_AGENCY,
};

const TIER_MODE_MAP: Record<string, 'payment' | 'subscription'> = {
  founding_lifetime: 'payment',
  starter_monthly: 'subscription',
  pro_monthly: 'subscription',
  agency_monthly: 'subscription',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2025-05-28.basil' });
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase admin env vars missing');
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS – tighten origin to your domain in production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tier, user_id, email } = req.body as {
      tier: string;
      user_id: string;
      email: string;
    };

    // -----------------------------------------------------------------------
    // Validate input
    // -----------------------------------------------------------------------
    if (!tier || !user_id || !email) {
      return res.status(400).json({ error: 'tier, user_id, and email are required' });
    }

    const priceId = TIER_PRICE_MAP[tier];
    if (!priceId) {
      return res.status(400).json({ error: `Unknown tier: ${tier}. Valid tiers: ${Object.keys(TIER_PRICE_MAP).join(', ')}` });
    }

    const mode = TIER_MODE_MAP[tier];

    // -----------------------------------------------------------------------
    // Founding-tier seat guard
    // -----------------------------------------------------------------------
    if (tier === 'founding_lifetime') {
      const supabase = getSupabaseAdmin();
      const { count, error: countError } = await supabase
        .from('founding_seats')
        .select('seat_number', { count: 'exact', head: true });

      if (countError) {
        console.error('[checkout] founding_seats count error:', countError);
        return res.status(500).json({ error: 'Failed to verify founding seat availability' });
      }

      const claimed = count ?? 0;
      if (claimed >= FOUNDING_SEAT_LIMIT) {
        return res.status(409).json({
          error: 'All founding seats have been claimed',
          claimed,
          remaining: 0,
        });
      }
    }

    // -----------------------------------------------------------------------
    // Create or retrieve Stripe customer
    // -----------------------------------------------------------------------
    const stripe = getStripe();

    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customer: Stripe.Customer;

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { user_id },
      });
    }

    // -----------------------------------------------------------------------
    // Build Checkout Session params
    // -----------------------------------------------------------------------
    const origin =
      req.headers.origin ??
      req.headers.referer?.replace(/\/$/, '') ??
      'https://laidcommandcenter.com';

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      price: priceId,
      quantity: 1,
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      line_items: [lineItem],
      mode,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: user_id,
      customer_update: { address: 'auto' },
      metadata: {
        user_id,
        tier,
      },
      ...(mode === 'payment'
        ? {
            payment_intent_data: {
              metadata: { user_id, tier },
            },
          }
        : {
            subscription_data: {
              metadata: { user_id, tier },
            },
          }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[checkout] error:', err);
    return res.status(500).json({ error: message });
  }
}
