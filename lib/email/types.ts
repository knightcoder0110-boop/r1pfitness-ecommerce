/**
 * Shared types for email event payloads consumed by the email provider (Klaviyo).
 * All money values are in major units (e.g. 49.99 USD, not 4999 cents).
 */

export interface EmailProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface EventOrderItem {
  productId: string;
  variantId?: string | number | null;
  sku: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  rowTotal: number;
  imageUrl?: string;
}

export type PaymentMethodKind =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "cash_app"
  | "link"
  | "affirm"
  | "afterpay_clearpay"
  | "klarna"
  | "us_bank_account"
  | string;

export interface PlacedOrderPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  items: EventOrderItem[];
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
  uniqueId: string;
}

export interface RefundedOrderPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  refundAmount: number;
  currency: string;
  isPartial: boolean;
  reason?: string;
  uniqueId: string;
}

export interface CancelledOrderPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  reason: "customer_request" | "payment_failed" | "fraud" | "inventory" | "other";
  items: EventOrderItem[];
  uniqueId: string;
}

export interface PaymentFailedPayload {
  profile: EmailProfile;
  orderId: string;
  orderNumber: string;
  failureCode: string;
  failureMessage: string;
  retryUrl: string;
  items: EventOrderItem[];
  uniqueId: string;
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
  uniqueId: string;
}
