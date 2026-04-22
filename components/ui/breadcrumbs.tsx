import Link from "next/link";
import { breadcrumbSchema } from "@/lib/seo";
import { getSiteUrl } from "@/lib/seo/site-url";
import { cn } from "@/lib/utils/cn";

/**
 * Breadcrumbs — single source of truth for navigational trails site-wide.
 *
 * Rendered above every page hero except the home page. Emits a
 * `BreadcrumbList` JSON-LD block for SEO (Google rich results).
 *
 * Visual style:
 *   - mono 10px, uppercase, wide tracking (matches site eyebrow typography)
 *   - faint "›" separators in gold
 *   - current page = gold text, no link
 *   - on mobile with >3 items, the middle items collapse to "…"
 *
 * The component is a server component — no client JS, no layout shift.
 */
export interface BreadcrumbItem {
  label: string;
  /**
   * Relative href. Omit on the final (current) item.
   * Absolute URL is derived for JSON-LD via `getSiteUrl()`.
   */
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const siteUrl = getSiteUrl();

  // Prepend Home automatically — callers never need to pass it.
  const trail: BreadcrumbItem[] = [{ label: "Home", href: "/" }, ...items];

  // JSON-LD payload uses absolute URLs; current page omits `item`.
  const ldItems = trail.map((item, idx) => ({
    name: item.label,
    ...(item.href && idx !== trail.length - 1
      ? { url: `${siteUrl}${item.href}` }
      : {}),
  }));

  // Mobile collapse: if >3 items, show first + … + last two.
  const needsCollapse = trail.length > 3;

  return (
    <nav aria-label="Breadcrumb" className={cn("w-full", className)}>
      <ol
        className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted"
        role="list"
      >
        {trail.map((item, idx) => {
          const isLast = idx === trail.length - 1;

          // Mobile: hide middle items when collapsing.
          const hiddenOnMobile =
            needsCollapse && idx > 0 && idx < trail.length - 2;

          return (
            <li
              key={`${item.label}-${idx}`}
              className={cn(
                "flex items-center gap-2",
                hiddenOnMobile && "hidden sm:flex",
              )}
            >
              {/* Separator (not before first item) */}
              {idx > 0 && (
                <span aria-hidden="true" className="text-gold/60">
                  ›
                </span>
              )}

              {/* Mobile collapse ellipsis — shown in place of the first hidden item */}
              {needsCollapse && idx === 1 && (
                <span
                  aria-hidden="true"
                  className="flex items-center gap-2 sm:hidden"
                >
                  <span className="text-subtle">…</span>
                  <span className="text-gold/60">›</span>
                </span>
              )}

              {isLast || !item.href ? (
                <span
                  aria-current="page"
                  className="text-gold truncate max-w-[14rem] sm:max-w-none"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-gold transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Structured data */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(ldItems)),
        }}
      />
    </nav>
  );
}
