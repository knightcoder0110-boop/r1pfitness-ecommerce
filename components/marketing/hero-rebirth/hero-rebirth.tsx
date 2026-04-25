import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ROUTES } from "@/lib/constants";
import { HeroFeatureStrip } from "./feature-strip";

export interface HeroRebirthProps {
  /** Small eyebrow text above the headline. */
  eyebrow?: string;
  /**
   * Headline words rendered on separate lines for the cinematic stacked feel.
   * Keep to 2-3 short words.
   */
  headlineLines?: readonly string[];
  /** Uppercase tagline shown under the headline. */
  tagline?: string;
  /** Primary CTA (gold metallic). */
  primaryCta?: { label: string; href: string };
  /** Secondary CTA (dark obsidian). */
  secondaryCta?: { label: string; href: string };
  /** Background image path (public dir) — shown on md+ (desktop/tablet). */
  backgroundImage?: string;
  /** Background image path (public dir) — shown below md (mobile). Falls back to backgroundImage if omitted. */
  mobileBackgroundImage?: string;
  /** Whether to render the feature strip beneath the hero. */
  showFeatureStrip?: boolean;
  /** Optional extra className for the outer wrapper. */
  className?: string;
}

const DEFAULTS = {
  eyebrow: "Official Merch",
  headlineLines: ["Wear the", "Rebirth."] as const,
  tagline: "Exclusive drops. Limited forever.",
  primaryCta: { label: "Shop All", href: ROUTES.shop },
  secondaryCta: { label: "Join the Ohana", href: "#newsletter" },
  backgroundImage: "/images/hero/hero-cover-desktop-mode.png",
  mobileBackgroundImage: "/images/hero/hero-cover-mobile-mode.png",
  showFeatureStrip: true,
} as const;

/**
 * HeroRebirth — cinematic editorial hero with full-bleed product photography.
 *
 * Layout
 * ──────
 *   Desktop: content pinned to the left, image reveals on the right via a
 *            left-to-right gradient that fades the obsidian background to
 *            transparent.
 *   Mobile:  content centered, image uniformly darkened for legibility.
 *
 * The optional feature strip overlaps the hero's bottom edge on desktop
 * (via negative margin, not absolute positioning, so it never collides
 * with the next section). On mobile it sits flush below.
 *
 * Server component — zero client JS.
 */
export function HeroRebirth({
  eyebrow = DEFAULTS.eyebrow,
  headlineLines = DEFAULTS.headlineLines,
  tagline = DEFAULTS.tagline,
  primaryCta = DEFAULTS.primaryCta,
  secondaryCta = DEFAULTS.secondaryCta,
  backgroundImage = DEFAULTS.backgroundImage,
  mobileBackgroundImage = DEFAULTS.mobileBackgroundImage,
  showFeatureStrip = DEFAULTS.showFeatureStrip,
  className,
}: HeroRebirthProps) {
  return (
    <div className={cn("relative", className)}>
      {/* ═══════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════ */}
      <section
        aria-label="Wear the Rebirth"
        className="relative isolate overflow-hidden bg-bg aspect-hero-surface min-h-[34rem] md:min-h-[42rem]"
      >
        {/* ─── Background image + overlays ──────────────────────── */}
        <div className="absolute inset-0 -z-10 overflow-clip">
          {/*
           * Mobile background — portrait image, shown below md.
           * `sizes` tells the browser this image only fills the viewport
           * at mobile widths, so it won't waste bandwidth on desktop.
           */}
          <Image
            src={mobileBackgroundImage}
            alt=""
            aria-hidden
            fill
            priority
            sizes="(max-width: 767px) 100vw, 1px"
            className="object-cover object-top md:hidden"
          />

          {/*
           * Desktop background — landscape image, shown at md+.
           * Hidden on mobile so the browser skips it on small screens.
           */}
          <Image
            src={backgroundImage}
            alt=""
            aria-hidden
            fill
            priority
            sizes="(min-width: 768px) 100vw, 1px"
            className="object-cover object-center hidden md:block"
          />

          {/* Mobile: uniform darken for text legibility. */}
          <div aria-hidden className="absolute inset-0 bg-bg/70 md:hidden" />

          {/* Desktop: L→R gradient reveals product on right, hides copy bg. */}
          <div
            aria-hidden
            className="absolute inset-0 hidden md:block bg-gradient-to-r from-bg via-bg/75 to-transparent"
          />

          {/* Top vignette for seamless header blend. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg to-transparent"
          />

          {/* Bottom vignette so the feature strip sits on a calm surface. */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg to-transparent"
          />

          {/* Faint grid texture for editorial depth. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--color-border)/0.10)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--color-border)/0.10)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40"
          />

          {/* Warm radial glow from bottom-left. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full bg-gold/5 blur-[90px]"
          />
        </div>

        {/* ─── Content ─────────────────────────────────────────── */}
        <Container size="page">
          <div
            className={cn(
              "relative flex h-full min-h-full flex-col justify-center items-center md:items-start",
              "py-16 md:py-20 lg:py-24",
            )}
          >
            <div
              className={cn(
                "w-full max-w-md sm:max-w-xl lg:max-w-2xl",
                "text-center md:text-left mx-auto md:mx-0",
              )}
            >
              {/* Eyebrow */}
              <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3">
                <span className="h-px w-6 sm:w-8 bg-gold" aria-hidden="true" />
                <p className="font-mono text-[10px] uppercase tracking-[0.38em] sm:tracking-[0.55em] text-gold">
                  {eyebrow}
                </p>
              </div>

              {/* Headline */}
              <h1
                className={cn(
                  "mt-6 md:mt-8",
                  "font-display uppercase text-text",
                  "text-[clamp(1.85rem,11vw,8.5rem)]",
                  "leading-[0.88] tracking-[0.02em]",
                )}
              >
                {headlineLines.map((line, i) => (
                  <span key={`${line}-${i}`} className="block">
                    {line}
                  </span>
                ))}
              </h1>

              {/* Tagline */}
              <p className="mt-6 md:mt-8 px-2 sm:px-0 font-mono text-[11px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.42em] text-muted">
                {tagline}
              </p>

              {/* Gold rule */}
              <div className="mt-8 md:mt-10 flex justify-center md:justify-start">
                <span className="block h-px w-20 bg-gold" aria-hidden="true" />
              </div>

              {/* CTAs */}
              <div
                className={cn(
                  "mt-8 md:mt-10",
                  "flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4",
                  "justify-center md:justify-start items-center md:items-start",
                )}
              >
                <Link
                  href={primaryCta.href}
                  className={cn(
                    buttonVariants({ variant: "primary", size: "lg" }),
                    "w-full max-w-[18rem] sm:w-auto sm:max-w-none",
                  )}
                >
                  {primaryCta.label}
                </Link>
                <Link
                  href={secondaryCta.href}
                  className={cn(
                    buttonVariants({ variant: "tertiary", size: "lg" }),
                    "w-full max-w-[18rem] sm:w-auto sm:max-w-none",
                  )}
                >
                  {secondaryCta.label}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURE STRIP — overlaps hero bottom on desktop via -mt
          ═══════════════════════════════════════════════════════════ */}
      {showFeatureStrip && (
        <div className="relative z-10 -mt-12 md:-mt-16 pb-8 md:pb-12">
          <Container size="page">
            <HeroFeatureStrip />
          </Container>
        </div>
      )}
    </div>
  );
}
