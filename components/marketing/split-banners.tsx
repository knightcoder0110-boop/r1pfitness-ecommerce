import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface SplitBannerItem {
  /** Heading text. Will be uppercased. */
  title: string;
  /** Smaller eyebrow / category label. */
  eyebrow?: string;
  /** Short copy line. */
  subtitle?: string;
  /** Absolute image URL. If omitted, a gradient placeholder is used. */
  imageSrc?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref: string;
}

export interface SplitBannersProps {
  items: SplitBannerItem[];
  className?: string;
}

/* ─── Default editorial panels ──────────────────────────────────────────── */
export const DEFAULT_SPLIT_BANNERS: SplitBannerItem[] = [
  {
    eyebrow: "New Arrivals",
    title: "Tees & Tops",
    subtitle: "Vintage wash. Paradise-born designs. Limited quantities.",
    ctaLabel: "SHOP TEES",
    ctaHref: "/shop?category=tees",
  },
  {
    eyebrow: "Fan Favourites",
    title: "Hoodies & Fleece",
    subtitle: "Heavyweight comfort. Built for the ohana.",
    ctaLabel: "SHOP HOODIES",
    ctaHref: "/shop?category=hoodies",
  },
];

/* ─── Gradient placeholders (alternate so cards look distinct) ──────────── */
const GRADIENTS = [
  "from-stone-900 via-stone-800 to-amber-950",
  "from-zinc-900 via-slate-800 to-zinc-900",
];

/* ─── Component ─────────────────────────────────────────────────────────── */

/**
 * Alternating full-bleed editorial banners — one or two side-by-side.
 *
 * When two items are passed, they sit in a 50/50 grid (desktop).
 * When one item is passed, it renders full-width.
 * Image alternates left/right using CSS column ordering when rendered as rows.
 *
 * For the standard homepage pair (Tees / Hoodies), pass `DEFAULT_SPLIT_BANNERS`.
 *
 * Server component — pure CSS transitions, no JS.
 */
export function SplitBanners({ items, className }: SplitBannersProps) {
  if (items.length === 0) return null;

  /* Two-panel side-by-side layout */
  if (items.length === 2) {
    return (
      <section aria-label="Featured collections" className={cn("w-full", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {items.map((item, i) => (
            <BannerCard key={i} item={item} gradientIndex={i} />
          ))}
        </div>
      </section>
    );
  }

  /* Single full-width or stacked multi-banner layout */
  return (
    <section aria-label="Featured collections" className={cn("w-full flex flex-col", className)}>
      {items.map((item, i) => (
        /* Alternate: image-left on even, image-right on odd */
        <BannerRow key={i} item={item} flip={i % 2 !== 0} gradientIndex={i} />
      ))}
    </section>
  );
}

/* ─── Internal: square card (used in the 2-up layout) ───────────────────── */
function BannerCard({
  item,
  gradientIndex,
}: {
  item: SplitBannerItem;
  gradientIndex: number;
}) {
  return (
    <Link
      href={item.ctaHref}
      className={cn(
        "group relative flex aspect-banner overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset",
      )}
      aria-label={item.title}
    >
      {/* Background */}
      {item.imageSrc ? (
        <Image
          src={item.imageSrc}
          alt={item.imageAlt || item.title}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            GRADIENTS[gradientIndex % GRADIENTS.length],
          )}
          aria-hidden="true"
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/20 to-transparent"
        aria-hidden="true"
      />

      {/* Gold rule that slides in from left */}
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-gold w-0 transition-all duration-500 group-hover:w-full"
        aria-hidden="true"
      />

      {/* Text */}
      <div className="relative mt-auto p-8 sm:p-10">
        {item.eyebrow && (
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold mb-2">
            {item.eyebrow}
          </p>
        )}
        <h3 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-wide text-white mb-2">
          {item.title.toUpperCase()}
        </h3>
        {item.subtitle && (
          <p className="text-white/70 text-sm mb-5 max-w-xs">{item.subtitle}</p>
        )}
        <span
          className={cn(
            buttonVariants({ size: "sm" }),
            "pointer-events-none bg-white/10 border border-white/30 text-white backdrop-blur-sm",
            "group-hover:bg-gold group-hover:border-gold group-hover:text-bg transition-colors duration-300",
          )}
          aria-hidden="true"
        >
          {item.ctaLabel ?? "SHOP NOW"}
        </span>
      </div>
    </Link>
  );
}

/* ─── Internal: alternating row (used in 3+ layout) ─────────────────────── */
function BannerRow({
  item,
  flip,
  gradientIndex,
}: {
  item: SplitBannerItem;
  flip: boolean;
  gradientIndex: number;
}) {
  return (
    <div
      className={cn(
        "group grid grid-cols-1 md:grid-cols-2 overflow-hidden border-b border-border",
      )}
    >
      {/* Image column */}
      <div
        className={cn(
          "relative aspect-banner md:aspect-[16/10] overflow-hidden",
          flip && "md:order-last",
        )}
      >
        {item.imageSrc ? (
          <Image
            src={item.imageSrc}
            alt={item.imageAlt || item.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              GRADIENTS[gradientIndex % GRADIENTS.length],
            )}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Text column */}
      <div className="flex flex-col justify-center gap-5 p-10 sm:p-14 bg-surface-1">
        {item.eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold">
            {item.eyebrow}
          </p>
        )}
        <h3 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-none tracking-wide text-text">
          {item.title.toUpperCase()}
        </h3>
        {item.subtitle && (
          <p className="text-muted text-base max-w-sm leading-relaxed">{item.subtitle}</p>
        )}
        <Link href={item.ctaHref} className={buttonVariants({ size: "lg" })}>
          {item.ctaLabel ?? "SHOP NOW"}
        </Link>
      </div>
    </div>
  );
}
