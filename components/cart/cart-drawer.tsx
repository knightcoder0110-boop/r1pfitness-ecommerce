"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { CartLineItem } from "./cart-line-item";
import { CouponForm } from "./coupon-form";
import {
  useCartActions,
  useCartCoupon,
  useCartIsOpen,
  useCartItemCount,
  useCartItems,
  useCartSubtotal,
} from "@/lib/cart";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils";

/**
 * Slide-in cart drawer. Rendered once in the root layout so every route has
 * access via the store — no prop drilling, no providers.
 *
 * Dismiss surface:
 *  - Escape key
 *  - Click the backdrop (outside the panel)
 *  - Close button (X) in the header
 *  - Body scroll is locked while open, restored on close.
 */
export function CartDrawer() {
  const isOpen = useCartIsOpen();
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const itemCount = useCartItemCount();
  const coupon = useCartCoupon();
  const { close } = useCartActions();

  // Escape to close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Body-scroll lock.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cart"
      aria-hidden={!isOpen}
      className="fixed inset-0 z-[60] pointer-events-none"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close cart"
        onClick={close}
        tabIndex={isOpen ? 0 : -1}
        className={cn(
          "absolute inset-0 bg-bg/70 backdrop-blur-sm transition-opacity duration-[var(--dur-slow)] ease-out",
          isOpen ? "pointer-events-auto opacity-100" : "opacity-0",
        )}
      />

      {/* Panel — full-width on mobile, 28rem (--size-drawer) on ≥sm */}
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-full flex-col bg-bg border-l border-border shadow-overlay",
          "sm:max-w-[var(--size-drawer)]",
          "transition-transform duration-[var(--dur-slow)] ease-out",
          isOpen ? "pointer-events-auto translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl tracking-wider text-text">
            Cart
            {itemCount > 0 ? (
              <span className="ml-2 font-mono text-xs text-muted">({itemCount})</span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="p-1 text-muted transition-colors hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="font-display text-2xl tracking-wider text-muted">
                Your cart is empty
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">
                Start browsing the drop
              </p>
              <Link href={ROUTES.shop} onClick={close}>
                <Button variant="secondary" className="mt-2">
                  Browse Shop
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.key}>
                  <CartLineItem item={item} compact />
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <footer className="border-t border-border px-5 py-5 space-y-4">
            {/* Coupon input / applied coupon */}
            <CouponForm />

            {/* Subtotal row */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
                Subtotal
              </span>
              <Price price={subtotal} size="md" />
            </div>

            {/* Discount row — only visible when a coupon is applied */}
            {coupon && (
              <div className="flex items-center justify-between -mt-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  Discount
                </span>
                <span className="font-mono text-xs text-green-500">
                  −{formatMoney(coupon.discount)}
                </span>
              </div>
            )}

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
              Shipping &amp; taxes calculated at checkout
            </p>
            <Link href={ROUTES.cart} onClick={close} className="block">
              <Button full size="lg">
                View Cart
              </Button>
            </Link>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
