"use client";

import { useMemo, useRef, useState } from "react";
import { VariantPicker } from "@/components/product/variant-picker";
import { SizeGuideModal } from "@/components/product/size-guide-modal";
import { BackInStockForm } from "@/components/product/back-in-stock-form";
import { cn } from "@/lib/utils/cn";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { trackAddToCart } from "@/lib/analytics";
import type { Product, ProductVariation } from "@/lib/woo/types";

export interface SpotlightPurchaseProps {
  product: Product;
}

/**
 * Client purchase surface for the ProductSpotlight section.
 *
 * Handles:
 *  - Variation attribute state (size, color, etc.)
 *  - Resolving the matching ProductVariation
 *  - Add-to-cart action with cart open + toast
 *  - OOS states and back-in-stock form
 *  - Optional size guide trigger
 *
 * Intentionally leaner than ProductPurchase (no StickyAddToCart — that's for PDP).
 */
export function SpotlightPurchase({ product }: SpotlightPurchaseProps) {
  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);
  const [isPending, setIsPending] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement | null>(null);

  const requiredAttrs = useMemo(
    () => product.attributes.filter((a) => a.variation),
    [product.attributes],
  );

  const [selected, setSelected] = useState<Record<string, string>>({});
  const allSelected = requiredAttrs.every((a) => Boolean(selected[a.id]));

  const matchingVariation: ProductVariation | undefined = useMemo(() => {
    if (!product.variations.length) return undefined;
    if (!allSelected) return undefined;
    return product.variations.find((v) =>
      Object.entries(selected).every(([k, val]) => v.attributes[k] === val),
    );
  }, [product.variations, selected, allSelected]);

  const productOOS = product.stockStatus === "out_of_stock";
  const variationOOS = matchingVariation?.stockStatus === "out_of_stock";
  const needsSelection = requiredAttrs.length > 0 && !allSelected;
  const disabled = productOOS || needsSelection || variationOOS || isPending;

  const label = productOOS
    ? "Sold Out"
    : needsSelection
      ? "Select options"
      : variationOOS
        ? "Unavailable"
        : isPending
          ? "Adding..."
          : "Add to Cart";

  function handleAdd() {
    if (disabled) return;
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

  const hasSizeAttr = product.attributes.some((a) => /size/i.test(a.name));
  const sizeGuideTab = product.categories.some((c) => /hoodie/i.test(c.name))
    ? "Hoodies"
    : product.categories.some((c) => /bottom|short|pant/i.test(c.name))
      ? "Bottoms"
      : "Tees";

  return (
    <div className="flex flex-col gap-5">
      {/* Variant picker */}
      {requiredAttrs.length > 0 && (
        <div className="flex flex-col gap-3">
          <VariantPicker
            attributes={product.attributes}
            value={selected}
            onChange={setSelected}
          />
          {hasSizeAttr && (
            <div className="flex">
              <SizeGuideModal defaultTab={sizeGuideTab} />
            </div>
          )}
        </div>
      )}

      {/* Add to cart — gold lustre primary button */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          ref={addBtnRef}
          type="button"
          disabled={disabled}
          onClick={handleAdd}
          className={cn(
            "relative overflow-hidden inline-flex items-center justify-center gap-2",
            "h-13 px-8 font-semibold text-sm uppercase tracking-widest",
            "transition-[filter,opacity] duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            disabled
              ? "opacity-50 cursor-not-allowed bg-surface-2 text-muted border border-border"
              : [
                  "bg-[linear-gradient(170deg,#D4AF55_0%,#C9A84C_45%,#9A7C2C_100%)] text-bg",
                  "before:absolute before:inset-0 before:pointer-events-none",
                  "before:bg-[linear-gradient(170deg,rgba(255,255,255,0.30)_0%,transparent_60%)]",
                  "hover:brightness-110",
                ],
          )}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin size-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Adding...
            </span>
          ) : (
            label
          )}
        </button>

        {/* Success micro-copy when pending resolves — optional subtle hint */}
        {!disabled && !isPending && (
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
            Free US shipping
          </p>
        )}
      </div>

      {/* Back-in-stock subscribe form */}
      {(productOOS || variationOOS) && (
        <BackInStockForm
          productId={product.id}
          variationId={matchingVariation?.id}
          productName={product.name}
        />
      )}
    </div>
  );
}
