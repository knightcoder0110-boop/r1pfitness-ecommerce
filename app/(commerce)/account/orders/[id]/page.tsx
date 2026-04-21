import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Price } from "@/components/ui/price";
import { getCustomerOrder } from "@/lib/auth/woo-customer";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Order Detail",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const order = await getCustomerOrder(id, session?.user.wooCustomerId ?? "0");
  if (!order) notFound();

  const lines = [
    { label: "Subtotal", value: order.subtotal },
    ...(order.discountTotal.amount > 0
      ? [{ label: "Discount", value: order.discountTotal, negative: true }]
      : []),
    { label: "Shipping", value: order.shippingTotal },
    { label: "Tax", value: order.taxTotal },
  ] as const;

  return (
    <div className="flex flex-col gap-10">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={ROUTES.accountOrders}
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted underline hover:text-text"
          >
            ← Orders
          </Link>
          <h2 className="mt-2 font-display text-2xl tracking-wider text-text">
            Order #{order.number}
          </h2>
          <p className="font-mono text-xs text-muted capitalize mt-1">
            {order.status} ·{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Price price={order.total} size="lg" />
      </div>

      {/* ── Line items ───────────────────────────────────────────────── */}
      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted mb-4">
          Items
        </h3>
        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.key} className="flex justify-between py-4 gap-4">
              <div>
                <p className="font-serif text-sm text-text">{item.name}</p>
                {item.sku && (
                  <p className="font-mono text-[10px] text-muted mt-0.5">
                    SKU: {item.sku}
                  </p>
                )}
                <p className="font-mono text-xs text-muted mt-0.5">
                  Qty: {item.quantity}
                </p>
              </div>
              <Price price={item.subtotal} size="sm" />
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2">
          {lines.map((line) => (
            <div key={line.label} className="flex justify-between">
              <span className="font-mono text-xs text-muted">{line.label}</span>
              <Price price={line.value} size="sm" />
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 mt-1">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text">
              Total
            </span>
            <Price price={order.total} size="md" />
          </div>
        </div>
      </section>

      {/* ── Addresses ────────────────────────────────────────────────── */}
      <div className="grid gap-8 sm:grid-cols-2">
        {[
          { label: "Billing Address", address: order.billing },
          { label: "Shipping Address", address: order.shipping },
        ].map(({ label, address }) => (
          <section key={label}>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted mb-3">
              {label}
            </h3>
            <address className="not-italic font-serif text-sm text-subtle leading-relaxed">
              {address.firstName} {address.lastName}
              <br />
              {address.line1}
              {address.line2 && (
                <>
                  <br />
                  {address.line2}
                </>
              )}
              <br />
              {address.city}, {address.region} {address.postalCode}
              <br />
              {address.country}
              {address.phone && (
                <>
                  <br />
                  {address.phone}
                </>
              )}
            </address>
          </section>
        ))}
      </div>
    </div>
  );
}
