import "server-only";

import { cookies } from "next/headers";
import { WooError } from "./errors";
import { adminFetch } from "./client";
import { mapCart, type RawStoreCart } from "./mappers";
import type { Cart } from "./types";

/**
 * WooCommerce Store API — cart operations.
 *
 * The Store API gives anonymous (guest) access to cart state via a
 * `Cart-Token` header. On the first request we send none; Woo responds with
 * a fresh `Cart-Token` header which we capture and store in an httpOnly,
 * SameSite=Lax, Secure cookie. On subsequent requests we replay it.
 *
 * Security notes:
 * - Cookie is httpOnly → JS can't read it (prevents exfiltration via XSS).
 * - SameSite=Lax → prevents cross-site POST from mutating the cart.
 * - Secure → cookie only sent over HTTPS in production.
 * - Path=/ with a short TTL (30 days) → session-scoped.
 * - The cookie ONLY holds the opaque Woo token; it's not a session.
 *
 * Nonces:
 * - Some Store API mutations require an X-WC-Store-API-Nonce for logged-in
 *   users. For guest carts (our flow) the nonce is not required. When we
 *   layer logged-in cart merging (Phase 8+), we'll fetch it from `/cart`
 *   and replay on mutations.
 */

const COOKIE_NAME = "r1p_cart_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_TIMEOUT_MS = 15_000;

interface CartFetchOptions {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
}

async function getStoredToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value;
}

