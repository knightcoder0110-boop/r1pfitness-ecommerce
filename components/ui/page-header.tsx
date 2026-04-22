import { cn } from "@/lib/utils/cn";

/**
 * PageHeader — the standard title block used by every collection, shop,
 * search, account, and content page.
 *
 * Replaces the ad-hoc `<header>` variants that were duplicated across
 * `/shop`, `/shop/[category]`, `/search`, `/about`, etc. Keeps typography
 * locked to design tokens.
 *
 * Layout:
 *   - Optional eyebrow (gold mono, with left gold rule)
 *   - Display title (Bebas Neue, clamped size)
 *   - Optional italic serif subtitle
 *   - Optional meta row (mono 12px uppercase — e.g. "24 pieces · page 1/3")
 *
 * Align = left by default; center for marketing/hero-style pages.
 */
export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Small stats row below subtitle — e.g. result count + pagination. */
  meta?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  /** HTML element rendered as the title (defaults to h1). */
  as?: "h1" | "h2";
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  align = "left",
  className,
  as: Tag = "h1",
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <header
      className={cn(
        "flex flex-col gap-3",
        centered && "items-center text-center",
        className,
      )}
    >
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

      <Tag
        className={cn(
          "font-display leading-none tracking-wide text-text",
          "text-[clamp(2.5rem,7vw,4.5rem)]",
          centered && "mx-auto max-w-3xl",
        )}
      >
        {title.toUpperCase()}
      </Tag>

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

      {meta && (
        <div
          className={cn(
            "mt-2 font-mono text-xs uppercase tracking-[0.3em] text-muted",
            centered && "mx-auto",
          )}
        >
          {meta}
        </div>
      )}
    </header>
  );
}
