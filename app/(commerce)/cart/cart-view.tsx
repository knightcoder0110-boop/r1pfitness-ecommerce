"use client";

import Link from "next/link";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import {
  useCartItemCount,
  useCartItems,
  useCartSubtotal,
  useHasHydrated,
} from "@/lib/cart";
import { ROUTES } from "@/lib/constants";

/**
 * Client view for `/cart`. Split out so the page shell can stay server-side
 * and own metadata.
 *
 * We gate rendering on hydration so the SSR HTML never shows a stale empty-cart
 * state that then flickers to populated after localStorage rehydrates.
 */
export function CartView() {
  const hydrated = useHasHydrated();
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const count = useCartItemCount();

  if (!hydrated) {
    return (
      <div className="grid gap-4">
        <div className="h-24 animate-pulse bg-text/5" />
        <div className="h-24 animate-pulse bg-text/5" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="font-display text-3xl tracking-wider text-text/70">
          Your cart is empty
        </p>
        <p className="max-w-md font-serif italic text-text/60">
          Nothing claimed yet. Head to the shop and see what&apos;s left of the drop.
        </p>
        <Link href={ROUTES.shop}>
          <Button size="lg">Browse Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <section aria-label="Cart items">
        <ul className="divide-y divide-text/10">
          {items.map((item) => (
            <li key={item.key}>
              <CartLineItem item={item} />
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="Order summary" className="h-fit border border-text/10 p-6">
        <h2 className="font-display text-xl tracking-wider text-text">Summary</h2>
        <dl className="mt-6 space-y-3 font-mono text-xs uppercase tracking-[0.2em]">
          <div className="flex justify-between">
            <dt className="text-text/60">Items</dt>
            <dd className="text-text tabular-nums">{count}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text/60">Subtotal</dt>
            <dd>
              <Price price={subtotal} size="md" />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text/60">Shipping</dt>
            <dd className="text-text/50">Calculated at checkout</dd>
          </div>
        </dl>

        <div className="mt-6">
          <Link href={ROUTES.checkout} className="block">
            <Button full size="lg">
              Checkout
            </Button>
          </Link>
        </div>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text/40">
          Taxes calculated at checkout · Secure payment
        </p>
      </aside>
    </div>
  );
}
