import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

// Singleton promise — loadStripe is safe to call multiple times but we cache it
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a (cached) Stripe.js instance initialised with the publishable key.
 * Call this lazily — only when you need to redirect to Checkout or mount Elements.
 *
 * Requires VITE_STRIPE_PUBLISHABLE_KEY to be set in your environment.
 */
export function getStripe(): Promise<Stripe | null> {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

  if (!publishableKey) {
    console.warn(
      '[stripe] VITE_STRIPE_PUBLISHABLE_KEY is not set. ' +
        'Stripe Checkout will not work until you add it to your .env.local file.',
    );
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}
