import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { ROUTES } from "@/lib/constants";

/**
 * Shop-by-category horizontal scroller.
 *
 * Mobile:  single-row snap-scroll — users swipe through cards.
 * Desktop: same layout, wider cards, no wrapping.
 *
 * Server component — zero client JS.
 */

const CARD_THEMES = [
  { bg: "linear-gradient(155deg,#1c0e00 0%,#3d2000 100%)" }, // warm amber
  { bg: "linear-gradient(155deg,#06080f 0%,#0d1b30 100%)" }, // deep navy
  { bg: "linear-gradient(155deg,#090f06 0%,#142208 100%)" }, // forest
  { bg: "linear-gradient(155deg,#15090a 0%,#2e1314 100%)" }, // deep crimson
  { bg: "linear-gradient(155deg,#08080f 0%,#0f1428 100%)" }, // midnight
  { bg: "linear-gradient(155deg,#0d0d0d 0%,#1c1c1c 100%)" }, // pure obsidian
];

export async function CategoryScroller() {
  const catalog = getCatalog();
  const categories = await catalog.listCategories();
  const filtered = categories.filter((c) => c.slug !== "uncategorized");

  if (filtered.length === 0) return null;

  return (
    <Section
      aria-labelledby="category-scroller-heading"
      spacing="md"
      bleed
      className="overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <Container>
        <SectionHeader
          id="category-scroller-heading"
          eyebrow="Collections"
          title="Shop by category"
          viewAllHref={ROUTES.collections}
        />
      </Container>

      {/* ── Scroll track — full-bleed, snaps on mobile ──────────── */}
      <div
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Browse product categories"
      >
        <ul
          className="
            flex gap-3 sm:gap-4
            snap-x snap-mandatory scroll-smooth
            pl-4 sm:pl-6 lg:pl-8
            pr-4 sm:pr-6 lg:pr-8
            pb-4
          "
          role="list"
        >
          {filtered.map((cat, i) => {
            const theme = CARD_THEMES[i % CARD_THEMES.length];
            return (
              <li
                key={cat.id}
                className="shrink-0 snap-start w-[72vw] max-w-[260px] sm:w-52 md:w-60 lg:w-64"
              >
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="
                    group relative flex flex-col justify-end
                    w-full aspect-card overflow-hidden
                    border border-white/[0.07]
                    hover:border-gold/40
                    transition-[border-color] duration-300
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-gold focus-visible:ring-offset-2
                    focus-visible:ring-offset-bg
                  "
                  aria-label={`Shop ${cat.name}`}
                >
                  {/* Gradient bg — slight scale on hover */}
                  <div
                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]"
                    style={{ background: theme?.bg }}
                    aria-hidden="true"
                  />

                  {/* Noise texture */}
                  <div
                    className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                      backgroundSize: "200px 200px",
                    }}
                    aria-hidden="true"
                  />

                  {/* Large letter watermark */}
                  <span
                    className="absolute -top-2 -right-1 font-display leading-none select-none text-white/[0.04]"
                    style={{ fontSize: "clamp(5rem,15vw,8rem)" }}
                    aria-hidden="true"
                  >
                    {cat.name.charAt(0).toUpperCase()}
                  </span>

                  {/* Bottom scrim */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                    aria-hidden="true"
                  />

                  {/* Gold rule slides in from left on hover */}
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-0 bg-gold transition-[width] duration-500 ease-out group-hover:w-full"
                    aria-hidden="true"
                  />

                  {/* Text */}
                  <div className="relative p-4 sm:p-5">
                    <p className="font-display text-2xl sm:text-3xl leading-none tracking-widest text-white">
                      {cat.name.toUpperCase()}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-gold/70">
                        Shop now
                      </span>
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="size-2.5 text-gold/70 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8h10M9 4l4 4-4 4"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}

          {/* "View all" end-cap card */}
          <li className="shrink-0 snap-start w-[38vw] max-w-[150px] sm:w-32 lg:w-36">
            <Link
              href={ROUTES.collections}
              className="
                group relative flex flex-col items-center justify-center
                w-full aspect-card overflow-hidden
                border border-gold/20
                hover:border-gold/50
                transition-[border-color] duration-300
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold
              "
              aria-label="Browse all categories"
            >
              <div
                className="absolute inset-0 bg-surface-1 group-hover:bg-surface-2 transition-colors duration-300"
                aria-hidden="true"
              />
              <div className="relative flex flex-col items-center gap-3 p-4">
                <div className="size-10 rounded-full border border-gold/30 flex items-center justify-center group-hover:border-gold/70 transition-colors duration-300">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="size-4 text-gold"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8h10M9 4l4 4-4 4"
                    />
                  </svg>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold text-center leading-relaxed">
                  View
                  <br />
                  All
                </p>
              </div>
            </Link>
          </li>
        </ul>
      </div>

      {/* ── Swipe hint — mobile only ─────────────────────────────── */}
      <p
        className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-faint sm:hidden"
        aria-hidden="true"
      >
        ← swipe to explore →
      </p>
    </Section>
  );
}
