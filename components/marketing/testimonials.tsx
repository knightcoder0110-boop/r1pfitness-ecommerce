import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils/cn";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface TestimonialItem {
  name: string;
  location?: string;
  text: string;
  /** Rating out of 5. Defaults to 5. */
  rating?: number;
  /** Optional product they purchased. */
  product?: string;
}

/* ─── Static data ────────────────────────────────────────────────────────── */
const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    name: "Keanu M.",
    location: "Honolulu, HI",
    rating: 5,
    product: "Ohana Forever Tee",
    text: "Wore this to the gym and got three compliments in one session. The print is fire and the quality is no joke — thick, doesn't shrink. This is the only brand I trust for drop-day drops.",
  },
  {
    name: "Talia R.",
    location: "Maui, HI",
    rating: 5,
    product: "R1P Discipline Club Hoodie",
    text: "Finally a brand from Hawaii that actually gets the culture. The hoodie is heavyweight and the graphic is clean. Wearing it is repping something real — Ohana Forever.",
  },
  {
    name: "Marcus T.",
    location: "Los Angeles, CA",
    rating: 5,
    product: "Lion: Regal Rage Tee",
    text: "The oversized fit is perfect. Vintage wash gives it that lived-in feel without losing the detail. Already copped two more for my training crew.",
  },
  {
    name: "Jasmine K.",
    location: "San Diego, CA",
    rating: 5,
    product: "Women's Defy Leggings",
    text: "Best activewear I've found for heavy training. Compression is real, material doesn't pill, and the R1P branding is subtle but sharp. Nothing else comes close.",
  },
  {
    name: "Elijah P.",
    location: "Phoenix, AZ",
    rating: 5,
    product: "Arnold Schwarzenegger Vintage Tee",
    text: "My bodybuilding crew went crazy over this. Vintage print is thick and crisp — doesn't crack after washing. Worth every penny and then some.",
  },
  {
    name: "Kaimana L.",
    location: "Waipahu, HI",
    rating: 5,
    product: "R1PFitness Crossbody Bag",
    text: "Repping home with every drop. The crossbody bag is sleek and the zippers feel premium. This brand keeps leveling up and I'm here for every drop.",
  },
];

/* ─── Star Ratings ──────────────────────────────────────────────────────── */
function StarRating({ count = 5, size = "sm" }: { count?: number; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "size-5" : "size-3.5";
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={i < count ? 0 : 1.5}
          className={cn(dim, i < count ? "text-gold" : "text-border-strong")}
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Aggregate social-proof bar ─────────────────────────────────────────── */
function AggregateBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-14">
      <StarRating count={5} size="lg" />
      <span className="font-display text-3xl leading-none text-text">4.9</span>
      <span className="h-4 w-px bg-border-strong" aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
        300+ Verified Reviews
      </span>
      <span className="hidden sm:block h-4 w-px bg-border-strong" aria-hidden="true" />
      <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
        Free US Shipping
      </span>
    </div>
  );
}

/* ─── Individual card ────────────────────────────────────────────────────── */
function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <blockquote className="group relative h-full flex flex-col rounded-md bg-[linear-gradient(170deg,rgba(242,237,228,0.055)_0%,rgba(242,237,228,0.02)_100%)] ring-1 ring-border overflow-hidden shadow-soft transition-[transform,box-shadow,ring] duration-300 hover:-translate-y-1 hover:shadow-raised hover:ring-gold/45">
      {/* Gold top accent bar */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"
      />

      {/* Decorative opening quotation mark */}
      <span
        aria-hidden="true"
        className="absolute -top-2 left-6 font-serif text-[8rem] leading-none text-gold/[0.08] select-none pointer-events-none"
      >
        &ldquo;
      </span>

      <div className="relative z-10 flex flex-col gap-6 h-full p-8 sm:p-9">
        {/* Product chip */}
        {item.product && (
          <p className="self-start font-mono text-[9px] uppercase tracking-[0.4em] text-gold bg-gold/[0.10] ring-1 ring-gold/25 px-2.5 py-1 rounded-sm">
            {item.product}
          </p>
        )}

        {/* Quote body — Cormorant Garamond italic */}
        <p className="font-serif italic text-[1.125rem] sm:text-[1.1875rem] leading-[1.75] text-text flex-1">
          &ldquo;{item.text}&rdquo;
        </p>

        {/* Gold hairline divider */}
        <div aria-hidden="true" className="h-px w-12 bg-gradient-to-r from-gold/70 to-transparent" />

        {/* Author footer */}
        <footer className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <StarRating count={item.rating ?? 5} size="sm" />
            <cite className="not-italic font-semibold text-sm text-text">
              {item.name}
            </cite>
            {item.location && (
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
                {item.location}
              </p>
            )}
          </div>

          {/* Verified badge */}
          <span className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-green-400/80 self-start">
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-3 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </span>
        </footer>
      </div>
    </blockquote>
  );
}

/* ─── Section component ──────────────────────────────────────────────────── */
export interface TestimonialsProps {
  items?: TestimonialItem[];
  className?: string;
}

/**
 * Community testimonials section.
 *
 * Header: centered eyebrow + display title + aggregate social proof bar.
 * Cards: gold left-accent, oversized faint quote mark, Cormorant serif body,
 *        product chip, star rating, author + verified badge.
 * Layout: horizontal snap-scroll on mobile → 3-col grid on md+.
 *
 * Server component — pure CSS, no JS.
 */
export function Testimonials({
  items = DEFAULT_TESTIMONIALS,
  className,
}: TestimonialsProps) {
  if (items.length === 0) return null;

  return (
    <Section
      aria-labelledby="testimonials-heading"
      spacing="lg"
      tone="contrast"
      bordered="y"
      className={className}
    >
      <SectionHeader
        id="testimonials-heading"
        eyebrow="Ohana Reviews"
        title="What the tribe says"
        align="center"
      />

      <AggregateBar />

      {/* Cards — horizontal snap scroll on mobile, 3-col grid on md+ */}
      <ul
        className={cn(
          /* Mobile: horizontal scroll with snap */
          "flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none",
          /* Desktop: 3-col grid */
          "md:grid md:grid-cols-3 md:overflow-visible md:pb-0",
        )}
        role="list"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, i) => (
          <li
            key={i}
            className="flex-shrink-0 w-[82vw] sm:w-[58vw] md:w-auto snap-start"
          >
            <TestimonialCard item={item} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
