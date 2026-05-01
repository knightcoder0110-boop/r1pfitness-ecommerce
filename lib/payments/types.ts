import "server-only";

/**
 * Provider-neutral payment types.
 *
 * The BFF (`/api/checkout`) and the webhook route should depend ONLY on
 * the types defined here. Stripe-specific shapes never leak past the
 * `lib/payments/providers/stripe/*` boundary.
 *
 * Money is always carried in MINOR units (cents). Conversion to major
 * units happens at the rendering edge (e.g. event payload builders).
 */

// ---------------------------------------------------------------------------
// Payment method kinds
// ---------------------------------------------------------------------------

/**
 * Normalised payment method identifier. We keep this provider-neutral
 * so Klaviyo template logic, analytics events, and admin UIs all
 * receive the same vocabulary regardless of which PSP processed the
 * charge.
 */
export type PaymentMethodKind =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "link"
  | "paypal"
  // Phase D
  | "klarna"
  | "afterpay"
  | "affirm"
  // Catch-all for kinds we don't classify yet (e.g. SEPA, Bancontact).
  | "other";

// ---------------------------------------------------------------------------
// createIntent
// ---------------------------------------------------------------------------

export interface CreateIntentInput {
  /** Total in minor units (cents). Server-authoritative. */
  amount: number;
  /** ISO 4217 lowercase (e.g. "usd"). */
  currency: string;
  /** Woo order id this intent is for. Stored on the intent as metadata. */
  orderId: string;
  /** Customer email — kept for risk scoring + later receipt fallback. */
  email?: string;
  /**
   * UUID v4 from the client. When provided, the provider sends it as
   * its idempotency key so duplicate creates collapse to one intent.
   * Optional for backwards-compatibility with stale clients; the
   * route layer's in-memory cache (lib/payments/intent-cache.ts) is
   * the primary defence.
   */
  idempotencyKey?: string;
  /** Freeform metadata persisted on the intent. */
  metadata?: Record<string, string>;
}

export interface CreateIntentResult {
  /** Provider-side intent id (e.g. `pi_…` for Stripe). */
  providerIntentId: string;
  /**
   * Token the client uses to confirm the payment in the browser. For
   * Stripe this is the PaymentIntent's `client_secret`.
   */
  confirmationToken: string;
  amount: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// retrieveIntent
// ---------------------------------------------------------------------------

export type IntentStatus =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "canceled";

export interface RetrievedIntent {
  providerIntentId: string;
  status: IntentStatus;
  amount: number;
  currency: string;
  /** May be undefined until the customer has chosen a method. */
  paymentMethodKind?: PaymentMethodKind;
  /** Provider-hosted receipt URL, if any. */
  receiptUrl?: string;
  /** Order id derived from intent metadata, if set. */
  orderId?: string;
}

// ---------------------------------------------------------------------------
// Webhook events
// ---------------------------------------------------------------------------

/**
 * Provider-neutral webhook event. Concrete providers translate their
 * native event shapes into one of these variants. Returning `null`
 * from `parseWebhook` means "verified but uninteresting" — the route
 * should respond 200 without further processing so the provider does
 * not retry.
 */
export type ProviderEvent =
  | PaymentSucceededEvent
  | PaymentFailedEvent
  | PaymentCanceledEvent
  | ChargeRefundedEvent;

export interface PaymentSucceededEvent {
  type: "payment.succeeded";
  /** Provider-side intent id. */
  intentId: string;
  /** Woo order id from intent metadata. `null` when missing (legacy intents). */
  orderId: string | null;
  amount: number;
  currency: string;
  paymentMethodKind: PaymentMethodKind;
  /** Customer email captured on the intent (metadata or receipt_email). */
  customerEmail: string | null;
}

export interface PaymentFailedEvent {
  type: "payment.failed";
  intentId: string;
  orderId: string | null;
  /** Stripe-style failure code, normalised but not enumerated. */
  failureCode?: string;
  failureMessage?: string;
}

export interface PaymentCanceledEvent {
  type: "payment.canceled";
  intentId: string;
  orderId: string | null;
  /** Why the intent was cancelled (e.g. "abandoned", "requested_by_customer"). */
  cancellationReason?: string;
}

export interface ChargeRefundedEvent {
  type: "charge.refunded";
  /** Provider-side charge id (e.g. `ch_…`). Used as refund dedupe key. */
  chargeId: string;
  /** PaymentIntent id. */
  intentId: string;
  /** Woo order id from PI/charge metadata. */
  orderId: string | null;
  /** Total refunded so far in minor units. */
  amountRefunded: number;
  currency: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// PaymentProvider interface
// ---------------------------------------------------------------------------

export type PaymentProviderName = "stripe";

export interface PaymentProvider {
  readonly name: PaymentProviderName;

  /** Create a new intent for this checkout. */
  createIntent(input: CreateIntentInput): Promise<CreateIntentResult>;

  /** Look up an existing intent by id. */
  retrieveIntent(providerIntentId: string): Promise<RetrievedIntent>;

  /**
   * Verify and parse a webhook request.
   *
   * - Throws `WebhookSignatureError` when the signature is missing,
   *   malformed, or does not validate against the configured secret.
   * - Returns `null` for events we don't act on (so the route can
   *   respond 200 without dispatching further logic).
   * - Returns a `ProviderEvent` for events we do act on.
   */
  parseWebhook(
    rawBody: Buffer,
    signature: string | null,
  ): Promise<ProviderEvent | null>;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookSignatureError";
  }
}

export class WebhookConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookConfigError";
  }
}
