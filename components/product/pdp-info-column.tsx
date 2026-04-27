"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductBadgeRow } from "./product-badge-row";
import { ColorSwatchPicker } from "./color-swatch-picker";
import { SizePicker } from "./size-picker";
import { VariantPicker } from "./variant-picker";
import { PriceDisplay } from "./price-display";
import { ReviewStars } from "./review-stars";
import { ShareButton } from "./share-button";
import { StockScarcity } from "./stock-scarcity";
import { TrustStrip } from "./trust-strip";
import { ShippingEstimate } from "./shipping-estimate";
import { FreeShippingProgress } from "./free-shipping-progress";
import { SocialProofSignal } from "./social-proof-signal";
import { WishlistIconButton } from "./wishlist-icon-button";
import { BuyNowButton } from "./buy-now-button";
import { BackInStockForm } from "./back-in-stock-form";
import { SizeGuideModal } from "./size-guide-modal";
import { StickyAddToCart } from "./sticky-add-to-cart";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Heading } from "@/components/ui/heading";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { useActiveVariationStore } from "@/lib/active-variation-store";
import { trackAddToCart, trackViewItem } from "@/lib/analytics";
import type { Product, ProductAttribute, ProductVariation } from "@/lib/woo/types";

export interface PdpInfoColumnProps {
  product: Product;
}

interface AttributeBuckets {
  color: ProductAttribute | undefined;
  size: ProductAttribute | undefined;
  other: ProductAttribute[];
}

/**
 * Split the product's variation-producing attributes into three buckets:
 *   • color → routed to <ColorSwatchPicker>
 *   • size  → routed to <SizePicker>
 *   • other → routed to the legacy <VariantPicker> as a fallback
 *
 * We match by attribute *name* (case-insensitive substring) rather than slug
 * so that admin-side renames don't require code changes.
 */
function bucketAttributes(attributes: ProductAttribute[]): AttributeBuckets {
  const variation = attributes.filter((a) => a.variation);
  return {
    color: variation.find((a) => /color|colour/i.test(a.name)),
    size: variation.find((a) => /size/i.test(a.name)),
    other: variation.filter(
      (a) => !/color|colour/i.test(a.name) && !/size/i.test(a.name),
    ),
  };
}

/**
 * Build a `Record<optionName, isAvailable>` for one attribute, given the
 * current selection of the *other* attributes. An option is available if
 * at least one in-stock variation exists where this attribute = option AND
 * every other selected attribute matches.
 *
 * Edge case: when no other attribute is selected yet, we mark an option
 * available if ANY variation matches that attribute and is in stock — gives
 * the user honest information about overall stock before they've committed.
 */
function computeAvailability(
  attribute: ProductAttribute,
  variations: ProductVariation[],
  otherSelected: Record<string, string>,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const option of attribute.options) {
    const candidates = variations.filter((v) => {
      if (v.attributes[attribute.id] !== option) return false;
      for (const [k, val] of Object.entries(otherSelected)) {
        if (v.attributes[k] !== val) return false;
      }
      return true;
    });
    out[option] = candidates.some((v) => v.stockStatus !== "out_of_stock");
  }
  return out;
}

/**
 * The complete PDP right-column experience.
 *
 * Owns ALL of:
 *   • Variant selection state (single source of truth for the page)
 *   • Resolved variation → drives price, stock, and gallery sync
 *   • Quantity (clamped to variation stock)
 *   • Add to cart + Buy now mutations
 *   • Wishlist icon co-located with ATC
 *   • Sticky bar visibility (via watchRef on the real ATC button)
 *
 * Section order matches the conversion blueprint in
 * `docs-wcommerce-nextjs/17-conversion-page-designs/product-page.md`:
 *
 *   1. Badge row (small)        → identity / signal
 *   2. Title + Share            → orientation
 *   3. Rating link              → social proof
 *   4. Price + savings          → value
 *   5. Short description        → editorial
 *   6. ─────── divider ───────
 *   7. Color swatches           → first decision (most visual)
 *   8. Size picker + Size Guide → second decision
 *   9. Other attributes         → fallback
 *  10. Stock scarcity (if low)  → urgency
 *  11. Free-shipping progress   → AOV nudge
 *  12. Quantity + ATC + Heart   → action row
 *  13. Buy It Now               → express path
 *  14. Shipping estimate        → certainty
 *  15. Trust strip              → trust
 *  16. Social proof signal      → social
 *  17. Back-in-stock form (OOS) → recovery
 */
