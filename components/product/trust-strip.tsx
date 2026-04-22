import { cn } from "@/lib/utils/cn";

/**
 * TrustStrip (inline) — compact 4-icon row used INSIDE the PDP info column,
 * directly below the add-to-cart button. Mirrors the Shopify theme's
 * `product-main__trust` block.
 *
 * For the full-width homepage version with stats and ring framing, see
 * `components/marketing/trust-bar.tsx`. That one is standalone; this one
 * is a slim inline complement.
 */
const ITEMS = [
  {
    label: "Free shipping $100+",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    label: "30-day returns",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-4">
        <polyline points="23 4 23 10 17 10" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
  },
  {
    label: "Secure checkout",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Made with aloha",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="size-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
] as const;

export interface TrustStripProps {
  className?: string;
}

export function TrustStrip({ className }: TrustStripProps) {
  return (
    <ul
      role="list"
      className={cn(
        "grid grid-cols-2 sm:grid-cols-4 gap-3",
        "border-y border-border py-4",
        className,
      )}
    >
      {ITEMS.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
        >
          <span className="text-gold shrink-0" aria-hidden>{item.icon}</span>
          <span className="leading-tight">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
