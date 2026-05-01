import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getWooOrder,
  markOrderProcessing,
  markOrderRefunded,
} from "@/lib/checkout/woo-order";
import { emit } from "@/lib/email";
import { buildPlacedOrderEvent, buildRefundedOrderEvent } from "@/lib/email/events";
import { env } from "@/lib/env";
import {
  getPaymentProvider,
  WebhookConfigError,
  WebhookSignatureError,
} from "@/lib/payments";

/**
 * POST /api/webhooks/stripe
 *
 * Provider-neutral webhook router. Verification + event translation
 * happen inside `provider.parseWebhook(...)`; this route only knows
 * about `ProviderEvent` variants.
 *
 * Events handled:
 *  - `payment.succeeded` → mark Woo order "processing", emit Klaviyo "Placed Order"
 *  - `payment.failed`    → log (Woo order stays pending; user retries)
 *  - `payment.canceled`  → log (canceled flow lands in PR A-7)
 *  - `charge.refunded`   → mark Woo order "refunded", emit Klaviyo "Refunded Order"
 *
 * Security:
 *  - Signature is verified inside `parseWebhook` (Stripe `constructEvent`).
 *    Failures return 400 so Stripe will retry once it's actually misconfigured
 *    on our side and stop after the configured retry window otherwise.
 *  - Email-emit failures are swallowed so a downstream provider outage
 *    cannot cause Stripe to retry the webhook and double-process the
 *    underlying Woo order.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const rawBody = Buffer.from(await req.arrayBuffer());

  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  let event;
  try {
    event = await getPaymentProvider().parseWebhook(rawBody, sig);
  } catch (err) {
    if (err instanceof WebhookConfigError) {
      console.error("[stripe-webhook]", err.message);
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    if (err instanceof WebhookSignatureError) {
      console.error("[stripe-webhook]", err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] unexpected parse error:", msg);
    return NextResponse.json({ error: "Webhook parse failed" }, { status: 400 });
  }

  if (!event) {
    // Verified but uninteresting event. Respond 200 so Stripe stops retrying.
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "payment.succeeded": {
        if (!event.orderId) {
          console.warn(
            `[stripe-webhook] payment.succeeded with no orderId, intent ${event.intentId}`,
          );
          break;
        }
        await markOrderProcessing(event.orderId, event.intentId);
        console.log(
          `[stripe-webhook] Order ${event.orderId} marked processing, tx ${event.intentId}`,
        );

        try {
          const order = await getWooOrder(event.orderId);
          const customerEmail = order?.billing.email ?? event.customerEmail ?? null;
          if (order && customerEmail) {
            const profileEmailOverride = order.billing.email
              ? undefined
              : { email: customerEmail };
            await emit({
              type: "order.placed",
              payload: buildPlacedOrderEvent({
                order,
                profile: profileEmailOverride,
                paymentMethod: event.paymentMethodKind,
                siteUrl: env.NEXT_PUBLIC_SITE_URL ?? "",
                orderUrl: orderUrl(event.orderId),
              }),
            });
          }
        } catch (emitErr) {
          console.error("[stripe-webhook] order.placed emit failed:", emitErr);
        }
        break;
      }

      case "payment.failed": {
        console.warn(
          `[stripe-webhook] Payment failed for order ${event.orderId ?? "unknown"}: ${event.failureCode ?? ""} ${event.failureMessage ?? ""}`.trim(),
        );
        break;
      }

      case "payment.canceled": {
        console.warn(
          `[stripe-webhook] Payment canceled for order ${event.orderId ?? "unknown"}: ${event.cancellationReason ?? ""}`.trim(),
        );
        break;
      }

      case "charge.refunded": {
        if (!event.orderId) {
          console.warn(
            `[stripe-webhook] charge.refunded with no orderId, charge ${event.chargeId}`,
          );
          break;
        }
        await markOrderRefunded(event.orderId);
        console.log(`[stripe-webhook] Order ${event.orderId} marked refunded`);

        try {
          const order = await getWooOrder(event.orderId);
          if (order && order.billing.email) {
            await emit({
              type: "order.refunded",
              payload: buildRefundedOrderEvent({
                order,
                refundAmount: event.amountRefunded / 100,
                refundKey: event.chargeId,
                reason: event.reason,
              }),
            });
          }
        } catch (emitErr) {
          console.error("[stripe-webhook] order.refunded emit failed:", emitErr);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function orderUrl(orderId: string): string {
  const base = env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/account/orders/${orderId}`;
}
