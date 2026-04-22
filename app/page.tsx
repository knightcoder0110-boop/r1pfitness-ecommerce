import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { ProductRail } from "@/components/product/product-rail";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";
import Marquee from "@/components/marquee";
import { StatementMarquee } from "@/components/marketing/statement-marquee";
import { TrustBar } from "@/components/marketing/trust-bar";
import { ProductSpotlight } from "@/components/marketing/product-spotlight";
import { CategoryScroller } from "@/components/marketing/category-scroller";
import { CategoryGrid } from "@/components/marketing/category-grid";
import { Testimonials } from "@/components/marketing/testimonials";
import { CommunityUgc } from "@/components/marketing/community-ugc";
import { CampaignCountdown } from "@/components/campaign/campaign-countdown";
import { siteConfig } from "@/lib/siteConfig";
import { ROUTES, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "R1P FITNESS — REBORN 1N PARADISE",
  description:
    "Exclusive Hawaiian streetwear & fitness apparel. Limited drops, 24 hours only. Waipahu, HI.",
};

export const revalidate = 3600;

export default async function HomePage() {
  const catalog = getCatalog();

  // Single data fetch — pass products to all sections that need them.
  const [{ items: allFeatured }, { items: bestSellers }] = await Promise.all([
    catalog.listProducts({ sort: "featured", pageSize: 8 }),
    catalog.listProducts({ sort: "newest", pageSize: 4 }),
  ]);

  // First product becomes the spotlight hero; remaining 4 fill the grid.
  const [spotlightSummary, ...gridProducts] = allFeatured;

  // Fetch the full product (with variations + attributes) for the spotlight.
  // We need the complete data for the inline variant picker + add-to-cart.
  const spotlightProduct = spotlightSummary
    ? await catalog.getProductBySlug(spotlightSummary.slug)
    : null;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main">
        {/* ══════════════════════════════════════════════════════════
            1. HERO — cinematic full-viewport opener
            ══════════════════════════════════════════════════════════ */}
        <section
          aria-label="Hero"
          className="relative overflow-hidden bg-bg min-h-[85vh] flex items-center pt-[var(--size-header)]"
        >
          {/* Hero background image */}
          <Image
            src="/images/hero/king-of-kings-collection-cover-image.jpg"
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Dark overlay — heavier at edges, lighter at centre so text pops */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg/80"
          />
          {/* Left-edge fade for readability on wide screens */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-bg/60 via-transparent to-bg/60"
          />

          {/* Grid texture (on top of image) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--color-border)/0.12)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--color-border)/0.12)_1px,transparent_1px)] bg-[size:44px_44px]"
          />

          {/* Radial glow from bottom-left */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]"
          />

          <Container className="relative z-10 flex flex-col items-center justify-center py-32 sm:py-40 gap-8 text-center">
            {/* Location pill */}
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-gold" aria-hidden="true" />
              <p className="font-mono text-[10px] uppercase tracking-[0.55em] text-gold">
                Waipahu, Hawaii · Est. 2026
              </p>
              <span className="h-px w-6 bg-gold" aria-hidden="true" />
            </div>

            {/* Main wordmark */}
            <h1 className="font-display text-[clamp(4rem,16vw,10.5rem)] leading-none tracking-[0.06em] text-text">
              {SITE.name}
            </h1>

            {/* Italic tagline */}
            <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-muted max-w-lg leading-relaxed">
              Reborn 1n Paradise
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <Link
                href={ROUTES.shop}
                className={buttonVariants({ size: "lg" })}
              >
                Shop the Drop
              </Link>
              <Link
                href={ROUTES.category("tees")}
                className={buttonVariants({ variant: "tertiary", size: "lg" })}
              >
                Browse Tees
              </Link>
            </div>

            {/* Scroll hint */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-40" aria-hidden="true">
              <div className="w-px h-8 bg-gold" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4 text-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </Container>
        </section>

        {/* ══════════════════════════════════════════════════════════
            2. TICKER MARQUEE — thin band of brand identity
            ══════════════════════════════════════════════════════════ */}
        <Marquee />

        {/* ══════════════════════════════════════════════════════════
            2b. DROP COUNTDOWN — shown only when nextDropDate is set
            ══════════════════════════════════════════════════════════ */}
        {siteConfig.nextDropDate && (
          <Section
            aria-labelledby="countdown-heading"
            spacing="md"
            bordered="bottom"
          >
            <div className="flex flex-col items-center gap-8 text-center">
              <div>
                <p
                  id="countdown-heading"
                  className="font-mono text-[10px] uppercase tracking-[0.55em] text-gold mb-2"
                >
                  Next Drop
                </p>
                <p className="font-serif italic text-muted">
                  Limited run. 24 hours only. You&apos;ve been warned.
                </p>
              </div>

              <CampaignCountdown dropDate={siteConfig.nextDropDate} />

              <Link
                href={ROUTES.shop}
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted underline hover:text-gold transition-colors"
              >
                Browse current drop →
              </Link>
            </div>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            3. TRUST BAR — 5 signals in gold
            ══════════════════════════════════════════════════════════ */}
        <TrustBar />

        {/* ══════════════════════════════════════════════════════════
            4. PRODUCT SPOTLIGHT — hero feature of the first drop
            ══════════════════════════════════════════════════════════ */}
        {spotlightProduct && (
          <ProductSpotlight
            product={spotlightProduct}
            tagline="Featured Drop"
            layout="image-left"
          />
        )}

        {/* ══════════════════════════════════════════════════════════
            5. STATEMENT MARQUEE #1 — oversized scrolling type
            ══════════════════════════════════════════════════════════ */}
        <StatementMarquee
          items={[
            { text: "Reborn 1n Paradise", style: "filled" },
            { text: "Ohana Forever", style: "outline" },
            { text: "24H Drops Only", style: "gold" },
            { text: "Waipahu, HI", style: "gold-outline" },
            { text: "Discipline Club", style: "filled" },
            { text: "R1P Fitness", style: "outline" },
          ]}
          speedSeconds={24}
          direction="left"
        />

        {/* ══════════════════════════════════════════════════════════
            6. NEW ARRIVALS GRID — 4 products
            ══════════════════════════════════════════════════════════ */}
        {gridProducts.length > 0 && (
          <ProductRail
            eyebrow="New Arrivals"
            title="Latest Drops"
            viewAllHref={ROUTES.shop}
            items={gridProducts.slice(0, 4)}
          />
        )}

        {/* ══════════════════════════════════════════════════════════
            7. CATEGORY BENTO GRID — shop by category
            ══════════════════════════════════════════════════════════ */}
        <CategoryGrid />

        {/* ══════════════════════════════════════════════════════════
            8. SECOND STATEMENT MARQUEE — reversed direction
            ══════════════════════════════════════════════════════════ */}
        <StatementMarquee
          items={[
            { text: "Iron Will", style: "gold" },
            { text: "Frozen Fury", style: "outline" },
            { text: "Regal Rage", style: "filled" },
            { text: "Shadow Hunter", style: "gold-outline" },
            { text: "Reborn Strong", style: "filled" },
            { text: "Never Fold", style: "gold" },
          ]}
          speedSeconds={20}
          direction="right"
        />

        {/* ══════════════════════════════════════════════════════════
            9. CATEGORY SCROLLER — horizontal snap-scroll on mobile
            ══════════════════════════════════════════════════════════ */}
        <CategoryScroller />

        {/* ══════════════════════════════════════════════════════════
            10. BRAND STORY — text + stat grid
            ══════════════════════════════════════════════════════════ */}
        <Section
          aria-labelledby="story-heading"
          spacing="lg"
          bordered="top"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px w-8 bg-gold" aria-hidden="true" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold">
                    Our Story
                  </p>
                </div>
                <h2
                  id="story-heading"
                  className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-none tracking-wide text-text"
                >
                  BORN IN WAIPAHU.
                  <br />
                  BUILT FOR THE GRIND.
                </h2>
                <p className="mt-6 font-serif italic text-lg text-muted leading-relaxed">
                  R1P FITNESS started as a garage gym and a dream. Every piece we
                  drop carries the spirit of our &lsquo;ohana — the early mornings,
                  the heavy sets, and the fire that keeps us going.
                </p>
                <p className="mt-4 text-sm text-subtle leading-relaxed">
                  We don&apos;t do restocks. Each design is a 24-hour limited drop. Miss it
                  and it&apos;s gone forever. That&apos;s the R1P way.
                </p>
                <div className="mt-10">
                  <Link
                    href={ROUTES.shop}
                    className={buttonVariants({ size: "md" })}
                  >
                    Shop the collection
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { number: "24H", label: "Drop window only" },
                    { number: "100%", label: "Limited edition" },
                    { number: "HI", label: "Made with aloha" },
                    { number: "∞", label: "Ohana always" },
                  ] as const
                ).map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-border bg-surface-1 p-8 flex flex-col gap-3 rounded-sm"
                  >
                    <span className="font-display text-5xl leading-none tracking-wider text-text">
                      {stat.number}
                    </span>
                    <div className="h-px w-6 bg-gold" aria-hidden="true" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            11. TESTIMONIALS — community reviews
            ══════════════════════════════════════════════════════════ */}
        <Testimonials />
        {/* ════════════════════════════════════════════════════════
            11b. COMMUNITY UGC — #r1pfitness Instagram wall
            ═══════════════════════════════════════════════════════ */}
        <CommunityUgc />
        {/* ══════════════════════════════════════════════════════════
            12. BEST SELLERS — additional 4-product row
            ══════════════════════════════════════════════════════════ */}
        {bestSellers.length > 0 && (
          <ProductRail
            eyebrow="Fan Favourites"
            title="Best Sellers"
            viewAllHref={ROUTES.shop}
            items={bestSellers}
            bordered="top"
          />
        )}
      </main>

      <SiteFooter />
      <CartDrawer />
    </>
  );
}
