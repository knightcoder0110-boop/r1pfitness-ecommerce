"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { VariantPicker } from "@/components/product/variant-picker";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { trackAddToCart } from "@/lib/analytics";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { Product, ProductSummary, ProductVariation } from "@/lib/woo/types";

interface QuickAddModalProps {
  /** Closed state is also represented by the host card; modal hides itself when open=false. */
  open: boolean;
  onClose: () => void;
  /** Listing-card summary — used as instant header content while the full Product loads. */
  summary: ProductSummary;
  /**
   * Pre-fetched full Product from the trigger's hover-prefetch.
   * When provided, the modal skips its own fetch and renders the picker
   * immediately — no loading skeleton visible to the user.
   */
  prefetchedProduct?: Product | null;
}

interface FetchState {
  status: "idle" | "loading" | "ready" | "error";
  product?: Product;
  errorMessage?: string;
}

/**
 * Quick Add modal — opens from a product card so customers can pick variants
 * and add to cart without leaving the listing page.
 *
 * Behaviour:
 *  - Fetches the full Product (with attributes + variations) from
 *    `/api/product/[slug]` on first open. Cached in component state for the
 *    lifetime of the modal instance.
 *  - Pre-selects the first option of every required attribute so the Add
 *    button is enabled by default for fast checkout.
 *  - Disables the Add button when the resolved variation is out of stock
 *    or when the selection is incomplete (defensive — `VariantPicker` always
 *    provides full defaults).
 *  - Falls back to a "View full details" link when the BFF errors so the
 *    customer can still reach the PDP.
 *  - Esc, backdrop click and the X button all close the modal.
 *  - Body scroll is locked while open and restored on close.
 *  - Uses createPortal to escape any backdrop-filter / transform stacking
 *    context on parents (consistent with mobile-nav).
 */
