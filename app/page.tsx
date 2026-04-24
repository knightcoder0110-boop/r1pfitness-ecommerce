import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { ProductRail } from "@/components/product/product-rail";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Section } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";
import { StatementMarquee } from "@/components/marketing/statement-marquee";
import { TrustBar } from "@/components/marketing/trust-bar";
import { ProductSpotlight } from "@/components/marketing/product-spotlight";
import { Testimonials } from "@/components/marketing/testimonials";
import { CommunityUgc } from "@/components/marketing/community-ugc";
import { CampaignCountdown } from "@/components/campaign/campaign-countdown";
import { HeroRebirth } from "@/components/marketing/hero-rebirth";
import { FeaturedCollections } from "@/components/marketing/featured-collections";
import { siteConfig } from "@/lib/siteConfig";
import { ROUTES } from "@/lib/constants";
import type { Product } from "@/lib/woo/types";
import type { Collection } from "@/components/marketing/featured-collections/data";

/* ── Spotlight slugs ─────────────────────────────────────────────────────── */
const SPOTLIGHT_SLUG        = "saved-by-jesus-oversized-vintage-tee";
const DARK_ROMANCE_SLUG     = "dark-romance-heavyweight-tee-valentines-day-edition-r1pfitness";

/* ── Fallback shown if Woo is unreachable or product is missing ── */
const SAVED_BY_JESUS_PRODUCT: Product = {
  id: "static-saved-by-jesus",
  slug: "saved-by-jesus-oversized-vintage-tee",
  name: "Saved By Jesus",
  description:
    "Reborn in faith. The Saved By Jesus oversized vintage tee is a limited R1P drop — premium heavyweight cotton, washed vintage finish, and bold faith-inspired graphics built for the 'ohana that trains with purpose.",
  shortDescription: "Limited oversized vintage tee. Faith over fear.",
  price: { amount: 4500, currency: "USD" },
  compareAtPrice: { amount: 5500, currency: "USD" },
  images: [
    {
      id: "sbj-1",
      url: "/images/products/tees/saved-by-jesus.png",
      alt: "Saved By Jesus oversized vintage tee — R1P Fitness limited drop",
      width: 1200,
      height: 1600,
    },
  ],
  categories: [{ id: "tees", name: "Tees", slug: "tees" }],
  tags: ["limited", "faith", "vintage", "new-drop"],
  attributes: [
    {
      id: "pa_size",
      name: "Size",
      options: ["S", "M", "L", "XL", "XXL"],
      variation: true,
      visible: true,
    },
  ],
  variations: [
    { id: "sbj-v-s",   sku: "SBJ-S",   price: { amount: 4500, currency: "USD" }, stockStatus: "in_stock",     stockQuantity: 8,  attributes: { pa_size: "S" } },
    { id: "sbj-v-m",   sku: "SBJ-M",   price: { amount: 4500, currency: "USD" }, stockStatus: "in_stock",     stockQuantity: 12, attributes: { pa_size: "M" } },
    { id: "sbj-v-l",   sku: "SBJ-L",   price: { amount: 4500, currency: "USD" }, stockStatus: "in_stock",     stockQuantity: 10, attributes: { pa_size: "L" } },
    { id: "sbj-v-xl",  sku: "SBJ-XL",  price: { amount: 4500, currency: "USD" }, stockStatus: "low_stock",    stockQuantity: 3,  attributes: { pa_size: "XL" } },
    { id: "sbj-v-xxl", sku: "SBJ-XXL", price: { amount: 4500, currency: "USD" }, stockStatus: "out_of_stock", stockQuantity: 0,  attributes: { pa_size: "XXL" } },
  ],
  stockStatus: "in_stock",
  stockQuantity: 33,
  meta: {
    fitType: "Oversized",
    fabricDetails: "100% heavyweight cotton, 280gsm",
    printMethod: "Screen printed",
    careInstructions: "Cold wash, hang dry",
    designStory:
      "Faith-inspired art meets Hawaiian streetwear. Limited drop. No restock.",
    isLimited: true,
    dropDate: "2026-04-24T00:00:00Z",
  },
  seo: {
    title: "Saved By Jesus Oversized Vintage Tee — R1P FITNESS Limited Drop",
    description:
      "Limited drop. Oversized vintage heavyweight tee from R1P FITNESS, Waipahu HI.",
  },
};

