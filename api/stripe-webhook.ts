import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutSessionCompleted(
  stripe: Stripe,
  supabase: ReturnType<typeof getSupabaseAdmin>,
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error('[webhook] checkout.session.completed: missing user_id or tier in metadata', session.id);
    return;
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null;
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  // Retrieve price ID from the line items
  let priceId: string | null = null;
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    priceId = lineItems.data[0]?.price?.id ?? null;
  } catch (e) {
    console.warn('[webhook] could not retrieve line items for session', session.id, e);
  }

  let foundingSeatNumber: number | null = null;

  // -------------------------------------------------------------------------
  // Founding tier: claim seat (with race-condition guard)
  // -------------------------------------------------------------------------
  if (tier === 'founding_lifetime') {
    const { data: seatData, error: seatError } = await supabase.rpc('claim_founding_seat', {
      p_user_id: userId,
    });

    if (seatError) {
      // All 50 seats are gone — refund and log
      console.error('[webhook] claim_founding_seat failed:', seatError.message);

      if (paymentIntentId) {
        try {
          await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'duplicate', // closest Stripe reason; attach note via metadata
            metadata: {
              reason: 'founding_seats_exhausted',
              user_id: userId,
            },
          });
          console.log('[webhook] refund issued for', paymentIntentId);
        } catch (refundErr) {
          console.error('[webhook] refund failed for', paymentIntentId, refundErr);
        }
      }

      // Send apology email via Stripe Customer (best-effort)
      if (customerId) {
        try {
          // Tag the customer so your email platform can pick it up
          await stripe.customers.update(customerId, {
            metadata: { founding_seat_denied: 'true', founding_seat_denied_at: new Date().toISOString() },
          });
        } catch {
          // non-fatal
        }
      }

      return; // Don't create a subscription record for a refunded charge
    }

    foundingSeatNumber = seatData as number;
  }

  // -------------------------------------------------------------------------
  // Determine period end for subscriptions
  // -------------------------------------------------------------------------
  let currentPeriodEnd: string | null = null;
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      currentPeriodEnd = new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000).toISOString();
    } catch {
      // non-fatal
    }
  }

  // -------------------------------------------------------------------------
  // Insert subscription record
  // -------------------------------------------------------------------------
  const { error: insertError } = await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    tier,
    status: 'active',
    current_period_end: currentPeriodEnd,
    founding_seat_number: foundingSeatNumber,
  });

  if (insertError) {
    console.error('[webhook] subscription insert error:', insertError);
  } else {
    console.log(`[webhook] subscription created for user ${userId}, tier ${tier}, seat ${foundingSeatNumber ?? 'n/a'}`);
  }
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  subscription: Stripe.Subscription,
) {
  const subWithPeriod = subscription as Stripe.Subscription & { current_period_end: number };
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status as 'active' | 'past_due' | 'canceled' | 'trialing',
      current_period_end: new Date(subWithPeriod.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[webhook] subscription update error:', error);
  } else {
    console.log('[webhook] subscription updated:', subscription.id, subscription.status);
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  subscription: Stripe.Subscription,
) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[webhook] subscription delete error:', error);
  } else {
    console.log('[webhook] subscription canceled:', subscription.id);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export const config = {
  api: { bodyParser: false }, // Raw body required for Stripe signature verification
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Collect raw body for signature verification
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  const rawBody = Buffer.concat(chunks);

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    console.error('[webhook] signature error:', message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${message}` });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripe, supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      default:
        // Unhandled event types — acknowledge receipt and move on
        console.log('[webhook] unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
