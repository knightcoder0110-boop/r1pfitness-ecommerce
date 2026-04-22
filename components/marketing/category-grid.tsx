/**
 * CategoryGrid — Bento shop-by-category grid
 *
 * Mirrors the Shopify theme's category-grid.liquid bento layout,
 * adapted for WooCommerce / Next.js 15 App Router.
 *
 * Card anatomy (matching the liquid source exactly):
 *   ┌────────────────────────────────────────────────┐
 *   │  MEDIA AREA                                    │
 *   │  · Gradient bg (scale 1.06 on hover)           │
 *   │  · Film-grain noise overlay                    │
 *   │  · Centred watermark letter (very faint)       │
 *   │  · Tagline pill (top-left, like liquid's       │
 *   │    product-count pill)                         │
 *   │  · Bottom gradient scrim                       │
 *   │  aspect-ratio: 2/3 (--aspect-card, portrait)  │
 *   ├────────────────────────────────────────────────┤
 *   │  BODY BAR                                      │
 *   │  · Category name  (Bebas Neue, gold on hover)  │
 *   │  · "Shop collection"  (mono subline)           │
 *   │  · Arrow circle  (→ gold-fill + shift on hover)│
 *   └────────────────────────────────────────────────┘
 *
 * Bento layout (desktop lg+, 4-col):
 *   ┌──────────────────────┬──────────┬──────────┐
 *   │                      │  Card B  │  Card C  │
 *   │  Card A — featured   │          │          │
 *   │  (col-span-2 ×       ├──────────┼──────────┤
 *   │   row-span-2)        │  Card D  │  Card E  │
 *   └──────────────────────┴──────────┴──────────┘
 *
 *   Tablet sm–lg : 2-col flat grid (bento resets to 1×1)
 *   Mobile        : 2-col flat grid
 *
 * Server component — zero client JS.
 */

import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

/* ─── Static enrichment ──────────────────────────────────────────────────
   WooCommerce ProductCategory = { id, name, slug } — no image or count.
   We enrich each known slug with a 3-stop gradient + an editorial tagline.
   Any unknown slug falls back to the cycling palette below.
──────────────────────────────────────────────────────────────────────── */
const CATEGORY_META = {
  tees: {
    gradient: "linear-gradient(150deg,#180800 0%,#3c1e00 45%,#5a2c08 100%)",
    tagline: "Vintage wash. Limited runs.",
  },
  hoodies: {
    gradient: "linear-gradient(150deg,#04060c 0%,#091324 50%,#0e2040 100%)",
    tagline: "Heavyweight comfort.",
  },
  bottoms: {
    gradient: "linear-gradient(150deg,#050b03 0%,#0d1c06 50%,#162c0c 100%)",
    tagline: "Train hard. Look clean.",
  },
  caps: {
    gradient: "linear-gradient(150deg,#100507 0%,#260d0e 50%,#381416 100%)",
    tagline: "Represent everywhere.",
  },
  accessories: {
    gradient: "linear-gradient(150deg,#05050c 0%,#0b0e24 50%,#10163e 100%)",
    tagline: "Finish the fit.",
  },
  activewear: {
    gradient: "linear-gradient(150deg,#090907 0%,#141208 50%,#201b0b 100%)",
    tagline: "Built for performance.",
  },
} satisfies Record<string, { gradient: string; tagline: string }>;

const FALLBACK_GRADIENTS = [
  "linear-gradient(150deg,#180800 0%,#3c1e00 45%,#5a2c08 100%)",
  "linear-gradient(150deg,#04060c 0%,#091324 50%,#0e2040 100%)",
  "linear-gradient(150deg,#050b03 0%,#0d1c06 50%,#162c0c 100%)",
  "linear-gradient(150deg,#100507 0%,#260d0e 50%,#381416 100%)",
  "linear-gradient(150deg,#05050c 0%,#0b0e24 50%,#10163e 100%)",
  "linear-gradient(150deg,#090907 0%,#141208 50%,#201b0b 100%)",
];

/* ─── Film-grain noise (shared pattern across all editorial sections) ─── */
const NOISE_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  backgroundSize: "200px 200px",
} as const;

/* ── Prop types ─────────────────────────────────────────────────────────── */
export interface CategoryGridProps {
  className?: string;
}

