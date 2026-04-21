"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { trackAddToCart } from "@/lib/analytics";
import type { Product, ProductVariation } from "@/lib/woo/types";

interface StickyAddToCartProps {
  /** The ref whose intersection we watch — point this at the real Add button. */
  watchRef: React.RefObject<HTMLElement | null>;
  product: Product;
  matchingVariation: ProductVariation | undefined;
  selectionLabel: string; // e.g. "M · Black"
  disabled: boolean;
  label: string; // mirrors the main button label
}

/**
 * Full-width sticky bar that slides up from the bottom whenever the primary
 * Add-to-Cart button scrolls out of the viewport.
 *
 * Works on both mobile (always visible at bottom) and desktop (same bar).
 * Uses IntersectionObserver so there's no scroll listener overhead.
 */
export function StickyAddToCart({
  watchRef,
  product,
  matchingVariation,
  selectionLabel,
  disabled,
  label,
}: StickyAddToCartProps) {
  const [visible, setVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);

  // Watch the real Add button — show this bar only when it's off-screen.
  useEffect(() => {
    const el = watchRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry!.isIntersecting),
      { threshold: 0, rootMargin: "0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchRef]);

  function handleAdd() {
    if (disabled || isPending) return;
    setIsPending(true);
    void addItem({
      product,
      ...(matchingVariation ? { variation: matchingVariation } : {}),
      quantity: 1,
    }).finally(() => setIsPending(false));
    openCart();
    showToast(`${product.name} added to your cart 🤙`, "success");
    trackAddToCart({
      productId: product.id,
      variationId: matchingVariation?.id,
      name: product.name,
      price: matchingVariation?.price ?? product.price,
      quantity: 1,
    });
  }

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (matchingVariation?.price ?? product.price).currency,
  }).format((matchingVariation?.price ?? product.price).amount / 100);

  return (
    <div
      role="complementary"
      aria-label="Quick add to cart"
      className={cn(
        // Base: fixed, full-width, bottom, above cart drawer z-index
        "fixed bottom-0 inset-x-0 z-[35]",
        "border-t border-border bg-bg/95 backdrop-blur-md",
        "px-4 py-3 flex items-center gap-3",
        // Slide transition
        "translate-y-full transition-transform duration-300 ease-out",
        visible && "translate-y-0",
      )}
    >
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text truncate leading-tight">
          {product.name}
        </p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-display text-sm tracking-wider text-gold">{price}</span>
          {selectionLabel && (
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted truncate">
              {selectionLabel}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <Button
        size="sm"
        disabled={disabled || isPending}
        onClick={handleAdd}
        className="shrink-0 min-w-[120px]"
      >
        {isPending ? "Adding…" : label}
      </Button>
    </div>
  );
}
