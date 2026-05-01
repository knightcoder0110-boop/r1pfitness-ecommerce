import "server-only";

import type { Order, CartLineItem } from "@/lib/woo/types";
import type {
  EventOrderItem,
  PaymentMethodKind,
  PlacedOrderPayload,
  RefundedOrderPayload,
  CancelledOrderPayload,
  EmailProfile,
} from "./types";

/**
 * Pure builders that translate Woo domain objects into the typed
 * lifecycle event payloads the email provider consumes. No I/O.
 *
 * Money: all event payloads expose major-unit numbers (e.g. 49.99) so
 * provider templates can render them without doing arithmetic. Source
 * data stays in minor units (cents) until this layer.
 */

export interface BuildPlacedOrderInput {
  order: Order;
  /** Override profile if Stripe metadata or Woo billing email diverge. */
  profile?: Partial<EmailProfile>;
  /** Detected from Stripe; unknown defaults to "card". */
  paymentMethod?: PaymentMethodKind;
  /** Coupon code that was applied (if any). */
  discountCode?: string;
  /** Site URL for absolute links. */
  siteUrl: string;
  /** Customer-facing order URL (typically `/account/orders/${orderId}`). */
  orderUrl: string;
}

export function buildPlacedOrderEvent(
  input: BuildPlacedOrderInput,
): PlacedOrderPayload {
  const { order } = input;
  const profile = mergeProfile(order, input.profile);

  const items = order.items.map(toEventItem);
  const subtotal = toMajor(order.subtotal.amount);
  const shipping = toMajor(order.shippingTotal.amount);
  const tax = toMajor(order.taxTotal.amount);
  const discount = toMajor(order.discountTotal.amount);
  const total = toMajor(order.total.amount);

  return {
    profile,
    orderId: order.id,
    orderNumber: order.number,
    items,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    currency: order.currency,
    discountCode: input.discountCode,
    paymentMethod: input.paymentMethod ?? "card",
    orderUrl: input.orderUrl,
    siteUrl: input.siteUrl,
    uniqueId: `order-${order.id}`,
  };
}

export interface BuildRefundedOrderInput {
  order: Order;
  /** Major-unit refund amount. */
  refundAmount: number;
  /** Stripe charge id; used as part of unique_id so partial refunds dedupe correctly. */
  refundKey: string;
  reason?: string;
  profile?: Partial<EmailProfile>;
}

export function buildRefundedOrderEvent(
  input: BuildRefundedOrderInput,
): RefundedOrderPayload {
  const { order } = input;
  const isPartial = input.refundAmount + 0.005 < toMajor(order.total.amount);
  return {
    profile: mergeProfile(order, input.profile),
    orderId: order.id,
    orderNumber: order.number,
    refundAmount: round2(input.refundAmount),
    currency: order.currency,
    isPartial,
    reason: input.reason,
    uniqueId: `refund-${input.refundKey}`,
  };
}

export interface BuildCancelledOrderInput {
  order: Order;
  reason: CancelledOrderPayload["reason"];
  profile?: Partial<EmailProfile>;
}

export function buildCancelledOrderEvent(
  input: BuildCancelledOrderInput,
): CancelledOrderPayload {
  const { order } = input;
  return {
    profile: mergeProfile(order, input.profile),
    orderId: order.id,
    orderNumber: order.number,
    reason: input.reason,
    items: order.items.map(toEventItem),
    uniqueId: `cancel-${order.id}`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeProfile(order: Order, override?: Partial<EmailProfile>): EmailProfile {
  const email = override?.email ?? order.billing.email;
  if (!email) {
    throw new Error(`buildEvent: cannot resolve customer email for order ${order.id}`);
  }
  return {
    email,
    firstName: override?.firstName ?? (order.billing.firstName || undefined),
    lastName: override?.lastName ?? (order.billing.lastName || undefined),
    phone: override?.phone ?? (order.billing.phone || undefined),
  };
}

function toEventItem(li: CartLineItem): EventOrderItem {
  const unit = toMajor(li.unitPrice.amount);
  return {
    productId: li.productId,
    variantId: li.variationId,
    sku: li.sku || null,
    name: li.name,
    quantity: li.quantity,
    unitPrice: unit,
    rowTotal: round2(unit * li.quantity),
    imageUrl: li.image?.url,
  };
}

const toMajor = (cents: number): number => round2(cents / 100);
const round2 = (n: number): number => Math.round(n * 100) / 100;
