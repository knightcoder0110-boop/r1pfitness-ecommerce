import "server-only";

import { adminFetch } from "@/lib/woo/client";

/**
 * Single-package shipment record.
 *
 * Sourced from the WooCommerce Shipment Tracking plugin's per-order
 * meta key `_wc_shipment_tracking_items`. We only surface the most
 * recent (by `dateShipped`) item — multi-package orders are out of
 * scope for v1; downstream consumers that need every parcel can
 * reach for `parseTrackingFromMetaData()` and read the full array.
 */
export interface Shipment {
  trackingNumber: string;
  /** Carrier slug as stored by Woo (e.g. `"usps"`, `"ups"`). */
  carrier: string;
  /** Display name (e.g. `"USPS"`). Falls back to `carrier` upper-cased. */
  carrierName: string;
  /**
   * Absolute URL the customer can use to follow the parcel. We prefer
   * the operator-supplied `custom_tracking_link` when present; otherwise
   * we synthesise one from a known-carrier template; otherwise empty.
   */
  trackingUrl: string;
  /** ISO-8601 date string. */
  shippedAt: string;
}

/** Shape of an entry in `_wc_shipment_tracking_items`. */
interface RawTrackingItem {
  tracking_provider?: string;
  custom_tracking_provider?: string;
  custom_tracking_link?: string;
  tracking_number?: string;
  date_shipped?: string | number;
  tracking_provider_name?: string;
}

/** Shape of an entry in `meta_data` on the Woo REST API order payload. */
export interface WooMetaEntry {
  key: string;
  // Plugins serialise differently; we accept anything.
  value: unknown;
}

/**
 * Build a public tracking URL for known carriers.
 *
 * Returns an empty string when we don't have a template and the
 * operator didn't supply a custom link. Callers can decide to fall
 * back to a generic carrier search page or omit the link entirely.
 */
export function buildCarrierTrackingUrl(
  carrier: string,
  trackingNumber: string,
  customLink?: string,
): string {
  if (customLink && /^https?:\/\//i.test(customLink)) {
    return customLink;
  }
  if (!trackingNumber) return "";

  const num = encodeURIComponent(trackingNumber);
  switch (carrier.toLowerCase()) {
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${num}`;
    case "ups":
      return `https://www.ups.com/track?tracknum=${num}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?tracknumbers=${num}`;
    case "dhl":
    case "dhl-express":
      return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
    default:
      return "";
  }
}

/**
 * Coerce `_wc_shipment_tracking_items`'s `value` into an array of
 * tracking items. The plugin stores it as a JSON-encoded array on
 * the meta row; some Woo deployments expose it pre-parsed (the REST
 * API does this for us most of the time), others as a raw string.
 */
function coerceTrackingArray(value: unknown): RawTrackingItem[] {
  if (Array.isArray(value)) return value as RawTrackingItem[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as RawTrackingItem[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toIsoShippedAt(raw: RawTrackingItem["date_shipped"]): string {
  if (!raw) return new Date().toISOString();
  // Woo stores either a unix timestamp (number/string) or ISO string.
  if (typeof raw === "number") {
    return new Date(raw * 1000).toISOString();
  }
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && /^\d+$/.test(String(raw))) {
    return new Date(asNumber * 1000).toISOString();
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Parse a Woo order's `meta_data` array and return the most recent
 * shipment, or `null` if none.
 *
 * Tolerant of:
 *  - missing meta entirely (`null`/`undefined`)
 *  - the meta value being a JSON string (legacy plugin behaviour)
 *  - per-item missing fields (carrier-only entries with no number, etc.)
 */
export function parseTrackingFromMetaData(
  meta: WooMetaEntry[] | null | undefined,
): Shipment | null {
  if (!meta || !Array.isArray(meta)) return null;

  const entry = meta.find((m) => m.key === "_wc_shipment_tracking_items");
  if (!entry) return null;

  const items = coerceTrackingArray(entry.value);
  if (items.length === 0) return null;

  // Pick the latest by date_shipped.
  const sorted = [...items].sort((a, b) => {
    const aDate = new Date(toIsoShippedAt(a.date_shipped)).getTime();
    const bDate = new Date(toIsoShippedAt(b.date_shipped)).getTime();
    return bDate - aDate;
  });

  for (const item of sorted) {
    const number = (item.tracking_number ?? "").trim();
    if (!number) continue;

    const carrier =
      (item.tracking_provider ?? "").trim() ||
      (item.custom_tracking_provider ?? "").trim() ||
      "other";

    const carrierName =
      (item.tracking_provider_name ?? "").trim() ||
      (item.custom_tracking_provider ?? "").trim() ||
      carrier.toUpperCase();

    return {
      trackingNumber: number,
      carrier: carrier.toLowerCase(),
      carrierName,
      trackingUrl: buildCarrierTrackingUrl(carrier, number, item.custom_tracking_link),
      shippedAt: toIsoShippedAt(item.date_shipped),
    };
  }

  return null;
}

/**
 * Fetch the raw Woo order and return its most recent shipment.
 *
 * Network failures resolve to `null` — caller decides whether to
 * surface a "tracking unavailable" UI or retry. Never throws.
 */
export async function getShipmentFromWooOrder(orderId: string): Promise<Shipment | null> {
  try {
    const raw = await adminFetch<{ meta_data?: WooMetaEntry[] }>({
      path: `/orders/${orderId}`,
      next: { revalidate: 30 },
    });
    return parseTrackingFromMetaData(raw.meta_data);
  } catch {
    return null;
  }
}
