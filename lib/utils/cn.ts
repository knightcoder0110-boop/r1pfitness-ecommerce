import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose Tailwind classnames with correct precedence.
 *
 *   cn("px-2", condition && "px-4", "text-sm")
 *   // -> "px-4 text-sm"  (later Tailwind classes win)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
