import { forwardRef, type HTMLAttributes, type ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * Centered page container with consistent horizontal padding that scales
 * with viewport. Use this instead of hand-rolling
 * `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` everywhere.
 *
 * Sizes map to design tokens, so changing container widths is a one-liner
 * in globals.css (`--size-container`).
 *
 * ─── Width policy (the contract) ────────────────────────────────────────
 *   page    — 1536px — DEFAULT for every page shell (shop, PDP, footer,
 *                       search, cart, account). Use this unless you have
 *                       a specific reason not to.
 *   content — 1280px — editorial prose + single-column forms.
 *   prose   — 65ch   — long-form text (legal, blog).
 *   narrow  — 1024px — rarely needed (tight forms).
 *   full    — 100%   — bleed surfaces (hero, marquees, split banners).
 *
 * `sm` / `md` / `lg` / `xl` are kept as deprecated aliases for back-compat.
 * New code MUST use the semantic names above.
 */
const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    size: {
      // ── Semantic (prefer these) ──
      page:    "max-w-screen-2xl",   // 1536px — default page shell
      content: "max-w-7xl",          // 1280px — editorial / forms
      narrow:  "max-w-5xl",          // 1024px — tight columns
      prose:   "max-w-prose",        //  65ch — long-form text
      full:    "max-w-none",         //        — bleed

      // ── Deprecated aliases (do not use in new code) ──
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-7xl",
      xl: "max-w-screen-2xl",
    },
  },
  defaultVariants: { size: "page" },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof containerVariants> {
  as?: ElementType;
}

export const Container = forwardRef<HTMLElement, ContainerProps>(function Container(
  { className, size, as: Tag = "div", ...props },
  ref,
) {
  return (
    <Tag ref={ref} className={cn(containerVariants({ size }), className)} {...props} />
  );
});

Container.displayName = "Container";
