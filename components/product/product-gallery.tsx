"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useActiveVariationStore } from "@/lib/active-variation-store";
import type { ImageRef } from "@/lib/woo/types";

export interface ProductGalleryProps {
  images: ImageRef[];
  productName: string;
}

/**
 * Product media gallery — redesigned with side thumbnail filmstrip.
 *
 * Layout:
 *  • Mobile  → main image (3:4 aspect) stacked above a horizontal thumb strip.
 *  • Desktop → vertical thumb filmstrip on the LEFT, main image fills the rest.
 *              The whole gallery is height-capped at min(100vh − header − padding, 720px)
 *              so the hero image is always fully visible without scrolling.
 *
 * Thumbnails match the product 3:4 aspect ratio for visual consistency.
 * The active thumbnail gets a gold border. Filmstrip scrolls when there are
 * more images than fit on screen.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const variantImage = useActiveVariationStore((s) => s.variantImage);

  // Build the full image list: variant image (if any) + product images (deduped).
  const allImages: ImageRef[] = variantImage
    ? [variantImage, ...images.filter((img) => img.id !== variantImage.id)]
    : images;

  // When a variant image appears, jump to index 0 automatically.
  const activeIndex = variantImage ? 0 : (manualIndex ?? 0);
  const active = allImages[activeIndex] ?? allImages[0];

  if (!active) {
    return (
      <div className="aspect-3/4 w-full rounded-sm bg-surface-1" aria-hidden />
    );
  }

  return (
    /*
     * Outer wrapper: on desktop this provides an explicit height so flex-1
     * on the main image stretches to fill it. On mobile there is no height
     * set — the 3:4 aspect ratio drives the height naturally.
     */
    <div className="lg:h-[min(calc(100vh-8rem),720px)]">
      <div className="flex h-full flex-col gap-3 lg:flex-row">

        {/* ── Thumbnail filmstrip ─────────────────────────────────────
            Mobile : horizontal strip BELOW the main image (order-last).
            Desktop: vertical strip on the LEFT (lg:order-first), 72px wide.
        ────────────────────────────────────────────────────────────── */}
        {allImages.length > 1 ? (
          <ul
            role="tablist"
            aria-label={`${productName} images`}
            className={cn(
              // Mobile: horizontal, no scrollbar visible, below main image
              "order-last flex flex-row gap-2 overflow-x-auto [scrollbar-width:none]",
              // Desktop: vertical left strip, scrollable if overflow
              "lg:order-first lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto",
              "lg:w-18 lg:shrink-0",
              "lg:[scrollbar-width:thin] lg:[scrollbar-color:var(--color-border)_transparent]",
            )}
          >
            {allImages.map((img, i) => {
              const selected = i === activeIndex;
              return (
                <li key={img.id} className="shrink-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={`Show image ${i + 1}`}
                    onClick={() => setManualIndex(i)}
                    className={cn(
                      // Mobile: fixed 64px width  |  Desktop: full 72px strip width
                      "relative block w-16 lg:w-full aspect-3/4 overflow-hidden rounded-sm border",
                      "transition-colors duration-150 cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
                      selected
                        ? "border-gold"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {/* ── Main image ──────────────────────────────────────────────
            Mobile : 3:4 aspect ratio drives height.
            Desktop: aspect-auto + flex-1 fills the height-capped container.
        ────────────────────────────────────────────────────────────── */}
        <div
          className={cn(
            "relative overflow-hidden rounded-sm bg-surface-1",
            "aspect-3/4",
            "lg:aspect-auto lg:flex-1 lg:min-h-0",
          )}
        >
          <Image
            key={active.id}
            src={active.url}
            alt={active.alt || productName}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

      </div>
    </div>
  );
}
