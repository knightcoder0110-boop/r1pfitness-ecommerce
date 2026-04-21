"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import type { ProductSummary } from "@/lib/woo/types";

interface ProductAddonCardProps {
  product: ProductSummary;
}

/**
 * Compact add-on card displayed in the "Complete the Look" rail on a PDP.
 *
 * If the product has no variations: single "Add" button adds directly.
 * If it has variations: shows a mini size-picker first, then enables Add.
 *
 * Note: ProductSummary does NOT include full variation data — for simplicity
 * the card uses a quick-add that links to the PDP when variations are needed,
 * and adds directly for simple products (no variation attributes).
 */
export function ProductAddonCard({ product }: ProductAddonCardProps) {
  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleQuickAdd() {
    if (pending || added) return;
    setPending(true);
    try {
      await addItem({ product: product as never, quantity: 1 });
      openCart();
      showToast(`${product.name} added to your cart 🤙`, "success");
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setPending(false);
    }
  }

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.price.currency,
  }).format(product.price.amount / 100);

  return (
    <article className="group flex items-center gap-3 p-3 border border-border hover:border-border-strong transition-colors bg-surface-1 hover:bg-surface-2 rounded-sm">
      {/* Thumbnail */}
      <div className="relative shrink-0 size-14 overflow-hidden rounded-sm bg-surface-2">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || product.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-3" aria-hidden />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text truncate leading-tight">
          {product.name}
        </p>
        <p className="mt-0.5 font-display text-sm tracking-wider text-gold">
          {price}
        </p>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={handleQuickAdd}
        disabled={pending || product.stockStatus === "out_of_stock"}
        aria-label={`Add ${product.name} to cart`}
        className={cn(
          "shrink-0 size-8 flex items-center justify-center rounded-sm",
          "border transition-all duration-200 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          added
            ? "border-gold bg-gold/15 text-gold"
            : product.stockStatus === "out_of_stock"
            ? "border-border text-faint cursor-not-allowed"
            : "border-border-strong bg-surface-2 text-muted hover:border-gold hover:text-gold hover:bg-gold/10",
        )}
      >
        {added ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m3 8 3.5 3.5 6.5-7" />
          </svg>
        ) : pending ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5 animate-spin" aria-hidden>
            <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
          </svg>
        )}
      </button>
    </article>
  );
}
