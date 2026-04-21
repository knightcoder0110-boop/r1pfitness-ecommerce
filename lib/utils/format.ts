/**
 * Formatting helpers. Pure, side-effect-free functions.
 */

/**
 * Format a Money value as a locale-aware currency string.
 *   formatMoney({ amount: 4200, currency: "USD" }) => "$42.00"
 */
export function formatMoney(
  money: { amount: number; currency: string },
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
  }).format(money.amount / 100);
}

/**
 * Format a date string (ISO) in a user-friendly way.
 */
export function formatDate(
  input: string | Date,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
  locale: string = "en-US",
): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Build an absolute URL from a path using the configured site URL.
 */
export function absoluteUrl(path: string, siteUrl: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = siteUrl.replace(/\/$/, "");
  const slug = path.startsWith("/") ? path : `/${path}`;
  return `${base}${slug}`;
}
