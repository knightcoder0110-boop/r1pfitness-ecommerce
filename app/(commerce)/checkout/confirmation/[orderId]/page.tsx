import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Price } from "@/components/ui/price";
import { TrackPurchaseClient } from "@/components/analytics/track-purchase-client";
import { getWooOrder } from "@/lib/checkout/woo-order";
import { ROUTES } from "@/lib/constants";

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

/**
 * /checkout/confirmation/[orderId]
 *
 * Shown after Stripe payment succeeds. Fetches the Woo order server-side and
 * displays a summary with order number, items, and billing address.
 *
 * If the order is not found (invalid orderId) we still show a generic success
 * message — the payment succeeded even if the fetch fails.
 */
export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderId } = await params;
  const order = await getWooOrder(orderId);

  return (
    <Container size="md" as="main" className="py-12 sm:py-20">
      {order && (
        <TrackPurchaseClient
          order={{
            id: order.id,
            number: order.number,
            total: order.total,
            items: order.items,
          }}
        />
      )}
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent"
          aria-hidden
        >
          Confirmed
        </span>
        <Heading level={1} size="xl" className="text-3xl sm:text-4xl">
          Order received.
        </Heading>
        <p className="max-w-md font-serif text-base italic text-muted">
          {order
            ? `Order #${order.number} is in the queue. You'll receive a confirmation email shortly.`
            : "Your payment went through. Check your inbox for a confirmation email."}
        </p>
        {order && (
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
            Order #{order.number} &middot; Status:{" "}
            <span className="text-text capitalize">{order.status}</span>
          </p>
        )}
      </div>

      {/* Order details */}
      {order && (
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {/* Items */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Items
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-text truncate">
                      {item.name}
                    </p>
                    {Object.values(item.attributes).length > 0 && (
                      <p className="font-mono text-[10px] text-muted">
                        {Object.values(item.attributes).join(" / ")}
                      </p>
                    )}
                    <p className="font-mono text-[10px] text-subtle">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <Price price={item.subtotal} size="sm" className="flex-none" />
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4 flex justify-between font-mono text-xs uppercase tracking-[0.2em]">
              <span className="text-muted">Total</span>
              <Price price={order.total} size="sm" />
            </div>
          </section>

          {/* Billing address */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Shipping to
            </h2>
            <address className="mt-4 not-italic font-sans text-sm text-muted space-y-1">
              <p className="text-text font-medium">
                {order.shipping.firstName} {order.shipping.lastName}
              </p>
              <p>{order.shipping.line1}</p>
              {order.shipping.line2 && <p>{order.shipping.line2}</p>}
              <p>
                {order.shipping.city}, {order.shipping.region}{" "}
                {order.shipping.postalCode}
              </p>
              <p>{order.shipping.country}</p>
            </address>
          </section>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 flex flex-col items-center gap-4">
        <Link
          href={ROUTES.shop}
          className="font-mono text-xs uppercase tracking-[0.3em] text-muted underline underline-offset-4 hover:text-text"
        >
          Continue Shopping
        </Link>
      </div>
    </Container>
  );
}
