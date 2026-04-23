import type { ReactNode } from "react";

/**
 * Feature strip items shown beneath the "Wear the Rebirth" hero.
 *
 * Icons are inline SVG (no extra deps) and inherit colour via `currentColor`
 * so they pick up the gold accent from the parent.
 */
export interface HeroFeature {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

const iconClass = "size-6 shrink-0";

export const HERO_FEATURES: HeroFeature[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconClass}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m12 0H4.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5Z" />
      </svg>
    ),
    title: "Limited Drops",
    subtitle: "24 hours only",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconClass}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-2 3-3 5-3 7a3 3 0 1 0 6 0c0-2-1-4-3-7Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11c2 1 4 1 6 0M20 11c-2 1-4 1-6 0M6 8c2 0 3 1 4 3M18 8c-2 0-3 1-4 3M12 13v8M8 21h8" />
      </svg>
    ),
    title: "Ohana Forever",
    subtitle: "You're part of this",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconClass}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
    title: "Premium Quality",
    subtitle: "Built to last",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconClass}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 13.5 3l-2.25 7.5h6L9 21l1.5-7.5h-6.75Z" />
      </svg>
    ),
    title: "Made for Discipline",
    subtitle: "Train. Live. R1P.",
  },
];
