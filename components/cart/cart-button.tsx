"use client";

import { ShoppingBag } from "lucide-react";
import { useCartActions, useCartItemCount, useHasHydrated } from "@/lib/cart";
import { cn } from "@/lib/utils/cn";

export interface CartButtonProps {
  className?: string;
}

/**
 * Header icon that opens the drawer. The count badge only renders after
 * hydration to avoid SSR-vs-client mismatch flicker.
 */
export function CartButton({ className }: CartButtonProps) {
  const { open } = useCartActions();
  const count = useCartItemCount();
  const hydrated = useHasHydrated();
  const showBadge = hydrated && count > 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Open cart${showBadge ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center text-text transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        className,
      )}
    >
      <ShoppingBag className="h-5 w-5" />
      {showBadge ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-text tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