export function QuickAddModal({ open, onClose, summary, prefetchedProduct }: QuickAddModalProps) {
  const [mounted, setMounted] = useState(false);
  // If the trigger already prefetched the product (hover), initialise
  // directly to "ready" so the modal shows the picker with zero latency.
  const [fetchState, setFetchState] = useState<FetchState>(() =>
    prefetchedProduct
      ? { status: "ready", product: prefetchedProduct }
      : { status: "idle" },
  );
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    // Pre-select first option for every variation attribute when we already
    // have the product (prefetch case).
    if (!prefetchedProduct) return {};
    const initial: Record<string, string> = {};
    for (const a of prefetchedProduct.attributes) {
      if (a.variation && a.options[0]) initial[a.id] = a.options[0];
    }
    return initial;
  });
  const [isPending, setIsPending] = useState(false);
  // Track whether we've already seeded the selection once so we don't
  // clobber the user's choices if the component re-renders.
  const selectionSeeded = useRef(false);
  if (prefetchedProduct && !selectionSeeded.current) {
    selectionSeeded.current = true;
  }

  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);

  // Hydration guard — createPortal needs document.
  useEffect(() => setMounted(true), []);

  // When the prefetchedProduct prop arrives (prefetch completes while modal
  // is already open), update fetch state immediately.
  useEffect(() => {
    if (!prefetchedProduct) return;
    setFetchState((prev) => {
      if (prev.status === "ready") return prev;
      return { status: "ready", product: prefetchedProduct };
    });
    if (!selectionSeeded.current) {
      selectionSeeded.current = true;
      const initial: Record<string, string> = {};
      for (const a of prefetchedProduct.attributes) {
        if (a.variation && a.options[0]) initial[a.id] = a.options[0];
      }
      setSelected(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetchedProduct]);

  // Body scroll lock + Esc key — only while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Fetch full product on first open ONLY when we don't already have data.
  useEffect(() => {
    if (!open) return;
    if (fetchState.status === "ready") return;  // prefetch or previous fetch done
    if (fetchState.status === "loading") return; // already in flight

    let cancelled = false;
    setFetchState({ status: "loading" });

    void (async () => {
      try {
        const res = await fetch(`/api/product/${encodeURIComponent(summary.slug)}`, {
          headers: { accept: "application/json" },
        });
        const json = (await res.json()) as
          | { ok: true; data: Product }
          | { ok: false; error: { code: string; message: string } };

        if (cancelled) return;

        if (!res.ok || !json.ok) {
          const message =
            !json.ok && json.error?.message ? json.error.message : "Could not load product details";
          setFetchState({ status: "error", errorMessage: message });
          return;
        }

        setFetchState({ status: "ready", product: json.data });

        // Pre-select first option of every variation attribute.
        if (!selectionSeeded.current) {
          selectionSeeded.current = true;
          const initial: Record<string, string> = {};
          for (const a of json.data.attributes) {
            if (a.variation && a.options[0]) initial[a.id] = a.options[0];
          }
          setSelected(initial);
        }
      } catch (err) {
        if (cancelled) return;
        setFetchState({
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Network error",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, summary.slug]);
  // Intentionally exclude fetchState.status from deps — we guard with early
  // returns at the top; adding it would cause spurious re-runs on every status
  // transition.

  const product = fetchState.product;

  const requiredAttrs = useMemo(
    () => product?.attributes.filter((a) => a.variation) ?? [],
    [product],
  );
  const allSelected = requiredAttrs.every((a) => Boolean(selected[a.id]));

  // Resolve matching variation from the current attribute selection.
  const matchingVariation: ProductVariation | undefined = useMemo(() => {
    if (!product?.variations.length || !allSelected) return undefined;
    return product.variations.find((v) =>
      Object.entries(selected).every(([k, val]) => v.attributes[k] === val),
    );
  }, [product, selected, allSelected]);

  const productOutOfStock = product?.stockStatus === "out_of_stock";
  const variationOutOfStock = matchingVariation?.stockStatus === "out_of_stock";
  const needsSelection = requiredAttrs.length > 0 && !allSelected;
  const isVariable = requiredAttrs.length > 0;
  // For a variable product we also require the resolved variation to actually
  // exist — covers exotic catalogs where some attribute combinations have no
  // matching variation row.
  const hasResolvedVariation = !isVariable || Boolean(matchingVariation);

  const disabled =
    !product ||
    productOutOfStock ||
    needsSelection ||
    variationOutOfStock ||
    !hasResolvedVariation ||
    isPending;

  const buttonLabel = !product
    ? "Loading…"
    : productOutOfStock
      ? "Sold Out"
      : needsSelection
        ? "Select options"
        : variationOutOfStock || !hasResolvedVariation
          ? "Unavailable"
          : isPending
            ? "Adding…"
            : "Add to Cart";

  // Image: prefer the resolved variation image, fall back to the product hero.
  const displayImage =
    matchingVariation?.image ?? product?.images[0] ?? summary.image ?? undefined;

  // Price: prefer the resolved variation, fall back to product, then summary.
  const displayPrice = matchingVariation?.price ?? product?.price ?? summary.price;
  const displayCompareAt =
    matchingVariation?.compareAtPrice ??
    product?.compareAtPrice ??
    summary.compareAtPrice;

  const onSale =
    displayCompareAt && displayCompareAt.amount > displayPrice.amount;

  function handleAdd() {
    if (disabled || !product) return;
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
    onClose();
  }

  if (!mounted) return null;

  const overlay = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.button
            type="button"
            key="quick-add-backdrop"
            aria-label="Close quick add"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-60 bg-[#0D0D0D]/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Panel */}
          <motion.div
            key="quick-add-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Quick add — ${summary.name}`}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className={cn(
              "fixed left-1/2 top-1/2 z-61 w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)]",
              "-translate-x-1/2 -translate-y-1/2 bg-[#141414] rounded-lg border border-border shadow-overlay",
              "overflow-hidden flex flex-col",
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-border shrink-0">
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold">
                  Quick Add
                </p>
                <h2 className="font-display text-lg tracking-wider text-text mt-0.5 line-clamp-2">
                  {summary.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted hover:text-text transition-colors text-2xl leading-none cursor-pointer shrink-0"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-5 py-5 flex flex-col gap-5">
                {/* Image + price row */}
                <div className="flex gap-4">
                  <div className="relative shrink-0 size-24 sm:size-28 overflow-hidden rounded-sm bg-surface-2">
                    {displayImage ? (
                      <Image
                        src={displayImage.url}
                        alt={displayImage.alt || summary.name}
                        fill
                        sizes="(min-width: 640px) 7rem, 6rem"
                        className={cn(
                          "object-cover",
                          (productOutOfStock || variationOutOfStock) && "grayscale opacity-50",
                        )}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span
                          aria-hidden
                          className="select-none font-display text-2xl tracking-widest text-surface-3"
                        >
                          R1P
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {summary.isLimited ? <Badge tone="gold">Limited</Badge> : null}
                      {onSale ? <Badge tone="coral">Sale</Badge> : null}
                      {productOutOfStock ? (
                        <Badge tone="danger">Sold Out</Badge>
                      ) : variationOutOfStock ? (
                        <Badge tone="neutral">Variant out of stock</Badge>
                      ) : null}
                    </div>
                    <Price
                      price={displayPrice}
                      {...(displayCompareAt ? { compareAtPrice: displayCompareAt } : {})}
                      size="md"
                    />
                  </div>
                </div>

                {/* Body content — varies with fetch state */}
                {fetchState.status === "loading" || fetchState.status === "idle" ? (
                  <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
                    <div className="h-3 w-24 rounded-sm bg-surface-2 animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-9 w-12 rounded-sm bg-surface-2 animate-pulse" />
                      <div className="h-9 w-12 rounded-sm bg-surface-2 animate-pulse" />
                      <div className="h-9 w-12 rounded-sm bg-surface-2 animate-pulse" />
                      <div className="h-9 w-12 rounded-sm bg-surface-2 animate-pulse" />
                    </div>
                  </div>
                ) : fetchState.status === "error" ? (
                  <div className="flex flex-col gap-3">
                    <p className="font-mono text-xs text-coral">
                      {fetchState.errorMessage ?? "Could not load product details."}
                    </p>
                    <Link
                      href={ROUTES.product(summary.slug)}
                      className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold underline underline-offset-4 hover:text-gold/80"
                      onClick={onClose}
                    >
                      View full details →
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Variant picker (only when product has variation attrs) */}
                    {requiredAttrs.length > 0 ? (
                      <VariantPicker
                        attributes={product!.attributes}
                        value={selected}
                        onChange={setSelected}
                      />
                    ) : (
                      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
                        No options to choose — ready to add.
                      </p>
                    )}

                    {/* Link to PDP for full info / back-in-stock notify form */}
                    <Link
                      href={ROUTES.product(summary.slug)}
                      onClick={onClose}
                      className="self-start font-mono text-[10px] uppercase tracking-[0.3em] text-muted underline underline-offset-4 hover:text-gold transition-colors"
                    >
                      View full details
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Footer CTA — sticky-ish at the bottom of the panel */}
            <div className="border-t border-border px-5 py-4 shrink-0 bg-[#141414]">
              <Button
                type="button"
                size="md"
                disabled={disabled}
                onClick={handleAdd}
                className="w-full"
              >
                {buttonLabel}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
