/**
 * Mappers: transform raw WooCommerce API responses into domain types.
 *
 * All ingress from Woo MUST pass through this layer. If a component imports
 * anything from `@woocommerce/*` or uses a raw Woo shape, that's a bug — fix
 * the mapper and expose the normalized type.
 *
 * Phase 0: file exists with a single utility (`toMinorUnits`). Concrete
 * mappers (`mapProduct`, `mapCart`, etc.) arrive in Phase 1.
 */

/**
 * Convert a Woo-formatted price string (which may be minor units already,
 * e.g. "4200" for $42.00 when currency_minor_unit=2) into a number of minor
 * units. Defensive — handles decimals, whitespace, empty strings.
 */
export function toMinorUnits(input: string | number | undefined | null): number {
  if (input === undefined || input === null || input === "") return 0;
  const n = typeof input === "number" ? input : Number(String(input).trim());
  if (!Number.isFinite(n)) return 0;
  // Store API returns prices in minor units as strings when `currency_minor_unit`
  // is honored. Older endpoints return decimal dollars. Phase 1 will branch on
  // the currency context carried in the response.
  return Math.round(n);
}