/* ── Dark Romance fallback (if Woo unreachable) ───────────────────────────── */
const DARK_ROMANCE_PRODUCT: Product = {
  id: "static-dark-romance",
  slug: DARK_ROMANCE_SLUG,
  name: "Dark Romance Heavyweight Tee",
  description:
    "Love was never gentle. It binds, it breaks, it burns — and through it all, the heart endures. The Dark Romance Tee is R1P FITNESS's Valentine's Day statement piece: a collision of classical art, gothic streetwear, and raw gym energy.",
  shortDescription: "Limited Valentine's Day drop. Gothic heavyweight oversized tee.",
  price: { amount: 6500, currency: "USD" },
  images: [
    {
      id: "dr-1",
      url: "https://cdn.shopify.com/s/files/1/0269/6124/8339/files/dark-romance-cover-image.png?v=1770820781",
      alt: "Dark Romance Heavyweight Tee — R1P Fitness Valentine's Day limited drop",
      width: 1200,
      height: 1600,
    },
    {
      id: "dr-2",
      url: "https://cdn.shopify.com/s/files/1/0269/6124/8339/files/dark-romance-front.png?v=1770820783",
      alt: "Dark Romance Tee front — gothic cherub artwork",
      width: 1200,
      height: 1600,
    },
  ],
  categories: [{ id: "tees", name: "Tees", slug: "tees" }],
  tags: ["limited", "gothic", "dark-romance", "valentines"],
  attributes: [
    {
      id: "pa_size",
      name: "Size",
      options: ["S", "M", "L", "XL", "XXL"],
      variation: true,
      visible: true,
    },
  ],
  variations: [
    { id: "dr-v-s",   sku: "DR-S",   price: { amount: 6500, currency: "USD" }, stockStatus: "in_stock",  stockQuantity: 10, attributes: { pa_size: "S" } },
    { id: "dr-v-m",   sku: "DR-M",   price: { amount: 6500, currency: "USD" }, stockStatus: "in_stock",  stockQuantity: 14, attributes: { pa_size: "M" } },
    { id: "dr-v-l",   sku: "DR-L",   price: { amount: 6500, currency: "USD" }, stockStatus: "in_stock",  stockQuantity: 10, attributes: { pa_size: "L" } },
    { id: "dr-v-xl",  sku: "DR-XL",  price: { amount: 6500, currency: "USD" }, stockStatus: "low_stock", stockQuantity: 4,  attributes: { pa_size: "XL" } },
    { id: "dr-v-xxl", sku: "DR-XXL", price: { amount: 6500, currency: "USD" }, stockStatus: "in_stock",  stockQuantity: 6,  attributes: { pa_size: "XXL" } },
  ],
  stockStatus: "in_stock",
  stockQuantity: 44,
  meta: {
    fitType: "Oversized",
    fabricDetails: "100% heavyweight cotton, 300gsm acid-washed",
    printMethod: "Screen printed",
    careInstructions: "Cold wash, hang dry",
    designStory: "Gothic art meets Hawaiian streetwear. Valentine's Day 2026 limited drop.",
    isLimited: true,
    dropDate: "2026-02-14T00:00:00Z",
  },
  seo: {
    title: "Dark Romance Heavyweight Tee — Valentine's Day 2026 | R1P FITNESS",
    description:
      "Limited Valentine's Day 2026 drop. Gothic oversized heavyweight tee from R1P FITNESS.",
  },
};

export const metadata: Metadata = {
  // Use `absolute` to bypass the root layout title template (avoids double-appending "— R1P FITNESS").
  title: { absolute: "R1P FITNESS — REBORN 1N PARADISE" },
  description:
    "Exclusive Hawaiian streetwear & fitness apparel. Limited drops, 24 hours only. Waipahu, HI.",
  openGraph: {
    title: "R1P FITNESS — REBORN 1N PARADISE",
    description: "Exclusive Hawaiian streetwear & fitness apparel. Limited drops, 24 hours only. Waipahu, HI.",
    url: "/",
  },
};

export const revalidate = 3600;

