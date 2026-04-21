"use client";

import { useMemo, useState } from "react";
import { VariantPicker } from "@/components/product/variant-picker";
import { Button } from "@/components/ui/button";
import { useServerCart } from "@/lib/cart";
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
  const { addItem } = useServerCart();
  const [isPending, setIsPending] = useState(false);

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

  function handleAdd() {
    if (disabled) return;
    setIsPending(true);
    // Fire-and-forget: local store update is synchronous, BFF sync happens in background.
    void addItem({
      product,
      ...(matchingVariation ? { variation: matchingVariation } : {}),
      quantity: 1,
    }).finally(() => setIsPending(false));
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
      <VariantPicker
        attributes={product.attributes}
        value={selected}
        onChange={setSelected}
      />
      <Button
        size="lg"
        disabled={disabled}
        onClick={handleAdd}
        className="w-full sm:w-auto"
      >
        {label}
      </Button>
    </div>
  );
}
