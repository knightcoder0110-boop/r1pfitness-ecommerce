"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  selectIsOpen,
  selectItemCount,
  selectItems,
  selectSubtotal,
  useCartStore,
  type CartStoreState,
} from "./store";

/**
 * Ergonomic hook surface over the Zustand store.
 *
 * Each hook subscribes to the smallest slice of state it needs. Hooks that
 * return objects (e.g. subtotal, actions) use `useShallow` so a new-identity
 * object doesn't trigger a rerender when the field values are unchanged —
 * critical for `computeTotals` which always returns a fresh object.
 *
 * SSR-safe: on the server these return the persist-store defaults, avoiding
 * hydration mismatches for localStorage-backed data.
 */

export const useCartItems = () => useCartStore(useShallow(selectItems));
export const useCartItemCount = () => useCartStore(selectItemCount);
export const useCartSubtotal = () => useCartStore(useShallow(selectSubtotal));
export const useCartIsOpen = () => useCartStore(selectIsOpen);

/** Bound action creators. Stable identity — safe for deps arrays. */
export function useCartActions() {
  return useCartStore(
    useShallow((s) => ({
      addItem: s.addItem,
      setQuantity: s.setQuantity,
      removeItem: s.removeItem,
      clear: s.clear,
      open: s.open,
      close: s.close,
      toggle: s.toggle,
    })),
  );
}

/**
 * Read a flag that is only reliable after hydration. Use this to gate the
 * cart badge count so the first SSR render shows nothing instead of 0
 * flickering to the real value on hydration.
 */
export function useHasHydrated(): boolean {
  const subscribe = useCallback(
    (cb: () => void) => useCartStore.persist.onFinishHydration(cb),
    [],
  );
  const getSnapshot = useCallback(() => useCartStore.persist.hasHydrated(), []);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export type { CartStoreState };
