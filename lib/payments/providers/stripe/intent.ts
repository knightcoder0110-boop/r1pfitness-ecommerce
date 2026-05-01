import "server-only";

import type Stripe from "stripe";
import type {
  CreateIntentInput,
  CreateIntentResult,
  IntentStatus,
  PaymentMethodKind,
  RetrievedIntent,
} from "../../types";
import { getStripe } from "./client";

/**
 * Create a Stripe PaymentIntent.
 *
 * - `automatic_payment_methods.enabled = true` lets Stripe negotiate
 *   which method types to surface in the PaymentElement based on the
 *   customer's browser, currency, and dashboard configuration. This is
 *   what makes ECE work without a hard-coded list.
 * - `receipt_email` is intentionally omitted: Klaviyo's "Placed Order"
 *   flow is the single source of truth for the order confirmation
 *   email; setting this would produce a duplicate Stripe-hosted receipt.
 * - When `idempotencyKey` is provided we forward it as Stripe's request
 *   `Idempotency-Key` header, providing defence in depth on top of the
 *   process-local in-memory cache (lib/payments/intent-cache.ts).
 */
export async function createIntent(
  input: CreateIntentInput,
): Promise<CreateIntentResult> {
  const stripe = getStripe();

  const metadata: Record<string, string> = {
    orderId: input.orderId,
    site: "merch",
    ...(input.email ? { email: input.email } : {}),
    ...(input.metadata ?? {}),
  };

  const intent = await stripe.paymentIntents.create(
    {
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata,
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );

  if (!intent.client_secret) {
    // Stripe always returns a client_secret for newly created PIs; if
    // we get here something unusual happened and the client cannot
    // confirm. Fail loud so the route returns a clean error.
    throw new Error("Stripe returned a PaymentIntent without a client_secret");
  }

  return {
    providerIntentId: intent.id,
    confirmationToken: intent.client_secret,
    amount: intent.amount,
    currency: intent.currency,
  };
}

/**
 * Retrieve an existing PaymentIntent and translate it into the
 * provider-neutral shape. Used by confirmation pages and admin tooling.
 */
export async function retrieveIntent(
  providerIntentId: string,
): Promise<RetrievedIntent> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(providerIntentId, {
    expand: ["latest_charge"],
  });
  return mapIntent(intent);
}

function mapIntent(intent: Stripe.PaymentIntent): RetrievedIntent {
  const charge =
    typeof intent.latest_charge === "object" && intent.latest_charge
      ? intent.latest_charge
      : null;
  return {
    providerIntentId: intent.id,
    status: intent.status as IntentStatus,
    amount: intent.amount,
    currency: intent.currency,
    paymentMethodKind: detectMethodKind(intent),
    receiptUrl: charge?.receipt_url ?? undefined,
    orderId: intent.metadata?.orderId,
  };
}

/**
 * Map a Stripe PaymentIntent / Charge to our normalised
 * `PaymentMethodKind`.
 *
 * Order of precedence:
 *  1. Expanded charge's `payment_method_details.type` (most accurate;
 *     distinguishes wallet sub-types like `apple_pay` vs `google_pay`).
 *  2. The intent's `payment_method_types[0]` (set at create time).
 *  3. Default to "card".
 */
export function detectMethodKind(
  intent: Stripe.PaymentIntent,
): PaymentMethodKind | undefined {
  // Wallet detection: expanded charge tells us if it was Apple/Google.
  if (typeof intent.latest_charge === "object" && intent.latest_charge) {
    const details = intent.latest_charge.payment_method_details;
    if (details?.card?.wallet?.type === "apple_pay") return "apple_pay";
    if (details?.card?.wallet?.type === "google_pay") return "google_pay";
    if (details?.card?.wallet?.type === "link") return "link";
    if (details?.type === "card") return "card";
    if (details?.type === "paypal") return "paypal";
    if (details?.type === "link") return "link";
    if (details?.type === "klarna") return "klarna";
    if (details?.type === "afterpay_clearpay") return "afterpay";
    if (details?.type === "affirm") return "affirm";
  }
  const t = intent.payment_method_types?.[0];
  switch (t) {
    case "card":
      return "card";
    case "link":
      return "link";
    case "paypal":
      return "paypal";
    case "klarna":
      return "klarna";
    case "afterpay_clearpay":
      return "afterpay";
    case "affirm":
      return "affirm";
    case undefined:
      return undefined;
    default:
      return "other";
  }
}
