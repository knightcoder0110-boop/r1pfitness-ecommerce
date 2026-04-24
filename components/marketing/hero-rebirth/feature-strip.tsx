import { cn } from "@/lib/utils/cn";
import { HERO_FEATURES, type HeroFeature } from "./features";

export interface HeroFeatureStripProps {
  items?: HeroFeature[];
  className?: string;
}

/**
 * Compact 4-up feature strip that sits flush beneath the hero.
 *
 * On mobile: 2x2 grid. On md+: single row with vertical dividers.
 * Lives inside a bordered "card" panel that matches the hero's dark surface.
 *
 * Pure presentational — server component, no state.
 */
export function HeroFeatureStrip({
  items = HERO_FEATURES,
  className,
}: HeroFeatureStripProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border-strong bg-bg/70 backdrop-blur-sm",
        "shadow-raised",
        className,
      )}
    >
      <ul
        role="list"
        className="grid grid-cols-2 md:grid-cols-4"
      >
        {items.map((item, i) => (
          <li
            key={item.title}
            className={cn(
              "flex items-center gap-3 px-5 py-4 md:px-6 md:py-5",
              "border-border/40",
              // Mobile (2-col): right border on left column (even index)
              i % 2 === 0 && "border-r",
              // Mobile (2-col): bottom border on first row
              i < 2 && "border-b md:border-b-0",
              // Desktop (4-col): right border on all but last item
              i < 3 && "md:border-r",
            )}
          >
            <span className="text-gold" aria-hidden="true">
              {item.icon}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-text">
                {item.title}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mt-1">
                {item.subtitle}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
