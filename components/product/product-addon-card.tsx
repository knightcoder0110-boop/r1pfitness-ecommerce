"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import type { Product, ProductVariation } from "@/lib/woo/types";

interface ProductAddonCardProps {
  product: Product;
}

/**
 * Compact add-on card for the "Complete the Look" rail.
 *
 * - Simple products (no variation attributes): Add button is enabled immediately.
 * - Variable products (e.g. tees with Size): shows compact size pills.
 *   The Add button is disabled until every required attribute is selected,
 *   then the resolved variation is passed to addItem.
 */
export function ProductAddonCard({ product }: ProductAddonCardProps) {
  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});

  // Attributes that drive variation selection (e.g. Size, Color).
  const variationAttrs = useMemo(
    () => product.attributes.filter((a) => a.variation),
    [product.attributes],
  );

  const isVariable = variationAttrs.length > 0;
  const allSelected = variationAttrs.every((a) => Boolean(selected[a.id]));

  // Resolve the matching ProductVariation from the current selection.
  const matchingVariation = useMemo<ProductVariation | undefined>(() => {
    if (!isVariable || !allSelected) return undefined;
    return product.variations.find((v) =>
      Object.entries(selected).every(([k, val]) => v.attributes[k] === val),
    );
  }, [product.variations, isVariable, allSelected, selected]);

  const outOfStock =
    product.stockStatus === "out_of_stock" ||
    matchingVariation?.stockStatus === "out_of_stock";

  // For variable products the button is disabled until a complete selection is made.
  const canAdd = !outOfStock && (!isVariable || (allSelected && Boolean(matchingVariation)));

  async function handleQuickAdd() {
    if (pending || added || !canAdd) return;
    setPending(true);
    try {
      await addItem({ product, variation: matchingVariation, quantity: 1 });
      openCart();
      showToast(`${product.name} added to your cart 🤙`, "success");
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setPending(false);
    }
  }

  const displayImage = matchingVariation?.image ?? product.images[0];

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (matchingVariation?.price ?? product.price).currency,
  }).format((matchingVariation?.price ?? product.price).amount / 100);

  return (
    <article className="flex flex-col gap-2 p-3 border border-border hover:border-border-strong transition-colors bg-surface-1 hover:bg-surface-2 rounded-sm">
      {/* Top row: thumbnail + name/price + add button */}
      <div className="flex items-center gap-3">
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
          <p className="mt-0.5 font-display text-sm tracking-wider text-gold">
            {price}
          </p>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!canAdd || pending}
          aria-label={`Add ${product.name} to cart`}
          title={isVariable && !allSelected ? "Select a size first" : undefined}
          className={cn(
            "shrink-0 size-8 flex items-center justify-center rounded-sm",
            "border transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            added
              ? "border-gold bg-gold/15 text-gold cursor-default"
              : !canAdd
              ? "border-border text-faint cursor-not-allowed opacity-50"
              : "border-border-strong bg-surface-2 text-muted hover:border-gold hover:text-gold hover:bg-gold/10 cursor-pointer",
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
      </div>

      {/* Mini variation picker — only shown for variable products */}
      {isVariable && (
        <div className="flex flex-col gap-1.5 pl-[68px]">
          {variationAttrs.map((attr) => (
            <div key={attr.id} className="flex flex-wrap gap-1.5">
              {attr.options.map((option) => {
                const isSelected = selected[attr.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [attr.id]: option }))
                    }
                    aria-pressed={isSelected}
                    className={cn(
                      "min-w-[32px] rounded-sm border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold",
                      isSelected
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted hover:border-border-strong hover:text-text",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ))}
          {isVariable && !allSelected && (
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-faint">
              Select {variationAttrs.map((a) => a.name.toLowerCase()).join(" & ")} to add
            </p>
          )}
        </div>
      )}
    </article>
  );
}
