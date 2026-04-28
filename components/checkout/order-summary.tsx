import Link from "next/link";
import type { CartLineItem as LineItem } from "@/lib/woo/types";
import { Price } from "@/components/ui/price";
import { ROUTES } from "@/lib/constants";
import {
  calculateShippingCents,
  freeShippingThresholdLabel,
} from "@/lib/constants/shipping";
import { formatMoney } from "@/lib/utils/format";

interface OrderSummaryProps {
  items: LineItem[];
  subtotal: { amount: number; currency: string };
  className?: string;
}

export function OrderSummary({ items, subtotal, className }: OrderSummaryProps) {
  const shippingCents = calculateShippingCents(subtotal.amount);
  const currency = subtotal.currency;
  return (
    <aside
      aria-label="Order summary"
      className={`h-fit border border-border p-5 sm:p-6 ${className ?? ""}`}
    >
      <h2 className="font-display text-xl tracking-wider text-text">Order Summary</h2>

      <ul className="mt-6 divide-y divide-border">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-3 py-3">
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image.url}
                alt={item.image.alt}
                width={56}
                height={70}
                className="h-[70px] w-14 flex-none object-cover"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-text line-clamp-2">
                {item.name}
              </p>
              {Object.entries(item.attributes).length > 0 && (
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  {Object.values(item.attributes).join(" / ")}
                </p>
              )}
              <p className="font-mono text-[10px] tracking-[0.15em] text-subtle">
                Qty {item.quantity}
              </p>
            </div>
            <Price price={item.subtotal} size="sm" className="flex-none" />
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-3 border-t border-border pt-4 font-mono text-xs uppercase tracking-[0.2em]">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>
            <Price price={subtotal} size="sm" />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd className="text-text tabular-nums">
            {shippingCents === 0 ? "Free" : formatMoney({ amount: shippingCents, currency })}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Taxes</dt>
          <dd className="text-muted">Calculated next step</dd>
        </div>
      </dl>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
        Free shipping over {freeShippingThresholdLabel()}
      </p>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
        <Link href={ROUTES.cart} className="underline underline-offset-2 hover:text-text">
          Edit cart
        </Link>
      </p>
    </aside>
  );
}
