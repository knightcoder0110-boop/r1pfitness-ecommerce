import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaign, isCampaignLive } from "@/lib/campaigns";
import { getCatalog } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { CampaignCountdown } from "@/components/campaign/campaign-countdown";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import Sparkles from "@/components/sparkles";
import { ROUTES } from "@/lib/constants";

interface Props {
  params: Promise<{ campaign: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { campaign: slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) return {};
  return {
    title: `${campaign.name} — R1P FITNESS DROP`,
    description: campaign.description,
    robots: { index: true, follow: true },
  };
}

export const revalidate = 60;

export default async function CampaignDropPage({ params }: Props) {
  const { campaign: slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign || !campaign.isActive) notFound();

  const isLive = isCampaignLive(campaign);
  const catalog = getCatalog();

  // Fetch featured products for this campaign's category
  const { items: products } = isLive
    ? await catalog.listProducts({
        category: campaign.categorySlug,
        sort: "featured",
        pageSize: 8,
      })
    : { items: [] };

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section
          aria-label={`${campaign.name} drop`}
          className="relative overflow-hidden bg-bg border-b border-border min-h-[60vh] flex items-center"
        >
          <Sparkles count={40} />

          {/* Spotlight glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]"
          />

          <Container className="relative z-10 flex flex-col items-center text-center py-24 sm:py-36 gap-8">
            {/* Campaign badge */}
            <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-coral animate-pulse"}`}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
                {isLive ? "Live Now" : "Coming Soon"}
              </span>
            </div>

            {/* Name */}
            <h1 className="font-display text-[clamp(3rem,12vw,7rem)] leading-none tracking-widest text-text">
              {campaign.name}
            </h1>

            {/* Tagline */}
            <p className="font-serif italic text-xl sm:text-2xl text-subtle max-w-md">
              {campaign.tagline}
            </p>

            {/* Countdown (only if not yet live) */}
            {!isLive && campaign.dropDate && (
              <div className="mt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted mb-6">
                  Drop goes live in
                </p>
                <CampaignCountdown dropDate={campaign.dropDate} />
              </div>
            )}

            {/* CTA */}
            {isLive ? (
              <Link
                href={ROUTES.category(campaign.categorySlug)}
                className={buttonVariants({ size: "lg" })}
              >
                Shop the Drop
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="font-serif italic text-sm text-muted">
                  {campaign.description}
                </p>

                {/* Pre-drop email capture */}
                <form
                  action="https://manage.kmail-lists.com/subscriptions/subscribe"
                  method="POST"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-2 mt-2"
                >
                  <input
                    type="hidden"
                    name="g"
                    value={campaign.klaviyoListId}
                  />
                  <label htmlFor="drop-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="drop-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="w-56 sm:w-64 bg-bg border border-border px-4 py-2.5 font-mono text-sm text-text placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="submit"
                    className={buttonVariants({ size: "sm" })}
                  >
                    Notify Me
                  </button>
                </form>

                <p className="font-mono text-[10px] text-faint">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
            )}
          </Container>
        </section>

        {/* ── Products (post-drop) ───────────────────────────────────── */}
        {isLive && products.length > 0 && (
          <section
            aria-labelledby="drop-products-heading"
            className="py-20 sm:py-28"
          >
            <Container>
              <div className="mb-10 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
                  {campaign.name}
                </p>
                <h2
                  id="drop-products-heading"
                  className="mt-1 font-display text-3xl sm:text-4xl tracking-wider text-text"
                >
                  Drop Pieces
                </h2>
              </div>
              <ProductGrid items={products} />
            </Container>
          </section>
        )}

        {/* ── No products fallback ──────────────────────────────────── */}
        {isLive && products.length === 0 && (
          <section className="py-20 text-center">
            <Container size="sm">
              <p className="font-display text-2xl tracking-wider text-muted">
                Products dropping soon
              </p>
              <p className="mt-3 font-serif italic text-subtle">
                Check back shortly — items will appear here when the drop goes live.
              </p>
              <Link
                href={ROUTES.shop}
                className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.25em] text-muted underline hover:text-text"
              >
                Browse the full shop
              </Link>
            </Container>
          </section>
        )}
      </main>

      <SiteFooter />
      <CartDrawer />
    </>
  );
}
