import "server-only";

import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/**
 * Lazily-initialised Stripe server client.
 * Throws if STRIPE_SECRET_KEY is not configured.
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

/**
 * Create a Stripe PaymentIntent for the given amount.
 *
 * Stripe's `receipt_email` is intentionally NOT set: Klaviyo's
 * `Placed Order` flow is the single source of truth for the order-
 * confirmation email. Setting `receipt_email` would cause Stripe to
 * also send its own hosted receipt, producing duplicate emails.
 *
 * @param amountCents - Total in minor units (e.g. 4999 = $49.99).
 * @param currency    - ISO 4217 code, lowercase (e.g. "usd").
 * @param metadata    - Freeform metadata attached to the PaymentIntent.
 */
export async function createPaymentIntent(
  amountCents: number,
  currency: string,
  metadata: Record<string, string> = {},
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: { ...metadata, site: "merch" },
  });
}
