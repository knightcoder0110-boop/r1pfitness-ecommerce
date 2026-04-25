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
import { useToastStore } from "@/lib/toast";
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
  const { patchWooKey, setCoupon, forceSync, insertItem } = useCartStore(
    useShallow((s) => ({
      patchWooKey: s.patchWooKey,
      setCoupon: s.setCoupon,
      forceSync: s.forceSync,
      insertItem: s.insertItem,
    })),
  );
  const showToast = useToastStore((s) => s.show);

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
     *
     * On success: force-syncs local state from the server response so local
     * and WC never drift.
     * On failure: rolls back the optimistic change and shows a toast.
     */
    setQuantity: async (key: string, quantity: number) => {
      // Read CURRENT state — don't rely on stale hook snapshot.
      const items = useCartStore.getState().items;
      const item = items.find((i) => i.key === key);
      if (!item) return;

      // Optimistic update first.
      localActions.setQuantity(key, quantity);

      const serverKey = item.wooKey ?? item.key;

      if (quantity === 0) {
        const result = await bffRemoveItem({ key: serverKey });
        if (result?.ok) {
          forceSync(result.data);
          return;
        }
        // CART_ITEM_NOT_FOUND — the item is already gone on WC's side
        // (stale wooKey from a rotated cart-token, or already-removed item).
        // Treat as success: keep the local removal, sync from a fresh GET.
        if (result && !result.ok && result.error?.code === "CART_ITEM_NOT_FOUND") {
          const fresh = await bffGetCart();
          if (fresh?.ok) forceSync(fresh.data);
          return;
        }
        // Genuine failure — roll back: restore item at its previous quantity.
        insertItem(item);
        localActions.setQuantity(key, item.quantity);
        showToast("Couldn't remove item — please try again", "error");
      } else {
        const result = await bffUpdateItem({ key: serverKey, quantity });
        if (result?.ok) {
          forceSync(result.data);
          return;
        }
        if (result && !result.ok && result.error?.code === "CART_ITEM_NOT_FOUND") {
          // Item disappeared server-side. Resync from server, keep local change.
          const fresh = await bffGetCart();
          if (fresh?.ok) forceSync(fresh.data);
          return;
        }
        // Roll back to previous quantity.
        localActions.setQuantity(key, item.quantity);
        showToast("Couldn't update quantity — please try again", "error");
      }
    },

    /**
     * Remove an item. Optimistic-first, then syncs to server.
     *
     * On success: force-syncs local state from the server response so the
     * item is definitively gone and won't reappear on the next page refresh.
     * On CART_ITEM_NOT_FOUND: the item is already gone server-side (stale
     * wooKey from a rotated cart-token). Keep the local removal and pull a
     * fresh server cart so the two stay in sync.
     * On other failures: roll back the optimistic remove and toast.
     */
    removeItem: async (key: string) => {
      const items = useCartStore.getState().items;
      const item = items.find((i) => i.key === key);
      if (!item) return;

      // Optimistic remove first.
      localActions.removeItem(key);

      const serverKey = item.wooKey ?? item.key;
      const result = await bffRemoveItem({ key: serverKey });

      if (result?.ok) {
        forceSync(result.data);
        return;
      }

      // Stale wooKey — the item is already absent on WC's side. Treat as
      // success and pull a fresh cart to make absolutely sure local matches
      // the server. This is the common case after a cart-token rotation
      // (e.g. when a fresh tab is opened and our token cookie expired).
      if (result && !result.ok && result.error?.code === "CART_ITEM_NOT_FOUND") {
        const fresh = await bffGetCart();
        if (fresh?.ok) forceSync(fresh.data);
        return;
      }

      // Genuine failure (network, 5xx, validation) — roll back the optimistic
      // remove so the item stays visible and the user can retry.
      insertItem(item);
      showToast("Couldn't remove item — please try again", "error");
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
