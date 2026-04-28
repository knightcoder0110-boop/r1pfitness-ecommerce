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
import { trackKlaviyoPlacedOrder } from "@/lib/klaviyo";
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

          // Fire Klaviyo "Placed Order" event so the configured flow can
          // send the branded order-confirmation email. Failures here must
          // never bubble up — Stripe would retry the webhook and we'd
          // double-process the Woo order. Best-effort, log on error.
          try {
            const order = await getWooOrder(orderId);
            const customerEmail =
              order?.billing.email ?? intent.metadata?.email ?? intent.receipt_email ?? null;
            if (order && customerEmail) {
              await trackKlaviyoPlacedOrder({
                email: customerEmail,
                orderId,
                total: order.total.amount / 100,
                currency: order.total.currency,
                firstName: order.billing.firstName || undefined,
                lastName: order.billing.lastName || undefined,
                items: order.items.map((li) => ({
                  productId: li.productId,
                  sku: li.sku,
                  name: li.name,
                  quantity: li.quantity,
                  unitPrice: li.unitPrice.amount / 100,
                })),
              });
            }
          } catch (klaviyoErr) {
            console.error("[stripe-webhook] Klaviyo Placed Order failed:", klaviyoErr);
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
