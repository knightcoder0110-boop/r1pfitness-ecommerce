import { ReviewStars } from "./review-stars";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface ProductReviewsProps {
  /** Stable id used to seed deterministic mock reviews. Typically product id. */
  seed: string;
  /** Product name — used in the section heading. */
  productName: string;
  className?: string;
}

interface ReviewSummary {
  rating: number;
  count: number;
  /** Distribution of counts per star bucket [5★, 4★, 3★, 2★, 1★]. Sums to count. */
  distribution: [number, number, number, number, number];
  reviews: Array<{
    id: string;
    author: string;
    location: string;
    rating: number;
    title: string;
    body: string;
    date: string;
    verified: boolean;
    fit?: "Runs small" | "True to size" | "Runs large";
    size?: string;
  }>;
}

const SAMPLE_REVIEWS: Array<{
  author: string;
  location: string;
  title: string;
  body: string;
  fit?: "Runs small" | "True to size" | "Runs large";
}> = [
  {
    author: "Kainoa M.",
    location: "Honolulu, HI",
    title: "Heaviest tee I own — and the print is unreal.",
    body: "280gsm is no joke. Holds its shape after a dozen washes, no shrink, color hasn't faded. The shepherd-boy art front-and-back is the cleanest screen print I've seen on a streetwear drop. Buying a second one before it's gone.",
    fit: "True to size",
  },
  {
    author: "Marcus L.",
    location: "Long Beach, CA",
    title: "Worth every dollar.",
    body: "Bought it expecting Hanes-tier and got something closer to a Reigning Champ. Stitching is tight, neck doesn't roll. Sized up one for the relaxed look — fits exactly how the model wears it.",
    fit: "Runs small",
  },
  {
    author: "Jasmine A.",
    location: "Austin, TX",
    title: "Faith collection slaps.",
    body: "I bought this for my husband and he's worn it three times this week. The verse on the inside neck tape was a really thoughtful detail — felt like more than just a graphic tee.",
    fit: "True to size",
  },
  {
    author: "David K.",
    location: "Brooklyn, NY",
    title: "Heavy, premium, slow shipping but worth it.",
    body: "Took 6 days to arrive but everything else is 10/10. Tag isn't itchy, hem is bound (not raw), and the print uses real plastisol — no peeling after first wash.",
    fit: "Runs large",
  },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Build a deterministic mock review summary keyed off the product seed.
 * Replace with a fetch when the reviews API ships — the shape is already
 * the right server-component contract.
 */
function buildSummary(seed: string, productName: string): ReviewSummary {
  void productName;
  const h = hash(seed);
  const count = 32 + (h % 220); // 32 – 251 reviews
  // Skewed toward 5★ — we sell premium goods.
  const fives = Math.round(count * 0.72);
  const fours = Math.round(count * 0.18);
  const threes = Math.round(count * 0.06);
  const twos = Math.round(count * 0.025);
  const ones = Math.max(0, count - fives - fours - threes - twos);
  const dist: [number, number, number, number, number] = [fives, fours, threes, twos, ones];

  const totalScore =
    fives * 5 + fours * 4 + threes * 3 + twos * 2 + ones * 1;
  const rating = Math.round((totalScore / count) * 10) / 10;

  // Pick 3 stable sample reviews per product based on its seed.
  const start = h % SAMPLE_REVIEWS.length;
  const picked = [0, 1, 2].map((i) => SAMPLE_REVIEWS[(start + i) % SAMPLE_REVIEWS.length]!);

  const monthsAgo = ["3 weeks ago", "1 month ago", "6 weeks ago"];
  const sizes = ["M", "L", "XL"];
  const ratings = [5, 5, 4];

  return {
    rating,
    count,
    distribution: dist,
    reviews: picked.map((r, i) => ({
      id: `${seed}-r${i}`,
      author: r.author,
      location: r.location,
      rating: ratings[i] ?? 5,
      title: r.title,
      body: r.body,
      date: monthsAgo[i] ?? "recently",
      verified: true,
      ...(r.fit ? { fit: r.fit } : {}),
      ...(sizes[i] ? { size: sizes[i] } : {}),
    })),
  };
}

/**
 * Below-fold reviews block.
 *
 * Layout (desktop / mobile):
 *   ┌────────────────────────────────────────────┐
 *   │ Reviews                       [Write one →]│
 *   │ ──────────────────────────────────────     │
 *   │  4.7   ★★★★★    [████████░░ 5★] 132        │
 *   │  /5    "84 reviews"   [██░░░░░░ 4★] 28     │
 *   │                       [░░░░░░░░ 3★] 8      │
 *   │                                            │
 *   │  Reviewer · Hilo, HI · Verified            │
 *   │  ★★★★★  3 weeks ago  · Fit: True to size │
 *   │  Title — bold serif                        │
 *   │  Body copy — serif italic                 │
 *   └────────────────────────────────────────────┘
 *
 * Server-rendered for SEO (review-rich snippets matter for Google).
 * Mock data today — swap the `buildSummary` call for a real fetch when
 * the reviews backend ships. Component shape stays the same.
 */
export function ProductReviews({ seed, productName, className }: ProductReviewsProps) {
  const summary = buildSummary(seed, productName);
  const total = summary.count;

  return (
    <section
      id="reviews"
      aria-label={`Reviews for ${productName}`}
      className={cn(
        "scroll-mt-[calc(var(--size-header)+1.5rem)]",
        "border-t border-border pt-10 sm:pt-14",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <Heading level={2} size="lg" className="text-2xl sm:text-3xl">
          What the Ohana Says
        </Heading>
        <Button variant="outline" size="sm">
          Write a review
        </Button>
      </div>

      {/* Summary block */}
      <div className="mb-10 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
        {/* Big rating tile */}
        <div className="flex flex-col items-center gap-1 rounded-sm border border-border bg-surface-1 px-8 py-6 sm:px-10">
          <span className="font-display text-5xl leading-none text-gold tabular-nums">
            {summary.rating.toFixed(1)}
          </span>
          <ReviewStars value={summary.rating} size="md" />
          <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            {total.toLocaleString()} reviews
          </span>
        </div>

        {/* Distribution bars */}
        <ul className="flex flex-col gap-1.5">
          {summary.distribution.map((c, i) => {
            const star = 5 - i;
            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
            return (
              <li key={star} className="flex items-center gap-3">
                <span className="w-12 shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-muted tabular-nums">
                  {star} stars
                </span>
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${pct}% of reviews are ${star} stars`}
                  className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      star >= 4 ? "bg-gold" : star === 3 ? "bg-muted" : "bg-coral/70",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-text">
                  {c}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Review cards */}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {summary.reviews.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-sm border border-border bg-surface-1 p-5"
          >
            {/* Stars + date */}
            <div className="flex items-center justify-between gap-3">
              <ReviewStars value={r.rating} size="sm" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                {r.date}
              </span>
            </div>

            {/* Title */}
            <p className="font-serif text-base leading-snug text-text">
              {r.title}
            </p>

            {/* Body */}
            <p className="font-serif italic text-sm leading-relaxed text-muted line-clamp-5">
              {r.body}
            </p>

            {/* Meta footer */}
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              <span className="text-text">{r.author}</span>
              <span aria-hidden>·</span>
              <span>{r.location}</span>
              {r.verified ? (
                <span className="inline-flex items-center gap-1 rounded-sm border border-success/40 bg-success/10 px-1.5 py-0.5 text-[9px] text-success">
                  Verified
                </span>
              ) : null}
              {r.fit ? (
                <span className="basis-full text-faint">
                  Size {r.size} · Fit: <span className="text-text">{r.fit}</span>
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex justify-center">
        <Button variant="outline" size="sm">
          Show all {total} reviews
        </Button>
      </div>
    </section>
  );
}
