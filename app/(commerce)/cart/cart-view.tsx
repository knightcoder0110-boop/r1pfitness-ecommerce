"use client";

import Link from "next/link";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCartItemCount,
  useCartItems,
  useCartSubtotal,
  useHasHydrated,
} from "@/lib/cart";
import { ROUTES } from "@/lib/constants";

/**
 * Client view for `/cart`. Split from the server page so `<CartPage />` can
 * own metadata. Gated on hydration to avoid empty-cart SSR flicker.
 *
 * Layout:
 *  - Mobile: items stack above a full-width summary card.
 *  - >=lg: two-column grid; summary is sticky.
 */
export function CartView() {
  const hydrated = useHasHydrated();
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const count = useCartItemCount();

  if (!hydrated) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="font-display text-2xl sm:text-3xl tracking-wider text-muted">
          Your cart is empty
        </p>
        <p className="max-w-md font-serif italic text-muted">
          Nothing claimed yet. Head to the shop and see what&apos;s left of the drop.
        </p>
        <Link href={ROUTES.shop}>
          <Button size="lg">Browse Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <section aria-label="Cart items" className="min-w-0">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.key}>
              <CartLineItem item={item} />
            </li>
          ))}
        </ul>
      </section>

      <aside
        aria-label="Order summary"
        className="h-fit border border-border p-5 sm:p-6 lg:sticky lg:top-[calc(var(--size-header)+1.5rem)]"
      >
        <h2 className="font-display text-xl tracking-wider text-text">Summary</h2>
        <dl className="mt-6 space-y-3 font-mono text-xs uppercase tracking-[0.2em]">
          <div className="flex justify-between">
            <dt className="text-muted">Items</dt>
            <dd className="text-text tabular-nums">{count}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>
              <Price price={subtotal} size="md" />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd className="text-muted">Calculated at checkout</dd>
          </div>
        </dl>

        <Link href={ROUTES.checkout} className="mt-6 block">
          <Button full size="lg">
            Checkout
          </Button>
        </Link>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
          Taxes calculated at checkout &middot; Secure payment
        </p>
      </aside>
    </div>
  );
}
