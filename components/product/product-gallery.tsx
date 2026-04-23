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
 * Product media gallery.
 *
 * Client component — state is local (selected thumbnail). Main image is
 * eager/priority so LCP is the hero. Thumbnails lazy-load.
 *
 * When a product variation with an image is selected (via useActiveVariationStore),
 * it is prepended to the gallery and automatically shown as the active image.
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
      <div className="aspect-product w-full rounded-sm bg-surface-1" aria-hidden />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-product w-full overflow-hidden rounded-sm bg-surface-1">
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

      {allImages.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" role="tablist" aria-label={`${productName} images`}>
          {allImages.map((img, i) => {
            const selected = i === activeIndex;
            return (
              <li key={img.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={`Show image ${i + 1}`}
                  onClick={() => setManualIndex(i)}
                  className={cn(
                    "relative aspect-square w-full overflow-hidden rounded-sm border transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    selected ? "border-gold" : "border-border hover:border-muted",
                  )}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
