/**
 * Shipping constants — single source of truth.
 *
 * Threshold lives in cents (Money minor units) to match cart subtotal
 * arithmetic and avoid floating-point drift. UI strings are derived,
 * never hard-coded, so a future change here propagates everywhere.
 */

export const FREE_SHIPPING_THRESHOLD_CENTS = 10000; // $100.00

export const FREE_SHIPPING_THRESHOLD_MONEY = {
  amount: FREE_SHIPPING_THRESHOLD_CENTS,
  currency: "USD",
} as const;

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
