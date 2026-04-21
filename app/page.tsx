import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import Marquee from "@/components/marquee";
import Manifesto from "@/components/manifesto";
import { ROUTES, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "R1P FITNESS — REBORN 1N PARADISE",
  description:
    "Exclusive Hawaiian streetwear & fitness apparel. Limited drops, 24 hours only. Waipahu, HI.",
};

export const revalidate = 3600;

export default async function HomePage() {
  const catalog = getCatalog();
  const { items: featured } = await catalog.listProducts({
    sort: "featured",
    pageSize: 4,
  });

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main">
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section
          aria-label="Hero"
          className="relative overflow-hidden bg-bg border-b border-border"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--color-border)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--color-border)/0.25)_1px,transparent_1px)] bg-[size:40px_40px]"
          />
          <Container className="relative flex flex-col items-center justify-center py-28 sm:py-40 gap-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted">
              Waipahu, Hawaii · Est. 2026
            </p>
            <h1 className="font-display text-[clamp(3.5rem,14vw,9rem)] leading-none tracking-widest text-text">
              {SITE.name}
            </h1>
            <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-subtle max-w-lg">
              Reborn 1n Paradise
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              <Link href={ROUTES.shop} className={buttonVariants({ size: "lg" })}>
                Shop Now
              </Link>
              <Link href={ROUTES.category("tees")} className={buttonVariants({ variant: "outline", size: "lg" })}>
                Browse Tees
              </Link>
            </div>
          </Container>
        </section>

        {/* ── Marquee ──────────────────────────────────────────────── */}
        <Marquee />

        {/* ── Featured products ────────────────────────────────────── */}
        {featured.length > 0 && (
          <section aria-labelledby="featured-heading" className="py-20 sm:py-28">
            <Container>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
                    New Arrivals
                  </p>
                  <h2
                    id="featured-heading"
                    className="mt-1 font-display text-3xl sm:text-4xl tracking-wider text-text"
                  >
                    Latest Drop
                  </h2>
                </div>
                <Link
                  href={ROUTES.shop}
                  className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.25em] text-muted underline hover:text-text transition-colors"
                >
                  View all &#8594;
                </Link>
              </div>

              <ProductGrid items={featured} />

              <div className="mt-10 flex justify-center sm:hidden">
                <Link href={ROUTES.shop} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  View all products
                </Link>
              </div>
            </Container>
          </section>
        )}

        {/* ── Manifesto ────────────────────────────────────────────── */}
        <section
          aria-label="Manifesto"
          className="border-t border-b border-border py-20 sm:py-28"
        >
          <Container size="md">
            <Manifesto />
          </Container>
        </section>

        {/* ── Brand story ──────────────────────────────────────────── */}
        <section aria-labelledby="story-heading" className="py-20 sm:py-28">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
                  Our Story
                </p>
                <h2
                  id="story-heading"
                  className="mt-2 font-display text-4xl sm:text-5xl tracking-wider text-text"
                >
                  Born in Waipahu.
                  <br />
                  Built for the Grind.
                </h2>
                <p className="mt-6 font-serif italic text-lg text-subtle leading-relaxed">
                  R1P FITNESS started as a garage gym and a dream. Every piece we
                  drop carries the spirit of our &lsquo;ohana &mdash; the early mornings,
                  the heavy sets, and the fire that keeps us going.
                </p>
                <p className="mt-4 font-serif text-sm text-faint leading-relaxed">
                  We don&apos;t do restocks. Each design is a 24-hour limited drop. Miss it
                  and it&apos;s gone forever. That&apos;s the R1P way.
                </p>
                <div className="mt-8">
                  <Link href={ROUTES.shop} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Shop the collection &#8594;
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { number: "24H", label: "Drop window" },
                    { number: "100%", label: "Limited edition" },
                    { number: "HI", label: "Made with aloha" },
                    { number: "\u221e", label: "Ohana always" },
                  ] as const
                ).map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-border p-6 flex flex-col gap-2"
                  >
                    <span className="font-display text-4xl tracking-wider text-text">
                      {stat.number}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ── Newsletter ───────────────────────────────────────────── */}
        <section
          aria-labelledby="newsletter-heading"
          className="border-t border-border bg-bg/60 py-20 sm:py-24"
        >
          <Container size="md" className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
              Stay Connected
            </p>
            <h2
              id="newsletter-heading"
              className="mt-2 font-display text-3xl sm:text-4xl tracking-wider text-text"
            >
              Get Drop Alerts
            </h2>
            <p className="mt-3 font-serif italic text-subtle">
              Be the first to know when new drops go live. No spam, ever.
            </p>
            <form
              action="https://manage.kmail-lists.com/subscriptions/subscribe"
              method="POST"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex gap-2 max-w-sm mx-auto"
            >
              <input type="hidden" name="g" value="KLAVIYO_LIST_ID" />
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="flex-1 bg-bg border border-border px-4 py-2.5 font-mono text-sm text-text placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button type="submit" className={buttonVariants({ size: "sm" })}>
                Join
              </button>
            </form>
          </Container>
        </section>
      </main>

      <SiteFooter />
      <CartDrawer />
    </>
  );
}
