import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

/**
 * Community UGC — Shopify-parity "@r1pfitness on the 'gram" tile wall.
 *
 * Layout: responsive masonry-style grid, 2:3 tall tiles, gold hashtag pin
 * per tile with a subtle hover overlay revealing the caption.
 * Data: static array (swap in real Instagram Graph API feed later — just
 * replace `TILES` with the fetched results).
 *
 * Server component: pure CSS (no JS).
 */

interface UgcTile {
  image: string;
  handle: string;
  caption: string;
  href?: string;
}

const TILES: UgcTile[] = [
  {
    image: "/images/photos/r1p-13.jpg",
    handle: "r1pfitness",
    caption: "Reborn in Paradise · Waipahu HI",
    href: "https://instagram.com/r1pfitness",
  },
  {
    image: "/images/photos/IMG_0331.jpg",
    handle: "ohanalifts",
    caption: "Training in the Discipline Club hoodie",
  },
  {
    image: "/images/photos/R1P2025%20Collection_135.jpg",
    handle: "keanu.m",
    caption: "2025 Collection drop · Ohana Forever",
  },
  {
    image: "/images/photos/R1P2025%20Collection_141.jpg",
    handle: "talia.r",
    caption: "R1P fit-check · Maui sunrise",
  },
  {
    image: "/images/photos/IMG_0447.jpg",
    handle: "kaimana.l",
    caption: "Reborn strong · streetwear staple",
  },
  {
    image: "/images/photos/R1P2025%20Collection_8.jpg",
    handle: "elijah.p",
    caption: "2025 Collection · Discipline over everything",
  },
];

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function UgcCard({ tile }: { tile: UgcTile }) {
  const inner = (
    <>
      <Image
        src={tile.image}
        alt={tile.caption}
        fill
        sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
      />

      {/* Gradient base — always visible for handle pill */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-bg/85 via-bg/35 to-transparent"
      />

      {/* Hover caption overlay */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-bg/40 backdrop-blur-[2px]"
      >
        <p className="p-5 font-serif italic text-sm text-text leading-relaxed">
          &ldquo;{tile.caption}&rdquo;
        </p>
      </div>

      {/* Handle strip — always-visible bottom */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 py-3 z-10">
        <InstagramGlyph className="size-4 text-gold shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-text/90 truncate">
          @{tile.handle}
        </span>
      </div>
    </>
  );

  const base =
    "group relative block aspect-editorial overflow-hidden rounded-md ring-1 ring-border transition-[transform,box-shadow,ring] duration-300 hover:-translate-y-1 hover:shadow-raised hover:ring-gold/40";

  if (tile.href) {
    return (
      <Link
        href={tile.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open Instagram post by @${tile.handle}`}
        className={base}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

export interface CommunityUgcProps {
  className?: string;
}

export function CommunityUgc({ className }: CommunityUgcProps) {
  return (
    <Section
      aria-labelledby="community-heading"
      spacing="lg"
      bordered="y"
      className={className}
    >
      <SectionHeader
        id="community-heading"
        eyebrow="#R1PFITNESS"
        title="The ohana on the 'gram"
        align="center"
      />

      <p className="mx-auto max-w-xl text-center font-serif text-[1.0625rem] text-muted leading-relaxed mt-3 mb-12">
        Tag us <strong className="text-gold not-italic font-semibold">@r1pfitness</strong> to get featured on the wall.
      </p>

      {/* Mobile: horizontally-scrollable snap row.  sm+: standard grid. */}
      <ul
        role="list"
        className={[
          /* Mobile snap-scroll row */
          "flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3",
          /* Hide scrollbar cross-browser */
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          /* sm+ grid */
          "sm:grid sm:grid-cols-3 sm:overflow-x-visible sm:pb-0",
          /* lg wide grid */
          "lg:grid-cols-6",
          /* grid gap on sm+ */
          "sm:gap-5",
        ].join(" ")}
      >
        {TILES.map((tile, i) => (
          <li
            key={i}
            className={[
              /* Mobile: fixed-width snap card — first tile a touch wider */
              i === 0
                ? "flex-none w-[75vw] snap-start"
                : "flex-none w-[68vw] snap-start",
              /* sm+ grid spanning */
              i === 0
                ? "sm:w-auto sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2"
                : "sm:w-auto",
            ].join(" ")}
          >
            <UgcCard tile={tile} />
          </li>
        ))}
      </ul>

      <div className="flex justify-center mt-12">
        <Link
          href="https://instagram.com/r1pfitness"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-gold hover:text-text transition-colors"
        >
          <InstagramGlyph className="size-4" />
          Follow @r1pfitness
        </Link>
      </div>
    </Section>
  );
}
