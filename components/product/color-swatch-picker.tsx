"use client";

import { Check } from "lucide-react";
import { colorInitial, resolveColor } from "@/lib/colors";
import { cn } from "@/lib/utils/cn";

export interface ColorSwatchPickerProps {
  /** Attribute display name — used as the legend (e.g. "Color"). */
  label: string;
  options: string[];
  /** Currently selected option name; `null` if nothing selected yet. */
  value: string | null;
  /** Map of optionName → isAvailable. Unavailable colours render strikethrough. */
  availability?: Record<string, boolean>;
  onChange: (option: string) => void;
  className?: string;
}

/**
 * Premium colour swatch picker for the PDP info column.
 *
 * Renders large, tactile circles in the actual hex of each colour, with a
 * thin neutral border so light shades remain visible against the obsidian
 * background. Selection state is communicated three ways:
 *
 *   1. A gold ring around the swatch (the primary affordance).
 *   2. A check icon overlay (auto-tinted dark/light by luminance).
 *   3. The selected name printed beside the legend ("Color: Onyx").
 *
 * Patterned/two-tone colours (e.g. camo, tie-dye) are rendered with a CSS
 * gradient. Unmapped colour names render as a neutral disc with the first
 * letter — never breaks, never 404s, always legible.
 *
 * Out-of-stock variants are still selectable (so the user can read the OOS
 * state and trigger the back-in-stock form) but receive a diagonal slash
 * overlay to make their state instantly readable.
 */
export function ColorSwatchPicker({
  label,
  options,
  value,
  availability,
  onChange,
  className,
}: ColorSwatchPickerProps) {
  if (options.length === 0) return null;

  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      <legend className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
          {label}
        </span>
        {value ? (
          <span className="font-serif italic text-sm text-text">{value}</span>
        ) : (
          <span className="font-serif italic text-sm text-faint">Choose one</span>
        )}
      </legend>

      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const isSelected = value === option;
          const isUnavailable = availability ? availability[option] === false : false;
          const descriptor = resolveColor(option);
          const hasHex = Boolean(descriptor?.hex);
          const isLight = Boolean(descriptor?.isLight);

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={isUnavailable ? `${option} — out of stock` : option}
              title={option}
              onClick={() => onChange(option)}
              className={cn(
                "group relative size-10 rounded-full transition-[transform,box-shadow] duration-200 cursor-pointer",
                "focus-visible:outline-none",
                "active:scale-95",
                // Gold ring on selected, subtle ring + scale on hover
                isSelected
                  ? "ring-2 ring-gold ring-offset-2 ring-offset-bg"
                  : "ring-1 ring-border-strong ring-offset-2 ring-offset-bg hover:ring-muted hover:scale-105",
                // Focus visible
                "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
              )}
            >
              {/* Colour fill */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-full",
                  // Subtle inner border for light colours so they don't look like holes
                  isLight && "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)]",
                )}
                style={
                  descriptor?.gradient
                    ? { background: descriptor.gradient }
                    : descriptor?.hex
                      ? { backgroundColor: descriptor.hex }
                      : undefined
                }
              >
                {!hasHex && !descriptor?.gradient ? (
                  <span
                    aria-hidden
                    className="flex h-full w-full items-center justify-center rounded-full bg-surface-2 font-mono text-xs uppercase tracking-wider text-muted"
                  >
                    {colorInitial(option)}
                  </span>
                ) : null}
              </span>

              {/* Check icon when selected — tinted by luminance */}
              {isSelected ? (
                <Check
                  aria-hidden
                  strokeWidth={3}
                  className={cn(
                    "absolute inset-0 m-auto size-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]",
                    isLight ? "text-bg" : "text-text",
                  )}
                />
              ) : null}

              {/* OOS slash overlay */}
              {isUnavailable ? (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, transparent calc(50% - 1px), rgba(180,64,46,0.85) 50%, transparent calc(50% + 1px))",
                  }}
                />
              ) : null}

              <span className="sr-only">{option}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
