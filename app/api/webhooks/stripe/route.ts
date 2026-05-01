import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/checkout";
import {
  getWooOrder,
  markOrderProcessing,
  markOrderRefunded,
} from "@/lib/checkout/woo-order";
import { emit } from "@/lib/email";
import { buildPlacedOrderEvent, buildRefundedOrderEvent } from "@/lib/email/events";
import type { PaymentMethodKind } from "@/lib/email/types";
import { env } from "@/lib/env";

/**
 * POST /api/webhooks/stripe
 *
 * Listens for Stripe events and transitions WooCommerce orders accordingly.
 *
 * Events handled:
 *  - `payment_intent.succeeded` → mark Woo order "processing"
 *  - `payment_intent.payment_failed` → log (order stays "pending", user retries)
 *
 * Security: every request is verified with the Stripe-Signature header using
 * STRIPE_WEBHOOK_SECRET. Requests that fail verification are rejected 400.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.arrayBuffer();
  const buf = Buffer.from(rawBody);

  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook signature invalid: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await markOrderProcessing(orderId, intent.id);
          console.log(`[stripe-webhook] Order ${orderId} marked processing, tx ${intent.id}`);

          // Emit the order.placed lifecycle event. The email layer
          // never throws — a provider outage must not cause Stripe to
          // retry the webhook and double-process the Woo order.
          try {
            const order = await getWooOrder(orderId);
            const customerEmail =
              order?.billing.email ?? intent.metadata?.email ?? intent.receipt_email ?? null;
            if (order && customerEmail) {
              const profileEmailOverride =
                order.billing.email ? undefined : { email: customerEmail };
              await emit({
                type: "order.placed",
                payload: buildPlacedOrderEvent({
                  order,
                  profile: profileEmailOverride,
                  paymentMethod: detectPaymentMethod(intent),
                  siteUrl: env.NEXT_PUBLIC_SITE_URL ?? "",
                  orderUrl: orderUrl(orderId),
                }),
              });
            }
          } catch (emitErr) {
            console.error("[stripe-webhook] order.placed emit failed:", emitErr);
          }
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const orderId = intent.metadata?.orderId;
        console.warn(`[stripe-webhook] Payment failed for order ${orderId ?? "unknown"}`);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const orderId = (charge.metadata as Record<string, string> | undefined)?.orderId
          ?? (charge.payment_intent as Stripe.PaymentIntent | null)?.metadata?.orderId;
        if (orderId) {
          await markOrderRefunded(orderId);
          console.log(`[stripe-webhook] Order ${orderId} marked refunded`);

          try {
            const order = await getWooOrder(orderId);
            if (order && order.billing.email) {
              await emit({
                type: "order.refunded",
                payload: buildRefundedOrderEvent({
                  order,
                  refundAmount: charge.amount_refunded / 100,
                  refundKey: charge.id,
                  reason: charge.refunds?.data[0]?.reason ?? undefined,
                }),
              });
            }
          } catch (emitErr) {
            console.error("[stripe-webhook] order.refunded emit failed:", emitErr);
          }
        }
        break;
      }
      default:
        // Ignore unhandled events — return 200 so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Map a Stripe PaymentIntent to our normalised PaymentMethodKind.
 *
 * The intent's `payment_method_types` is an array; we trust the first
 * entry. For ECE-driven Apple/Google/Link/PayPal payments the type is
 * carried on the underlying PaymentMethod, but at webhook time we have
 * the intent only. "card" is the safe default.
 */
function detectPaymentMethod(intent: Stripe.PaymentIntent): PaymentMethodKind {
  const t = intent.payment_method_types?.[0];
  switch (t) {
    case "card":
      return "card";
    case "link":
      return "link";
    case "paypal":
      return "paypal";
    default:
      return t ? "other" : "card";
  }
}

function orderUrl(orderId: string): string {
  const base = env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/account/orders/${orderId}`;
}
