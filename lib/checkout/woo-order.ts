import "server-only";

import { adminFetch } from "@/lib/woo/client";
import type { Order } from "@/lib/woo/types";
import type { CheckoutRequest } from "./types";
import {
  STANDARD_SHIPPING_METHOD_ID,
  STANDARD_SHIPPING_METHOD_TITLE,
} from "@/lib/constants/shipping";

/**
 * Woo order line-item shape expected by the REST API.
 * https://woocommerce.github.io/woocommerce-rest-api-docs/#create-an-order
 */
interface WooLineItem {
  product_id: number;
  variation_id?: number;
  quantity: number;
  subtotal?: string;
  total?: string;
}

interface RawWooOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  line_items: Array<{
    id: number;
    product_id: number;
    variation_id?: number;
    quantity: number;
    sku: string;
    name: string;
    price: string;
    total: string;
  }>;
}

/** Shape for creating a draft Woo order. */
interface CreateOrderPayload {
  status: "pending";
  currency: string;
  customer_note?: string;
  set_paid: false;
  created_via?: string;
  payment_method?: string;
  payment_method_title?: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  line_items: WooLineItem[];
  shipping_lines?: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  coupon_lines?: Array<{ code: string }>;
  meta_data?: Array<{ key: string; value: string }>;
}

function toWooBilling(email: string, addr: CheckoutRequest["billing"]): Record<string, string> {
  return {
    first_name: addr.firstName,
    last_name: addr.lastName,
    address_1: addr.line1,
    address_2: addr.line2 ?? "",
    city: addr.city,
    state: addr.region,
    postcode: addr.postalCode,
    country: addr.country,
    phone: addr.phone ?? "",
    email,
  };
}

function toWooShipping(addr: CheckoutRequest["billing"]): Record<string, string> {
  return {
    first_name: addr.firstName,
    last_name: addr.lastName,
    address_1: addr.line1,
    address_2: addr.line2 ?? "",
    city: addr.city,
    state: addr.region,
    postcode: addr.postalCode,
    country: addr.country,
    phone: addr.phone ?? "",
  };
}

/**
 * Create a WooCommerce order in "pending" status (not yet paid).
 *
 * The order stores all line items at their cart unit price plus a flat
 * shipping line. WooCommerce computes any applicable tax server-side
 * based on the billing/shipping address and the configured tax rates;
 * the final `total` returned reflects subtotal + shipping + tax and is
 * the authoritative amount to charge via Stripe.
 *
 * Stripe handles payment — once `payment_intent.succeeded` fires, the
 * webhook (app/api/webhooks/stripe/route.ts) transitions the order to
 * "processing".
 *
 * @param req           Validated checkout request (server-trusted items)
 * @param shippingCents Shipping charge in minor units (already computed
 *                      from `calculateShippingCents(subtotal)`)
 * @returns             Order ID, currency, and the Woo-computed total
 *                      in cents (subtotal + shipping + tax)
 */
export async function createWooOrder(
  req: CheckoutRequest,
  shippingCents: number,
): Promise<{ orderId: string; currency: string; totalCents: number }> {
  const shipping = req.shipping ?? req.billing;
  const currency = req.items[0]?.unitPrice.currency ?? "USD";

  const lineItems: WooLineItem[] = req.items.map((item) => {
    const totalDollars = ((item.unitPrice.amount * item.quantity) / 100).toFixed(2);
    return {
      product_id: parseInt(item.productId, 10),
      ...(item.variationId ? { variation_id: parseInt(item.variationId, 10) } : {}),
      quantity: item.quantity,
      subtotal: totalDollars,
      total: totalDollars,
      // Unit price hint in meta — informational only
      meta_data: [{ key: "_unit_price_cents", value: String(item.unitPrice.amount) }],
    } as WooLineItem;
  });

  const shippingTotalDollars = (shippingCents / 100).toFixed(2);

  const payload: CreateOrderPayload = {
    status: "pending",
    currency,
    created_via: "checkout",
    payment_method: "stripe",
    payment_method_title: "Credit Card (Stripe)",
    set_paid: false,
    billing: toWooBilling(req.email, req.billing),
    shipping: toWooShipping(shipping),
    line_items: lineItems,
    shipping_lines: [
      {
        method_id: STANDARD_SHIPPING_METHOD_ID,
        method_title:
          shippingCents === 0 ? "Free Shipping" : STANDARD_SHIPPING_METHOD_TITLE,
        total: shippingTotalDollars,
      },
    ],
    ...(req.coupons?.length
      ? { coupon_lines: req.coupons.map((code) => ({ code })) }
      : {}),
    meta_data: [
      { key: "_checkout_source", value: "r1p-storefront" },
      { key: "_wc_order_attribution_source_type", value: "utm" },
      { key: "_wc_order_attribution_utm_source", value: "(direct)" },
    ],
  };

  const raw = await adminFetch<RawWooOrder>({
    path: "/orders",
    method: "POST",
    body: payload,
  });

  // Woo's `total` is a decimal string in major units; convert to cents.
  const totalCents = Math.round(parseFloat(raw.total) * 100);

  return { orderId: String(raw.id), currency, totalCents };
}

