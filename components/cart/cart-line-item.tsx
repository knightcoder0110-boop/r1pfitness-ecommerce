"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useServerCart } from "@/lib/cart/sync";
import type { CartLineItem as CartLineItemType } from "@/lib/woo/types";

export interface CartLineItemProps {
  item: CartLineItemType;
  /** When true, renders the compact version used in the drawer. */
  compact?: boolean;
}

/**
 * Single line in the cart drawer or cart page. Owns its qty stepper and
 * remove button — never lifts state up, just calls store actions directly.
 */
export function CartLineItem({ item, compact = false }: CartLineItemProps) {
  const { setQuantity, removeItem } = useServerCart();

  const attributeLine = Object.values(item.attributes).filter(Boolean).join(" · ");

  return (
    <article
      className="flex gap-4 border-b border-border py-4 last:border-b-0"
      aria-label={item.name}
    >
      {item.image ? (
        <div className="relative aspect-cart-thumb w-20 shrink-0 overflow-hidden rounded-sm bg-surface-1">
          <Image
            src={item.image.url}
            alt={item.image.alt || item.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base tracking-wider text-text">
              {item.name}
            </h3>
            {attributeLine ? (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                {attributeLine}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            aria-label={`Remove ${item.name}`}
            className="-mr-1 -mt-1 p-1 text-subtle transition-colors hover:text-text cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-auto flex items-center justify-between gap-3">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => setQuantity(item.key, q)}
            aria-label={`Quantity for ${item.name}`}
          />
          <Price price={item.subtotal} size={compact ? "sm" : "md"} />
        </div>
      </div>
    </article>
  );
}
