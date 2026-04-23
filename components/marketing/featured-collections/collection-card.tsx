import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Collection, CollectionBadge } from "./data";

/* ─── Badge ─────────────────────────────────────────────────────────────── */
const BADGE_STYLES: Record<NonNullable<CollectionBadge>, string> = {
  "new-drop":
    "bg-gold text-bg font-mono text-[9px] uppercase tracking-[0.28em] px-2.5 py-1",
  limited:
    "bg-text text-bg font-mono text-[9px] uppercase tracking-[0.28em] px-2.5 py-1",
  exclusive:
    "bg-coral text-text font-mono text-[9px] uppercase tracking-[0.28em] px-2.5 py-1",
};

const BADGE_LABELS: Record<NonNullable<CollectionBadge>, string> = {
  "new-drop": "New Drop",
  limited: "Limited",
  exclusive: "Exclusive",
};

/* ─── Noise SVG (film-grain texture, shared across editorial cards) ──────── */
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* ─── CollectionCard ─────────────────────────────────────────────────────── */
export interface CollectionCardProps {
  collection: Collection;
  /** True when this card is the center/featured card (slightly taller on desktop). */
  featured?: boolean;
  className?: string;
}

/**
 * Single collection card.
 *
 * Anatomy:
 *   ┌──────────────────────────────┐
 *   │  [badge top-left]            │
 *   │                              │
 *   │  background image / gradient │
 *   │                              │
 *   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← bottom scrim
 *   │  [icon]                      │
 *   │  COLLECTION NAME             │
 *   │  XX ITEMS                    │
 *   │  ──────────────              │
 *   │  SHOP NOW  →                 │
 *   └──────────────────────────────┘
 *
 * Hover: image scales 1.06, border brightens to gold tint.
 * Server component — no state.
 */
export function CollectionCard({
  collection,
  featured = false,
  className,
}: CollectionCardProps) {
  return (
    <Link
      href={collection.href}
      aria-label={`Shop ${collection.name} — ${collection.itemCount} items`}
      className={cn(
        "group relative flex flex-col overflow-hidden",
        "aspect-editorial",
        "border border-white/8 hover:border-gold/40",
        "transition-[border-color] duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        // Desktop: all cards same height; featured card gets extra height
        featured
          ? "min-h-105 md:min-h-120"
          : "min-h-95 md:min-h-110",
        // Mobile snap: fixed width so cards don't collapse
        "w-[72vw] max-w-75 shrink-0 snap-start",
        // Desktop: reset to auto so grid takes over
        "md:w-auto md:max-w-none md:shrink md:snap-none",
        className,
      )}
    >
      {/* ── Background ──────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        style={{ background: collection.gradient }}
      />

      {/* Actual product image (when provided) */}
      {collection.image && (
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        >
          <Image
            src={collection.image}
            alt=""
            fill
            sizes="(max-width: 768px) 72vw, 20vw"
            className="object-cover object-center"
          />
        </div>
      )}

      {/* Film-grain noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: NOISE_BG, backgroundSize: "200px 200px" }}
      />

      {/* ── Badge ──────────────────────────────────────────────────── */}
      {collection.badge && (
        <span
          className={cn(
            "absolute top-3 left-3 z-10",
            BADGE_STYLES[collection.badge],
          )}
        >
          {BADGE_LABELS[collection.badge]}
        </span>
      )}

      {/* ── Bottom scrim ────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[65%] bg-linear-to-t from-black/95 via-black/50 to-transparent"
      />

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 mt-auto flex flex-col items-center gap-2 px-4 pb-5 pt-6 text-center">
        {/* Collection icon */}
        <span className="text-gold mb-1 transition-transform duration-300 group-hover:-translate-y-0.5">
          {collection.icon}
        </span>

        {/* Name */}
        <h3 className="font-display uppercase text-text text-[clamp(1.1rem,3vw,1.45rem)] leading-none tracking-[0.06em]">
          {collection.name}
        </h3>

        {/* Item count */}
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted">
          {collection.itemCount} Items
        </p>

        {/* Divider */}
        <span className="mt-2 block h-px w-10 bg-gold/40" aria-hidden="true" />

        {/* Shop now CTA */}
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-2",
            "font-mono text-[10px] uppercase tracking-[0.32em]",
            "text-muted group-hover:text-gold",
            "transition-colors duration-200",
          )}
        >
          Shop Now
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
            className="size-3 transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8h10M9 4l4 4-4 4"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
}
