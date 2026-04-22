import { cn } from "@/lib/utils/cn";
import { Section } from "@/components/ui/section";

/* ─── Trust Item Definition ─────────────────────────────────────────────── */
export interface TrustItem {
  icon: React.ReactNode;
  stat: string;
  label: string;
}

const DEFAULT_ITEMS: TrustItem[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    stat: "FREE",
    label: "Shipping over $100",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    stat: "24H",
    label: "Exclusive drops only",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    stat: "100%",
    label: "Quality guaranteed",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    stat: "WAIPAHU",
    label: "Hawaii, Est. 2026",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
    stat: "OHANA",
    label: "Forever community",
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export interface TrustBarProps {
  items?: TrustItem[];
  className?: string;
}

/**
 * Full-width horizontal trust-signal strip.
 *
 * On mobile: 2-column grid. On md+: single row with dividers.
 * Gold icon accents, monospace stat + label stacked.
 *
 * Server component — no client state.
 */
export function TrustBar({ items = DEFAULT_ITEMS, className }: TrustBarProps) {
  return (
    <Section
      aria-label="Why shop with us"
      spacing="xs"
      tone="muted"
      bordered="y"
      bleed
      className={className}
    >
      {/* Mobile: single horizontal snap-scroll row. md+: evenly divided 5-col strip. */}
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul
          className={cn(
            "flex snap-x snap-mandatory",
            "divide-x divide-border",
            "min-w-max md:min-w-0 md:w-full",
            "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          )}
          role="list"
        >
          {items.map((item, i) => (
            <li
              key={i}
              className={cn(
                "snap-start shrink-0",
                "flex flex-col items-center gap-1.5 text-center",
                "w-[42vw] sm:w-auto sm:flex-1",
                "px-4 py-3 sm:py-2 md:px-6",
              )}
            >
              <span className="text-gold [&>svg]:size-5 sm:[&>svg]:size-6 md:[&>svg]:size-7">
                {item.icon}
              </span>
              <span className="font-display text-base sm:text-lg tracking-widest text-text leading-none">
                {item.stat}
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-muted leading-tight">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
