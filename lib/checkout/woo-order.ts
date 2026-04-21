import "server-only";

import { adminFetch } from "@/lib/woo/client";
import type { Order } from "@/lib/woo/types";
import type { CheckoutRequest } from "./types";

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
  billing: Record<string, string>;
  shipping: Record<string, string>;
  line_items: WooLineItem[];
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
 * The order stores all line items from the local cart at the current unit
 * price. Stripe handles payment — once `payment_intent.succeeded` fires, the
 * webhook (app/api/webhooks/stripe/route.ts) transitions the order to
 * "processing".
 *
 * Returns the created order's numeric ID (as a string) and the total.
 */
export async function createWooOrder(
  req: CheckoutRequest,
): Promise<{ orderId: string; currency: string }> {
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

  const payload: CreateOrderPayload = {
    status: "pending",
    currency,
    set_paid: false,
    billing: toWooBilling(req.email, req.billing),
    shipping: toWooShipping(shipping),
    line_items: lineItems,
    ...(req.coupons?.length
      ? { coupon_lines: req.coupons.map((code) => ({ code })) }
      : {}),
    meta_data: [{ key: "_checkout_source", value: "r1p-storefront" }],
  };

  const raw = await adminFetch<RawWooOrder>({
    path: "/orders",
    method: "POST",
    body: payload,
  });

  return { orderId: String(raw.id), currency };
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
export async function markOrderProcessing(orderId: string): Promise<void> {
  await adminFetch({
    path: `/orders/${orderId}`,
    method: "PUT",
    body: { status: "processing" },
  });
}
