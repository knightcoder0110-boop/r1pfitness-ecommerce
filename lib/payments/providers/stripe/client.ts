import "server-only";

import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/**
 * Lazily-initialised Stripe server client.
 *
 * Throws if `STRIPE_SECRET_KEY` is not configured so that any code
 * path which needs the SDK fails loud at first use rather than
 * silently producing a broken intent.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to .env.local to enable checkout.",
    );
  }
  _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  return _stripe;
}

/** Test-only: reset the cached client so a different mocked SDK can be picked up. */
export function __resetStripeClientForTesting(): void {
  _stripe = null;
}
