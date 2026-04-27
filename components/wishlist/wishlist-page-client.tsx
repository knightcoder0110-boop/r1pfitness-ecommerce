"use client";

import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import { buttonVariants } from "@/components/ui/button";
import {
  selectWishlistHydrated,
  selectWishlistItems,
  useWishlistStore,
} from "@/lib/wishlist/store";
import { wishlistItemToProductSummary } from "@/lib/wishlist/types";
import { ROUTES } from "@/lib/constants";

export function WishlistPageClient() {
  const hydrated = useWishlistStore(selectWishlistHydrated);
  const items = useWishlistStore(selectWishlistItems);
  const clear = useWishlistStore((state) => state.clear);
  const visibleItems = hydrated ? items : [];
  const products = visibleItems.map(wishlistItemToProductSummary);

  if (!hydrated) {
    return (
      <section className="border-border bg-surface-1 border p-8 text-center sm:p-12">
        <p className="text-gold font-mono text-[10px] tracking-[0.35em] uppercase">Wishlist</p>
        <h2 className="font-display text-text mt-3 text-4xl tracking-[0.08em]">
          Loading saved pieces.
        </h2>
        <p className="text-muted mx-auto mt-3 max-w-md font-serif text-base leading-relaxed italic">
          Pulling your saved products into view.
        </p>
      </section>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <section className="border-border bg-surface-1 border p-8 text-center sm:p-12">
        <p className="text-gold font-mono text-[10px] tracking-[0.35em] uppercase">Wishlist</p>
        <h2 className="font-display text-text mt-3 text-4xl tracking-[0.08em]">
          Nothing saved yet.
        </h2>
        <p className="text-muted mx-auto mt-3 max-w-md font-serif text-base leading-relaxed italic">
          Tap the heart on any product card to keep your next drop list close.
        </p>
        <Link href={ROUTES.shop} className={buttonVariants({ size: "lg", className: "mt-6" })}>
          Shop The Drop
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="border-border mb-8 flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-gold font-mono text-[10px] tracking-[0.35em] uppercase">
            Saved Pieces
          </p>
          <p className="text-muted mt-2 font-serif text-base italic">
            {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"} ready when you are.
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-muted hover:text-text self-start font-mono text-[10px] tracking-[0.25em] uppercase underline underline-offset-4 transition-colors sm:self-auto"
        >
          Clear wishlist
        </button>
      </div>
      <ProductGrid items={products} />
    </section>
  );
}
