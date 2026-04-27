"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { QuickAddModal } from "@/components/product/quick-add-modal";
import { getCachedQuickAddProduct, loadQuickAddProduct } from "@/components/product/quick-add-product-cache";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { trackAddToCart } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import type { Product, ProductSummary } from "@/lib/woo/types";

interface QuickAddTriggerProps {
  product: ProductSummary;
  className?: string;
}

/**
 * Quick Add trigger — replaces the old "Quick View" strip on the product card
 * with a real action.
 *
 * Two behaviours, decided from the listing summary:
 *  - Variable product (has color/size options or a positive variantCount)
 *    → opens the Quick Add modal so the customer can pick variants.
 *  - Simple product → fetches the full Product from the BFF and adds it to
 *    the cart in one click. Shows an "Adding…" state while in flight.
 *
 * For sold-out products this trigger is not rendered (the parent card
 * decides) — we redirect those customers to the PDP for back-in-stock
 * notify subscriptions.
 *
 * UX note: visible by default on mobile (no hover affordance there), slides
 * up on hover on ≥ sm to preserve the editorial feel of the card.
 */
export function QuickAddTrigger({ product, className }: QuickAddTriggerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  // Prefetched full Product — populated on hover/touchstart so the modal
  // can display instantly when the user actually clicks.
  const [prefetched, setPrefetched] = useState<Product | null>(
    () => getCachedQuickAddProduct(product.slug, product.id),
  );

  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);

  // Heuristic for "this product needs variant selection". `variantCount` is
  // populated from raw.variations.length in the mapper; the option arrays
  // catch products whose attributes are surfaced without explicit variations.
  const isVariable =
    (product.variantCount ?? 0) > 0 ||
    (product.colorOptions?.length ?? 0) > 0 ||
    (product.sizeOptions?.length ?? 0) > 0;

  const label = isVariable ? "Quick Add" : "Add to Cart";

  /**
   * Start a prefetch to the BFF. Called on hover (desktop) and touchstart
   * (mobile), and also once the trigger enters the viewport for variable
   * products. Shared cache + promise dedupe means repeat opens and concurrent
   * trigger/modal requests collapse into a single fetch.
   */
  const startPrefetch = useCallback(() => {
    if (prefetched) return;
    void loadQuickAddProduct(product.slug, product.id).then((full) => {
      if (full) setPrefetched(full);
    });
  }, [prefetched, product.id, product.slug]);

  useEffect(() => {
    if (!isVariable || prefetched) return;
    const node = buttonRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startPrefetch();
          observer.disconnect();
        }
      },
      { rootMargin: "160px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVariable, prefetched, startPrefetch]);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // The card's image and title are both anchors to the PDP; this button
    // sits inside the image area so we always need to stop the event from
    // bubbling to those parents.
    event.preventDefault();
    event.stopPropagation();

    if (pending) return;

    if (isVariable) {
      setModalOpen(true);
      return;
    }

    // Simple product — use prefetched data if available, else fetch now.
    setPending(true);
    void (async () => {
      try {
        const full = prefetched ?? await loadQuickAddProduct(product.slug, product.id);
        if (!full) {
          showToast("Could not add to cart — try opening the product page", "error");
          return;
        }

        // Defensive: stock could have changed since the listing rendered.
        if (full.stockStatus === "out_of_stock") {
          showToast(`${full.name} is sold out`, "error");
          return;
        }

        await addItem({ product: full, quantity: 1 });
        openCart();
        showToast(`${full.name} added to your cart 🤙`, "success");
        trackAddToCart({
          productId: full.id,
          name: full.name,
          price: full.price,
          quantity: 1,
        });
      } catch {
        showToast("Network error — try again", "error");
      } finally {
        setPending(false);
      }
    })();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={startPrefetch}
        onTouchStart={startPrefetch}
        disabled={pending}
        aria-label={`${label}: ${product.name}`}
        className={cn(
          "absolute inset-x-0 bottom-0 z-10",
          "flex items-center justify-between gap-2 px-4 py-3",
          "bg-bg/88 backdrop-blur-xs border-t border-white/6",
          // Mobile: always visible; ≥ sm: slide up on group-hover.
          "translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0",
          "transition-transform duration-300 ease-out",
          "cursor-pointer disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          className,
        )}
      >
        <span className="flex items-center gap-2">
          <ShoppingBag aria-hidden className="h-3 w-3 text-gold" strokeWidth={2.5} />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.4em] text-gold">
            {pending ? "Adding…" : label}
          </span>
        </span>
        <span aria-hidden className="text-sm leading-none text-gold">
          →
        </span>
      </button>

      <QuickAddModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        summary={product}
        prefetchedProduct={prefetched}
      />
    </>
  );
}
