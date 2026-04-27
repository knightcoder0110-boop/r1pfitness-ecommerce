"use client";

import { cn } from "@/lib/utils/cn";

export interface SizePickerProps {
  label: string;
  options: string[];
  value: string | null;
  /** Map of optionName → isAvailable. Unavailable sizes render disabled / strikethrough. */
  availability?: Record<string, boolean>;
  onChange: (option: string) => void;
  /** Optional slot rendered in the header on the right (e.g. Size Guide link). */
  headerAction?: React.ReactNode;
  className?: string;
}

/**
 * Standard apparel size order — drives how options are sorted regardless
 * of how the admin entered them. Anything we don't recognise sorts last,
 * preserving its original ordering.
 */
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];

function sizeRank(option: string): number {
  const idx = SIZE_ORDER.indexOf(option.trim().toUpperCase());
  return idx === -1 ? 999 : idx;
}

/**
 * Size picker — rectangular pills with a clear hierarchy:
 *
 *   • Available + unselected   → bone-tinted outline, hover lifts to gold
 *   • Available + selected     → gold border, gold-tinted fill, gold text
 *   • Unavailable (OOS)        → diagonal slash, faded text, still focusable
 *
 * Critical UX choices:
 *   • OOS sizes are NOT hidden. Hiding them creates a gap in cognition
 *     ("does this run small? did they ever stock my size?"). We show
 *     them with the slash so the user can see at a glance which sizes
 *     are temporarily out, and click for back-in-stock notify.
 *   • The header carries a `headerAction` slot so the Size Guide link
 *     sits inline at the same baseline as the legend, never as a stray
 *     button that floats below.
 */
export function SizePicker({
  label,
  options,
  value,
  availability,
  onChange,
  headerAction,
  className,
}: SizePickerProps) {
  if (options.length === 0) return null;

  const sorted = [...options].sort((a, b) => sizeRank(a) - sizeRank(b));

  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      <legend className="flex w-full items-center justify-between gap-3">
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
            {label}
          </span>
          {value ? (
            <span className="font-serif italic text-sm text-text">{value}</span>
          ) : null}
        </span>
        {headerAction ? <span className="shrink-0">{headerAction}</span> : null}
      </legend>

      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {sorted.map((option) => {
          const isSelected = value === option;
          const isUnavailable = availability ? availability[option] === false : false;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={isUnavailable ? `${option} — out of stock` : option}
              data-size={option}
              data-unavailable={isUnavailable || undefined}
              onClick={() => onChange(option)}
              className={cn(
                "relative inline-flex min-w-12 items-center justify-center px-4 py-2.5",
                "rounded-sm border font-mono text-[13px] uppercase tracking-[0.18em]",
                "transition-[transform,color,border-color,background-color] duration-150 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                "active:translate-y-[1px]",
                // States
                isSelected
                  ? "border-gold bg-gold/12 text-gold"
                  : isUnavailable
                    ? "border-border bg-transparent text-faint hover:text-muted"
                    : "border-border-strong bg-transparent text-text hover:border-gold/55 hover:text-gold",
              )}
            >
              <span className={cn(isUnavailable && "opacity-70")}>{option}</span>

              {/* Diagonal slash for OOS — drawn over the pill */}
              {isUnavailable ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(242,237,228,0.30) 50%, transparent calc(50% + 0.5px))",
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
