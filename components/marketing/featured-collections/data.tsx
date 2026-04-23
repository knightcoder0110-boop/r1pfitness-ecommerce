import type { ReactNode } from "react";
import { ROUTES } from "@/lib/constants";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type CollectionBadge = "new-drop" | "limited" | "exclusive" | null;

export interface Collection {
  id: string;
  name: string;
  itemCount: number;
  href: string;
  badge: CollectionBadge;
  /** Icon node rendered inside the card bottom panel */
  icon: ReactNode;
  /** Optional image path (from /public). Falls back to `gradient`. */
  image?: string;
  /** CSS gradient — used when no image is supplied */
  gradient: string;
}

export interface FeatureSignal {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export interface TrustItem {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

/* ─── Shared icon class ──────────────────────────────────────────────────── */
const iconSm = "size-7 shrink-0";
const iconMd = "size-8 shrink-0";

/* ─── Default collections ───────────────────────────────────────────────── */
export const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: "king-of-kings",
    name: "King of Kings",
    itemCount: 28,
    href: ROUTES.category("king-of-kings"),
    badge: "new-drop",
    gradient: "linear-gradient(160deg,#0d0800 0%,#261500 45%,#3d2200 100%)",
    image: "/images/products/tees/black-tee-male-model-1.png",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconMd}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l7-5 7 5" />
        <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10l4-3 4 3" />
      </svg>
    ),
  },
  {
    id: "dragon-ball-z",
    name: "Dragon Ball Z",
    itemCount: 36,
    href: ROUTES.category("dragon-ball-z"),
    badge: null,
    gradient: "linear-gradient(160deg,#0d0300 0%,#2a0800 45%,#420e00 100%)",
    image: "/images/products/tees/male-female-tee-1.png",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconMd}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" fill="currentColor" opacity="0.35" />
        <path strokeLinecap="round" d="M3.5 9.5C6 8 9 7 12 7s6 1 8.5 2.5" />
        <path strokeLinecap="round" d="M3.5 14.5C6 16 9 17 12 17s6-1 8.5-2.5" />
      </svg>
    ),
  },
  {
    id: "gold-era",
    name: "Gold Era",
    itemCount: 22,
    href: ROUTES.category("gold-era"),
    badge: null,
    gradient: "linear-gradient(160deg,#0a0800 0%,#1f1500 40%,#352200 100%)",
    image: "/images/products/tees/white-tee-male-model-1.png",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconMd}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
  {
    id: "one-piece",
    name: "One Piece",
    itemCount: 18,
    href: ROUTES.category("one-piece"),
    badge: null,
    gradient: "linear-gradient(160deg,#020810 0%,#081828 45%,#0e2840 100%)",
    image: "/images/products/hoodies/red-hodie-male-model-1.png",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconMd}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9c0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.326-.857 2.455-2.05 2.855L12 15" />
        <circle cx="12" cy="18" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "limited-drops",
    name: "Limited Drops",
    itemCount: 12,
    href: ROUTES.shop,
    badge: "limited",
    gradient: "linear-gradient(160deg,#080808 0%,#141414 45%,#1e1e1e 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconMd}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
];

/* ─── Feature signals (top-right of section header) ─────────────────────── */
export const FEATURE_SIGNALS: FeatureSignal[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconSm}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7.5l5-3.5 5 3.5" />
      </svg>
    ),
    title: "Premium Quality",
    subtitle: "Built to Last",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconSm}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Limited Drops",
    subtitle: "Exclusive Designs",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconSm}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 13.5 3l-2.25 7.5h6L9 21l1.5-7.5h-6.75Z" />
      </svg>
    ),
    title: "Made for Discipline",
    subtitle: "Train. Live. R1P.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconSm}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 2.5-3 4.5-3 7a3 3 0 0 0 6 0c0-2.5-1.5-4.5-3-7Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.343 10.657A8 8 0 0 0 4 16c0 2 .5 3 2 4M17.657 10.657A8 8 0 0 1 20 16c0 2-.5 3-2 4M12 21v-3" />
      </svg>
    ),
    title: "Ohana Forever",
    subtitle: "You're Part of This",
  },
];

/* ─── Trust strip items ─────────────────────────────────────────────────── */
export const TRUST_ITEMS: TrustItem[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconSm}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
    title: "New Drops",
    subtitle: "Every week. Limited pieces only.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconSm}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4c-1.5 0-4 1-4 4v1H6l-1 13h14L18 9h-2V8c0-3-2.5-4-4-4Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6" />
      </svg>
    ),
    title: "Premium Fabrics",
    subtitle: "Ultra soft. Built for performance.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconSm}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
    title: "Secure Shipping",
    subtitle: "Fast, reliable & tracked worldwide.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={iconSm}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
      </svg>
    ),
    title: "Easy Returns",
    subtitle: "30-day returns & exchanges.",
  },
];
