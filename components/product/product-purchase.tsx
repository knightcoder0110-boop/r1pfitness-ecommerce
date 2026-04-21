"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VariantPicker } from "@/components/product/variant-picker";
import { SizeGuideModal } from "@/components/product/size-guide-modal";
import { BackInStockForm } from "@/components/product/back-in-stock-form";
import { StickyAddToCart } from "@/components/product/sticky-add-to-cart";
import { Button } from "@/components/ui/button";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { useActiveVariationStore } from "@/lib/active-variation-store";
import { trackAddToCart } from "@/lib/analytics";
import type { Product, ProductVariation } from "@/lib/woo/types";

export interface ProductPurchaseProps {
  product: Product;
}

/**
 * Client-side purchase surface for a PDP.
 *
 * Responsibilities:
 *  - Hold selected variant-attribute state.
 *  - Resolve the current `ProductVariation` (if any) from the attribute map.
 *  - Validate selection completeness before enabling "Add to cart".
 *  - Fire the cart action + analytics event.
 *
 * Keeping this isolated means the PDP page itself stays a server component
 * and can remain `generateStaticParams`-friendly.
 */
export function ProductPurchase({ product }: ProductPurchaseProps) {
  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);
  const setVariantImage = useActiveVariationStore((s) => s.setVariantImage);
  const [isPending, setIsPending] = useState(false);
  // Ref pointed at the main Add button — StickyAddToCart watches its visibility.
  const addBtnRef = useRef<HTMLButtonElement | null>(null);

  // Required variation-producing attributes.
  const requiredAttrs = useMemo(
    () => product.attributes.filter((a) => a.variation),
    [product.attributes],
  );

  // Selected attribute values: { pa_size: "M", pa_color: "Coral" }.
  const [selected, setSelected] = useState<Record<string, string>>({});

  const allSelected = requiredAttrs.every((a) => Boolean(selected[a.id]));

  // Resolve matching variation if product has variations.
  const matchingVariation: ProductVariation | undefined = useMemo(() => {
    if (!product.variations.length) return undefined;
    if (!allSelected) return undefined;
    return product.variations.find((v) =>
      Object.entries(selected).every(([k, val]) => v.attributes[k] === val),
    );
  }, [product.variations, selected, allSelected]);

  const productOutOfStock = product.stockStatus === "out_of_stock";
  const variationOutOfStock =
    matchingVariation?.stockStatus === "out_of_stock";

  // Sync variation image into gallery whenever the resolved variation changes.
  useEffect(() => {
    setVariantImage(matchingVariation?.image);
  }, [matchingVariation, setVariantImage]);

  // Disabled when: no stock; OR has variations but selection incomplete;
  // OR selection complete but variation itself is OOS.
  const needsSelection = requiredAttrs.length > 0 && !allSelected;
  const disabled =
    productOutOfStock || needsSelection || variationOutOfStock || isPending;

  const label = productOutOfStock
    ? "Sold Out"
    : needsSelection
      ? "Select options"
      : variationOutOfStock
        ? "Unavailable"
        : isPending
          ? "Adding..."
          : "Add to Cart";

  // Human-readable label for the sticky bar e.g. "M · Black"
  const selectionLabel = Object.values(selected).join(" · ");

  function handleAdd() {
    if (disabled) return;
    setIsPending(true);
    // Optimistic: local state updates synchronously; BFF syncs in background.
    void addItem({
      product,
      ...(matchingVariation ? { variation: matchingVariation } : {}),
      quantity: 1,
    }).finally(() => setIsPending(false));
    // Open cart drawer + show confirmation toast immediately (optimistic UX).
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

  return (
    <div className="flex flex-col gap-6">
      {/* Variant picker + size guide link */}
      {requiredAttrs.length > 0 && (
        <div className="flex flex-col gap-3">
          <VariantPicker
            attributes={product.attributes}
            value={selected}
            onChange={setSelected}
          />
          {/* Show size guide only when a size attribute exists */}
          {product.attributes.some((a) => /size/i.test(a.name)) && (
            <div className="flex justify-end">
              <SizeGuideModal
                defaultTab={
                  product.categories.some((c) => /hoodie/i.test(c.name))
                    ? "Hoodies"
                    : product.categories.some((c) =>
                        /bottom|short|pant/i.test(c.name),
                      )
                    ? "Bottoms"
                    : "Tees"
                }
              />
            </div>
          )}
        </div>
      )}
      {/* No variants — still show size guide if product likely has sizing */}
      {requiredAttrs.length === 0 && (
        <VariantPicker
          attributes={product.attributes}
          value={selected}
          onChange={setSelected}
        />
      )}
      <Button
        ref={addBtnRef}
        size="lg"
        disabled={disabled}
        onClick={handleAdd}
        className="w-full sm:w-auto"
      >
        {label}
      </Button>

      {/* Back-in-stock subscribe form — shown when item is genuinely OOS */}
      {(productOutOfStock || variationOutOfStock) && (
        <BackInStockForm
          productId={product.id}
          variationId={matchingVariation?.id}
          productName={product.name}
        />
      )}

      {/* Sticky bar — slides up when main button scrolls out of view */}
      <StickyAddToCart
        watchRef={addBtnRef}
        product={product}
        matchingVariation={matchingVariation}
        selectionLabel={selectionLabel}
        disabled={disabled}
        label={label}
      />
    </div>
  );
}
