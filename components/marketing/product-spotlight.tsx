import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { SpotlightPurchase } from "@/components/marketing/spotlight-purchase";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/lib/woo/types";

export interface ProductSpotlightProps {
  /** Full product (with variations, attributes, meta). */
  product: Product;
  /** Gold monospace eyebrow above the title — e.g. "Featured Drop". */
  tagline?: string;
  /** Short editorial copy shown between title and price. */
  subtext?: string;
  /**
   * Which side the image appears on.
   * `image-left` (default) or `image-right` for alternation on multi-spotlight pages.
   */
  layout?: "image-left" | "image-right";
  className?: string;
}

/**
 * Full-viewport product spotlight — the R1P equivalent of a Shopify
 * "Featured Product" section.
 *
 * Layout:
 *  Desktop │ [full-height photo]  │  eyebrow · title · price · variants · ATC
 *          │  max-h: min(840px, 100vh-header)
 *
 *  Mobile  │  [landscape 4:3 photo]
 *          │  eyebrow · title · price · variants · ATC
 *
 * Design principles:
 *  - Image fills its column with `object-cover` — no fixed aspect pushing height.
 *  - Text column is vertically centred, scrollable only if content overflows.
 *  - Variants (size, color…) and Add-to-Cart live directly in the section.
 *  - Gold lustre CTA matches the hero button — consistent call-to-action language.
 *  - Editorial details: noise texture, watermark letter, bottom-gold-rule hover.
 *
 * Server component — SpotlightPurchase is the isolated client island.
 */
export function ProductSpotlight({
  product,
  tagline = "Featured Drop",
  subtext,
  layout = "image-left",
  className,
}: ProductSpotlightProps) {
  const primaryImage = product.images[0];
  const onSale =
    product.compareAtPrice &&
    product.compareAtPrice.amount > product.price.amount;
  const outOfStock = product.stockStatus === "out_of_stock";
  const lowStock =
    product.stockStatus === "low_stock" ||
    (product.stockQuantity !== undefined &&
      product.stockQuantity > 0 &&
      product.stockQuantity <= 4);
  const isLimited = product.meta.isLimited;

  // Discount percentage pill (e.g. "SAVE 25%")
  const discountPct =
    onSale && product.compareAtPrice
      ? Math.round(
          (1 - product.price.amount / product.compareAtPrice.amount) * 100,
        )
      : null;

  const imageRight = layout === "image-right";

  return (
    <section
      aria-label={`Featured: ${product.name}`}
      className={cn(
        "group relative w-full overflow-hidden border-y border-border",
        /* 2-col on desktop */
        "grid grid-cols-1 md:grid-cols-2 md:items-stretch",
        className,
      )}
    >
      {/* ── Image column ─────────────────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden bg-surface-2",
          /* 2:3 portrait on both mobile and desktop — image drives section height */
          "aspect-2/3",
          imageRight && "md:order-2",
        )}
      >
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            priority
          />
        ) : (
          /* Branded placeholder when no image is available */
          <div className="absolute inset-0 bg-linear-to-br from-surface-2 to-surface-3 flex items-center justify-center">
            <span
              className="font-display text-7xl tracking-widest text-muted opacity-30"
              aria-hidden="true"
            >
              R1P
            </span>
          </div>
        )}

        {/* Noise texture overlay — premium film-grain feel */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />

        {/* Bottom scrim — subtle fade into section bg on mobile stacked layout */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-bg/40 to-transparent md:hidden"
        />

        {/* Faint large watermark letter — top-right corner */}
        <span
          aria-hidden="true"
          className="absolute -top-4 -right-2 font-display leading-none select-none text-white/4 pointer-events-none"
          style={{ fontSize: "clamp(6rem, 18vw, 11rem)" }}
        >
          {product.name.charAt(0).toUpperCase()}
        </span>

        {/* Gold rule slides in from left on hover — same pattern as CategoryScroller */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold transition-[width] duration-700 ease-out group-hover:w-full"
        />

        {/* SOLD OUT overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-bg/65 flex items-center justify-center">
            <span className="font-display text-4xl tracking-widest text-muted">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* ── Content column ───────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex flex-col justify-center",
          "gap-6 py-10 px-6 sm:px-10 lg:px-14",
          /* Scroll if content somehow overflows on a very short viewport */
          "md:overflow-y-auto",
          imageRight && "md:order-1",
        )}
      >
        {/* Vertical gold accent — subtle left bar on the text column */}
        <span
          aria-hidden="true"
          className="hidden md:block absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-gold/20"
        />

        {/* ── Eyebrow ────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="h-px w-8 shrink-0 bg-gold" aria-hidden="true" />
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold">
            {tagline}
          </p>
        </div>

        {/* ── Product title ──────────────────────────────────── */}
        <h2 className="font-display text-[clamp(2.25rem,5.5vw,4.5rem)] leading-none tracking-wide text-text text-left">
          {product.name.toUpperCase()}
        </h2>

        {/* ── Subtext / description snippet ─────────────────── */}
        {/* shortDescription comes from WooCommerce as raw HTML (e.g. <p>…</p>),
            so we use dangerouslySetInnerHTML to render it correctly. */}
        {(subtext ?? product.shortDescription) && (
          subtext ? (
            <p className="text-muted text-sm sm:text-base max-w-sm leading-relaxed -mt-2">
              {subtext}
            </p>
          ) : (
            <div
              className="text-muted text-sm sm:text-base max-w-sm leading-relaxed -mt-2 [&_p]:mb-0 [&_a]:text-gold [&_a]:underline"
              // WooCommerce short_description is server-sanitized HTML — safe to render.
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )
        )}

        {/* ── Price row ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            size="lg"
          />
          {discountPct && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm bg-coral/15 border border-coral/40 font-mono text-[9px] uppercase tracking-[0.25em] text-coral">
              Save {discountPct}%
            </span>
          )}
        </div>

        {/* ── Badge row ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 -mt-2">
          {isLimited && <Badge tone="gold">Limited Edition</Badge>}
          {onSale && !discountPct && <Badge tone="coral">Sale</Badge>}
          {outOfStock ? (
            <Badge tone="neutral">Sold Out</Badge>
          ) : lowStock && product.stockQuantity ? (
            <Badge tone="danger">Only {product.stockQuantity} left</Badge>
          ) : lowStock ? (
            <Badge tone="danger">Low Stock</Badge>
          ) : null}
          {product.meta.printMethod && (
            <Badge tone="ocean">{product.meta.printMethod}</Badge>
          )}
        </div>

        {/* ── Variant picker + Add to Cart (client island) ───── */}
        <SpotlightPurchase product={product} />

        {/* ── View full details link ─────────────────────────── */}
        <Link
          href={ROUTES.product(product.slug)}
          className="self-start font-mono text-[9px] uppercase tracking-[0.35em] text-muted hover:text-gold transition-colors duration-200"
        >
          View full details →
        </Link>
      </div>
    </section>
  );
}
