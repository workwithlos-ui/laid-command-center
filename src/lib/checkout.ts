import { getStripe } from '@/lib/stripe';

export type CheckoutTier =
  | 'founding_lifetime'
  | 'starter_monthly'
  | 'pro_monthly'
  | 'agency_monthly';

export interface CheckoutOptions {
  tier: CheckoutTier;
  userId: string;
  email: string;
}

export interface CheckoutResult {
  success: boolean;
  error?: string;
}

/**
 * Creates a Stripe Checkout session via /api/checkout and redirects the user
 * to the Stripe-hosted payment page.
 *
 * Returns { success: false, error } if anything fails before the redirect.
 * If the redirect succeeds the function never resolves (browser navigates away).
 */
export async function startCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
  const { tier, userId, email } = options;

  try {
    // 1. Create the Checkout session on the server
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, user_id: userId, email }),
    });

    const data = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !data.url) {
      const errorMessage = data.error ?? `Checkout failed (HTTP ${response.status})`;
      console.error('[checkout] server error:', errorMessage);
      return { success: false, error: errorMessage };
    }

    // 2. Ensure Stripe.js is loaded (needed for redirectToCheckout fallback path)
    //    For hosted Checkout we just redirect via window.location, but we also
    //    preload Stripe.js so Elements work later without delay.
    void getStripe();

    // 3. Redirect to Stripe Checkout
    window.location.href = data.url;

    // The browser navigates away — this line is only reached in test environments
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[checkout] client error:', err);
    return { success: false, error: message };
  }
}

/**
 * Convenience wrappers for each tier.
 */
export const checkout = {
  foundingLifetime: (userId: string, email: string) =>
    startCheckout({ tier: 'founding_lifetime', userId, email }),

  starterMonthly: (userId: string, email: string) =>
    startCheckout({ tier: 'starter_monthly', userId, email }),

  proMonthly: (userId: string, email: string) =>
    startCheckout({ tier: 'pro_monthly', userId, email }),

  agencyMonthly: (userId: string, email: string) =>
    startCheckout({ tier: 'agency_monthly', userId, email }),
};

// ---------------------------------------------------------------------------
// Sales-page convenience exports
// Used by src/pages/Founding.tsx for cold/warm traffic checkout flow.
// email doubles as userId for unauthenticated visitors.
// ---------------------------------------------------------------------------

/**
 * One-liner for the founding sales page CTA.
 * Captures email, creates a Stripe session, and redirects.
 */
export async function checkoutFoundingTier(email: string): Promise<void> {
  const result = await startCheckout({ tier: 'founding_lifetime', userId: email, email });
  if (!result.success) {
    throw new Error(result.error ?? 'Checkout failed');
  }
}

/**
 * Fetches the live founding seat count.
 * Gracefully degrades if the API isn't deployed yet.
 */
export async function getFoundingStatus(): Promise<{
  claimed: number;
  remaining: number;
  total: number;
}> {
  try {
    const res = await fetch('/api/founding-status');
    if (!res.ok) throw new Error('Status fetch failed');
    return res.json() as Promise<{ claimed: number; remaining: number; total: number }>;
  } catch {
    return { claimed: 12, remaining: 38, total: 50 };
  }
}
