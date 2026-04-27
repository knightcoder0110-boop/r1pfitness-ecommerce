"use client";

import { Heart } from "lucide-react";
import { selectWishlistHydrated, useWishlistStore } from "@/lib/wishlist/store";
import { useToastStore } from "@/lib/toast";
import { cn } from "@/lib/utils/cn";
import type { Product, ProductSummary } from "@/lib/woo/types";

interface ProductWishlistCtaProps {
  product: Product;
}

function pickAttributeOptions(product: Product, matcher: RegExp) {
  return product.attributes.find((attribute) => matcher.test(attribute.name))?.options ?? [];
}

function toWishlistSummary(product: Product): ProductSummary {
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
    ...(pickAttributeOptions(product, /color/i).length
      ? { colorOptions: pickAttributeOptions(product, /color/i) }
      : {}),
    ...(pickAttributeOptions(product, /size/i).length
      ? { sizeOptions: pickAttributeOptions(product, /size/i) }
      : {}),
    ...(product.variations.length ? { variantCount: product.variations.length } : {}),
  };
}

export function ProductWishlistCta({ product }: ProductWishlistCtaProps) {
  const hydrated = useWishlistStore(selectWishlistHydrated);
  const wished = useWishlistStore((state) => state.has(product.id));
  const toggle = useWishlistStore((state) => state.toggle);
  const showToast = useToastStore((state) => state.show);

  const normalizedProduct = toWishlistSummary(product);
  const isWished = hydrated && wished;

  function handleClick() {
    const added = toggle(normalizedProduct);
    showToast(
      added
        ? `${normalizedProduct.name} saved to your wishlist`
        : `${normalizedProduct.name} removed from wishlist`,
      added ? "success" : "error",
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isWished
          ? `Remove ${normalizedProduct.name} from wishlist`
          : `Save ${normalizedProduct.name} to wishlist`
      }
      aria-pressed={isWished}
      className={cn(
        "flex w-full items-center justify-center gap-3 border px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.24em] transition-[transform,border-color,color,background-color] duration-200",
        "border-border bg-bg/45 text-text hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold",
        "focus-visible:ring-gold focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        isWished && "border-gold/45 bg-gold/10 text-gold",
      )}
    >
      <Heart aria-hidden className={cn("size-4", isWished && "fill-current")} />
      <span>{isWished ? "Saved to Wishlist" : "Save to Wishlist"}</span>
    </button>
  );
}