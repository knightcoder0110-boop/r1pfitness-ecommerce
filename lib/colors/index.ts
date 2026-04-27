/**
 * Brand-aware colour resolver.
 *
 * Used by every swatch UI so all surfaces — product cards, PDP picker,
 * cart line items — render the same hex for the same colour name.
 *
 * Rules:
 *   • All keys are lower-cased.
 *   • Synonyms (e.g. "obsidian"/"black") map to the same hex.
 *   • An unmapped name falls back to a neutral surface so we never 404
 *     on a customer-created attribute term — UIs render a letter glyph.
 *   • Two-tone / patterned colours can be expressed via a `gradient`
 *     descriptor; renderers detect this and apply a CSS conic-gradient.
 */

export interface ColorDescriptor {
  /** Solid CSS colour or `undefined` if this is a gradient-only entry. */
  hex?: string;
  /** Optional gradient — used for two-tone, marled, or pattern swatches. */
  gradient?: string;
  /** Whether the swatch is light enough to need a dark check icon overlay. */
  isLight?: boolean;
}

const COLOR_MAP: Record<string, ColorDescriptor> = {
  // Brand palette
  black: { hex: "#0D0D0D" },
  obsidian: { hex: "#0D0D0D" },
  bone: { hex: "#F2EDE4", isLight: true },
  sand: { hex: "#F2EDE4", isLight: true },
  cream: { hex: "#F4EFE6", isLight: true },
  ivory: { hex: "#F8F4EB", isLight: true },
  white: { hex: "#FFFFFF", isLight: true },
  gold: { hex: "#C9A84C" },
  mustard: { hex: "#C9A84C" },
  coral: { hex: "#C4572A" },
  rust: { hex: "#A94721" },
  ocean: { hex: "#1B4F6B" },
  navy: { hex: "#1B4F6B" },
  blue: { hex: "#1B4F6B" },

  // Common apparel colours
  olive: { hex: "#6B7F3B" },
  forest: { hex: "#2F4A33" },
  green: { hex: "#3B5B3F" },
  sage: { hex: "#9CAF88" },
  charcoal: { hex: "#2A2A2A" },
  grey: { hex: "#8A8A8A" },
  gray: { hex: "#8A8A8A" },
  silver: { hex: "#C0C0C0", isLight: true },
  red: { hex: "#B43A2F" },
  burgundy: { hex: "#5E1F26" },
  maroon: { hex: "#5E1F26" },
  brown: { hex: "#6B4B2E" },
  tan: { hex: "#A88B6A" },
  khaki: { hex: "#B6A179" },
  beige: { hex: "#D9C9A7", isLight: true },
  pink: { hex: "#E8A4A4" },
  yellow: { hex: "#E5C13A" },
  orange: { hex: "#D6722A" },
  purple: { hex: "#5B3475" },
  lavender: { hex: "#B8A9D6" },
  teal: { hex: "#2F7A7A" },

  // Patterned
  camo: {
    gradient:
      "conic-gradient(from 45deg, #4D5A3A, #6B7F3B 25%, #8B7F4F 50%, #4D5A3A 75%, #6B7F3B)",
  },
  tiedye: {
    gradient:
      "conic-gradient(from 0deg, #C4572A, #C9A84C, #1B4F6B, #6B7F3B, #C4572A)",
  },
};

export function resolveColor(name: string): ColorDescriptor | undefined {
  return COLOR_MAP[name.trim().toLowerCase()];
}

/**
 * Compact "first letter" used as a fallback glyph when a colour name
 * isn't in the map — e.g. a one-off variant like "Heritage Plum".
 */
export function colorInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}
