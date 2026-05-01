import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { parseTrackingFromMetaData, type WooMetaEntry } from "@/lib/checkout/shipment";
import { emit } from "@/lib/email";
import {
  buildCancelledOrderEvent,
  buildShippedOrderEvent,
} from "@/lib/email/events";
import type { Order } from "@/lib/woo/types";

/**
 * WooCommerce **order** webhook handler.
 *
 * Configure in WP admin → WooCommerce → Settings → Advanced → Webhooks:
 *   - Topic: Order created / updated
 *   - Delivery URL: https://<host>/api/webhooks/woo/order
 *   - Secret: same value as WOO_WEBHOOK_SECRET env var
 *
 * What this does:
 *  - Verifies the HMAC-SHA256 signature in `x-wc-webhook-signature`
 *    over the raw body. Same pattern as `customer/route.ts` and
 *    `product/route.ts` — kept inline rather than extracted because
 *    each route uses a different body shape and we want to keep the
 *    raw-body read explicit.
 *  - On `order.updated` with status `completed` AND tracking present
 *    in `_wc_shipment_tracking_items` meta: emits `order.shipped`.
 *  - On `order.updated` with status `cancelled`: emits `order.cancelled`.
 *    Stripe-driven cancels (PR A-7 path) also flip the Woo status, so
 *    Woo will fire this webhook a moment later. We rely on Klaviyo's
 *    `uniqueId` dedupe (`cancel-{orderId}`) to collapse the duplicate
 *    rather than trying to read a custom origin meta key — simpler and
 *    matches how `order.refunded` already works for refunds initiated
 *    in Woo admin.
 *
 * Idempotency:
 *  - Both event payloads carry deterministic `uniqueId`s:
 *      - `ship-{orderId}-{trackingNumber}` (multi-parcel safe)
 *      - `cancel-{orderId}`
 *  - A Woo retry of the same payload yields the same key.
 *
 * Security:
 *  - Raw body read before JSON.parse (signature is over bytes).
 *  - Timing-safe comparison.
 *  - Missing/invalid signature → 401 with no body detail.
 *  - Email-emit failures swallowed so a Klaviyo outage cannot trigger
 *    Woo webhook retries and double-process state.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WooOrderPayload {
  id?: number;
  number?: string;
  status?: string;
  currency?: string;
  date_created?: string;
  date_modified?: string;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
  line_items?: Array<{
    id: number;
    product_id: number;
    variation_id?: number;
    quantity: number;
    sku: string;
    name: string;
    price: string | number;
    total: string;
  }>;
  meta_data?: WooMetaEntry[];
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Translate the Woo webhook payload (snake_case) into the `Order`
 * shape the email-event builders consume (camelCase, Money values).
 *
 * We do not call back into `getWooOrder` because:
 *   - It would race with Woo's own write that triggered this webhook
 *     (cache layers and read replicas may not yet reflect the update).
 *   - The webhook payload is the canonical state at the moment of the
 *     transition; using it directly is more accurate.
 */
function payloadToOrder(p: WooOrderPayload): Order | null {
  if (typeof p.id !== "number" || !p.billing?.email) return null;

  const currency = p.currency ?? "USD";
  const toMinor = (v: string | number | undefined): number => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  };

  return {
    id: String(p.id),
    number: p.number ?? String(p.id),
    status: (p.status as Order["status"]) ?? "pending",
    currency,
    createdAt: p.date_created ?? new Date().toISOString(),
    updatedAt: p.date_modified ?? new Date().toISOString(),
    subtotal: { amount: 0, currency },
    discountTotal: { amount: 0, currency },
    shippingTotal: { amount: 0, currency },
    taxTotal: { amount: 0, currency },
    total: { amount: 0, currency },
    billing: {
      firstName: p.billing.first_name ?? "",
      lastName: p.billing.last_name ?? "",
      line1: p.billing.address_1 ?? "",
      line2: p.billing.address_2 || undefined,
      city: p.billing.city ?? "",
      region: p.billing.state ?? "",
      postalCode: p.billing.postcode ?? "",
      country: p.billing.country ?? "US",
      email: p.billing.email,
      phone: p.billing.phone || undefined,
    },
    shipping: {
      firstName: p.shipping?.first_name ?? p.billing.first_name ?? "",
      lastName: p.shipping?.last_name ?? p.billing.last_name ?? "",
      line1: p.shipping?.address_1 ?? p.billing.address_1 ?? "",
      line2: p.shipping?.address_2 || undefined,
      city: p.shipping?.city ?? p.billing.city ?? "",
      region: p.shipping?.state ?? p.billing.state ?? "",
      postalCode: p.shipping?.postcode ?? p.billing.postcode ?? "",
      country: p.shipping?.country ?? p.billing.country ?? "US",
    },
    items: (p.line_items ?? []).map((li) => ({
      key: `${li.product_id}::${li.variation_id ?? ""}`,
      productId: String(li.product_id),
      variationId: li.variation_id ? String(li.variation_id) : undefined,
      name: li.name,
      sku: li.sku ?? "",
      quantity: li.quantity,
      unitPrice: { amount: toMinor(li.price), currency },
      subtotal: { amount: toMinor(li.total), currency },
      attributes: {},
    })),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.WOO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: { code: "BACKEND_OFFLINE", message: "Webhook secret not configured" } },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-wc-webhook-signature");

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid signature" } },
      { status: 401 },
    );
  }

  let payload: WooOrderPayload;
  try {
    payload = JSON.parse(rawBody) as WooOrderPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Malformed webhook body" } },
      { status: 400 },
    );
  }

  const topic = req.headers.get("x-wc-webhook-topic") ?? "order.unknown";
  const status = payload.status;
  const orderId = payload.id !== undefined ? String(payload.id) : "unknown";

  console.info(`[woo-order-webhook] topic=${topic} id=${orderId} status=${status}`);

  // Only act on terminal transitions we can observe. `order.created`
  // for "pending" orders is noise (we created it ourselves moments ago
  // from /api/checkout); we ignore it so we don't fire a placeholder
  // shipped/cancelled before the customer has even paid.
  if (status !== "completed" && status !== "cancelled") {
    return NextResponse.json({ ok: true, data: { received: true, ignored: status } });
  }

  const order = payloadToOrder(payload);
  if (!order) {
    return NextResponse.json({ ok: true, data: { received: true, skipped: "no_email" } });
  }

  try {
    if (status === "completed") {
      const shipment = parseTrackingFromMetaData(payload.meta_data);
      if (!shipment) {
        // Mark complete without tracking — Woo flow is to ship later.
        // Skip silently; Klaviyo flow can fire on the eventual
        // `_wc_shipment_tracking_items` update which arrives via an
        // `order.updated` (still status=completed) once the operator
        // adds a tracking number.
        return NextResponse.json({ ok: true, data: { received: true, skipped: "no_tracking" } });
      }

      await emit({
        type: "order.shipped",
        payload: buildShippedOrderEvent({ order, ...shipment }),
      });
    } else {
      await emit({
        type: "order.cancelled",
        payload: buildCancelledOrderEvent({ order, reason: "other" }),
      });
    }
  } catch (emitErr) {
    console.error(`[woo-order-webhook] emit failed for ${orderId}:`, emitErr);
    // Still 200 — we don't want Woo retrying and re-emitting.
  }

  return NextResponse.json({ ok: true, data: { received: true, topic, status } });
}
