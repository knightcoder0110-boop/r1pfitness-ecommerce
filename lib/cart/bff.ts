/**
 * Client-side wrappers around the /api/cart/* BFF routes.
 *
 * These are plain async functions — no React, no Zustand. They can be called
 * from hooks or event handlers. All functions return null on network/parse
 * failure so callers can gracefully degrade (optimistic UI already applied).
 *
 * The BFF returns the standard `{ ok, data } | { ok: false, error }` envelope
 * from `lib/api/handler.ts`, where `data` is our normalized `Cart` type.
 *
 * Security: all payloads are validated again by Zod inside the BFF routes, so
 * the client never needs to trust its own sanitisation.
 */

import type { Cart } from "@/lib/woo/types";

export type CartApiResult =
  | { ok: true; data: Cart }
  | { ok: false; error: { code: string; message: string } };

type VariationEntry = { attribute: string; value: string };

async function apiPost(path: string, body: unknown): Promise<CartApiResult | null> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as CartApiResult;
  } catch {
    return null;
  }
}

/** Fetch the current server-side cart. Returns null on network failure. */
export async function bffGetCart(): Promise<CartApiResult | null> {
  try {
    const res = await fetch("/api/cart", { cache: "no-store" });
    return (await res.json()) as CartApiResult;
  } catch {
    return null;
  }
}

/**
 * Add an item to the server cart.
 * On success the response contains the full updated Cart (with WC item keys).
 */
export async function bffAddItem(params: {
  productId: number;
  quantity: number;
  variation?: VariationEntry[];
}): Promise<CartApiResult | null> {
  return apiPost("/api/cart/add", params);
}

/** Update quantity of an existing server cart item by its WC key. */
export async function bffUpdateItem(params: {
  key: string;
  quantity: number;
}): Promise<CartApiResult | null> {
  return apiPost("/api/cart/update", params);
}

/** Remove an item from the server cart by its WC key. */
export async function bffRemoveItem(params: {
  key: string;
}): Promise<CartApiResult | null> {
  return apiPost("/api/cart/remove", params);
}

/** Remove every item from the server cart. */
export async function bffClearCart(): Promise<CartApiResult | null> {
  return apiPost("/api/cart/clear", {});
}

/** Apply a coupon code to the server cart. */
export async function bffApplyCoupon(code: string): Promise<CartApiResult | null> {
  return apiPost("/api/cart/coupon", { code, action: "apply" });
}

/** Remove a coupon from the server cart. */
export async function bffRemoveCoupon(code: string): Promise<CartApiResult | null> {
  return apiPost("/api/cart/coupon", { code, action: "remove" });
}