export function PdpInfoColumn({ product }: PdpInfoColumnProps) {
  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);
  const setVariantImage = useActiveVariationStore((s) => s.setVariantImage);
  const addBtnRef = useRef<HTMLButtonElement | null>(null);

  // ── Attribute bucketing (memoised so referential identity is stable) ──
  const buckets = useMemo(() => bucketAttributes(product.attributes), [product.attributes]);
  const requiredAttrs = useMemo(
    () => product.attributes.filter((a) => a.variation),
    [product.attributes],
  );

  // ── Selection state ───────────────────────────────────────────────────
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);

  const allSelected = requiredAttrs.every((a) => Boolean(selected[a.id]));

  // ── Resolve matching variation ────────────────────────────────────────
  const matchingVariation: ProductVariation | undefined = useMemo(() => {
    if (!product.variations.length) return undefined;
    if (!allSelected) return undefined;
    return product.variations.find((v) =>
      Object.entries(selected).every(([k, val]) => v.attributes[k] === val),
    );
  }, [product.variations, selected, allSelected]);

  // ── Effective price / compareAt / stock — variation overrides product ──
  const effectivePrice = matchingVariation?.price ?? product.price;
  const effectiveCompareAt =
    matchingVariation?.compareAtPrice ?? product.compareAtPrice;
  const effectiveStockStatus =
    matchingVariation?.stockStatus ?? product.stockStatus;
  const effectiveStockQty =
    matchingVariation?.stockQuantity ?? product.stockQuantity;
  const productOutOfStock = product.stockStatus === "out_of_stock";
  const variationOutOfStock = matchingVariation?.stockStatus === "out_of_stock";
  const isOutOfStock = productOutOfStock || variationOutOfStock;

  // Clamp qty whenever the chosen variation has a tighter stock cap.
  useEffect(() => {
    if (effectiveStockQty && quantity > effectiveStockQty) {
      setQuantity(effectiveStockQty);
    }
  }, [effectiveStockQty, quantity]);

  // ── Sync variation image into gallery ─────────────────────────────────
  useEffect(() => {
    setVariantImage(matchingVariation?.image);
  }, [matchingVariation, setVariantImage]);

  // ── Fire view_item once on mount ──────────────────────────────────────
  useEffect(() => {
    trackViewItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      ...(product.categories.find((c) => c.slug !== "uncategorized")?.name
        ? { category: product.categories.find((c) => c.slug !== "uncategorized")!.name }
        : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // ── Availability matrices for each picker ─────────────────────────────
  const colorAvailability = useMemo(() => {
    if (!buckets.color) return {};
    const otherSelected: Record<string, string> = { ...selected };
    delete otherSelected[buckets.color.id];
    return computeAvailability(buckets.color, product.variations, otherSelected);
  }, [buckets.color, product.variations, selected]);

  const sizeAvailability = useMemo(() => {
    if (!buckets.size) return {};
    const otherSelected: Record<string, string> = { ...selected };
    delete otherSelected[buckets.size.id];
    return computeAvailability(buckets.size, product.variations, otherSelected);
  }, [buckets.size, product.variations, selected]);

  // ── ATC state ─────────────────────────────────────────────────────────
  const [isPending, setIsPending] = useState(false);
  const needsSelection = requiredAttrs.length > 0 && !allSelected;
  const disabled = isOutOfStock || needsSelection || isPending;

  const ctaLabel = isOutOfStock
    ? "Sold Out"
    : needsSelection
      ? "Select options"
      : isPending
        ? "Adding..."
        : `Add to Cart — ${formatLine(effectivePrice, quantity)}`;

  const stickyLabel = isOutOfStock
    ? "Sold Out"
    : needsSelection
      ? "Select options"
      : isPending
        ? "Adding..."
        : "Add to Cart";

  const selectionLabel = Object.values(selected).join(" · ");

  function handleAdd() {
    if (disabled) return;
    setIsPending(true);
    void addItem({
      product,
      ...(matchingVariation ? { variation: matchingVariation } : {}),
      quantity,
    }).finally(() => setIsPending(false));
    openCart();
    showToast(`${product.name} added to your cart 🤙`, "success");
    trackAddToCart({
      productId: product.id,
      ...(matchingVariation?.id ? { variationId: matchingVariation.id } : {}),
      name: product.name,
      price: effectivePrice,
      quantity,
    });
  }

  // ── Category derivation for size guide preset ─────────────────────────
  const sizeGuideTab = useMemo<"Tees" | "Hoodies" | "Bottoms">(() => {
    if (product.categories.some((c) => /hoodie/i.test(c.name))) return "Hoodies";
    if (product.categories.some((c) => /bottom|short|pant/i.test(c.name))) {
      return "Bottoms";
    }
    return "Tees";
  }, [product.categories]);

  const updateSelection = (attrId: string) => (option: string) =>
    setSelected((prev) => ({ ...prev, [attrId]: option }));

  return (
    <section
      aria-label={`${product.name} purchase information`}
      className="flex flex-col"
    >
      {/* ── 1. Badges (small, above title) ─────────────────────────── */}
      <ProductBadgeRow product={product} className="mb-3" />

      {/* ── 2. Title + Share ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <Heading
          level={1}
          size="xl"
          className="text-3xl sm:text-4xl lg:text-5xl"
        >
          {product.name}
        </Heading>
        <ShareButton
          title={product.name}
          {...(product.shortDescription ? { text: product.shortDescription } : {})}
        />
      </div>

      {/* ── 3. Rating ──────────────────────────────────────────────── */}
      <ReviewStars
        value={4.7}
        count={84}
        href="#reviews"
        size="md"
        className="mt-3"
      />

      {/* ── 4. Price ────────────────────────────────────────────────── */}
      <PriceDisplay
        price={effectivePrice}
        compareAtPrice={effectiveCompareAt}
        className="mt-5"
      />

      {/* ── 5. Short description ───────────────────────────────────── */}
      {product.shortDescription ? (
        <div
          className="mt-5 font-serif text-base sm:text-lg italic text-muted leading-relaxed [&_p]:mb-0"
          dangerouslySetInnerHTML={{ __html: product.shortDescription }}
        />
      ) : null}

      {/* ── 6. Divider ──────────────────────────────────────────────── */}
      <hr className="mt-7 border-border" />

      {/* ── 7. Color swatches ───────────────────────────────────────── */}
      {buckets.color ? (
        <ColorSwatchPicker
          label={buckets.color.name}
          options={buckets.color.options}
          value={selected[buckets.color.id] ?? null}
          availability={colorAvailability}
          onChange={updateSelection(buckets.color.id)}
          className="mt-7"
        />
      ) : null}

      {/* ── 8. Size picker + Size Guide ─────────────────────────────── */}
      {buckets.size ? (
        <SizePicker
          label={buckets.size.name}
          options={buckets.size.options}
          value={selected[buckets.size.id] ?? null}
          availability={sizeAvailability}
          onChange={updateSelection(buckets.size.id)}
          headerAction={<SizeGuideModal defaultTab={sizeGuideTab} />}
          className="mt-7"
        />
      ) : null}

      {/* ── 9. Other variation attributes (fallback) ───────────────── */}
      {buckets.other.length > 0 ? (
        <div className="mt-7">
          <VariantPicker
            attributes={buckets.other}
            value={selected}
            onChange={(next) => setSelected((prev) => ({ ...prev, ...next }))}
          />
        </div>
      ) : null}

      {/* ── 10. Stock scarcity ──────────────────────────────────────── */}
      <StockScarcity
        product={product}
        {...(matchingVariation ? { variation: matchingVariation } : {})}
        className="mt-6 self-start"
      />

      {/* ── 11. Free-shipping progress ──────────────────────────────── */}
      {!isOutOfStock ? (
        <FreeShippingProgress
          pendingCents={effectivePrice.amount * quantity}
          className="mt-6"
        />
      ) : null}

      {/* ── 12. Action row: Quantity + ATC + Heart ──────────────────── */}
      <div className="mt-5 flex items-stretch gap-2 sm:gap-3">
        {!isOutOfStock ? (
          <QuantityStepper
            value={quantity}
            min={1}
            max={effectiveStockQty && effectiveStockQty > 0 ? effectiveStockQty : 10}
            onChange={setQuantity}
            aria-label="Quantity"
            className="h-13 sm:h-14 shrink-0"
          />
        ) : null}

        <Button
          ref={addBtnRef}
          size="lg"
          full
          disabled={disabled}
          loading={isPending}
          onClick={handleAdd}
          className="flex-1 h-13 sm:h-14 text-sm sm:text-base"
        >
          {ctaLabel}
        </Button>

        <WishlistIconButton product={product} size="lg" />
      </div>

      {/* ── 13. Buy It Now ──────────────────────────────────────────── */}
      {!isOutOfStock ? (
        <BuyNowButton
          product={product}
          {...(matchingVariation ? { variation: matchingVariation } : {})}
          disabled={disabled}
          className="mt-3"
        />
      ) : null}

      {/* ── 14. Shipping estimate ───────────────────────────────────── */}
      {!isOutOfStock ? <ShippingEstimate className="mt-5" /> : null}

      {/* ── 15. Trust strip ─────────────────────────────────────────── */}
      <TrustStrip className="mt-5" />

      {/* ── 16. Social proof ────────────────────────────────────────── */}
      {!isOutOfStock ? (
        <SocialProofSignal seed={product.id} className="mt-4" />
      ) : null}

      {/* ── 17. Back-in-stock form (OOS only) ───────────────────────── */}
      {isOutOfStock ? (
        <div className="mt-6">
          <BackInStockForm
            productId={product.id}
            {...(matchingVariation?.id ? { variationId: matchingVariation.id } : {})}
            productName={product.name}
          />
        </div>
      ) : null}

      {/* Sticky bar — slides up when main button scrolls out */}
      <StickyAddToCart
        watchRef={addBtnRef}
        product={product}
        matchingVariation={matchingVariation}
        selectionLabel={selectionLabel}
        disabled={disabled}
        label={stickyLabel}
      />

      {/* SR-only live region for stock changes */}
      <span className="sr-only" aria-live="polite">
        {effectiveStockStatus === "low_stock"
          ? "Low stock — order soon"
          : effectiveStockStatus === "out_of_stock"
            ? "Out of stock"
            : ""}
      </span>
    </section>
  );
}

function formatLine(price: { amount: number; currency: string }, qty: number): string {
  const total = (price.amount * qty) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(total);
}
