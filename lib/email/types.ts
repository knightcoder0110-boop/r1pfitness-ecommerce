import "server-only";

import type { Order, Money } from "@/lib/woo/types";

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * Minimal customer identity attached to every event. `email` is the
 * canonical key the email provider uses to merge profiles.
 */
export interface EmailProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * Source of consent when subscribing a profile to a marketing list.
 * Klaviyo (and CASL/CAN-SPAM compliance) require us to record this.
 */
export type ConsentSource =
  | "newsletter_form"
  | "checkout_optin"
  | "footer_form"
  | "back_in_stock"
  | "manual";

// ---------------------------------------------------------------------------
// Order lifecycle event union
// ---------------------------------------------------------------------------

/** Payment method kind, normalised across providers. */
export type PaymentMethodKind =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "link"
  | "paypal"
  | "other";

/** Item shape used by every order-related event. */
export interface EventOrderItem {
  productId: string;
  variantId?: string;
  sku: string | null;
  name: string;
  quantity: number;
  /** Major-unit unit price (e.g. 49.99). */
  unitPrice: number;
  /** quantity × unitPrice, rounded to 2 dp. */
  rowTotal: number;
  productUrl?: string;
  imageUrl?: string;
  categories?: string[];
}

export interface PlacedOrderPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  items: EventOrderItem[];
  /** Major units. */
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  discountCode?: string;
  paymentMethod: PaymentMethodKind;
  orderUrl: string;
  siteUrl: string;
  /**
   * Stable key used by the provider to dedupe retries. Defaults to
   * `order-${orderId}` when not provided. Override only when a single
   * order legitimately fires the metric more than once (e.g. partial
   * refunds use a different unique_id derived from the refund id).
   */
  uniqueId?: string;
}

export interface ShippedOrderPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  carrierName: string;
  shippedAt: string;
  estimatedDelivery?: string;
  items: EventOrderItem[];
  uniqueId?: string;
}

export interface RefundedOrderPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  /** Major units. */
  refundAmount: number;
  currency: string;
  isPartial: boolean;
  reason?: string;
  uniqueId?: string;
}

export interface CancelledOrderPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  reason: "customer_request" | "auto_timeout" | "stock_unavailable" | "fraud_review" | "other";
  items: EventOrderItem[];
  uniqueId?: string;
}

export interface PaymentFailedPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  failureCode: string;
  failureMessage: string;
  retryUrl: string;
  items: EventOrderItem[];
  uniqueId?: string;
}

export interface StartedCheckoutPayload {
  profile: EmailProfile;
  checkoutId: string;
  items: EventOrderItem[];
  itemCount: number;
  /** Major units. */
  subtotal: number;
  total: number;
  currency: string;
  checkoutUrl: string;
  uniqueId?: string;
}

export interface NewsletterPayload {
  profile: EmailProfile;
  source: ConsentSource;
}

/**
 * Discriminated union of every customer-lifecycle event the BFF emits.
 * Provider implementations pattern-match on `type` to translate into
 * provider-specific shapes (Klaviyo "metrics", future "topics", etc.).
 */
export type OrderLifecycleEvent =
  | { type: "order.placed"; payload: PlacedOrderPayload }
  | { type: "order.shipped"; payload: ShippedOrderPayload }
  | { type: "order.delivered"; payload: ShippedOrderPayload }
  | { type: "order.cancelled"; payload: CancelledOrderPayload }
  | { type: "order.refunded"; payload: RefundedOrderPayload }
  | { type: "checkout.started"; payload: StartedCheckoutPayload }
  | { type: "payment.failed"; payload: PaymentFailedPayload }
  | { type: "newsletter.subscribed"; payload: NewsletterPayload };

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface EmitResult {
  ok: boolean;
  /** Provider-side identifier for the dispatched event (when available). */
  providerEventId?: string;
  /** Human-readable reason on failure; never contains PII. */
  error?: string;
}

export interface SubscribeResult {
  ok: boolean;
  error?: string;
}

export interface EmailProvider {
  readonly name: "klaviyo" | "stub";

  /**
   * Dispatch a lifecycle event. Implementations must be idempotent on
   * `event.payload.uniqueId` (or the type-specific default) so webhook
   * retries do not produce duplicate emails.
   */
  emit(event: OrderLifecycleEvent): Promise<EmitResult>;

  /**
   * Subscribe a profile to a marketing list with a recorded consent
   * source. Transactional emails do NOT require this; they go to any
   * profile that exists, regardless of subscription state.
   */
  subscribeToList(
    listId: string,
    profile: EmailProfile,
    source: ConsentSource,
  ): Promise<SubscribeResult>;
}

// ---------------------------------------------------------------------------
// Helpers used by builders
// ---------------------------------------------------------------------------

export const moneyToMajor = (m: Money): number =>
  Number((m.amount / 100).toFixed(2));

export type WooOrder = Order;
