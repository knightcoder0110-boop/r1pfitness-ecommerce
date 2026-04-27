"use client";

import { useEffect } from "react";
import { useCartActions } from "@/lib/cart";
import { bffClearCart } from "@/lib/cart/bff";

interface CheckoutSuccessSyncProps {
  orderId: string;
}

export function CheckoutSuccessSync({ orderId }: CheckoutSuccessSyncProps) {
  const { clear } = useCartActions();

  useEffect(() => {
    clear();

    const dedupeKey = `r1p:checkout-server-cart-clearing:${orderId}`;
    if (sessionStorage.getItem(dedupeKey)) return;

    sessionStorage.setItem(dedupeKey, "pending");
    void bffClearCart().then((result) => {
      if (result?.ok) {
        sessionStorage.setItem(dedupeKey, "done");
        return;
      }

      sessionStorage.removeItem(dedupeKey);
    });
  }, [clear, orderId]);

  return null;
}