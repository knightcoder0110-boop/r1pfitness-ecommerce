"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { QuickAddModal } from "@/components/product/quick-add-modal";
import type { Product, ProductSummary } from "@/lib/woo/types";

interface ProductAddonCardProps {
  product: Product;
}

function productToSummary(p: Product): ProductSummary {
  const colors = p.attributes.find((a) => /color/i.test(a.name))?.options ?? [];
  const sizes = p.attributes.find((a) => /size/i.test(a.name))?.options ?? [];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    ...(p.compareAtPrice ? { compareAtPrice: p.compareAtPrice } : {}),
    ...(p.images[0] ? { image: p.images[0] } : {}),
    ...(p.images[1] ? { hoverImage: p.images[1] } : {}),
    stockStatus: p.stockStatus,
    isLimited: Boolean(p.meta.isLimited),
    ...(colors.length ? { colorOptions: colors } : {}),
    ...(sizes.length ? { sizeOptions: sizes } : {}),
    ...(p.variations.length ? { variantCount: p.variations.length } : {}),
  };
}

/**
 * Compact add-on card for the "Complete the Look" rail.
 *
 * Simple products: the "+" button adds directly to cart.
 * Variable products: the "+" button opens a QuickAddModal so the customer
 * can pick their size/color without leaving the PDP.
 *
 * No inline variant pickers — keeps the rail lean and fast.
 */
export function ProductAddonCard({ product }: ProductAddonCardProps) {
  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isVariable = useMemo(
    () => product.attributes.some((a) => a.variation),
    [product.attributes],
  );

  const outOfStock = product.stockStatus === "out_of_stock";
  const canAdd = !outOfStock;

  async function handleQuickAdd() {
    if (pending || added || !canAdd) return;
    if (isVariable) {
      setModalOpen(true);
      return;
    }
    // Simple product: add directly
    setPending(true);
    try {
      await addItem({ product, variation: undefined, quantity: 1 });
      openCart();
      showToast(`${product.name} added to your cart 🤙`, "success");
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setPending(false);
    }
  }

  const displayImage = product.images[0];

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.price.currency,
  }).format(product.price.amount / 100);

  return (
    <>
      <article className="flex items-center gap-3 p-3 border border-border hover:border-border-strong transition-colors bg-surface-1 hover:bg-surface-2 rounded-sm">
        {/* Thumbnail */}
        <div className="relative shrink-0 size-14 overflow-hidden rounded-sm bg-surface-2">
          {displayImage ? (
            <Image
              src={displayImage.url}
              alt={displayImage.alt || product.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-surface-2" aria-hidden />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text truncate leading-tight">
            {product.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-display text-sm tracking-wider text-gold">{price}</span>
            {isVariable && (
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-faint">
                Choose options
              </span>
            )}
          </div>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!canAdd || pending}
          aria-label={
            isVariable
              ? `Choose options for ${product.name}`
              : `Add ${product.name} to cart`
          }
          className={cn(
            "shrink-0 size-8 flex items-center justify-center rounded-sm",
            "transition-[transform,filter,background-color,box-shadow,border-color,opacity] duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
            added
              ? "border border-gold bg-gold/15 text-gold cursor-default"
              : !canAdd
              ? "border border-border text-faint cursor-not-allowed opacity-50"
              : "bg-[linear-gradient(170deg,#E6C56A_0%,#D4AF55_28%,#C9A84C_55%,#A88934_100%)] text-bg shadow-metallic hover:brightness-[1.07] hover:shadow-metallic-hover hover:-translate-y-px cursor-pointer",
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
          ) : isVariable ? (
            // Chevron → replaced with + so it reads as "add" not "navigate"
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
            </svg>
          )}
        </button>
      </article>

      {/* Quick-add modal — only mounted for variable products */}
      {isVariable && (
        <QuickAddModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          summary={productToSummary(product)}
          prefetchedProduct={product}
        />
      )}
    </>
  );
}
