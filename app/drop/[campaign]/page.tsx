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
    robots: { index: false, follow: false },
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
          className="bg-bg border-border relative flex min-h-[60vh] items-center overflow-hidden border-b"
        >
          <Sparkles count={40} />

          {/* Spotlight glow */}
          <div
            aria-hidden
            className="bg-accent/5 pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          />

          <Container className="relative z-10 flex flex-col items-center gap-8 py-24 text-center sm:py-36">
            {/* Campaign badge */}
            <div className="border-border inline-flex items-center gap-2 border px-4 py-1.5">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse bg-emerald-500" : "bg-coral animate-pulse"}`}
              />
              <span className="text-muted font-mono text-[10px] tracking-[0.4em] uppercase">
                {isLive ? "Live Now" : "Coming Soon"}
              </span>
            </div>

            {/* Name */}
            <h1 className="font-display text-text text-[clamp(3rem,12vw,7rem)] leading-none tracking-widest">
              {campaign.name}
            </h1>

            {/* Tagline */}
            <p className="text-subtle max-w-md font-serif text-xl italic sm:text-2xl">
              {campaign.tagline}
            </p>

            {/* Countdown (only if not yet live) */}
            {!isLive && campaign.dropDate && (
              <div className="mt-4">
                <p className="text-muted mb-6 font-mono text-[10px] tracking-[0.3em] uppercase">
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
                <p className="text-muted font-serif text-sm italic">{campaign.description}</p>

                {/* Pre-drop email capture */}
                <form
                  action="https://manage.kmail-lists.com/subscriptions/subscribe"
                  method="POST"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex gap-2"
                >
                  <input type="hidden" name="g" value={campaign.klaviyoListId} />
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
                    className="bg-bg border-border text-text placeholder:text-faint focus:ring-accent w-56 border px-4 py-2.5 font-mono text-sm focus:ring-2 focus:outline-none sm:w-64"
                  />
                  <button type="submit" className={buttonVariants({ size: "sm" })}>
                    Notify Me
                  </button>
                </form>

                <p className="text-faint font-mono text-[10px]">No spam. Unsubscribe anytime.</p>
              </div>
            )}
          </Container>
        </section>

        {/* ── Products (post-drop) ───────────────────────────────────── */}
        {isLive && products.length > 0 && (
          <section aria-labelledby="drop-products-heading" className="py-20 sm:py-28">
            <Container>
              <div className="mb-10 text-center">
                <p className="text-muted font-mono text-[10px] tracking-[0.4em] uppercase">
                  {campaign.name}
                </p>
                <h2
                  id="drop-products-heading"
                  className="font-display text-text mt-1 text-3xl tracking-wider sm:text-4xl"
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
              <p className="font-display text-muted text-2xl tracking-wider">
                Products dropping soon
              </p>
              <p className="text-subtle mt-3 font-serif italic">
                Check back shortly — items will appear here when the drop goes live.
              </p>
              <Link
                href={ROUTES.shop}
                className="text-muted hover:text-text mt-6 inline-block font-mono text-xs tracking-[0.25em] uppercase underline"
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
