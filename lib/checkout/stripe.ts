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
 * @param amountCents  - Total in minor units (e.g. 4999 = $49.99).
 * @param currency     - ISO 4217 code, lowercase (e.g. "usd").
 * @param metadata     - Freeform metadata attached to the PaymentIntent.
 * @param receiptEmail - When set, Stripe sends a hosted receipt to this
 *                       address after the charge succeeds. This is our
 *                       baseline order confirmation — independent of
 *                       Klaviyo / Woo email pipelines.
 */
export async function createPaymentIntent(
  amountCents: number,
  currency: string,
  metadata: Record<string, string> = {},
  receiptEmail?: string,
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: { ...metadata, site: "merch" },
    ...(receiptEmail ? { receipt_email: receiptEmail } : {}),
  });
}
