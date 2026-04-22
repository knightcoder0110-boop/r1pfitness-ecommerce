import { cn } from "@/lib/utils/cn";

/**
 * Compact colour swatch dots for product cards.
 *
 * Uses the brand palette for known colour names; falls back to a neutral
 * outlined dot with the first letter for unmapped values so we never 404
 * on a customer-created attribute term.
 */

// Brand-aware colour map. Keys are lowercased.
const COLOR_MAP: Record<string, string> = {
  black: "#0D0D0D",
  obsidian: "#0D0D0D",
  bone: "#F2EDE4",
  sand: "#F2EDE4",
  cream: "#F2EDE4",
  white: "#FFFFFF",
  ivory: "#F8F4EB",
  gold: "#C9A84C",
  mustard: "#C9A84C",
  coral: "#C4572A",
  rust: "#C4572A",
  ocean: "#1B4F6B",
  navy: "#1B4F6B",
  blue: "#1B4F6B",
  olive: "#6B7F3B",
  forest: "#3B5B3F",
  green: "#3B5B3F",
  charcoal: "#2A2A2A",
  grey: "#8A8A8A",
  gray: "#8A8A8A",
  red: "#B43A2F",
  brown: "#6B4B2E",
  tan: "#A88B6A",
};

function resolveColor(name: string): string | undefined {
  return COLOR_MAP[name.trim().toLowerCase()];
}

export interface ColorSwatchesProps {
  options: string[];
  /** Max swatches to show before collapsing to "+N". Default: 5. */
  max?: number;
  className?: string;
}

export function ColorSwatches({ options, max = 5, className }: ColorSwatchesProps) {
  if (!options.length) return null;
  const visible = options.slice(0, max);
  const overflow = options.length - visible.length;

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`${options.length} colour${options.length === 1 ? "" : "s"} available`}
    >
      {visible.map((name) => {
        const hex = resolveColor(name);
        return (
          <span
            key={name}
            title={name}
            aria-hidden
            className={cn(
              "inline-block size-3 rounded-full border transition-transform",
              hex ? "border-white/20" : "border-border",
            )}
            style={hex ? { backgroundColor: hex } : undefined}
          >
            {!hex ? (
              <span className="sr-only">{name}</span>
            ) : null}
          </span>
        );
      })}
      {overflow > 0 ? (
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
