/**
 * Shipping constants — single source of truth.
 *
 * Amounts live in cents (Money minor units) to match cart subtotal
 * arithmetic and avoid floating-point drift. UI strings are derived
 * from helpers below, never hard-coded, so a future change here
 * propagates everywhere — UI, cart, checkout, server-side pricing.
 */

/** Order subtotal at or above which standard shipping is free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000; // $150.00

/** Flat-rate standard shipping charged when subtotal < free threshold. */
export const FLAT_SHIPPING_RATE_CENTS = 1000; // $10.00

/** Currency code used for shipping money objects. */
export const SHIPPING_CURRENCY = "USD" as const;

/** Display label for the standard shipping method (used in Woo + UI). */
export const STANDARD_SHIPPING_METHOD_TITLE = "Standard Shipping";

/** Internal Woo `method_id` for the shipping line on order creation. */
export const STANDARD_SHIPPING_METHOD_ID = "flat_rate";

export const FREE_SHIPPING_THRESHOLD_MONEY = {
  amount: FREE_SHIPPING_THRESHOLD_CENTS,
  currency: SHIPPING_CURRENCY,
} as const;

export const FLAT_SHIPPING_RATE_MONEY = {
  amount: FLAT_SHIPPING_RATE_CENTS,
  currency: SHIPPING_CURRENCY,
} as const;

/**
 * Calculate the shipping cost in cents for a given cart subtotal in cents.
 * Free at or above the threshold; flat rate otherwise.
 */
export function calculateShippingCents(subtotalCents: number): number {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return FLAT_SHIPPING_RATE_CENTS;
}

/** "$150" — used in marketing copy. */
export function freeShippingThresholdLabel(): string {
  return `$${(FREE_SHIPPING_THRESHOLD_CENTS / 100).toFixed(0)}`;
}

/** "$10" — used in policy / cart copy. */
export function flatShippingRateLabel(): string {
  return `$${(FLAT_SHIPPING_RATE_CENTS / 100).toFixed(0)}`;
}

/** "FREE SHIPPING ON ORDERS OVER $150" — used in announcement bar. */
export function freeShippingAnnouncement(): string {
  return `FREE SHIPPING ON ORDERS OVER ${freeShippingThresholdLabel()}`;
}

/** "Free shipping $150+" — used in trust strip / badges. */
export function freeShippingBadgeLabel(): string {
  return `Free shipping ${freeShippingThresholdLabel()}+`;
}

/**
 * Cutoff hour (local time) for "ships today" calculations. Orders placed
 * before this clock time on a business day ship that day; orders after
 * roll to the next business day.
 */
export const SAME_DAY_CUTOFF_HOUR = 14; // 2:00 PM HST

/**
 * Standard handling + transit window in business days, inclusive of
 * the dispatch day. Used by ShippingEstimate to render arrival ranges.
 */
export const STANDARD_TRANSIT_DAYS_MIN = 3;
export const STANDARD_TRANSIT_DAYS_MAX = 5;
