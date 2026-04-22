import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { ProductSummary } from "@/lib/woo/types";

export interface ProductCardProps {
  product: ProductSummary;
  /** Loading priority for the image (first row should be eager). */
  priority?: boolean;
  className?: string;
}

/**
 * Premium editorial product card for R1P FITNESS.
 *
 * Design intent:
 *  - 2:3 tall portrait ratio — the standard for luxury streetwear product imagery
 *  - Dark-frosted quick-view strip slides up on hover from the image bottom
 *  - Thin gold sweep rule at the image edge (brand signature)
 *  - Hover image crossfades in at full opacity
 *  - Sold-out: grayscale + subtle overlay text
 *  - Info row: display title (line-clamp) + mono price + hover arrow
 *
 * Two separate <Link>s keep the HTML valid while giving the image hover
 * area its own interactive affordance. Touch users tap the info link.
 */
export function ProductCard({ product, priority, className }: ProductCardProps) {
  const onSale = product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;
  const outOfStock = product.stockStatus === "out_of_stock";
  const lowStock = product.stockStatus === "low_stock";

  return (
    <article
      aria-label={product.name}
      className={cn("group relative flex flex-col", className)}
    >
      {/* ── Image block ─────────────────────────────────────────────── */}
      <div className="relative aspect-card w-full overflow-hidden rounded-sm bg-surface-2">

        {/* Primary image */}
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || product.name}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className={cn(
              "object-cover transition-[transform,opacity] duration-700 ease-out",
              !outOfStock && !product.hoverImage && "group-hover:scale-[1.04]",
              !outOfStock && product.hoverImage && "group-hover:opacity-0",
              outOfStock && "grayscale opacity-40",
            )}
          />
        ) : (
          /* Branded placeholder when no image */
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="select-none font-display text-6xl tracking-widest text-surface-3"
              aria-hidden="true"
            >
              R1P
            </span>
          </div>
        )}

        {/* Hover image (crossfade) */}
        {product.hoverImage && !outOfStock && (
          <Image
            src={product.hoverImage.url}
            alt={product.hoverImage.alt || `${product.name} — alternate view`}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}

        {/* Sold-out label inside image */}
        {outOfStock && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center"
            aria-hidden="true"
          >
            <span className="font-display text-xl tracking-[0.35em] text-white/35 uppercase">
              Sold Out
            </span>
          </div>
        )}

        {/* Badges — top-left */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.isLimited ? <Badge tone="gold">Limited</Badge> : null}
          {onSale ? <Badge tone="coral">Sale</Badge> : null}
          {lowStock ? <Badge tone="neutral">Low stock</Badge> : null}
        </div>

        {/* Quick-view strip — dark frosted glass slides up on hover */}
        {!outOfStock && (
          <Link
            href={ROUTES.product(product.slug)}
            tabIndex={-1}
            aria-hidden
            className={cn(
              "absolute inset-x-0 bottom-0 z-10",
              "flex items-center justify-between gap-2 px-4 py-3",
              "bg-bg/88 backdrop-blur-[4px] border-t border-white/[0.06]",
              "translate-y-full group-hover:translate-y-0",
              "transition-transform duration-300 ease-out",
            )}
          >
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.4em] text-gold">
              Quick View
            </span>
            <span aria-hidden className="text-sm leading-none text-gold">
              →
            </span>
          </Link>
        )}

        {/* Gold sweep — brand signature bottom accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 bg-gold transition-[width] duration-500 ease-out group-hover:w-full"
        />
      </div>

      {/* ── Info — separate link keeps HTML valid ────────────────────── */}
      <Link
        href={ROUTES.product(product.slug)}
        className={cn(
          "flex flex-col gap-1 pt-3.5 pb-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        )}
      >
        {/* Product name */}
        <h3 className="line-clamp-2 font-display text-base leading-snug tracking-[0.15em] text-text transition-colors duration-200 group-hover:text-gold">
          {product.name}
        </h3>

        {/* Price + hover arrow */}
        <div className="mt-0.5 flex items-center justify-between">
          <Price
            price={product.price}
            {...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {})}
            size="sm"
          />
          <span
            aria-hidden
            className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            →
          </span>
        </div>
      </Link>
    </article>
  );
}
