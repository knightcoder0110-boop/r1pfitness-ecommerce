import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/checkout";
import { markOrderProcessing } from "@/lib/checkout/woo-order";
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
          await markOrderProcessing(orderId);
          console.log(`[stripe-webhook] Order ${orderId} marked processing`);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const orderId = intent.metadata?.orderId;
        console.warn(`[stripe-webhook] Payment failed for order ${orderId ?? "unknown"}`);
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
