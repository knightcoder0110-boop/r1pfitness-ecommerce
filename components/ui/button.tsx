import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Reference UI primitive.
 *
 * Conventions this component establishes for the whole component library:
 *  - Class-variance-authority for variant + size matrices.
 *  - `asChild` pattern deferred until we need Radix Slot; for now accept `as`
 *    only through the native `button` element.
 *  - Forward refs for form compatibility.
 *  - Styling via tokens in `globals.css` + Tailwind. No inline CSS.
 *
 * If you're adding another primitive (Input, Badge, Dialog), COPY this layout:
 *   1. `*Variants` from cva.
 *   2. `export interface *Props extends HTMLAttributes, VariantProps`.
 *   3. `forwardRef` component with displayName.
 *   4. Colocated `.test.tsx` with a11y + interaction tests.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold uppercase tracking-wider",
    "transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-[#C4572A] text-[#F2EDE4] hover:bg-[#a94721] focus-visible:ring-[#C4572A]",
        secondary:
          "bg-[#F2EDE4] text-[#0D0D0D] hover:bg-[#d9d3c7] focus-visible:ring-[#F2EDE4]",
        outline:
          "border border-[#F2EDE4]/40 bg-transparent text-[#F2EDE4] hover:bg-[#F2EDE4]/10 focus-visible:ring-[#F2EDE4]",
        ghost: "bg-transparent text-[#F2EDE4] hover:bg-[#F2EDE4]/10 focus-visible:ring-[#F2EDE4]",
        link: "bg-transparent text-[#C9A84C] underline-offset-4 hover:underline focus-visible:ring-[#C9A84C]",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
      },
      full: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      full: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, render a spinner and disable interaction. */
  loading?: boolean;
  /** Optional icon rendered before the label. */
  leadingIcon?: React.ReactNode;
  /** Optional icon rendered after the label. */
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, full, loading, leadingIcon, trailingIcon, children, disabled, type, ...props },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading ? "true" : undefined}
      className={cn(buttonVariants({ variant, size, full }), className)}
      {...props}
    >
      {loading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : leadingIcon ? (
        <span aria-hidden className="inline-flex">
          {leadingIcon}
        </span>
      ) : null}
      <span>{children}</span>
      {!loading && trailingIcon ? (
        <span aria-hidden className="inline-flex">
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
});

Button.displayName = "Button";

export { buttonVariants };
