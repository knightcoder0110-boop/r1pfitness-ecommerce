import { forwardRef, type HTMLAttributes, type ElementType, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Container, type ContainerProps } from "./container";

/**
 * Section — a standardized vertical-rhythm wrapper used by every homepage
 * and PDP block. Think of it as the analog of a Shopify section.
 *
 * Design goals:
 *  - ONE vertical-padding scale across the whole site (sm / md / lg)
 *  - ONE tone palette (default / muted / contrast)
 *  - Bleed mode for edge-to-edge content (SplitBanners, StatementMarquee)
 *  - Sensible defaults so pages can just write `<Section>...</Section>`
 */
const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      none: "",
      xs: "py-section-xs",
      sm: "py-section-sm",
      md: "py-section-md",
      lg: "py-section-lg",
    },
    tone: {
      default: "bg-bg",
      muted: "bg-surface-1",
      contrast: "bg-surface-2",
      transparent: "",
    },
    bordered: {
      none: "",
      top: "border-t border-border",
      bottom: "border-b border-border",
      y: "border-y border-border",
    },
  },
  defaultVariants: {
    spacing: "md",
    tone: "default",
    bordered: "none",
  },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  /** HTML element to render — defaults to `<section>` */
  as?: ElementType;
  /**
   * When `true`, content is rendered edge-to-edge (no inner Container).
   * Use for full-bleed banners, marquees, and galleries.
   */
  bleed?: boolean;
  /** Container size when NOT bleed */
  containerSize?: ContainerProps["size"];
  children: ReactNode;
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  {
    className,
    spacing,
    tone,
    bordered,
    bleed = false,
    containerSize,
    as: Tag = "section",
    children,
    ...props
  },
  ref,
) {
  const inner = bleed ? (
    children
  ) : (
    <Container size={containerSize}>{children}</Container>
  );

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={cn(sectionVariants({ spacing, tone, bordered }), className)}
      {...props}
    >
      {inner}
    </Tag>
  );
});

Section.displayName = "Section";
