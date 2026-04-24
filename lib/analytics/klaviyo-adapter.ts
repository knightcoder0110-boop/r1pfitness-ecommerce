/**
 * Klaviyo browser analytics adapter.
 *
 * Translates typed AnalyticsEvents into Klaviyo _learnq push calls.
 * Covers the three ecommerce events Klaviyo uses for browse/purchase
 * abandonment automations:
 *   view_item      → "Viewed Product"
 *   add_to_cart    → "Added to Cart"
 *   begin_checkout → "Started Checkout"
 *
 * Usage (called once at app boot from app/providers.tsx):
 *   initKlaviyoAdapter();
 *
 * No-ops silently when the Klaviyo pixel hasn't loaded yet — the pixel
 * initialises `window._learnq` as an array so pushes are queued and
 * replayed once the script loads.
 */
import { registerAnalyticsAdapter } from "./track";
import type { AnalyticsEvent, ItemPayload } from "./events";

declare global {
  interface Window {
    // Klaviyo pixel queue — initialised by the klaviyo.js loader.
    _learnq: unknown[];
  }
}

/** Push one call to the Klaviyo pixel queue. */
function kpush(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window._learnq = window._learnq || [];
  window._learnq.push(args);
}

/** Map a typed ItemPayload to Klaviyo's line-item shape. */
function toKlaviyoItem(item: ItemPayload) {
  return {
    ProductID: item.id,
    ProductName: item.name,
    Quantity: item.quantity ?? 1,
    ItemPrice: item.priceCents / 100,
    RowTotal: (item.priceCents / 100) * (item.quantity ?? 1),
    ...(item.variantId ? { SKU: item.variantId } : {}),
    ...(item.category ? { ProductCategories: [item.category] } : {}),
  };
}

function klaviyoAdapter(event: AnalyticsEvent): void {
  switch (event.name) {
    case "view_item": {
      const { item } = event.payload;
      kpush("track", "Viewed Product", {
        ProductName: item.name,
        ProductID: item.id,
        Price: item.priceCents / 100,
        ...(item.variantId ? { SKU: item.variantId } : {}),
        ...(item.category ? { Categories: [item.category] } : {}),
      });
      break;
    }

    case "add_to_cart": {
      const { item } = event.payload;
      kpush("track", "Added to Cart", {
        $value: event.payload.cartValueCents / 100,
        AddedItemProductName: item.name,
        AddedItemProductID: item.id,
        AddedItemPrice: item.priceCents / 100,
        AddedItemQuantity: item.quantity ?? 1,
        ...(item.variantId ? { AddedItemSKU: item.variantId } : {}),
        ...(item.category ? { AddedItemCategories: [item.category] } : {}),
      });
      break;
    }

    case "begin_checkout": {
      kpush("track", "Started Checkout", {
        // $event_id deduplicates the event if the user navigates back/forward.
        $event_id: `checkout_${Date.now()}`,
        $value: event.payload.valueCents / 100,
        ItemCount: event.payload.items.reduce((s, i) => s + (i.quantity ?? 1), 0),
        Items: event.payload.items.map(toKlaviyoItem),
      });
      break;
    }

    // All other events (page_view, purchase, newsletter_signup, etc.) are
    // handled by the GTM adapter — no action needed here.
  }
}

export function initKlaviyoAdapter(): void {
  registerAnalyticsAdapter(klaviyoAdapter);
}
