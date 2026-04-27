import type { Money } from "@/lib/woo/types";
import type { ItemPayload } from "./events";
import { track } from "./track";

function toItemPayload(params: {
  productId: string;
  name: string;
  price: Money;
  quantity?: number;
  variationId?: string | undefined;
  category?: string | undefined;
}): ItemPayload {
  return {
    id: params.productId,
    name: params.name,
    priceCents: params.price.amount,
    currency: params.price.currency,
    quantity: params.quantity ?? 1,
    ...(params.variationId ? { variantId: params.variationId } : {}),
    ...(params.category ? { category: params.category } : {}),
  };
}

export function trackViewItem(params: {
  productId: string;
  name: string;
  price: Money;
  category?: string;
}): void {
  track({ name: "view_item", payload: { item: toItemPayload(params) } });
}

export function trackAddToCart(params: {
  productId: string;
  name: string;
  price: Money;
  quantity?: number;
  variationId?: string | undefined;
}): void {
  const item = toItemPayload(params);
  const quantity = params.quantity ?? 1;
  track({
    name: "add_to_cart",
    payload: { item, cartValueCents: params.price.amount * quantity },
  });
}

export function trackRemoveFromCart(params: {
  productId: string;
  name: string;
  price: Money;
  quantity?: number;
  variationId?: string | undefined;
}): void {
  const item = toItemPayload(params);
  track({
    name: "remove_from_cart",
    payload: { item, cartValueCents: params.price.amount * (params.quantity ?? 1) },
  });
}

export function trackBeginCheckout(params: {
  items: Array<{
    productId: string;
    name: string;
    price: Money;
    quantity?: number;
    variationId?: string | undefined;
    category?: string | undefined;
  }>;
}): void {
  const mapped = params.items.map((i) =>
    toItemPayload({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      variationId: i.variationId,
      category: i.category,
    }),
  );
  const valueCents = mapped.reduce((sum, item) => sum + item.priceCents * (item.quantity ?? 1), 0);
  track({ name: "begin_checkout", payload: { items: mapped, valueCents } });
}

export function trackPurchase(params: {
  orderId: string;
  valueCents: number;
  items: Array<{
    productId: string;
    name: string;
    price: Money;
    quantity?: number;
    variationId?: string | undefined;
    category?: string | undefined;
  }>;
  coupon?: string | undefined;
}): void {
  const mapped = params.items.map((i) =>
    toItemPayload({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      variationId: i.variationId,
      category: i.category,
    }),
  );
  track({
    name: "purchase",
    payload: {
      orderId: params.orderId,
      items: mapped,
      valueCents: params.valueCents,
      ...(params.coupon ? { coupon: params.coupon } : {}),
    },
  });
}
