"use client";

import { useCartCoupon, useCartItems, useCartSubtotal } from "@/lib/cart";
import { OrderSummary } from "./order-summary";

/**
 * CheckoutSidebar — live order summary for the checkout page right rail.
 *
 * Client component: reads Zustand cart store.
 * Rendered only on >=lg breakpoint (hidden below that via the page layout).
 */
export function CheckoutSidebar() {
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const coupon = useCartCoupon();

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <OrderSummary items={items} subtotal={subtotal} coupon={coupon} />

      {/* Trust signals */}
      <div className="border border-border p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          Why R1P?
        </p>
        <ul className="mt-4 space-y-3">
          {[
            "Limited drops — every piece is numbered",
            "Heavyweight 400gsm fabric",
            "Printed & shipped from Waipahu, HI",
            "30-day fit guarantee",
          ].map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className="mt-px font-mono text-xs text-accent" aria-hidden>
                /
              </span>
              <span className="font-sans text-sm text-muted">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-border p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          Questions?
        </p>
        <p className="mt-2 font-sans text-sm text-muted">
          DM us on{" "}
          <a
            href="https://instagram.com/r1pfitness"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text underline underline-offset-2 hover:no-underline"
          >
            @r1pfitness
          </a>{" "}
          — we reply same day.
        </p>
      </div>
    </div>
  );
}
