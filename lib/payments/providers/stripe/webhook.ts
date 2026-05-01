import "server-only";

import type Stripe from "stripe";
import { env } from "@/lib/env";
import {
  type ChargeRefundedEvent,
  type PaymentCanceledEvent,
  type PaymentFailedEvent,
  type PaymentMethodKind,
  type PaymentSucceededEvent,
  type ProviderEvent,
  WebhookConfigError,
  WebhookSignatureError,
} from "../../types";
import { detectMethodKind } from "./intent";
import { getStripe } from "./client";

/**
 * Verify the `Stripe-Signature` header against the configured webhook
 * secret and translate the resulting Stripe event into a provider-
 * neutral `ProviderEvent`.
 *
 * Returns `null` for events we don't act on (so the webhook route
 * responds 200 and Stripe does not retry).
 *
 * Errors:
 *  - `WebhookConfigError` when `STRIPE_WEBHOOK_SECRET` is unset.
 *  - `WebhookSignatureError` when signature is missing or invalid.
 */
export async function parseWebhook(
  rawBody: Buffer,
  signature: string | null,
): Promise<ProviderEvent | null> {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new WebhookConfigError("STRIPE_WEBHOOK_SECRET not configured");
  }
  if (!signature) {
    throw new WebhookSignatureError("Missing stripe-signature header");
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    throw new WebhookSignatureError(`Stripe signature invalid: ${msg}`);
  }

  return translate(event);
}

function translate(event: Stripe.Event): ProviderEvent | null {
  switch (event.type) {
    case "payment_intent.succeeded":
      return toSucceeded(event.data.object as Stripe.PaymentIntent);
    case "payment_intent.payment_failed":
      return toFailed(event.data.object as Stripe.PaymentIntent);
    case "payment_intent.canceled":
      return toCanceled(event.data.object as Stripe.PaymentIntent);
    case "charge.refunded":
      return toRefunded(event.data.object as Stripe.Charge);
    default:
      return null;
  }
}

function toSucceeded(intent: Stripe.PaymentIntent): PaymentSucceededEvent {
  const customerEmail =
    intent.metadata?.email ?? intent.receipt_email ?? null;
  // For PI without an expanded charge, fall back to `payment_method_types`.
  const kind: PaymentMethodKind = detectMethodKind(intent) ?? "card";
  return {
    type: "payment.succeeded",
    intentId: intent.id,
    orderId: intent.metadata?.orderId ?? null,
    amount: intent.amount,
    currency: intent.currency,
    paymentMethodKind: kind,
    customerEmail,
  };
}

function toFailed(intent: Stripe.PaymentIntent): PaymentFailedEvent {
  const err = intent.last_payment_error;
  return {
    type: "payment.failed",
    intentId: intent.id,
    orderId: intent.metadata?.orderId ?? null,
    failureCode: err?.code,
    failureMessage: err?.message,
  };
}

function toCanceled(intent: Stripe.PaymentIntent): PaymentCanceledEvent {
  return {
    type: "payment.canceled",
    intentId: intent.id,
    orderId: intent.metadata?.orderId ?? null,
    cancellationReason: intent.cancellation_reason ?? undefined,
  };
}

function toRefunded(charge: Stripe.Charge): ChargeRefundedEvent {
  // The PaymentIntent metadata is the canonical source for orderId.
  // We accept charge.metadata as a fallback, then fall back to expanding
  // the PI when the charge is expanded.
  const piMetadata =
    typeof charge.payment_intent === "object" && charge.payment_intent
      ? charge.payment_intent.metadata
      : null;
  const orderId =
    (charge.metadata as Record<string, string> | undefined)?.orderId ??
    piMetadata?.orderId ??
    null;
  const intentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? "");
  return {
    type: "charge.refunded",
    chargeId: charge.id,
    intentId,
    orderId,
    amountRefunded: charge.amount_refunded,
    currency: charge.currency,
    reason: charge.refunds?.data[0]?.reason ?? undefined,
  };
}
