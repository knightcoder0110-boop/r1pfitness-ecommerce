"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import {
  selectWishlistCount,
  selectWishlistHydrated,
  useWishlistStore,
} from "@/lib/wishlist/store";

export function WishlistHeaderButton() {
  const hydrated = useWishlistStore(selectWishlistHydrated);
  const count = useWishlistStore(selectWishlistCount);
  const visibleCount = hydrated ? count : 0;

  return (
    <Link
      href={ROUTES.wishlist}
      aria-label={`Wishlist${visibleCount > 0 ? `, ${visibleCount} saved` : ""}`}
      className="hover:bg-surface-1 focus-visible:ring-gold text-text focus-visible:ring-offset-bg relative inline-flex size-10 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Heart aria-hidden className="size-5" />
      {visibleCount > 0 && (
        <span className="bg-gold text-bg absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] leading-4 font-bold">
          {visibleCount > 9 ? "9+" : visibleCount}
        </span>
      )}
    </Link>
  );
}
