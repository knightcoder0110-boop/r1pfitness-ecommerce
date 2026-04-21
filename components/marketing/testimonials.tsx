import { Container } from "@/components/ui/container";
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
    text: "Wore this to the gym and got three compliments in one session. The print is fire and the quality is no joke — thick, doesn't shrink.",
  },
  {
    name: "Talia R.",
    location: "Maui, HI",
    rating: 5,
    product: "R1P Discipline Club Hoodie",
    text: "Finally a brand from Hawaii that actually gets the culture. The hoodie is heavy weight and the graphic is clean. Repping Ohana Forever.",
  },
  {
    name: "Marcus T.",
    location: "Los Angeles, CA",
    rating: 5,
    product: "Lion: Regal Rage Tee",
    text: "The oversized fit is perfect. Vintage wash gives it that lived-in feel without losing the detail. Already copped two more.",
  },
  {
    name: "Jasmine K.",
    location: "San Diego, CA",
    rating: 5,
    product: "Women's Defy Leggings",
    text: "Best activewear I've found for heavy training. Compression is real, material doesn't pill, and the R1P branding is subtle but sharp.",
  },
  {
    name: "Elijah P.",
    location: "Phoenix, AZ",
    rating: 5,
    product: "Arnold Schwarzenegger Vintage Tee",
    text: "My bodybuilding crew went crazy over this one. Vintage print is thick and crisp — doesn't crack after washing. Worth every penny.",
  },
  {
    name: "Kaimana L.",
    location: "Waipahu, HI",
    rating: 5,
    product: "R1PFitness Crossbody Bag",
    text: "Repping home with every drop. The crossbody bag is sleek and the zippers feel premium. This brand keeps leveling up, respect.",
  },
];

/* ─── Star Ratings ──────────────────────────────────────────────────────── */
function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={i < count ? 0 : 1.5}
          className={cn("size-4", i < count ? "text-gold" : "text-border-strong")}
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export interface TestimonialsProps {
  items?: TestimonialItem[];
  className?: string;
}

/**
 * Community testimonials section.
 *
 * 3-column masonry-like grid on desktop, horizontal scroll on mobile (snap).
 * Gold star ratings, name + location, optional product callout.
 *
 * Server component — pure CSS, no JS.
 */
export function Testimonials({
  items = DEFAULT_TESTIMONIALS,
  className,
}: TestimonialsProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className={cn("py-16 sm:py-24 bg-surface-1 border-y border-border", className)}
    >
      <Container>
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-12 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold">
            Ohana Reviews
          </span>
          <h2
            id="testimonials-heading"
            className="font-display text-[clamp(2rem,6vw,4rem)] leading-none tracking-wide text-text"
          >
            WHAT THE TRIBE SAYS
          </h2>
          <div className="h-px w-16 bg-gold opacity-60 mt-1" aria-hidden="true" />
        </div>

        {/* Cards — horizontal snap scroll on mobile, 3-col grid on md+ */}
        <ul
          className={cn(
            /* Mobile: horizontal scroll with snap */
            "flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none",
            /* Desktop: grid */
            "md:grid md:grid-cols-3 md:overflow-visible md:pb-0",
          )}
          role="list"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((item, i) => (
            <li
              key={i}
              className="flex-shrink-0 w-[80vw] sm:w-[60vw] md:w-auto snap-start"
            >
              <blockquote className="h-full flex flex-col gap-4 rounded-sm bg-bg border border-border p-6 sm:p-7">
                <StarRating count={item.rating ?? 5} />
                <p className="text-text text-sm sm:text-base leading-relaxed flex-1">
                  &ldquo;{item.text}&rdquo;
                </p>
                <footer className="mt-auto pt-4 border-t border-border flex flex-col gap-0.5">
                  {item.product && (
                    <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold mb-1">
                      {item.product}
                    </p>
                  )}
                  <cite className="not-italic font-semibold text-sm text-text">
                    {item.name}
                  </cite>
                  {item.location && (
                    <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
                      {item.location}
                    </p>
                  )}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
