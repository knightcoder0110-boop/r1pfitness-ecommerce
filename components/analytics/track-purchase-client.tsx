"use client";

import { useEffect, useRef } from "react";
import type { Order } from "@/lib/woo/types";
import { trackPurchase } from "@/lib/analytics";

interface TrackPurchaseClientProps {
  order: Pick<Order, "id" | "number" | "total" | "items">;
}

/**
 * Fires the `purchase` analytics event exactly once on mount.
 *
 * Mounted from the order confirmation page (server component) with the Woo
 * order data. Uses sessionStorage to dedupe in case the user reloads or
 * back-navigates to the confirmation URL.
 */
export function TrackPurchaseClient({ order }: TrackPurchaseClientProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Per-tab dedupe: same order should not double-fire on reload.
    const dedupeKey = `r1p:purchase-tracked:${order.id}`;
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem(dedupeKey)) {
        return;
      }
      sessionStorage.setItem(dedupeKey, "1");
    } catch {
      // sessionStorage can throw in private mode \u2014 fail open.
    }

    trackPurchase({
      orderId: order.number || order.id,
      valueCents: order.total.amount,
      items: order.items.map((li) => ({
        productId: li.productId,
        name: li.name,
        price: li.unitPrice,
        quantity: li.quantity,
        ...(li.variationId ? { variationId: li.variationId } : {}),
      })),
    });
  }, [order]);

  return null;
}
