import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { ImageRef, ProductSummary } from "@/lib/woo/types";

export interface ProductSpotlightProps {
  /** The product to feature. */
  product: ProductSummary;
  /** Optional editorial tagline shown above the product title. */
  tagline?: string;
  /** Optional short copy shown between title and price. */
  subtext?: string;
  /**
   * Which side the image appears on.
   * `image-left` (default) or `image-right` for alternation on multi-spotlight pages.
   */
  layout?: "image-left" | "image-right";
  className?: string;
}

/**
 * Oversized editorial product feature — 2-column split on desktop, stacked on mobile.
 *
 * Design intent: Show one "hero" product per section with large photography,
 * limited-drop framing (badge + countdown hint), and a gold CTA.
 * Inspired by the Shopify theme's `product-spotlight.liquid` section.
 *
 * Server component — no client JS.
 */
export function ProductSpotlight({
  product,
  tagline = "LIMITED DROP",
  subtext,
  layout = "image-left",
  className,
}: ProductSpotlightProps) {
  const image: ImageRef | undefined = product.image;
  const onSale =
    product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;
  const outOfStock = product.stockStatus === "out_of_stock";

  const imageCol = (
    <div className="relative aspect-card w-full overflow-hidden bg-surface-2">
      {image ? (
        <Image
          src={image.url}
          alt={image.alt || product.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
      ) : (
        /* Placeholder gradient when no image is available */
        <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-surface-3 flex items-center justify-center">
          <span className="font-display text-6xl tracking-widest text-muted opacity-40" aria-hidden="true">
            R1P
          </span>
        </div>
      )}
      {outOfStock && (
        <div className="absolute inset-0 bg-bg/60 flex items-center justify-center">
          <span className="font-display text-4xl tracking-widest text-muted">
            SOLD OUT
          </span>
        </div>
      )}
    </div>
  );

  const textCol = (
    <div className="flex flex-col justify-center gap-6 py-12 px-6 sm:px-10 lg:px-16">
      {/* Eyebrow */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-gold" aria-hidden="true" />
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold">
          {tagline}
        </p>
      </div>

      {/* Title */}
      <h2 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-none tracking-wide text-text">
        {product.name.toUpperCase()}
      </h2>

      {/* Optional subtext */}
      {subtext && (
        <p className="text-subtle text-base sm:text-lg max-w-sm leading-relaxed">
          {subtext}
        </p>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="lg"
        />
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        {onSale && <Badge tone="coral">SALE</Badge>}
        {product.isLimited && <Badge tone="gold">LIMITED</Badge>}
        {product.stockStatus === "low_stock" && (
          <Badge tone="danger">LOW STOCK</Badge>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-3 mt-2">
        <Link
          href={ROUTES.product(product.slug)}
          className={cn(
            buttonVariants({ size: "lg" }),
            /* Gold lustre treatment matching Shopify theme hero-banner style */
            "relative overflow-hidden bg-[linear-gradient(170deg,#D4AF55_0%,#C9A84C_45%,#9A7C2C_100%)] text-bg",
            "before:absolute before:inset-0 before:bg-[linear-gradient(170deg,rgba(255,255,255,0.35)_0%,transparent_60%)] before:pointer-events-none",
            "hover:brightness-110 transition-[filter] duration-200",
          )}
          aria-disabled={outOfStock}
        >
          {outOfStock ? "SOLD OUT" : "SHOP THE DROP"}
        </Link>
        <Link
          href={ROUTES.shop}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          VIEW ALL
        </Link>
      </div>
    </div>
  );

  return (
    <section
      aria-label={`Featured: ${product.name}`}
      className={cn(
        "group w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden border-y border-border",
        className,
      )}
    >
      {layout === "image-left" ? (
        <>
          {imageCol}
          {textCol}
        </>
      ) : (
        <>
          {textCol}
          {imageCol}
        </>
      )}
    </section>
  );
}
