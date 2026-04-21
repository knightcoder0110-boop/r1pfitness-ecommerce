/**
 * GTM / GA4 analytics adapter.
 *
 * Pushes every typed AnalyticsEvent to window.dataLayer using GA4 ecommerce
 * schema (the standard GTM → GA4 format).
 *
 * Usage (called once at app boot from app/providers.tsx):
 *   initGtmAdapter();
 *
 * Requires NEXT_PUBLIC_GTM_ID env var. No-ops silently when unset — safe in
 * development without GTM configured.
 */
import { registerAnalyticsAdapter } from "./track";
import type { AnalyticsEvent } from "./events";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function gtmAdapter(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];

  switch (event.name) {
    case "page_view":
      window.dataLayer.push({
        event: "page_view",
        page_path: event.payload.path,
        page_title: event.payload.title,
      });
      break;

    case "view_item":
      window.dataLayer.push({
        event: "view_item",
        ecommerce: {
          currency: event.payload.item.currency,
          value: event.payload.item.priceCents / 100,
          items: [
            {
              item_id: event.payload.item.id,
              item_name: event.payload.item.name,
              price: event.payload.item.priceCents / 100,
              quantity: event.payload.item.quantity ?? 1,
              ...(event.payload.item.category
                ? { item_category: event.payload.item.category }
                : {}),
              ...(event.payload.item.variantId
                ? { item_variant: event.payload.item.variantId }
                : {}),
            },
          ],
        },
      });
      break;

    case "view_item_list":
      window.dataLayer.push({
        event: "view_item_list",
        ecommerce: {
          item_list_name: event.payload.list,
          items: event.payload.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.priceCents / 100,
            currency: item.currency,
            quantity: item.quantity ?? 1,
          })),
        },
      });
      break;

    case "add_to_cart":
      window.dataLayer.push({
        event: "add_to_cart",
        ecommerce: {
          currency: event.payload.item.currency,
          value: event.payload.cartValueCents / 100,
          items: [
            {
              item_id: event.payload.item.id,
              item_name: event.payload.item.name,
              price: event.payload.item.priceCents / 100,
              quantity: event.payload.item.quantity ?? 1,
              ...(event.payload.item.variantId
                ? { item_variant: event.payload.item.variantId }
                : {}),
              ...(event.payload.item.category
                ? { item_category: event.payload.item.category }
                : {}),
            },
          ],
        },
      });
      break;

    case "remove_from_cart":
      window.dataLayer.push({
        event: "remove_from_cart",
        ecommerce: {
          currency: event.payload.item.currency,
          value: event.payload.cartValueCents / 100,
          items: [
            {
              item_id: event.payload.item.id,
              item_name: event.payload.item.name,
              price: event.payload.item.priceCents / 100,
              quantity: event.payload.item.quantity ?? 1,
            },
          ],
        },
      });
      break;

    case "begin_checkout":
      window.dataLayer.push({
        event: "begin_checkout",
        ecommerce: {
          value: event.payload.valueCents / 100,
          items: event.payload.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.priceCents / 100,
            currency: item.currency,
            quantity: item.quantity ?? 1,
          })),
        },
      });
      break;

    case "purchase":
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: event.payload.orderId,
          value: event.payload.valueCents / 100,
          ...(event.payload.coupon ? { coupon: event.payload.coupon } : {}),
          items: event.payload.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.priceCents / 100,
            currency: item.currency,
            quantity: item.quantity ?? 1,
          })),
        },
      });
      break;

    case "newsletter_signup":
      window.dataLayer.push({
        event: "newsletter_signup",
        source: event.payload.source,
      });
      break;

    case "drop_unlock_attempt":
      window.dataLayer.push({
        event: "drop_unlock_attempt",
        campaign: event.payload.campaign,
        success: event.payload.success,
      });
      break;

    default:
      // Exhaustive — catches any future event names as a passthrough.
      window.dataLayer.push({ event: (event as AnalyticsEvent).name });
  }
}

/** Module-level flag — prevents double-registration on React re-renders. */
let initialized = false;

/**
 * Call once at app boot (see app/providers.tsx).
 * No-ops when NEXT_PUBLIC_GTM_ID is not set.
 */
export function initGtmAdapter(): void {
  if (initialized) return;
  // Guard: skip in non-browser or when GTM ID is not configured.
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_GTM_ID) return;
  initialized = true;
  registerAnalyticsAdapter(gtmAdapter);
}
