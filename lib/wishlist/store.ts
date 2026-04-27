"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProductSummary } from "@/lib/woo/types";
import { wishlistItemFromProductSummary, type WishlistItem } from "./types";

interface WishlistStoreState {
  items: WishlistItem[];
  hydrated: boolean;
  add: (product: ProductSummary) => void;
  remove: (productId: string) => void;
  toggle: (product: ProductSummary) => boolean;
  has: (productId: string) => boolean;
  replaceAll: (items: WishlistItem[]) => void;
  mergeRemote: (items: WishlistItem[]) => void;
  clear: () => void;
  setHydrated: (hydrated: boolean) => void;
}

const STORE_NAME = "r1p-wishlist";
const STORE_VERSION = 1;

function uniqueItems(items: WishlistItem[]): WishlistItem[] {
  const byId = new Map<string, WishlistItem>();
  for (const item of items) {
    const existing = byId.get(item.productId);
    if (!existing || item.addedAt < existing.addedAt) {
      byId.set(item.productId, item);
    }
  }
  return [...byId.values()].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export const useWishlistStore = create<WishlistStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      add: (product) =>
        set((state) => {
          if (state.items.some((item) => item.productId === product.id)) return state;
          return { items: uniqueItems([wishlistItemFromProductSummary(product), ...state.items]) };
        }),

      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),

      toggle: (product) => {
        const exists = get().items.some((item) => item.productId === product.id);
        if (exists) {
          get().remove(product.id);
          return false;
        }
        get().add(product);
        return true;
      },

      has: (productId) => get().items.some((item) => item.productId === productId),

      replaceAll: (items) => set({ items: uniqueItems(items) }),

      mergeRemote: (items) => set((state) => ({ items: uniqueItems([...state.items, ...items]) })),

      clear: () => set({ items: [] }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: STORE_NAME,
      version: STORE_VERSION,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export const selectWishlistItems = (state: WishlistStoreState) => state.items;
export const selectWishlistCount = (state: WishlistStoreState) => state.items.length;
export const selectWishlistHydrated = (state: WishlistStoreState) => state.hydrated;