export default async function HomePage() {
  const catalog = getCatalog();

  const [{ items: gridProducts }, { items: bestSellers }, liveSpotlight, liveDarkRomance, { items: faithProducts }] =
    await Promise.all([
      catalog.listProducts({ sort: "featured", pageSize: 4 }),
      catalog.listProducts({ sort: "newest", pageSize: 4 }),
      catalog.getProductBySlug(SPOTLIGHT_SLUG).catch(() => null),
      catalog.getProductBySlug(DARK_ROMANCE_SLUG).catch(() => null),
      catalog.listProducts({ category: "faith", pageSize: 4 }),
    ]);

  const spotlightProduct   = liveSpotlight   ?? SAVED_BY_JESUS_PRODUCT;
  const darkRomanceProduct = liveDarkRomance ?? DARK_ROMANCE_PRODUCT;

  /* ── Map faith products → Collection cards ─────────────────────────────── */
  const faithCollections: Collection[] = faithProducts.map((p) => ({
    id: p.slug,
    name: p.name,
    itemCount: p.variantCount ?? 5,
    href: ROUTES.product(p.slug),
    badge: "new-drop" as const,
    gradient: "linear-gradient(160deg,#04020c 0%,#0b0519 45%,#130828 100%)",
    image: p.image?.url,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-8 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v8m0 0v12m0-12h5m-5 0H7" />
      </svg>
    ),
  }));

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
        <HeroRebirth />

        {/* ── Old hero (kept for reference) ─────────────────────────
        <section
          aria-label="Hero"
          className="relative overflow-hidden bg-bg min-h-[85vh] flex items-center"
        >
          <Image
            src="/images/hero/king-of-kings-collection-cover-image.jpg"
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/55 to-bg/80" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-bg/60 via-transparent to-bg/60" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--color-border)/0.12)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--color-border)/0.12)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />
          <Container className="relative z-10 flex flex-col items-center justify-center py-32 sm:py-40 gap-8 text-center">
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-gold" aria-hidden="true" />
              <p className="font-mono text-[10px] uppercase tracking-[0.55em] text-gold">Waipahu, Hawaii · Est. 2026</p>
              <span className="h-px w-6 bg-gold" aria-hidden="true" />
            </div>
            <h1 className="font-display text-[clamp(4rem,16vw,10.5rem)] leading-none tracking-[0.06em] text-text">{SITE.name}</h1>
            <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-muted max-w-lg leading-relaxed">Reborn 1n Paradise</p>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <Link href={ROUTES.shop} className={buttonVariants({ size: "lg" })}>Shop the Drop</Link>
              <Link href={ROUTES.category("tees")} className={buttonVariants({ variant: "tertiary", size: "lg" })}>Browse Tees</Link>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-40" aria-hidden="true">
              <div className="w-px h-8 bg-gold" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4 text-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </Container>
        </section>
        ── End old hero ─────────────────────────────────────────── */}

        {/* ══════════════════════════════════════════════════════════
            2. TRUST BAR — credibility signals right after hero
            ══════════════════════════════════════════════════════════ */}
        <TrustBar />

        {/* ══════════════════════════════════════════════════════════
            4. DROP COUNTDOWN — urgency/FOMO (shown when active)
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
            5. FEATURED COLLECTIONS — faith collection products
            ══════════════════════════════════════════════════════════ */}
        <FeaturedCollections
          collections={faithCollections.length > 0 ? faithCollections : undefined}
          eyebrow="New Faith Collection"
          title={"FAITH OVER FEAR.\nWEAR YOUR BELIEFS."}
          subtitle="Four pieces. One message. Crafted for those who carry their faith into every rep, every day."
          ctaLabel="Shop Faith Collection"
          ctaHref={ROUTES.category("faith")}
        />

        {/* ══════════════════════════════════════════════════════════
            6. STATEMENT MARQUEE #1 — energise before product grid
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
            7. LATEST DROPS — 4-product new arrivals grid
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
            8. PRODUCT SPOTLIGHT — Saved By Jesus featured drop
            ══════════════════════════════════════════════════════════ */}
        <ProductSpotlight
          product={spotlightProduct}
          tagline="Featured Drop"
          subtext="Faith over fear. Limited drop — no restock."
          layout="image-left"
        />

        {/* ══════════════════════════════════════════════════════════
            9. STATEMENT MARQUEE #2 — pace break before brand story
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
            10. BRAND STORY — emotional connection + stat grid
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
            11. BEST SELLERS — conversion push after brand story
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

        {/* ══════════════════════════════════════════════════════════
            12. PRODUCT SPOTLIGHT — Dark Romance (Valentine's Drop)
            ══════════════════════════════════════════════════════════ */}
        <ProductSpotlight
          product={darkRomanceProduct}
          tagline="Limited Drop"
          subtext="Love was never gentle. Gothic heavyweight tee — no restock."
          layout="image-right"
        />

        {/* ══════════════════════════════════════════════════════════
            13. TESTIMONIALS — social proof
            ══════════════════════════════════════════════════════════ */}
        <Testimonials />

        {/* ══════════════════════════════════════════════════════════
            14. COMMUNITY UGC — #r1pfitness Instagram wall
            ══════════════════════════════════════════════════════════ */}
        <CommunityUgc />
      </main>

      <SiteFooter />
      <CartDrawer />
    </>
  );
}