async function persistToken(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

async function clearToken(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/**
 * Low-level Store API cart fetch with Cart-Token round-tripping.
 * Exported only for cart-adjacent modules (checkout). UI never calls this.
 */
async function cartFetch<T>(opts: CartFetchOptions): Promise<{ data: T; token: string }> {
  const base = (process.env.WOO_BASE_URL ?? "").replace(/\/$/, "");
  if (!base) {
    throw new WooError({
      code: "WOO_UNREACHABLE",
      message: "WOO_BASE_URL is not configured",
      status: 500,
    });
  }

  const url = `${base}/wp-json/wc/store/v1${opts.path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    let storedToken = await getStoredToken();

    if (!storedToken && opts.method === "POST") {
      const bootstrap = await fetch(`${base}/wp-json/wc/store/v1/cart`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      const bootstrapToken = bootstrap.headers.get("cart-token") ?? "";
      if (bootstrapToken) {
        storedToken = bootstrapToken;
        await persistToken(bootstrapToken);
      }
    }

    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(storedToken ? { "Cart-Token": storedToken } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      // Cart is per-session; never cache.
      cache: "no-store",
    });

    // Capture + persist token BEFORE checking status, so invalid-token
    // errors still refresh our cookie if Woo rotates.
    const returnedToken = res.headers.get("cart-token") ?? storedToken ?? "";
    if (returnedToken && returnedToken !== storedToken) {
      await persistToken(returnedToken);
    }

    if (!res.ok) {
      let details: unknown = undefined;
      try {
        details = await res.json();
      } catch {
        /* ignore */
      }
      const code = codeForCartStatus(res.status, details);
      // On invalid cart token, drop our cookie so next request starts fresh.
      if (code === "CART_INVALID_TOKEN") await clearToken();

      throw new WooError({
        code,
        message: extractMessage(details) ?? `Cart request failed: ${res.status}`,
        status: res.status,
        details,
      });
    }

    if (res.status === 204) {
      return { data: undefined as T, token: returnedToken };
    }
    const data = (await res.json()) as T;
    return { data, token: returnedToken };
  } catch (err) {
    if (err instanceof WooError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new WooError({
        code: "WOO_TIMEOUT",
        message: "Cart request timed out",
        status: 504,
        cause: err,
      });
    }
    throw new WooError({
      code: "WOO_UNREACHABLE",
      message: "Cart request failed before a response was received",
      status: 502,
      cause: err,
    });
  } finally {
    clearTimeout(timer);
  }
}

function codeForCartStatus(status: number, details: unknown) {
  // Woo emits `code: "woocommerce_rest_cart_invalid_token"` on bad tokens.
  const woocode = typeof details === "object" && details !== null && "code" in details
    ? String((details as { code?: unknown }).code ?? "")
    : "";
  if (woocode.includes("invalid_token")) return "CART_INVALID_TOKEN";
  if (woocode.includes("out_of_stock") || woocode.includes("not_purchasable")) return "OUT_OF_STOCK";
  if (woocode.includes("invalid_quantity")) return "INVALID_QUANTITY";
  if (status === 404) return "CART_ITEM_NOT_FOUND";
  if (status === 400) return "VALIDATION_FAILED";
  return "WOO_UNEXPECTED";
}

function extractMessage(details: unknown): string | undefined {
  if (typeof details === "object" && details !== null && "message" in details) {
    const msg = (details as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return undefined;
}

/** Variation attribute entry for add-to-cart. */
export interface AddItemAttribute {
  attribute: string; // e.g. "pa_size"
  value: string; // e.g. "M"
}

/* ──────────────────────────────────────────────────────────────────────────
 * Public cart operations. Every function returns a normalized domain Cart.
 * ────────────────────────────────────────────────────────────────────── */

export async function getCart(): Promise<Cart> {
  const { data, token } = await cartFetch<RawStoreCart>({ path: "/cart" });
  const cart = mapCart(data, token);
  return enrichFreeShipping(cart);
}

export async function addCartItem(input: {
  productId: string | number;
  quantity: number;
  variation?: AddItemAttribute[];
}): Promise<Cart> {
  const id = typeof input.productId === "string" ? Number.parseInt(input.productId, 10) : input.productId;
  if (!Number.isFinite(id) || id <= 0) {
    throw new WooError({
      code: "VALIDATION_FAILED",
      message: "Invalid productId",
      status: 400,
    });
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new WooError({
      code: "INVALID_QUANTITY",
      message: "Quantity must be a positive integer",
      status: 400,
    });
  }

  const { data, token } = await cartFetch<RawStoreCart>({
    path: "/cart/add-item",
    method: "POST",
    body: {
      id,
      quantity: Math.floor(input.quantity),
      ...(input.variation && input.variation.length > 0 ? { variation: input.variation } : {}),
    },
  });
  return mapCart(data, token);
}

export async function updateCartItem(input: {
  key: string;
  quantity: number;
}): Promise<Cart> {
  if (!input.key) {
    throw new WooError({ code: "VALIDATION_FAILED", message: "key is required", status: 400 });
  }
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    throw new WooError({
      code: "INVALID_QUANTITY",
      message: "Quantity must be a non-negative integer",
      status: 400,
    });
  }

  const { data, token } = await cartFetch<RawStoreCart>({
    path: "/cart/update-item",
    method: "POST",
    body: { key: input.key, quantity: Math.floor(input.quantity) },
  });
  return mapCart(data, token);
}

export async function removeCartItem(key: string): Promise<Cart> {
  if (!key) {
    throw new WooError({ code: "VALIDATION_FAILED", message: "key is required", status: 400 });
  }
  const { data, token } = await cartFetch<RawStoreCart>({
    path: "/cart/remove-item",
    method: "POST",
    body: { key },
  });
  return mapCart(data, token);
}

export async function clearCart(): Promise<Cart> {
  let cart = await getCart();

  while (cart.items.length > 0) {
    const item = cart.items[0]!;

    try {
      cart = await removeCartItem(item.wooKey ?? item.key);
    } catch (err) {
      if (!isIdempotentClearError(err)) throw err;
      cart = await getCart();
    }
  }

  return cart;
}

function isIdempotentClearError(err: unknown): boolean {
  return err instanceof WooError && (
    err.code === "CART_ITEM_NOT_FOUND" ||
    err.status === 404 ||
    err.status === 409
  );
}

export async function applyCoupon(code: string): Promise<Cart> {
  if (!code) {
    throw new WooError({ code: "VALIDATION_FAILED", message: "code is required", status: 400 });
  }
  const { data, token } = await cartFetch<RawStoreCart>({
    path: "/cart/apply-coupon",
    method: "POST",
    body: { code },
  });
  const cart = mapCart(data, token);
  return enrichFreeShipping(cart);
}

export async function removeCoupon(code: string): Promise<Cart> {
  if (!code) {
    throw new WooError({ code: "VALIDATION_FAILED", message: "code is required", status: 400 });
  }
  const { data, token } = await cartFetch<RawStoreCart>({
    path: "/cart/remove-coupon",
    method: "POST",
    body: { code },
  });
  return mapCart(data, token);
}

/** Test-only. Exposed for unit tests that stub `fetch`. */
export const __internal = { COOKIE_NAME, cartFetch };

/**
 * Enrich a mapped cart by resolving `free_shipping` from the WooCommerce REST
 * API for any applied coupons. Called after `mapCart` in `getCart` and
 * `applyCoupon` so the flag is always accurate.
 */
async function enrichFreeShipping(cart: Cart): Promise<Cart> {
  if (cart.coupons.length === 0) return cart;
  const codes = cart.coupons.map((c) => c.code);
  const freeShipSet = await resolveFreeShippingCodes(codes);
  if (freeShipSet.size === 0) return cart;
  return {
    ...cart,
    coupons: cart.coupons.map((c) => ({
      ...c,
      freeShipping: freeShipSet.has(c.code.toLowerCase()),
    })),
  };
}

/**
 * Returns the set of coupon codes (lowercased) that have `free_shipping: true`
 * in WooCommerce. Internal helper used by `enrichFreeShipping` and
 * `hasFreeShippingCoupon`.
 */
async function resolveFreeShippingCodes(codes: string[]): Promise<Set<string>> {
  const results = await Promise.all(
    codes.map(async (code): Promise<string | null> => {
      try {
        const rows = await adminFetch<Array<{ free_shipping: boolean }>>({
          path: `/coupons?code=${encodeURIComponent(code)}`,
        });
        return Array.isArray(rows) && rows.some((c) => c.free_shipping === true)
          ? code.toLowerCase()
          : null;
      } catch {
        return null;
      }
    }),
  );
  return new Set(results.filter((r): r is string => r !== null));
}

/**
 * Returns true if any of the supplied coupon codes has `free_shipping: true`
 * in WooCommerce. Used by the checkout BFF to override flat-rate shipping
 * when a free-shipping coupon is applied to the cart.
 */
export async function hasFreeShippingCoupon(codes: string[]): Promise<boolean> {
  if (!codes.length) return false;
  const freeSet = await resolveFreeShippingCodes(codes);
  return freeSet.size > 0;
}
