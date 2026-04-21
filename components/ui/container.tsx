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
 */
const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    size: {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-7xl",
      prose: "max-w-prose",
      full: "max-w-none",
    },
  },
  defaultVariants: { size: "lg" },
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
