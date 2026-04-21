"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { CartLineItem } from "./cart-line-item";
import {
  useCartActions,
  useCartIsOpen,
  useCartItemCount,
  useCartItems,
  useCartSubtotal,
} from "@/lib/cart";
import { ROUTES } from "@/lib/constants";

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
      className="fixed inset-0 z-50 pointer-events-none"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close cart"
        onClick={close}
        tabIndex={isOpen ? 0 : -1}
        className={`absolute inset-0 bg-bg/70 transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-bg border-l border-text/10 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "pointer-events-auto translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-text/10 px-5 py-4">
          <h2 className="font-display text-xl tracking-wider text-text">
            Cart
            {itemCount > 0 ? (
              <span className="ml-2 font-mono text-xs text-text/50">({itemCount})</span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="p-1 text-text/60 transition-colors hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="font-display text-2xl tracking-wider text-text/60">
                Your cart is empty
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-text/40">
                Start browsing the drop
              </p>
              <Link href={ROUTES.shop} onClick={close}>
                <Button variant="secondary" className="mt-2">
                  Browse Shop
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-text/10">
              {items.map((item) => (
                <li key={item.key}>
                  <CartLineItem item={item} compact />
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <footer className="border-t border-text/10 px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-text/60">
                Subtotal
              </span>
              <Price price={subtotal} size="md" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text/40">
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
