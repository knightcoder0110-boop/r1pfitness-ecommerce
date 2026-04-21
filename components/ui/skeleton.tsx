import { cn } from "@/lib/utils/cn";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Solid-color animated placeholder. Use for route-level and component-level
 * loading fallbacks. Opacity pulses — no color shift to keep the dark theme
 * consistent.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-sm bg-text/10", className)}
      {...props}
    />
  );
}