/**
 * Fetch a single Woo order by ID (server-side, admin auth).
 * Used by the confirmation page.
 */
export async function getWooOrder(orderId: string): Promise<Order | null> {
  try {
    const raw = await adminFetch<RawWooOrder>({
      path: `/orders/${orderId}`,
      next: { revalidate: 30 },
    });

    return {
      id: String(raw.id),
      number: raw.number,
      status: raw.status as Order["status"],
      currency: raw.currency,
      createdAt: new Date().toISOString(), // raw has date_created but typed loosely
      updatedAt: new Date().toISOString(),
      subtotal: { amount: Math.round(parseFloat(raw.total) * 100), currency: raw.currency },
      discountTotal: { amount: 0, currency: raw.currency },
      shippingTotal: { amount: 0, currency: raw.currency },
      taxTotal: { amount: 0, currency: raw.currency },
      total: { amount: Math.round(parseFloat(raw.total) * 100), currency: raw.currency },
      billing: {
        firstName: raw.billing.first_name ?? "",
        lastName: raw.billing.last_name ?? "",
        line1: raw.billing.address_1 ?? "",
        line2: raw.billing.address_2 || undefined,
        city: raw.billing.city ?? "",
        region: raw.billing.state ?? "",
        postalCode: raw.billing.postcode ?? "",
        country: raw.billing.country ?? "US",
        phone: raw.billing.phone || undefined,
        email: raw.billing.email || undefined,
      },
      shipping: {
        firstName: raw.shipping.first_name ?? "",
        lastName: raw.shipping.last_name ?? "",
        line1: raw.shipping.address_1 ?? "",
        line2: raw.shipping.address_2 || undefined,
        city: raw.shipping.city ?? "",
        region: raw.shipping.state ?? "",
        postalCode: raw.shipping.postcode ?? "",
        country: raw.shipping.country ?? "US",
        phone: raw.shipping.phone || undefined,
      },
      items: raw.line_items.map((li) => ({
        key: String(li.id),
        productId: String(li.product_id),
        variationId: li.variation_id ? String(li.variation_id) : undefined,
        name: li.name,
        sku: li.sku,
        quantity: li.quantity,
        unitPrice: {
          amount: Math.round(parseFloat(li.price) * 100),
          currency: raw.currency,
        },
        subtotal: {
          amount: Math.round(parseFloat(li.total) * 100),
          currency: raw.currency,
        },
        attributes: {},
      })),
    };
  } catch {
    return null;
  }
}

/** Transition a pending Woo order to "processing" after payment succeeds. */
export async function markOrderProcessing(
  orderId: string,
  intentId?: string,
): Promise<void> {
  const order = await getWooOrder(orderId);
  if (order?.status === "processing" || order?.status === "completed") {
    return;
  }

  await adminFetch({
    path: `/orders/${orderId}`,
    method: "PUT",
    body: {
      status: "processing",
      ...(intentId ? { transaction_id: intentId } : {}),
    },
    timeoutMs: 15_000,
  });
}

/** Transition a Woo order to "refunded" after a charge.refunded event. */
export async function markOrderRefunded(orderId: string): Promise<void> {
  const order = await getWooOrder(orderId);
  if (order?.status === "refunded") {
    return;
  }

  await adminFetch({
    path: `/orders/${orderId}`,
    method: "PUT",
    body: { status: "refunded" },
    timeoutMs: 15_000,
  });
}
