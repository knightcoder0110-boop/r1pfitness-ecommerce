"use client";

/**
 * Cart BFF sync layer.
 *
 * CartSyncProvider
 *   Mount once in the root Providers tree. On first hydration, if the local
 *   Zustand cart is empty, it fetches GET /api/cart and reconciles so a
 *   returning visitor (or new tab) sees their server-side cart immediately.
 *
 * useServerCart
 *   Drop-in replacement for useCartActions() for components that perform
 *   mutations. Applies the local optimistic update first, then fires the BFF
 *   in the background. wooKey patching keeps the server-side key in sync so
 *   subsequent update/remove calls reach the correct WC item.
 *
 * Degradation: when WOO_BASE_URL is not configured the BFF returns
 * BACKEND_OFFLINE (503). All BFF calls return null or { ok: false } in that
 * case — the local cart continues to work normally (fixture mode).
 */

import { useEffect, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "./store";
import { useCartActions } from "./hooks";
import { lineKey } from "./reducer";
import {
  bffGetCart,
  bffAddItem,
  bffUpdateItem,
  bffRemoveItem,
  bffApplyCoupon,
  bffRemoveCoupon,
} from "./bff";
import type { Product, ProductVariation } from "@/lib/woo/types";

/**
 * Provider that reconciles the local cart with the server cart on mount.
 * Place this inside your root client Providers component.
 */
export function CartSyncProvider({ children }: { children: ReactNode }) {
  const syncFromServer = useCartStore((s) => s.syncFromServer);

  useEffect(() => {
    bffGetCart().then((result) => {
      if (result?.ok && result.data.items.length > 0) {
        syncFromServer(result.data);
      }
    });
  }, [syncFromServer]);

  return <>{children}</>;
}

/**
 * Augmented cart actions that fire BFF mutations in addition to local
 * optimistic updates. Use this hook in place of useCartActions() in any
 * component that adds, updates, removes, or coupons items.
 */
export function useServerCart() {
  const localActions = useCartActions();
  const { patchWooKey, setCoupon } = useCartStore(
    useShallow((s) => ({ patchWooKey: s.patchWooKey, setCoupon: s.setCoupon })),
  );

  return {
    // ── Passthrough actions (no BFF call needed) ──────────────────────
    clear: localActions.clear,
    open: localActions.open,
    close: localActions.close,
    toggle: localActions.toggle,

    // ── BFF-backed mutations ──────────────────────────────────────────

    /**
     * Add an item. Optimistically updates the local store, then syncs to the
     * server. On success, patches the WooCommerce item key onto the local
     * item so future update/remove calls use the correct server-side key.
     */
    addItem: async (params: {
      product: Product;
      variation?: ProductVariation;
      quantity?: number;
    }) => {
      localActions.addItem(params);

      const variation = params.variation
        ? Object.entries(params.variation.attributes).map(([attribute, value]) => ({
            attribute,
            value,
          }))
        : undefined;

      const result = await bffAddItem({
        productId: Number(params.product.id),
        quantity: params.quantity ?? 1,
        variation,
      });

      if (result?.ok) {
        // Find the WC item that matches the product we just added.
        const localKey = lineKey(params.product.id, params.variation?.id);
        const wooItem = result.data.items.find(
          (i) => i.productId === params.product.id,
        );
        if (wooItem) {
          patchWooKey(localKey, wooItem.key);
        }
      }
    },

    /**
     * Set quantity. Optimistic-first; fires BFF for update (n > 0) or remove
     * (n === 0). Uses the wooKey if available so the request reaches the right
     * WC cart item. Falls back to the local key (which IS the WC key for
     * server-reconciled items).
     */
    setQuantity: async (key: string, quantity: number) => {
      // Read CURRENT state — don't rely on stale hook snapshot.
      const items = useCartStore.getState().items;
      localActions.setQuantity(key, quantity);

      const item = items.find((i) => i.key === key);
      if (!item) return;
      const serverKey = item.wooKey ?? item.key;

      if (quantity === 0) {
        await bffRemoveItem({ key: serverKey });
      } else {
        await bffUpdateItem({ key: serverKey, quantity });
      }
    },

    /**
     * Remove an item. Optimistic-first, then syncs to server.
     */
    removeItem: async (key: string) => {
      const items = useCartStore.getState().items;
      localActions.removeItem(key);

      const item = items.find((i) => i.key === key);
      if (!item) return;
      const serverKey = item.wooKey ?? item.key;
      await bffRemoveItem({ key: serverKey });
    },

    /**
     * Apply a coupon code. Makes the BFF call, then persists the discount in
     * the local store so the drawer shows the savings immediately.
     * Returns the raw API result so callers can show success/error feedback.
     */
    applyCoupon: async (code: string) => {
      const result = await bffApplyCoupon(code);
      if (result?.ok) {
        const couponData = result.data.coupons.find(
          (c) => c.code.toLowerCase() === code.toLowerCase(),
        );
        if (couponData) {
          setCoupon({ code: couponData.code, discount: couponData.discount });
        }
      }
      return result;
    },

    /**
     * Remove an applied coupon. Clears the coupon from the local store on
     * success.
     */
    removeCoupon: async (code: string) => {
      const result = await bffRemoveCoupon(code);
      if (result?.ok) {
        setCoupon(null);
      }
      return result;
    },
  };
}
