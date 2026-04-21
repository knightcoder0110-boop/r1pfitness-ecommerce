/**
 * Typed analytics events.
 *
 * Every tracked event has a name and a payload shape. Call `track(name, payload)`
 * from anywhere — the adapter fans out to GA4, Klaviyo, etc.
 *
 * Phase 0: type definitions only. The dispatcher lands in Phase 7 (Marketing).
 */

export interface ItemPayload {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  quantity?: number;
  variantId?: string;
  category?: string;
}

export type AnalyticsEvent =
  | { name: "page_view"; payload: { path: string; title?: string } }
  | { name: "view_item"; payload: { item: ItemPayload } }
  | { name: "view_item_list"; payload: { list: string; items: ItemPayload[] } }
  | { name: "add_to_cart"; payload: { item: ItemPayload; cartValueCents: number } }
  | { name: "remove_from_cart"; payload: { item: ItemPayload; cartValueCents: number } }
  | { name: "begin_checkout"; payload: { items: ItemPayload[]; valueCents: number } }
  | {
      name: "purchase";
      payload: { orderId: string; items: ItemPayload[]; valueCents: number; coupon?: string };
    }
  | { name: "newsletter_signup"; payload: { source: string } }
  | { name: "drop_unlock_attempt"; payload: { campaign: string; success: boolean } };

export type AnalyticsEventName = AnalyticsEvent["name"];
