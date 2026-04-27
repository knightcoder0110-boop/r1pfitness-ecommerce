import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ReviewStarsProps {
  /** Rating value, 0–5. Decimals supported (e.g. 4.7). */
  value: number;
  /** Total number of reviews — when given, renders "(N reviews)" beside stars. */
  count?: number;
  /** Slot — typically an anchor to the reviews section. */
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: { star: "size-3.5", text: "text-[11px]" },
  md: { star: "size-4", text: "text-xs" },
  lg: { star: "size-5", text: "text-sm" },
};

/**
 * Five-star rating display with optional review count link.
 *
 *   ★★★★☆  4.7 (84 reviews)
 *
 * Renders empty stars in muted bone, filled stars in gold. Half-stars are
 * rendered via a clipped overlay so any decimal value renders correctly.
 *
 * `href` makes the whole control a link (typically to `#reviews`) so the
 * label "(N reviews)" is the affordance to scroll-jump to the section.
 */
export function ReviewStars({
  value,
  count,
  href,
  size = "md",
  className,
}: ReviewStarsProps) {
  const sizes = SIZE_CLASSES[size];
  const safe = Math.max(0, Math.min(5, value));
  const fillPct = (safe / 5) * 100;
  const display = safe.toFixed(1);

  const content = (
    <>
      <span aria-hidden className="relative inline-flex shrink-0">
        {/* Empty stars */}
        <span className={cn("inline-flex gap-0.5 text-border-strong")}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={`bg-${i}`} className={sizes.star} strokeWidth={1.5} />
          ))}
        </span>
        {/* Filled overlay clipped to fillPct */}
        <span
          className="pointer-events-none absolute inset-0 inline-flex gap-0.5 overflow-hidden text-gold"
          style={{ width: `${fillPct}%` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={`fg-${i}`}
              className={cn(sizes.star, "shrink-0 fill-current")}
              strokeWidth={1.5}
            />
          ))}
        </span>
      </span>

      <span
        className={cn(
          "font-mono uppercase tracking-[0.2em] tabular-nums text-text",
          sizes.text,
        )}
      >
        {display}
      </span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "font-serif italic text-muted underline-offset-2",
            sizes.text,
            href && "hover:text-text hover:underline",
          )}
        >
          ({count.toLocaleString()} {count === 1 ? "review" : "reviews"})
        </span>
      ) : null}
    </>
  );

  const sharedProps = {
    "aria-label": `Rated ${display} out of 5${count ? ` from ${count} reviews` : ""}`,
    className: cn("inline-flex items-center gap-2", className),
  };

  if (href) {
    return (
      <a href={href} {...sharedProps}>
        {content}
      </a>
    );
  }

  return <span {...sharedProps}>{content}</span>;
}
