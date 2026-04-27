import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Price } from "@/components/ui/price";
import { CheckoutSuccessSync } from "@/components/checkout/checkout-success-sync";
import { TrackPurchaseClient } from "@/components/analytics/track-purchase-client";
import { getWooOrder } from "@/lib/checkout/woo-order";
import { ROUTES, SITE } from "@/lib/constants";

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
  const itemCount = order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const shippingName = order
    ? [order.shipping.firstName, order.shipping.lastName].filter(Boolean).join(" ")
    : "";
  const contactEmail = order?.billing.email || "r1pfitness@gmail.com";
  const nextSteps = [
    {
      title: "Confirmation sent",
      body: `A receipt is headed to ${contactEmail}. Keep it for your records.`,
      icon: Mail,
    },
    {
      title: "Order is in queue",
      body: "Your pieces are now in processing. You'll get another update once they ship.",
      icon: Package,
    },
    {
      title: "Need anything?",
      body: "Reply to your confirmation email or message the team if an address detail needs fixing.",
      icon: ShieldCheck,
    },
  ];

  return (
    <Container size="lg" as="main" className="py-10 sm:py-16 lg:py-20">
      <CheckoutSuccessSync orderId={orderId} />
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
      <div className="space-y-8 lg:space-y-10">
        <section className="relative overflow-hidden border border-border bg-surface-1 px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div aria-hidden className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
          <div aria-hidden className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-coral/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 border border-gold/25 bg-bg/45 px-3 py-1.5">
                <CheckCircle2 aria-hidden className="size-4 text-gold" />
                <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-gold">
                  Payment Confirmed
                </span>
              </div>

              <Heading level={1} size="xl" className="mt-5 text-4xl sm:text-5xl lg:text-6xl">
                Order locked in.
              </Heading>

              <p className="mt-4 max-w-2xl font-serif text-lg italic leading-relaxed text-muted sm:text-xl">
                {order
                  ? `Mahalo. Order #${order.number} is in the queue and the team will start moving on it shortly.`
                  : "Your payment went through. Your confirmation email should land shortly with the final order details."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={ROUTES.shop}
                  className={buttonVariants({ size: "lg" })}
                >
                  Continue Shopping
                </Link>
                <Link
                  href={ROUTES.contact}
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Need Help?
                </Link>
              </div>
            </div>

            <div className="border border-border bg-bg/55 p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                Order Snapshot
              </p>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="border border-border/80 bg-surface-1/70 p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                    Order
                  </dt>
                  <dd className="mt-2 font-display text-3xl tracking-[0.08em] text-text">
                    #{order?.number ?? orderId}
                  </dd>
                </div>

                <div className="border border-border/80 bg-surface-1/70 p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                    Total
                  </dt>
                  <dd className="mt-2 text-text">
                    {order ? <Price price={order.total} size="lg" /> : "Paid"}
                  </dd>
                </div>

                <div className="border border-border/80 bg-surface-1/70 p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                    Status
                  </dt>
                  <dd className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-text">
                    {order?.status ?? "Confirmed"}
                  </dd>
                </div>

                <div className="border border-border/80 bg-surface-1/70 p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                    Items
                  </dt>
                  <dd className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-text">
                    {order ? `${itemCount} piece${itemCount === 1 ? "" : "s"}` : "Ready to process"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-start">
          <div className="space-y-8">
            {order ? (
              <section className="border border-border bg-surface-1 p-6 sm:p-8">
                <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                      What You Ordered
                    </p>
                    <h2 className="mt-2 font-display text-3xl tracking-[0.08em] text-text">
                      Drop Receipt
                    </h2>
                  </div>
                  <p className="font-serif text-sm italic text-muted sm:max-w-xs sm:text-right">
                    Everything below is confirmed and attached to this order.
                  </p>
                </div>

                <ul className="mt-2 divide-y divide-border">
                  {order.items.map((item) => (
                    <li key={item.key} className="flex items-start justify-between gap-4 py-5">
                      <div className="min-w-0 space-y-1.5">
                        <p className="truncate font-display text-xl tracking-[0.06em] text-text">
                          {item.name}
                        </p>
                        {Object.values(item.attributes).length > 0 && (
                          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                            {Object.values(item.attributes).join(" / ")}
                          </p>
                        )}
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">
                          Qty {item.quantity}
                          {item.sku ? ` / ${item.sku}` : ""}
                        </p>
                      </div>
                      <Price price={item.subtotal} size="sm" className="shrink-0" />
                    </li>
                  ))}
                </ul>

                <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                      Shipping To
                    </p>
                    <address className="mt-3 space-y-1 not-italic font-sans text-sm leading-relaxed text-muted">
                      <p className="font-medium text-text">{shippingName || "Shipping address"}</p>
                      <p>{order.shipping.line1}</p>
                      {order.shipping.line2 && <p>{order.shipping.line2}</p>}
                      <p>
                        {order.shipping.city}, {order.shipping.region} {order.shipping.postalCode}
                      </p>
                      <p>{order.shipping.country}</p>
                    </address>
                  </div>

                  <div className="border border-border/80 bg-bg/45 p-4 sm:ml-auto sm:w-full sm:max-w-xs">
                    <div className="flex items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.22em]">
                      <span className="text-muted">Total</span>
                      <Price price={order.total} size="sm" />
                    </div>
                    <p className="mt-3 font-serif text-sm italic leading-relaxed text-muted">
                      Paid securely through Stripe. You'll get shipment tracking as soon as the label is created.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <section className="border border-border bg-surface-1 p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  Confirmation Sent
                </p>
                <h2 className="mt-3 font-display text-3xl tracking-[0.08em] text-text">
                  Your payment is complete.
                </h2>
                <p className="mt-3 max-w-xl font-serif text-base italic leading-relaxed text-muted">
                  We couldn't load the full order snapshot right now, but the payment succeeded and the team has it.
                  Check your inbox for the receipt and reply there if anything needs attention.
                </p>
              </section>
            )}

            <section className="border border-border bg-surface-1 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <ShieldCheck aria-hidden className="size-5 text-gold" />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  What Happens Next
                </p>
              </div>

              <div className="mt-6 grid gap-4">
                {nextSteps.map((step) => {
                  const Icon = step.icon;

                  return (
                    <div key={step.title} className="flex gap-4 border border-border/80 bg-bg/40 p-4">
                      <div className="flex size-11 shrink-0 items-center justify-center border border-gold/25 bg-gold/10">
                        <Icon aria-hidden className="size-5 text-gold" />
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text">
                          {step.title}
                        </p>
                        <p className="mt-2 font-sans text-sm leading-relaxed text-muted">{step.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-border bg-surface-1 p-6">
              <div className="flex items-center gap-3">
                <MapPin aria-hidden className="size-5 text-gold" />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  Support Desk
                </p>
              </div>

              <p className="mt-4 font-serif text-base italic leading-relaxed text-muted">
                Questions, size changes, or shipping issues? Reach out before the order leaves the queue.
              </p>

              <div className="mt-5 space-y-3">
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-3 border border-border bg-bg/45 px-4 py-3 text-sm text-text transition-colors hover:border-gold/40"
                >
                  <Mail aria-hidden className="size-4 text-gold" />
                  <span className="truncate font-mono text-[11px] uppercase tracking-[0.2em]">
                    {contactEmail}
                  </span>
                </a>

                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 border border-border bg-bg/45 px-4 py-3 text-sm text-text transition-colors hover:border-gold/40"
                >
                  <span
                    aria-hidden
                    className="flex size-4 items-center justify-center font-mono text-[10px] uppercase text-gold"
                  >
                    IG
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
                    DM @r1pfitness
                  </span>
                </a>
              </div>
            </section>

            <section className="border border-border bg-surface-1 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                Keep The Momentum
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-[0.08em] text-text">
                Ready for the next drop?
              </h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
                The fastest way to miss limited gear is closing this tab and forgetting us for two weeks.
              </p>
              <Link
                href={ROUTES.shop}
                className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gold transition-colors hover:text-text"
              >
                Browse the shop
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </Container>
  );
}
