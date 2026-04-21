import { cn } from "@/lib/utils/cn";

export type StatementItemStyle = "filled" | "outline" | "gold" | "gold-outline";

export interface StatementItem {
  /** The text to display. Will be uppercased automatically. */
  text: string;
  /** Visual treatment for this item. */
  style?: StatementItemStyle;
}

export interface StatementMarqueeProps {
  /** Items to show in the marquee. Duplicated under the hood for a seamless loop. */
  items: StatementItem[];
  /** Duration of one full loop, in seconds. Lower = faster. Defaults to 28s. */
  speedSeconds?: number;
  /** Separator glyph between items. Defaults to `✦`. */
  separator?: string;
  /** Scroll direction. Defaults to `left`. */
  direction?: "left" | "right";
  /** Render top + bottom gold rules. Defaults to true. */
  bordered?: boolean;
  className?: string;
}

/**
 * Full-width oversized scrolling text strip.
 *
 * Design: Bebas Neue at display sizes (clamped) with four style treatments —
 * solid, outline, gold, gold-outline — that can be mixed per-item to create
 * visual rhythm. Duplicated content ensures a seamless loop without JS. Honours
 * `prefers-reduced-motion`.
 *
 * Server component — pure CSS animation, zero JS.
 */
export function StatementMarquee({
  items,
  speedSeconds = 28,
  separator = "✦",
  direction = "left",
  bordered = true,
  className,
}: StatementMarqueeProps) {
  if (items.length === 0) return null;

  // Render items + separator, twice, so translateX(-50%) wraps seamlessly.
  const renderTrack = (ariaHidden: boolean) =>
    items.map((item, i) => (
      <span key={`${ariaHidden ? "b" : "a"}-${i}`} className="contents">
        <span className={cn("r1p-sm-item", styleClass(item.style))} aria-hidden={ariaHidden || undefined}>
          {item.text.toUpperCase()}
        </span>
        <span className="r1p-sm-sep" aria-hidden="true">
          {separator}
        </span>
      </span>
    ));

  return (
    <section
      aria-label="Brand statement"
      className={cn(
        "r1p-statement-marquee relative w-full overflow-hidden bg-bg",
        bordered && "border-y border-gold/40",
        className,
      )}
      style={{ ["--sm-speed" as string]: `${speedSeconds}s` }}
    >
      <div
        className={cn(
          "r1p-statement-track flex items-center whitespace-nowrap py-8 sm:py-10 will-change-transform",
          direction === "left" ? "r1p-sm-left" : "r1p-sm-right",
        )}
      >
        {renderTrack(false)}
        {renderTrack(true)}
      </div>

      {/* Local styles — kept inline so the component is fully self-contained. */}
      <style>{`
        .r1p-sm-item {
          font-family: var(--font-display);
          font-size: clamp(3rem, 9vw, 7.5rem);
          line-height: 0.95;
          letter-spacing: 0.02em;
          padding: 0 0.15em;
          color: var(--color-text);
          user-select: none;
          flex-shrink: 0;
        }
        .r1p-sm-item.r1p-sm-outline {
          -webkit-text-stroke: 2px var(--color-text);
          color: transparent;
        }
        .r1p-sm-item.r1p-sm-gold { color: var(--color-gold); }
        .r1p-sm-item.r1p-sm-gold-outline {
          -webkit-text-stroke: 2px var(--color-gold);
          color: transparent;
        }
        .r1p-sm-sep {
          font-size: clamp(1rem, 3vw, 2.25rem);
          color: var(--color-gold);
          opacity: 0.65;
          padding: 0 0.35em;
          flex-shrink: 0;
        }
        .r1p-sm-left  { animation: r1p-sm-scroll-left  var(--sm-speed, 28s) linear infinite; }
        .r1p-sm-right { animation: r1p-sm-scroll-right var(--sm-speed, 28s) linear infinite; }
        @keyframes r1p-sm-scroll-left  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes r1p-sm-scroll-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .r1p-statement-track { animation: none !important; }
        }
      `}</style>
    </section>
  );
}

function styleClass(style: StatementItemStyle = "filled"): string {
  switch (style) {
    case "outline":
      return "r1p-sm-outline";
    case "gold":
      return "r1p-sm-gold";
    case "gold-outline":
      return "r1p-sm-gold-outline";
    default:
      return "";
  }
}
