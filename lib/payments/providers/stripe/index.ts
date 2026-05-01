import "server-only";

import type { PaymentProvider } from "../../types";
import { createIntent, retrieveIntent } from "./intent";
import { parseWebhook } from "./webhook";

/**
 * Stripe implementation of the `PaymentProvider` interface.
 *
 * Each method delegates to a focused module so this file remains a
 * thin assembly point. Tests target the focused modules directly.
 */
export const stripeProvider: PaymentProvider = {
  name: "stripe",
  createIntent,
  retrieveIntent,
  parseWebhook,
};

export { getStripe } from "./client";
