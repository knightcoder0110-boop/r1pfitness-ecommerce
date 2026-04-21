"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLineItem, Product, ProductVariation } from "@/lib/woo/types";
import {
  EMPTY_CART,
  addItem as addItemReducer,
  clearCart as clearCartReducer,
  computeTotals,
  removeItem as removeItemReducer,
  setQuantity as setQuantityReducer,
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
          const next = addItemReducer({ items: s.items, currency: s.currency }, params);
          return { items: next.items, currency: next.currency, isOpen: true };
        }),

      setQuantity: (key, quantity) =>
        set((s) => setQuantityReducer({ items: s.items, currency: s.currency }, key, quantity)),

      removeItem: (key) =>
        set((s) => removeItemReducer({ items: s.items, currency: s.currency }, key)),

      clear: () => set((s) => clearCartReducer({ items: s.items, currency: s.currency })),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: STORE_NAME,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Only persist data — never the drawer open/close flag.
      partialize: (s) => ({ items: s.items, currency: s.currency }),
    },
  ),
);

/* ── Selectors ───────────────────────────────────────────────────
 * Prefer selectors over reading the whole store to minimise re-renders.
 */

export const selectItems = (s: CartStoreState): CartLineItem[] => s.items;
export const selectIsOpen = (s: CartStoreState): boolean => s.isOpen;
export const selectItemCount = (s: CartStoreState): number =>
  computeTotals({ items: s.items, currency: s.currency }).itemCount;
export const selectSubtotal = (s: CartStoreState) =>
  computeTotals({ items: s.items, currency: s.currency }).subtotal;