/* ────────────────────────────────────────────────────────────────────────
   SERVER COMPONENT
──────────────────────────────────────────────────────────────────────── */
export async function CategoryGrid({ className }: CategoryGridProps) {
  const catalog = getCatalog();
  const categories = await catalog.listCategories();
  const filtered = categories.filter((c) => c.slug !== "uncategorized");

  if (filtered.length === 0) return null;

  /* 5 cards: 1 featured (2×2 hero) + 4 regular fill the 2×2 right quadrant */
  const display = filtered.slice(0, 5);
  const [featured, ...rest] = display;

  return (
    <Section
      aria-labelledby="cat-grid-heading"
      spacing="lg"
      bordered="y"
      containerSize="xl"
      className={className}
    >
      <SectionHeader
        id="cat-grid-heading"
        eyebrow="Collections"
        title="Shop by category"
        viewAllHref={ROUTES.collections}
        align="center"
      />

      {/*
        ─── Bento grid ──────────────────────────────────────────────────────
        lg+  : 4-col. Featured spans col-span-2 × row-span-2.
               Row heights driven by the regular cards' aspect-card ratio.
               Featured fills its 2-row slot via `h-full` + `flex-1` media.
        sm–lg: 2-col flat (bento resets; featured collapses to 1×1).
        xs   : 2-col flat.
      */}
      <ul
        className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4"
        role="list"
      >
        {featured && (
          <li className="lg:col-span-2 lg:row-span-2">
            <CategoryCard cat={featured} index={0} featured />
          </li>
        )}

        {rest.map((cat, i) => (
          <li key={cat.id}>
            <CategoryCard cat={cat} index={i + 1} featured={false} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   CARD
   Two-part structure that matches cat-grid-card in the Shopify liquid:
     Part 1 — MEDIA AREA: gradient + effects, tall portrait aspect-ratio
     Part 2 — BODY BAR:   category name + subline + arrow circle
──────────────────────────────────────────────────────────────────────── */
function CategoryCard({
  cat,
  index,
  featured,
}: {
  cat: { id: string; name: string; slug: string };
  index: number;
  featured: boolean;
}) {
  const meta =
    CATEGORY_META[cat.slug.toLowerCase() as keyof typeof CATEGORY_META];
  const gradient =
    meta?.gradient ?? FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const tagline = meta?.tagline;

  return (
    <Link
      href={`/shop?category=${cat.slug}`}
      className={cn(
        /* Flex column so media + body stack */
        "group flex flex-col overflow-hidden",
        /* Border */
        "border border-white/[0.08]",
        /* Hover: lift + deep shadow + solid gold ring — exact liquid values */
        "transition-[border-color,transform,box-shadow] duration-[400ms]",
        "[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
        "will-change-transform",
        "hover:border-gold hover:-translate-y-1",
        "hover:shadow-[0_24px_56px_rgba(0,0,0,0.60),0_0_0_1px_rgba(201,168,76,1)]",
        /* Focus ring */
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        /* Desktop featured: fills the 2-row bento slot */
        featured && "lg:h-full",
      )}
      aria-label={`Shop ${cat.name}`}
    >

      {/* ═══════════════════════════════════════════════════════════
          PART 1 — MEDIA AREA
          Regular cards: aspect-card (2:3 portrait — tall editorial).
          Featured (lg): flex-1 so it fills the bento 2-row height.
          Featured (sm/mobile): aspect-card same as any other card.
          ═══════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          "relative overflow-hidden",
          /* Regular cards always portrait */
          "aspect-card",
          /* Featured on desktop: override aspect, fill remaining flex height */
          featured && "lg:[aspect-ratio:auto] lg:flex-1 lg:min-h-[300px]",
        )}
      >
        {/* Gradient bg — scales on hover (mirrors liquid scale(1.06)) */}
        <div
          className="absolute inset-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          style={{ background: gradient }}
          aria-hidden="true"
        />

        {/* Film-grain noise — same as CategoryScroller */}
        <div
          className="absolute inset-0 opacity-[0.055] mix-blend-overlay pointer-events-none"
          style={NOISE_STYLE}
          aria-hidden="true"
        />

        {/* Bottom scrim — ensures body-bar area is readable */}
        <div
          className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/50 to-transparent"
          aria-hidden="true"
        />

        {/* Centred watermark letter — editorial depth, very faint */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display leading-none select-none pointer-events-none text-white/[0.04]"
          style={{
            fontSize: featured
              ? "clamp(10rem,30vw,22rem)"
              : "clamp(6rem,18vw,14rem)",
          }}
        >
          {cat.name.charAt(0).toUpperCase()}
        </span>

        {/* Tagline pill — top-left, mirrors liquid's product-count pill */}
        {tagline && (
          <div
            className="absolute top-3.5 left-3.5 px-2.5 py-[5px] rounded-full bg-bg/[0.72] backdrop-blur-sm border border-white/[0.10]"
            aria-hidden="true"
          >
            <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-muted leading-none whitespace-nowrap">
              {tagline}
            </span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PART 2 — BODY BAR
          Matches cat-grid-card__body: title (left) + arrow (right).
          Sits on a slightly raised surface so it reads as a distinct
          zone — same as the liquid's card body background.
          ═══════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          "px-4 sm:px-5",
          featured ? "py-4 sm:py-[18px]" : "py-3.5 sm:py-4",
          "bg-surface-1 border-t border-white/[0.06]",
        )}
      >
        {/* Title + subline */}
        <div className="flex flex-col gap-[5px] min-w-0">
          <h3
            className={cn(
              "font-display leading-none tracking-[0.04em] text-text",
              "transition-colors duration-[250ms] group-hover:text-gold",
              featured
                ? "text-[clamp(1.1rem,1.75vw,1.65rem)]"
                : "text-[clamp(0.9rem,1.35vw,1.2rem)]",
            )}
          >
            {cat.name.toUpperCase()}
          </h3>
          <p className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-subtle leading-none">
            Shop collection
          </p>
        </div>

        {/* Arrow circle — gold-fills and nudges right on hover */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center rounded-full",
            "border border-border text-subtle",
            "transition-[background-color,border-color,color,transform] duration-[250ms]",
            "group-hover:bg-gold group-hover:border-gold group-hover:text-bg group-hover:translate-x-[3px]",
            featured ? "size-9 sm:size-10" : "size-8 sm:size-9",
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={featured ? "size-4" : "size-3.5"}
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>

    </Link>
  );
}
