import "server-only";

import type { PaymentProvider, PaymentProviderName } from "./types";
import { stripeProvider } from "./providers/stripe";

/**
 * Public surface of the payments layer.
 *
 * Callers should depend on the `PaymentProvider` interface and the
 * other types re-exported below. Stripe-specific imports never leak
 * past this module.
 */
let providerOverride: PaymentProvider | null = null;

export function getPaymentProvider(
  name: PaymentProviderName = "stripe",
): PaymentProvider {
  if (providerOverride) return providerOverride;
  switch (name) {
    case "stripe":
      return stripeProvider;
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown payment provider: ${exhaustive as string}`);
    }
  }
}

/** Test-only override for the active provider. */
export function __setPaymentProviderForTesting(p: PaymentProvider | null): void {
  providerOverride = p;
}

// Re-exports for downstream convenience.
export type {
  ChargeRefundedEvent,
  CreateIntentInput,
  CreateIntentResult,
  IntentStatus,
  PaymentCanceledEvent,
  PaymentFailedEvent,
  PaymentMethodKind,
  PaymentProvider,
  PaymentProviderName,
  PaymentSucceededEvent,
  ProviderEvent,
  RetrievedIntent,
} from "./types";

export {
  WebhookConfigError,
  WebhookSignatureError,
} from "./types";

export {
  getOrCreate as getOrCreateCachedIntent,
  isValidIdempotencyKey,
} from "./intent-cache";
