import { createElement, forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * Typography primitive. Pick the semantic level (h1..h6) + the visual size
 * independently, so we can keep a proper document outline without being
 * married to a fixed visual hierarchy.
 *
 *   <Heading level={1} size="display">…</Heading>
 *   <Heading level={2} size="lg">…</Heading>
 */
const headingVariants = cva(
  "font-display text-text uppercase",
  {
    variants: {
      size: {
        display:
          "text-4xl sm:text-5xl md:text-6xl tracking-[0.1em] leading-[0.95]",
        xl:  "text-3xl sm:text-4xl md:text-5xl tracking-[0.12em]",
        lg:  "text-2xl sm:text-3xl md:text-4xl tracking-[0.15em]",
        md:  "text-xl sm:text-2xl tracking-[0.2em]",
        sm:  "text-lg sm:text-xl tracking-[0.25em]",
        xs:  "text-sm tracking-[0.3em]",
      },
      tone: {
        default: "text-text",
        muted:   "text-muted",
        accent:  "text-accent",
        gold:    "text-gold",
      },
    },
    defaultVariants: { size: "lg", tone: "default" },
  },
);

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  level?: HeadingLevel;
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size, tone, className, children, ...props },
  ref,
) {
  return createElement(
    `h${level}`,
    { ref, className: cn(headingVariants({ size, tone }), className), ...props },
    children,
  );
});

Heading.displayName = "Heading";

/**
 * Small eyebrow / kicker above a heading.
 * Uppercase mono, wide tracking — our recurring design motif.
 */
export function Eyebrow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn(
        "font-mono text-xs uppercase tracking-[0.25em] text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
