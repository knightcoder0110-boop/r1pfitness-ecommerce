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
 * Product listing card. Uses an <article> wrapper so interactive children
 * (two separate <Link>s, quick-add overlay) are all valid descendants without
 * the HTML crime of an <a> inside an <a>.
 *
 * Hover effects:
 *  - Primary image: subtle scale-up (or crossfades out when hoverImage exists)
 *  - Hover image (when available): crossfades in at full opacity
 *  - Quick-add strip: slides up from the bottom of the image
 */
export function ProductCard({ product, priority, className }: ProductCardProps) {
  const onSale = product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;
  const outOfStock = product.stockStatus === "out_of_stock";
  const lowStock = product.stockStatus === "low_stock";

  return (
    <article
      aria-label={product.name}
      className={cn("group relative flex flex-col gap-3", className)}
    >
      {/* ── Image block ─────────────────────────────────────────────── */}
      <div className="relative aspect-card w-full overflow-hidden rounded-sm bg-surface-1">

        {/* Primary image */}
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className={cn(
              "object-cover transition-[transform,opacity] duration-500",
              !outOfStock && !product.hoverImage && "group-hover:scale-105",
              !outOfStock && product.hoverImage && "group-hover:opacity-0",
              outOfStock && "opacity-40",
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-faint font-mono text-xs">
            NO IMAGE
          </div>
        )}

        {/* Hover image (crossfade) — shown only when a second gallery image exists */}
        {product.hoverImage && !outOfStock && (
          <Image
            src={product.hoverImage.url}
            alt={product.hoverImage.alt || `${product.name} — alternate view`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.isLimited ? <Badge tone="gold">Limited</Badge> : null}
          {onSale ? <Badge tone="coral">Sale</Badge> : null}
          {lowStock ? <Badge tone="neutral">Low stock</Badge> : null}
          {outOfStock ? <Badge tone="danger">Sold out</Badge> : null}
        </div>

        {/* Quick-add overlay — slides up from the bottom on group-hover.
            Uses a separate <Link> (not a button inside another anchor). */}
        {!outOfStock && (
          <Link
            href={ROUTES.product(product.slug)}
            tabIndex={-1}
            aria-hidden
            className={cn(
              "absolute inset-x-0 bottom-0 z-10",
              "flex items-center justify-between gap-2 px-4 py-3",
              "bg-[linear-gradient(170deg,#D4AF55_0%,#C9A84C_45%,#9A7C2C_100%)] text-bg",
              "translate-y-full group-hover:translate-y-0",
              "transition-transform duration-300 ease-out",
            )}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] font-semibold">
              Quick Add
            </span>
            <span aria-hidden className="text-xs opacity-80">→</span>
          </Link>
        )}
      </div>

      {/* ── Info — separate link so HTML remains valid ───────────────── */}
      <Link
        href={ROUTES.product(product.slug)}
        className={cn(
          "flex flex-col gap-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        )}
      >
        <h3 className="font-display text-lg tracking-wider text-text group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <Price
          price={product.price}
          {...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {})}
          size="sm"
        />
      </Link>
    </article>
  );
}
