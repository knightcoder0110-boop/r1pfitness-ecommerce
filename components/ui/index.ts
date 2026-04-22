export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";
export { Badge } from "./badge";
export type { BadgeProps } from "./badge";
export { Breadcrumbs } from "./breadcrumbs";
export type { BreadcrumbsProps, BreadcrumbItem } from "./breadcrumbs";
export { Container } from "./container";
export type { ContainerProps } from "./container";
export { Heading, Eyebrow } from "./heading";
export type { HeadingProps } from "./heading";
export { PageHeader } from "./page-header";
export type { PageHeaderProps } from "./page-header";
export { Price } from "./price";
export type { PriceProps } from "./price";
export { QuantityStepper } from "./quantity-stepper";
export type { QuantityStepperProps } from "./quantity-stepper";
export { Skeleton } from "./skeleton";
export type { SkeletonProps } from "./skeleton";
export { Section } from "./section";
export type { SectionProps } from "./section";
export { SectionHeader } from "./section-header";
export type { SectionHeaderProps } from "./section-header";

/*
 * ─── Corner-radius policy ───────────────────────────────────────────────
 * R1P FITNESS radii (single source of truth):
 *
 *   rounded-sm  (4px)  — DEFAULT for every UI surface:
 *                        images, buttons, badges, cards, modals,
 *                        inputs, chips, stat tiles, dialogs, swatches.
 *   rounded-full       — decorative only: pulse dots, blur orbs,
 *                        avatar circles, icon-button backgrounds.
 *   rounded-md / lg    — do NOT use. Premium editorial ≠ chubby.
 *
 * Rule: if a surface has a border/background and is not fully square,
 * it MUST use `rounded-sm`. No bare square tiles anywhere.
 */
