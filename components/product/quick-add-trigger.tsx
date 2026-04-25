"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { QuickAddModal } from "@/components/product/quick-add-modal";
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

    // Simple product — fetch full Product, then add 1 to cart.
    setPending(true);
    void (async () => {
      try {
        const res = await fetch(`/api/product/${encodeURIComponent(product.slug)}`, {
          headers: { accept: "application/json" },
        });
        const json = (await res.json()) as
          | { ok: true; data: Product }
          | { ok: false; error: { message: string } };

        if (!res.ok || !json.ok) {
          showToast("Could not add to cart — try opening the product page", "error");
          return;
        }

        const full = json.data;

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
      />
    </>
  );
}
