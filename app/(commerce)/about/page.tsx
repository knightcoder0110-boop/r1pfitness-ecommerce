import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About R1P FITNESS — Reborn 1n Paradise",
  description:
    "Born in Waipahu, Hawaii. R1P FITNESS is a limited-drop streetwear and fitness brand built for those who grind before the sun rises.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About R1P FITNESS",
    description:
      "Born in Waipahu, Hawaii. Limited-drop streetwear and fitness apparel — 24 hours only, no restocks.",
  },
};

const STATS = [
  { number: "2026", label: "Founded" },
  { number: "24H", label: "Drop window" },
  { number: "0", label: "Restocks ever" },
  { number: "HI", label: "Home base" },
] as const;

const VALUES = [
  {
    heading: "No Restocks. Ever.",
    body: "Every drop is 24 hours. Miss it, and it's gone forever. That's not scarcity marketing — that's the R1P way. We'd rather make 50 perfect pieces than 5,000 average ones.",
  },
  {
    heading: "Ohana First.",
    body: "This brand started as a garage gym and a group chat. Our customers aren't customers — they're 'ohana. That word means family, and we don't take it lightly.",
  },
  {
    heading: "Waipahu Roots.",
    body: "We rep Waipahu, HI hard. Not Honolulu. Not the tourist strip. The westside. Where people wake up at 4am to train because that's the only time they have. That energy is stitched into every piece.",
  },
  {
    heading: "Built to Move.",
    body: "R1P FITNESS isn't just streetwear — it's training gear you can wear out. Every silhouette is tested in the gym first. If it doesn't move with you under a bar, it doesn't ship.",
  },
] as const;

export default function AboutPage() {
  return (
    <Container as="main" className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "About" }]} className="mb-8 sm:mb-12" />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="mb-20 max-w-3xl sm:mb-28">
        <p className="text-muted mb-4 font-mono text-[10px] tracking-[0.5em] uppercase">
          Our Story
        </p>
        <Heading level={1} size="xl" className="mb-8 text-4xl leading-none sm:text-6xl lg:text-7xl">
          Reborn 1n Paradise
        </Heading>
        <p className="text-subtle font-serif text-xl leading-relaxed italic sm:text-2xl">
          R1P FITNESS started as a garage gym and a dream. Every piece we drop carries the spirit of
          our &lsquo;ohana — the early mornings, the heavy sets, and the fire that keeps us going.
        </p>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section
        aria-label="Brand stats"
        className="border-border mb-20 grid grid-cols-2 gap-px border sm:mb-28 sm:grid-cols-4"
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="border-border flex flex-col items-center justify-center gap-1 p-8 text-center"
          >
            <span className="font-display text-text text-4xl tracking-wider sm:text-5xl">
              {stat.number}
            </span>
            <span className="text-muted font-mono text-[10px] tracking-[0.3em] uppercase">
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {/* ── Story body ────────────────────────────────────────────────── */}
      <section className="mb-20 grid gap-12 sm:mb-28 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-muted mb-4 font-mono text-[10px] tracking-[0.4em] uppercase">
            How It Started
          </p>
          <h2 className="font-display text-text mb-6 text-3xl tracking-wider sm:text-4xl">
            A Garage. A Bar. A Dream.
          </h2>
          <div className="text-subtle space-y-4 font-serif text-base leading-relaxed sm:text-lg">
            <p>
              It started with a beat-up barbell, a pull-up bar bolted into a doorframe, and a group
              of friends who trained together every morning before work. Nobody was getting paid to
              be there. Nobody had a sponsor. We just showed up.
            </p>
            <p>
              The name R1P FITNESS — Reborn 1n Paradise — came from that feeling after a hard
              session. The soreness. The clarity. The knowing that you left everything on the floor
              and came out the other side different. Reborn.
            </p>
            <p>
              Paradise isn&apos;t the postcard version of Hawaii. It&apos;s the 5am air before
              sunrise. The trade winds coming through the open garage door. The way every rep feels
              both brutal and beautiful when you&apos;re doing it with people you love.
            </p>
            <p>
              We started printing gear for ourselves. Our &apos;ohana wanted it. Then strangers
              wanted it. Now we drop it — 24 hours, limited run, gone forever. We kept the soul of
              that garage and we aren&apos;t changing it.
            </p>
          </div>
        </div>

        {/* Brand pillars grid */}
        <div className="flex flex-col gap-6">
          <p className="text-muted font-mono text-[10px] tracking-[0.4em] uppercase">
            What We Stand For
          </p>
          {VALUES.map((v) => (
            <div key={v.heading} className="border-gold/40 border-l-2 pl-5">
              <h3 className="font-display text-text mb-1 text-lg tracking-wider">{v.heading}</h3>
              <p className="text-subtle font-serif text-sm leading-relaxed sm:text-base">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="border-border flex flex-col items-start justify-between gap-6 border-t pt-16 sm:flex-row sm:items-center sm:pt-20">
        <div>
          <h2 className="font-display text-text mb-2 text-2xl tracking-wider sm:text-3xl">
            Ready to rep the island?
          </h2>
          <p className="text-subtle font-serif italic">
            Limited drops, 24 hours only. No DM requests. No restocks.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={ROUTES.shop} className={buttonVariants({ size: "lg" })}>
            Shop Now
          </Link>
          <Link
            href={ROUTES.collections}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            All Collections
          </Link>
        </div>
      </section>
    </Container>
  );
}
