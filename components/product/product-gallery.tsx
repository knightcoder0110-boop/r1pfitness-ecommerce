"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
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
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const active = images[index] ?? images[0];

  if (!active) {
    return (
      <div className="aspect-[4/5] w-full rounded-sm bg-surface-1" aria-hidden />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-surface-1">
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

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" role="tablist" aria-label={`${productName} images`}>
          {images.map((img, i) => {
            const selected = i === index;
            return (
              <li key={img.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={`Show image ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "relative aspect-square w-full overflow-hidden rounded-sm border transition-colors",
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
