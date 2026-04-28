"use client";

import { Heart } from "lucide-react";
import { selectWishlistHydrated, useWishlistStore } from "@/lib/wishlist/store";
import { useToastStore } from "@/lib/toast";
import { cn } from "@/lib/utils/cn";
import type { ProductSummary } from "@/lib/woo/types";

interface WishlistButtonProps {
  product: ProductSummary;
  className?: string;
}

export function WishlistButton({ product, className }: WishlistButtonProps) {
  const hydrated = useWishlistStore(selectWishlistHydrated);
  const wished = useWishlistStore((state) => state.has(product.id));
  const toggle = useWishlistStore((state) => state.toggle);
  const showToast = useToastStore((state) => state.show);
  const isWished = hydrated && wished;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const added = toggle(product);
    showToast(
      added ? `${product.name} saved to your wishlist` : `${product.name} removed from wishlist`,
      added ? "success" : "error",
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
      aria-pressed={isWished}
      className={cn(
        "absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-full",
        "bg-bg/78 text-text shadow-soft border border-white/10 backdrop-blur-sm",
        "cursor-pointer hover:border-gold/45 hover:text-gold transition-[transform,color,border-color,background-color] duration-200 hover:-translate-y-0.5",
        "focus-visible:ring-gold focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        isWished && "border-gold/45 bg-gold/12 text-gold",
        className,
      )}
    >
      <Heart aria-hidden className={cn("size-4", isWished && "fill-current")} />
    </button>
  );
}
