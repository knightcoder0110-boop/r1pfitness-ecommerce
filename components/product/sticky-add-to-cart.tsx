"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { trackAddToCart } from "@/lib/analytics";
import { selectWishlistHydrated, useWishlistStore } from "@/lib/wishlist/store";
import type { Product, ProductSummary, ProductVariation } from "@/lib/woo/types";

interface StickyAddToCartProps {
  /** The ref whose intersection we watch — point this at the real Add button. */
  watchRef: React.RefObject<HTMLElement | null>;
  product: Product;
  matchingVariation: ProductVariation | undefined;
  selectionLabel: string; // e.g. "M · Black"
  disabled: boolean;
  label: string; // mirrors the main button label
}

function toSummary(p: Product): ProductSummary {
  const colors = p.attributes.find((a) => /color/i.test(a.name))?.options ?? [];
  const sizes = p.attributes.find((a) => /size/i.test(a.name))?.options ?? [];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    ...(p.compareAtPrice ? { compareAtPrice: p.compareAtPrice } : {}),
    ...(p.images[0] ? { image: p.images[0] } : {}),
    stockStatus: p.stockStatus,
    isLimited: Boolean(p.meta.isLimited),
    ...(colors.length ? { colorOptions: colors } : {}),
    ...(sizes.length ? { sizeOptions: sizes } : {}),
  };
}

/**
 * Full-width sticky bar that slides up from the bottom whenever the primary
 * Add-to-Cart button scrolls out of the viewport.
 *
 * Contains: product name + price, wishlist toggle, and Add to Cart button.
 * Uses IntersectionObserver — no scroll listener overhead.
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

  // Wishlist
  const hydrated = useWishlistStore(selectWishlistHydrated);
  const wished = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWished = hydrated && wished;

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

  function handleWishlist() {
    const summary = toSummary(product);
    const added = toggleWishlist(summary);
    showToast(
      added ? `${product.name} saved to your wishlist` : `${product.name} removed from wishlist`,
      added ? "success" : "error",
    );
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
        "fixed bottom-0 inset-x-0 z-35",
        "border-t border-border bg-bg/95 backdrop-blur-md",
        "px-4 py-3 flex items-center gap-2 sm:gap-3",
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

      {/* Wishlist toggle */}
      <button
        type="button"
        onClick={handleWishlist}
        aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        aria-pressed={isWished}
        className={cn(
          "shrink-0 size-10 flex items-center justify-center rounded-sm border",
          "transition-[transform,color,border-color,background-color] duration-200 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-bg focus-visible:ring-offset-1",
          "active:translate-y-px",
          isWished
            ? "border-gold/50 bg-gold/10 text-gold"
            : "border-border text-muted hover:border-gold/40 hover:text-gold hover:bg-gold/8",
        )}
      >
        <Heart aria-hidden className={cn("size-4", isWished && "fill-current")} />
      </button>

      {/* ATC */}
      <Button
        size="sm"
        disabled={disabled || isPending}
        onClick={handleAdd}
        className="shrink-0 min-w-27.5 sm:min-w-32.5"
      >
        {isPending ? "Adding…" : label}
      </Button>
    </div>
  );
}
