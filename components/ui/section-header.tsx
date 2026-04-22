import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Standard header block used by every product rail, category grid, and editorial
 * section: small gold rule + eyebrow, oversized display title, optional
 * "view all" link on the right.
 *
 * Kept as a single component so typography, spacing, and link styling stay in
 * sync across the entire site — change once, update everywhere.
 */
export interface SectionHeaderProps {
  /** Small label above the title — rendered in gold monospace caps */
  eyebrow?: string;
  /** The main H2 shown in display font */
  title: string;
  /** Optional supporting line below the title */
  subtitle?: string;
  /** Optional "view all →" link shown on the right on desktop */
  viewAllHref?: string;
  /** Custom "view all" label (defaults to "View all") */
  viewAllLabel?: string;
  /** Visual alignment — `left` (default) or `center` for editorial sections */
  align?: "left" | "center";
  /** Accessible id so the H2 can label its parent section */
  id?: string;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
  align = "left",
  id,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 mb-10",
        // When a view-all link is provided we push it to the right on desktop.
        viewAllHref && !centered && "sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        centered && "items-center text-center",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-3", centered && "items-center")}>
        {eyebrow && (
          <div
            className={cn(
              "flex items-center gap-3",
              centered && "justify-center",
            )}
          >
            <span className="h-px w-8 bg-gold" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-gold">
              {eyebrow}
            </p>
            {centered && <span className="h-px w-8 bg-gold" aria-hidden="true" />}
          </div>
        )}
        <h2
          id={id}
          className={cn(
            "font-display text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-wide text-text",
            centered && "mx-auto max-w-3xl",
          )}
        >
          {title.toUpperCase()}
        </h2>
        {subtitle && (
          <p
            className={cn(
              "font-serif italic text-base sm:text-lg text-muted max-w-xl",
              centered && "mx-auto",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className={cn(
            "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted hover:text-gold transition-colors",
            !centered && "hidden sm:inline-flex self-end",
            centered && "self-center",
          )}
        >
          {viewAllLabel} <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
