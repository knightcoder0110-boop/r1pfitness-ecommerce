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
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold uppercase tracking-wider",
    "cursor-pointer select-none",
    "rounded-md",
    "transition-[transform,filter,background-color,box-shadow] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:pointer-events-none disabled:opacity-55 disabled:saturate-75",
    "active:translate-y-px",
  ],
  {
    variants: {
      variant: {
        // Primary — metallic gold. Solid with linear-gradient sheen + raised shadow.
        primary: [
          "text-bg shadow-metallic",
          "bg-[linear-gradient(170deg,#E6C56A_0%,#D4AF55_28%,#C9A84C_55%,#A88934_100%)]",
          "hover:brightness-[1.07] hover:shadow-metallic-hover hover:-translate-y-[1px]",
          "focus-visible:ring-gold",
        ],
        // Secondary — bone/sand solid. Paper-feel with crisp shadow.
        secondary: [
          "text-bg shadow-metallic",
          "bg-[linear-gradient(170deg,#FAF6EE_0%,#F2EDE4_45%,#E3DCCE_100%)]",
          "hover:brightness-[1.04] hover:shadow-metallic-hover hover:-translate-y-[1px]",
          "focus-visible:ring-text",
        ],
        // Tertiary — obsidian solid. Dark surface with gold-tinted border, sand text.
        tertiary: [
          "text-text shadow-soft",
          "bg-[linear-gradient(170deg,#1F1F1F_0%,#151515_55%,#0D0D0D_100%)]",
          "ring-1 ring-inset ring-[rgba(201,168,76,0.22)]",
          "hover:ring-[rgba(201,168,76,0.45)] hover:brightness-110 hover:-translate-y-[1px] hover:shadow-raised",
          "focus-visible:ring-gold",
        ],
        // Outline — subtle alt, kept for compatibility. Still solid surface.
        outline: [
          "bg-surface-1 text-text ring-1 ring-inset ring-border-strong",
          "hover:bg-surface-2 hover:ring-text/40",
          "focus-visible:ring-text",
        ],
        // Ghost — low-emphasis surface button.
        ghost: [
          "bg-transparent text-text",
          "hover:bg-surface-1",
          "focus-visible:ring-text",
        ],
        // Link — inline gold link, no shadow/bg.
        link: "bg-transparent text-gold underline-offset-4 hover:underline focus-visible:ring-gold rounded-none shadow-none",
      },
      size: {
        sm:   "h-10 px-4 text-xs",
        md:   "h-12 px-6 text-sm",
        lg:   "h-14 px-9 text-sm",
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
