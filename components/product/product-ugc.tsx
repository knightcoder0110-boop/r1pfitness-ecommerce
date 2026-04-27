import { Camera, AtSign } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { cn } from "@/lib/utils/cn";

export interface ProductUgcProps {
  /** Product name for accessibility — section title is generic. */
  productName: string;
  /** Stable id used to deterministically pick placeholder tiles. */
  seed: string;
  className?: string;
}

/**
 * Tag we surface on the prompt card. Lives here as a constant so a future
 * brand-wide hashtag change is a single-file edit.
 */
const COMMUNITY_TAG = "#R1PFITNESS";

/**
 * UGC photo grid on the PDP.
 *
 * The grid is a 6-tile mosaic: one large hero on desktop, three medium,
 * one tall — the irregularity makes it feel like a curated wall, not a
 * stock collage. On mobile we collapse to a 2-column grid.
 *
 * Real photo URLs ship later via a `/api/ugc/:productId` endpoint that
 * proxies tagged Instagram media. For now we render placeholder tiles
 * with brand gradients so the layout is correct and ready to receive
 * real images.
 *
 * The last tile is always the "Tag us to be featured" prompt so the
 * grid invites contribution rather than just showcasing it.
 */
export function ProductUgc({ productName, seed, className }: ProductUgcProps) {
  // Deterministic gradient picker — keeps SSR + hydration stable.
  const gradients = [
    "linear-gradient(135deg, rgba(196,87,42,0.35), rgba(13,13,13,1) 70%)",
    "linear-gradient(135deg, rgba(201,168,76,0.30), rgba(13,13,13,1) 70%)",
    "linear-gradient(135deg, rgba(27,79,107,0.45), rgba(13,13,13,1) 70%)",
    "linear-gradient(135deg, rgba(242,237,228,0.18), rgba(13,13,13,1) 70%)",
    "linear-gradient(135deg, rgba(196,87,42,0.25), rgba(27,79,107,0.30) 100%)",
  ];
  function pick(salt: number): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return gradients[(h + salt) % gradients.length]!;
  }

  return (
    <section
      aria-label={`Customer photos featuring ${productName}`}
      className={cn(
        "border-t border-border pt-10 sm:pt-14",
        className,
      )}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Heading level={2} size="lg" className="text-2xl sm:text-3xl">
            Worn by the Ohana
          </Heading>
          <p className="font-serif italic text-sm text-muted">
            Real photos, real people, real aloha. Tag{" "}
            <span className="font-mono not-italic text-text">{COMMUNITY_TAG}</span>{" "}
            for a chance to be featured.
          </p>
        </div>
        <a
          href="https://instagram.com/r1pfitness"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 rounded-sm border border-border-strong bg-surface-1 px-3 py-2",
            "font-mono text-[11px] uppercase tracking-[0.22em] text-text",
            "hover:border-gold/50 hover:text-gold transition-colors",
          )}
        >
          <AtSign aria-hidden strokeWidth={1.75} className="size-3.5" />
          r1pfitness
        </a>
      </div>

      {/* Mosaic grid — 2 cols mobile, 4 cols desktop */}
      <ul
        role="list"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <li
            key={i}
            className={cn(
              "relative overflow-hidden rounded-sm border border-border bg-surface-1",
              // Make the first tile span 2 cols + 2 rows on desktop for a hero
              i === 0 && "lg:col-span-2 lg:row-span-2 aspect-square lg:aspect-auto",
              i !== 0 && "aspect-square",
            )}
            style={{ background: pick(i) }}
          >
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <Camera className="size-6 text-text/15" strokeWidth={1.25} />
            </span>
            <span className="sr-only">Customer photo {i + 1}</span>
          </li>
        ))}

        {/* Final tile is the prompt CTA */}
        <li
          className={cn(
            "relative aspect-square overflow-hidden rounded-sm",
            "border border-dashed border-gold/45 bg-gold/[0.04]",
            "flex flex-col items-center justify-center gap-2 p-3 text-center",
          )}
        >
          <Camera aria-hidden strokeWidth={1.5} className="size-5 text-gold" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
            Be featured
          </span>
          <span className="font-serif italic text-[11px] leading-tight text-muted">
            Tag <span className="not-italic text-text">{COMMUNITY_TAG}</span>
          </span>
        </li>
      </ul>
    </section>
  );
}
