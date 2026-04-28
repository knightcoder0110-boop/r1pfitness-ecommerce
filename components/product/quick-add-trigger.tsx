"use client";

import { useCallback, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { QuickAddModal } from "@/components/product/quick-add-modal";
import {
  getCachedQuickAddProduct,
  loadQuickAddProduct,
} from "@/components/product/quick-add-product-cache";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { trackAddToCart } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import type { Product, ProductSummary } from "@/lib/woo/types";

interface QuickAddTriggerProps {
  product: ProductSummary;
  className?: string;
}

function summaryNeedsVariantSelection(product: ProductSummary) {
  return (
    (product.variantCount ?? 0) > 0 ||
    (product.colorOptions?.length ?? 0) > 0 ||
    (product.sizeOptions?.length ?? 0) > 0
  );
}

function fullProductNeedsVariantSelection(product: Product) {
  return (
    product.variations.length > 0 ||
    product.attributes.some((attribute) => attribute.variation && attribute.options.length > 0)
  );
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
  // Prefetched full Product — populated on hover/touchstart so the modal
  // can display instantly when the user actually clicks.
  const [prefetched, setPrefetched] = useState<Product | null>(() =>
    getCachedQuickAddProduct(product.slug, product.id),
  );

  const { addItem, open: openCart } = useServerCart();
  const showToast = useToastStore((s) => s.show);

  // Heuristic for "this product needs variant selection". `variantCount` is
  // populated from raw.variations.length in the mapper; the option arrays
  // catch products whose attributes are surfaced without explicit variations.
  const isVariable = summaryNeedsVariantSelection(product);

  const label = isVariable ? "Quick Add" : "Add to Cart";

  /**
   * Start a prefetch to the BFF. Called on intent signals only (hover, focus,
   * touchstart). Avoid viewport-wide prefetching here: Woo's variation REST
   * endpoint slows down sharply when many products are fetched concurrently.
   */
  const startPrefetch = useCallback(() => {
    if (prefetched) return;
    void loadQuickAddProduct(product.slug, product.id).then((full) => {
      if (full) setPrefetched(full);
    });
  }, [prefetched, product.id, product.slug]);

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
        const full = prefetched ?? (await loadQuickAddProduct(product.slug, product.id));
        if (!full) {
          showToast("Could not add to cart — try opening the product page", "error");
          return;
        }

        // Wishlist items saved before variant metadata existed may look like
        // simple products in the summary. Always trust the fetched product
        // before doing a one-click add.
        if (fullProductNeedsVariantSelection(full)) {
          setPrefetched(full);
          setModalOpen(true);
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
        type="button"
        onClick={handleClick}
        onMouseEnter={startPrefetch}
        onFocus={startPrefetch}
        onTouchStart={startPrefetch}
        disabled={pending}
        aria-label={`${label}: ${product.name}`}
        className={cn(
          // Positioned as a solid bar at the bottom of the card image
          "absolute inset-x-0 bottom-0 z-10",
          "flex items-center justify-center gap-2 py-3",
          // Solid metallic gold — matches the primary Button variant
          "bg-[linear-gradient(170deg,#E6C56A_0%,#D4AF55_28%,#C9A84C_55%,#A88934_100%)]",
          "text-bg shadow-metallic",
          // Mobile: always visible; ≥ sm: slide up on group-hover
          "translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0",
          "transition-[transform,filter,box-shadow] duration-300 ease-out",
          "hover:brightness-[1.07] hover:shadow-metallic-hover",
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-55",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset",
          className,
        )}
      >
        <ShoppingBag aria-hidden className="size-3.5 shrink-0" strokeWidth={2.5} />
        <span className="font-mono text-[10px] font-semibold tracking-[0.35em] uppercase">
          {pending ? "Adding…" : label}
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
