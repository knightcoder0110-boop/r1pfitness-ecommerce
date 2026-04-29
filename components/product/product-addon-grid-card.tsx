"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { QuickAddModal } from "@/components/product/quick-add-modal";
import type { Product, ProductSummary } from "@/lib/woo/types";

interface ProductAddonGridCardProps {
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
 * Portrait card for the "Complete the Look" grid.
 *
 * Layout: full-width 3:4 image → compact info row (name + price + add button).
 *
 * Simple products: "+" adds directly to cart.
 * Variable products: "+" opens QuickAddModal to pick size/color without leaving the PDP.
 */
export function ProductAddonGridCard({ product }: ProductAddonGridCardProps) {
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

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.price.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(product.price.amount / 100);

  async function handleAdd() {
    if (pending || added || outOfStock) return;
    if (isVariable) {
      setModalOpen(true);
      return;
    }
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

  return (
    <>
      <article
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-sm",
          "border border-border hover:border-border-strong",
          "bg-surface-1 hover:bg-surface-1",
          "transition-[border-color] duration-200",
        )}
      >
        {/* Square image — compact */}
        <div className="relative w-full aspect-square overflow-hidden bg-surface-2">
          {displayImage ? (
            <Image
              src={displayImage.url}
              alt={displayImage.alt || product.name}
              fill
              sizes="(max-width: 640px) 144px, 160px"
              className={cn(
                "object-cover transition-transform duration-500 ease-out",
                "group-hover:scale-[1.04]",
              )}
            />
          ) : (
            <div className="absolute inset-0 bg-surface-2" aria-hidden />
          )}

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-bg/60 flex items-center justify-center">
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          {/* Name + price */}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-text leading-tight line-clamp-1">
              {product.name}
            </p>
            <p className="mt-px font-display text-xs tracking-wider text-gold leading-none">
              {price}
            </p>
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock || pending}
            aria-label={
              isVariable
                ? `Choose options for ${product.name}`
                : `Add ${product.name} to cart`
            }
            className={cn(
              "shrink-0 size-8 flex items-center justify-center rounded-sm",
              "transition-[transform,filter,background-color,box-shadow,border-color,opacity] duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
              outOfStock
                ? "border border-border text-faint cursor-not-allowed opacity-40"
                : added
                  ? "border border-gold bg-gold/15 text-gold cursor-default"
                  : "bg-[linear-gradient(170deg,#E6C56A_0%,#D4AF55_28%,#C9A84C_55%,#A88934_100%)] text-bg shadow-metallic hover:brightness-[1.07] hover:shadow-metallic-hover hover:-translate-y-px cursor-pointer",
            )}
          >
            {added ? (
              /* Check mark */
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="size-3.5"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m3 8 3.5 3.5 6.5-7" />
              </svg>
            ) : pending ? (
              /* Spinner */
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="size-3.5 animate-spin"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            ) : (
              /* Plus */
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="size-3.5"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
              </svg>
            )}
          </button>
        </div>
      </article>

      {/* Quick-add modal — only for variable products */}
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
