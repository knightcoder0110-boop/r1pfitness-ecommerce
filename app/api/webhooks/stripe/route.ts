import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getWooOrder,
  markOrderCancelled,
  markOrderFailed,
  markOrderProcessing,
  markOrderRefunded,
} from "@/lib/checkout/woo-order";
import { emit } from "@/lib/email";
import {
  buildCancelledOrderEvent,
  buildPaymentFailedEvent,
  buildPlacedOrderEvent,
  buildRefundedOrderEvent,
} from "@/lib/email/events";
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
 *  - `payment.failed`    → mark Woo order "failed", emit Klaviyo "Payment Failed"
 *  - `payment.canceled`  → mark Woo order "cancelled", emit Klaviyo "Cancelled Order"
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
        const intentId = event.intentId;
        const code = event.failureCode ?? "unknown";
        const message = event.failureMessage ?? "Payment failed";
        console.warn(
          `[stripe-webhook] Payment failed for order ${event.orderId ?? "unknown"}: ${code} ${message}`,
        );

        if (!event.orderId) break;

        await markOrderFailed(event.orderId, `Payment failed: ${code} — ${message}`);

        try {
          const order = await getWooOrder(event.orderId);
          const customerEmail = order?.billing.email ?? event.customerEmail ?? null;
          if (order && customerEmail) {
            const profileEmailOverride = order.billing.email
              ? undefined
              : { email: customerEmail };
            await emit({
              type: "payment.failed",
              payload: buildPaymentFailedEvent({
                order,
                profile: profileEmailOverride,
                failureCode: code,
                failureMessage: message,
                retryUrl: retryUrl(),
                intentId,
              }),
            });
          }
        } catch (emitErr) {
          console.error("[stripe-webhook] payment.failed emit failed:", emitErr);
        }
        break;
      }

      case "payment.canceled": {
        const reason = event.cancellationReason ?? "unknown";
        console.warn(
          `[stripe-webhook] Payment canceled for order ${event.orderId ?? "unknown"}: ${reason}`,
        );

        if (!event.orderId) break;

        await markOrderCancelled(event.orderId, `Payment canceled: ${reason}`);

        try {
          const order = await getWooOrder(event.orderId);
          if (order && order.billing.email) {
            await emit({
              type: "order.cancelled",
              payload: buildCancelledOrderEvent({
                order,
                // Stripe-side cancel reasons are not customer-friendly; bucket
                // them into our cancellation taxonomy. `abandoned` (the most
                // common cause — checkout sheet closed) and `requested_by_customer`
                // both fall under customer_request; everything else (failed
                // 3DS, fraud, etc.) is the auto/system bucket so the email
                // copy doesn't blame the customer.
                reason:
                  reason === "requested_by_customer" || reason === "abandoned"
                    ? "customer_request"
                    : "auto_timeout",
              }),
            });
          }
        } catch (emitErr) {
          console.error("[stripe-webhook] order.cancelled emit failed:", emitErr);
        }
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

function retryUrl(): string {
  const base = env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/checkout`;
}
