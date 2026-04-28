"use client";

import { Heart } from "lucide-react";
import { selectWishlistHydrated, useWishlistStore } from "@/lib/wishlist/store";
import { useToastStore } from "@/lib/toast";
import { cn } from "@/lib/utils/cn";
import type { Product, ProductSummary } from "@/lib/woo/types";

export interface WishlistIconButtonProps {
  product: Product;
  /** Size — `md` matches a standard 44px tap target, `lg` matches lg buttons. */
  size?: "md" | "lg";
  className?: string;
}

function pickAttributeOptions(product: Product, matcher: RegExp): string[] {
  return product.attributes.find((a) => matcher.test(a.name))?.options ?? [];
}

function toSummary(product: Product): ProductSummary {
  const colors = pickAttributeOptions(product, /color/i);
  const sizes = pickAttributeOptions(product, /size/i);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    ...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {}),
    ...(product.images[0] ? { image: product.images[0] } : {}),
    ...(product.images[1] ? { hoverImage: product.images[1] } : {}),
    stockStatus: product.stockStatus,
    isLimited: Boolean(product.meta.isLimited),
    ...(colors.length ? { colorOptions: colors } : {}),
    ...(sizes.length ? { sizeOptions: sizes } : {}),
    ...(product.variations.length ? { variantCount: product.variations.length } : {}),
  };
}

/**
 * Square heart-only wishlist toggle for the PDP buy box.
 *
 * Designed to sit *beside* the Add-to-Cart button — same vertical rhythm,
 * same border treatment as the secondary button variant. The square shape
 * keeps the optical mass low so it never competes with the primary CTA.
 *
 *   ┌──────────────────────────────────┬──────┐
 *   │           Add to Cart            │  ♡   │  ← this component
 *   └──────────────────────────────────┴──────┘
 *
 * Visual states:
 *   • idle      → bone outline + subtle fill on hover
 *   • wished    → gold border + tinted fill + filled heart
 *   • SSR/empty → renders the idle state until store hydrates (prevents flash)
 */
export function WishlistIconButton({
  product,
  size = "lg",
  className,
}: WishlistIconButtonProps) {
  const hydrated = useWishlistStore(selectWishlistHydrated);
  const wished = useWishlistStore((s) => s.has(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const showToast = useToastStore((s) => s.show);
  const isWished = hydrated && wished;

  function handleClick() {
    const summary = toSummary(product);
    const added = toggle(summary);
    showToast(
      added
        ? `${summary.name} saved to your wishlist`
        : `${summary.name} removed from wishlist`,
      added ? "success" : "error",
    );
  }

  const sizeClass =
    size === "lg"
      ? "size-13 sm:size-14"
      : "size-11";

  const iconSize = size === "lg" ? "size-5" : "size-4";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isWished
          ? `Remove ${product.name} from wishlist`
          : `Save ${product.name} to wishlist`
      }
      aria-pressed={isWished}
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-sm border",
        "transition-[transform,color,border-color,background-color] duration-200",
        "focus-visible:ring-gold focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "active:translate-y-px cursor-pointer",
        sizeClass,
        isWished
          ? "border-gold/55 bg-gold/12 text-gold"
          : "border-border-strong bg-surface-1 text-text hover:border-gold/45 hover:bg-surface-2 hover:text-gold",
        className,
      )}
    >
      <Heart
        aria-hidden
        strokeWidth={1.75}
        className={cn(iconSize, "transition-transform", isWished && "fill-current scale-105")}
      />
    </button>
  );
}
