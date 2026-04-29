import type { CartLineItem, Money, Product, ProductVariation } from "@/lib/woo/types";

/**
 * Pure cart state + reducers. No Zustand, no React, no browser APIs.
 *
 * This file exists so cart logic is:
 *  1. Trivially unit-testable (just call the functions).
 *  2. Reusable server-side (draft carts, receipts) without a React runtime.
 *  3. Independent of persistence — the store just wraps these reducers.
 *
 * Money arithmetic is in MINOR units (cents). Never use floats.
 */

export interface CartState {
  items: CartLineItem[];
  currency: string;
  /** Applied coupon + discount amount. null when no coupon is active. */
  coupon: { code: string; discount: Money; freeShipping: boolean } | null;
}

export const EMPTY_CART: CartState = { items: [], currency: "USD", coupon: null };

/** Stable key for an item — (productId, variationId?). Used for dedup. */
export function lineKey(productId: string, variationId?: string): string {
  return variationId ? `${productId}::${variationId}` : productId;
}

/** Build a `CartLineItem` from a product + optional variation + qty. */
export function buildLineItem(params: {
  product: Product;
  variation?: ProductVariation;
  quantity: number;
}): CartLineItem {
  const { product, variation, quantity } = params;
  const unitPrice = variation?.price ?? product.price;
  const image = variation?.image ?? product.images[0];
  const key = lineKey(product.id, variation?.id);

  return {
    key,
    productId: product.id,
    ...(variation ? { variationId: variation.id } : {}),
    name: product.name,
    sku: variation?.sku ?? product.id,
    quantity,
    unitPrice,
    subtotal: { amount: unitPrice.amount * quantity, currency: unitPrice.currency },
    ...(image ? { image } : {}),
    attributes: variation?.attributes ?? {},
  };
}

/** Replace an item's quantity, recomputing subtotal. Returns null if qty <= 0. */
function withQuantity(item: CartLineItem, quantity: number): CartLineItem | null {
  if (quantity <= 0) return null;
  return {
    ...item,
    quantity,
    subtotal: { amount: item.unitPrice.amount * quantity, currency: item.unitPrice.currency },
  };
}

/**
 * Add a product (optionally a specific variation) to the cart. If the same
 * line exists, quantity is incremented. Currency mismatches are rejected
 * (return state unchanged).
 */
export function addItem(
  state: CartState,
  params: { product: Product; variation?: ProductVariation; quantity?: number },
): CartState {
  const quantity = params.quantity ?? 1;
  if (quantity <= 0) return state;

  const incoming = buildLineItem({ ...params, quantity });

  // Enforce single-currency carts.
  if (state.items.length > 0 && state.currency !== incoming.unitPrice.currency) {
    return state;
  }

  const existingIdx = state.items.findIndex((i) => i.key === incoming.key);
  if (existingIdx === -1) {
    return {
      ...state,
      currency: incoming.unitPrice.currency,
      items: [...state.items, incoming],
    };
  }

  const existing = state.items[existingIdx];
  if (!existing) return state;
  const merged = withQuantity(existing, existing.quantity + quantity);
  if (!merged) return state;
  const next = state.items.slice();
  next[existingIdx] = merged;
  return { ...state, items: next };
}

/** Set an item's quantity. Removing if quantity <= 0. */
export function setQuantity(state: CartState, key: string, quantity: number): CartState {
  const idx = state.items.findIndex((i) => i.key === key);
  if (idx === -1) return state;
  const existing = state.items[idx];
  if (!existing) return state;

  const updated = withQuantity(existing, quantity);
  if (!updated) {
    return { ...state, items: state.items.filter((_, i) => i !== idx) };
  }
  const next = state.items.slice();
  next[idx] = updated;
  return { ...state, items: next };
}

/** Remove a single line by key. */
export function removeItem(state: CartState, key: string): CartState {
  const next = state.items.filter((i) => i.key !== key);
  if (next.length === state.items.length) return state;
  return { ...state, items: next };
}

/** Remove every item. Preserves currency so downstream code has a valid default. */
export function clearCart(state: CartState): CartState {
  if (state.items.length === 0) return state;
  return { ...state, items: [], coupon: null };
}

/** Set or clear the active coupon. */
export function setCoupon(
  state: CartState,
  coupon: CartState["coupon"],
): CartState {
  return { ...state, coupon };
}

export interface CartTotals {
  itemCount: number;
  subtotal: Money;
}

/** Compute totals. Pure — call on every render, it's cheap. */
export function computeTotals(state: CartState): CartTotals {
  let itemCount = 0;
  let amount = 0;
  for (const item of state.items) {
    itemCount += item.quantity;
    amount += item.subtotal.amount;
  }
  return {
    itemCount,
    subtotal: { amount, currency: state.currency },
  };
}
