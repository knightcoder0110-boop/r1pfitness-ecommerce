"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Cart, CartLineItem, Product, ProductVariation } from "@/lib/woo/types";
import {
  EMPTY_CART,
  addItem as addItemReducer,
  clearCart as clearCartReducer,
  computeTotals,
  removeItem as removeItemReducer,
  setQuantity as setQuantityReducer,
  setCoupon as setCouponReducer,
  type CartState,
} from "./reducer";

/**
 * Zustand store wrapping the pure reducer in `./reducer.ts`.
 *
 * Philosophy:
 *  - Store holds raw state only. Derived data (totals) is computed via selectors.
 *  - All mutations funnel through the reducer — this is the only place reducers
 *    meet React. Makes it trivial to swap to server-side cart later.
 *  - Drawer `isOpen` lives here so any page/button can open/close it.
 *  - LocalStorage persistence with version — schema migrations are easy.
 */
export interface CartStoreState extends CartState {
  isOpen: boolean;
  addItem: (params: { product: Product; variation?: ProductVariation; quantity?: number }) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  /**
   * Patch the WooCommerce cart key onto a locally-added item so subsequent
   * BFF update/remove calls can use the correct server-side key.
   */
  patchWooKey: (localKey: string, wooKey: string) => void;
  /**
   * Populate local cart from a server-side WC Cart response.
   * No-op when local cart already has items (local wins).
   */
  syncFromServer: (cart: Cart) => void;
  /**
   * Unconditionally replace local cart state with the given server cart.
   * Used after successful BFF mutations to converge local + server state.
   */
  forceSync: (cart: Cart) => void;
  /**
   * Insert a single line item back into the cart (used to roll back a
   * failed optimistic remove). If an item with the same key already exists
   * it is replaced.
   */
  insertItem: (item: CartLineItem) => void;
  /** Set or clear the applied coupon + discount. */
  setCoupon: (coupon: CartState["coupon"]) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const STORE_NAME = "r1p-cart";
const STORE_VERSION = 1;

export const useCartStore = create<CartStoreState>()(
  persist(
    (set) => ({
      ...EMPTY_CART,
      isOpen: false,

      addItem: (params) =>
        set((s) => {
          const next = addItemReducer({ items: s.items, currency: s.currency, coupon: s.coupon }, params);
          return { items: next.items, currency: next.currency, isOpen: true };
        }),

      setQuantity: (key, quantity) =>
        set((s) => setQuantityReducer({ items: s.items, currency: s.currency, coupon: s.coupon }, key, quantity)),

      removeItem: (key) =>
        set((s) => removeItemReducer({ items: s.items, currency: s.currency, coupon: s.coupon }, key)),

      clear: () => set((s) => clearCartReducer({ items: s.items, currency: s.currency, coupon: s.coupon })),

      patchWooKey: (localKey, wooKey) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.key === localKey ? { ...item, wooKey } : item,
          ),
        })),

      syncFromServer: (cart) =>
        set((s) => {
          // Local wins: if user already has items, don't clobber them.
          if (s.items.length > 0) return {};
          const coupon =
            cart.coupons.length > 0
              ? { code: cart.coupons[0]!.code, discount: cart.coupons[0]!.discount }
              : null;
          return { items: cart.items, currency: cart.currency, coupon };
        }),

      forceSync: (cart) =>
        set(() => {
          const coupon =
            cart.coupons.length > 0
              ? { code: cart.coupons[0]!.code, discount: cart.coupons[0]!.discount }
              : null;
          return { items: cart.items, currency: cart.currency, coupon };
        }),

      insertItem: (item) =>
        set((s) => {
          const idx = s.items.findIndex((i) => i.key === item.key);
          if (idx >= 0) {
            const next = [...s.items];
            next[idx] = item;
            return { items: next };
          }
          return { items: [...s.items, item] };
        }),

      setCoupon: (coupon) => set((s) => setCouponReducer({ items: s.items, currency: s.currency, coupon: s.coupon }, coupon)),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: STORE_NAME,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Only persist data — never the drawer open/close flag.
      partialize: (s) => ({ items: s.items, currency: s.currency, coupon: s.coupon }),
    },
  ),
);

/* ── Selectors ───────────────────────────────────────────────────
 * Prefer selectors over reading the whole store to minimise re-renders.
 */

export const selectItems = (s: CartStoreState): CartLineItem[] => s.items;
export const selectIsOpen = (s: CartStoreState): boolean => s.isOpen;
export const selectItemCount = (s: CartStoreState): number =>
  computeTotals({ items: s.items, currency: s.currency, coupon: s.coupon }).itemCount;
export const selectSubtotal = (s: CartStoreState) =>
  computeTotals({ items: s.items, currency: s.currency, coupon: s.coupon }).subtotal;
