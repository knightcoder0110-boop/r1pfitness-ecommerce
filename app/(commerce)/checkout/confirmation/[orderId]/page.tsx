import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin, Package, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Price } from "@/components/ui/price";
import { CheckoutSuccessSync } from "@/components/checkout/checkout-success-sync";
import { TrackPurchaseClient } from "@/components/analytics/track-purchase-client";
import { auth } from "@/auth";
import { getCustomerOrder } from "@/lib/auth/woo-customer";
import { getWooOrderForConfirmation } from "@/lib/checkout";
import { ROUTES, SITE } from "@/lib/constants";

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ key?: string | string[] }>;
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
export default async function ConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const { orderId } = await params;
  const { key } = await searchParams;
  const orderKey = Array.isArray(key) ? key[0] : key;
  const session = await auth();
  const customerId = session?.user.wooCustomerId ?? "0";
  const customerOrder = await getCustomerOrder(orderId, customerId);
  const order = customerOrder ?? await getWooOrderForConfirmation(orderId, orderKey);
  const itemCount = order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const shippingName = order
    ? [order.shipping.firstName, order.shipping.lastName].filter(Boolean).join(" ")
    : "";
  const customerEmail = order?.billing.email || "the email used at checkout";
  const supportEmail = SITE.emails.support;
  const nextSteps = [
    {
      title: "Confirmation sent",
      body: `A receipt is headed to ${customerEmail}. Keep it for your records.`,
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
        <section className="border-border bg-surface-1 relative overflow-hidden border px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div
            aria-hidden
            className="bg-gold/10 absolute top-0 right-0 h-40 w-40 rounded-full blur-3xl"
          />
          <div
            aria-hidden
            className="bg-coral/10 absolute bottom-0 left-0 h-36 w-36 rounded-full blur-3xl"
          />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:items-start">
            <div>
              <div className="border-gold/25 bg-bg/45 inline-flex items-center gap-2 border px-3 py-1.5">
                <CheckCircle2 aria-hidden className="text-gold size-4" />
                <span className="text-gold font-mono text-[10px] tracking-[0.35em] uppercase">
                  Payment Confirmed
                </span>
              </div>

              <Heading level={1} size="xl" className="mt-5 text-4xl sm:text-5xl lg:text-6xl">
                Order locked in.
              </Heading>

              <p className="text-muted mt-4 max-w-2xl font-serif text-lg leading-relaxed italic sm:text-xl">
                {order
                  ? `Mahalo. Order #${order.number} is in the queue and the team will start moving on it shortly.`
                  : "Your payment went through. Your confirmation email should land shortly with the final order details."}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={ROUTES.shop}
                  className={buttonVariants({ size: "lg", className: "w-full justify-center sm:w-auto" })}
                >
                  Continue Shopping
                </Link>
                <Link
                  href={ROUTES.contact}
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "w-full justify-center sm:w-auto",
                  })}
                >
                  Need Help?
                </Link>
              </div>
            </div>

            <div className="border-border bg-bg/55 border p-5 sm:p-6">
              <p className="text-muted font-mono text-[10px] tracking-[0.3em] uppercase">
                Order Snapshot
              </p>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="border-border/80 bg-surface-1/70 border p-4">
                  <dt className="text-muted font-mono text-[10px] tracking-[0.25em] uppercase">
                    Order
                  </dt>
                  <dd className="font-display text-text mt-2 text-3xl tracking-[0.08em]">
                    #{order?.number ?? orderId}
                  </dd>
                </div>

                <div className="border-border/80 bg-surface-1/70 border p-4">
                  <dt className="text-muted font-mono text-[10px] tracking-[0.25em] uppercase">
                    Total
                  </dt>
                  <dd className="text-text mt-2">
                    {order ? <Price price={order.total} size="lg" /> : "Paid"}
                  </dd>
                </div>

                <div className="border-border/80 bg-surface-1/70 border p-4">
                  <dt className="text-muted font-mono text-[10px] tracking-[0.25em] uppercase">
                    Status
                  </dt>
                  <dd className="text-text mt-2 font-mono text-xs tracking-[0.22em] uppercase">
                    {order?.status ?? "Confirmed"}
                  </dd>
                </div>

                <div className="border-border/80 bg-surface-1/70 border p-4">
                  <dt className="text-muted font-mono text-[10px] tracking-[0.25em] uppercase">
                    Items
                  </dt>
                  <dd className="text-text mt-2 font-mono text-xs tracking-[0.22em] uppercase">
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
              <section className="border-border bg-surface-1 border p-6 sm:p-8">
                <div className="border-border flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-muted font-mono text-[10px] tracking-[0.3em] uppercase">
                      What You Ordered
                    </p>
                    <h2 className="font-display text-text mt-2 text-3xl tracking-[0.08em]">
                      Drop Receipt
                    </h2>
                  </div>
                  <p className="text-muted font-serif text-sm italic sm:max-w-xs sm:text-right">
                    Everything below is confirmed and attached to this order.
                  </p>
                </div>

                <ul className="divide-border mt-2 divide-y">
                  {order.items.map((item) => (
                    <li key={item.key} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 space-y-1.5">
                        <p className="font-display text-text truncate text-xl tracking-[0.06em]">
                          {item.name}
                        </p>
                        {Object.values(item.attributes).length > 0 && (
                          <p className="text-muted font-mono text-[10px] tracking-[0.22em] uppercase">
                            {Object.values(item.attributes).join(" / ")}
                          </p>
                        )}
                        <p className="text-subtle font-mono text-[10px] tracking-[0.22em] uppercase">
                          Qty {item.quantity}
                          {item.sku ? ` / ${item.sku}` : ""}
                        </p>
                      </div>
                      <Price price={item.subtotal} size="sm" className="shrink-0 self-start sm:self-auto" />
                    </li>
                  ))}
                </ul>

                <div className="border-border mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
                  <div>
                    <p className="text-muted font-mono text-[10px] tracking-[0.25em] uppercase">
                      Shipping To
                    </p>
                    <address className="text-muted mt-3 space-y-1 font-sans text-sm leading-relaxed not-italic">
                      <p className="text-text font-medium">{shippingName || "Shipping address"}</p>
                      <p>{order.shipping.line1}</p>
                      {order.shipping.line2 && <p>{order.shipping.line2}</p>}
                      <p>
                        {order.shipping.city}, {order.shipping.region} {order.shipping.postalCode}
                      </p>
                      <p>{order.shipping.country}</p>
                    </address>
                  </div>

                  <div className="border-border/80 bg-bg/45 border p-4 sm:ml-auto sm:w-full sm:max-w-xs">
                    <div className="flex items-center justify-between gap-4 font-mono text-xs tracking-[0.22em] uppercase">
                      <span className="text-muted">Total</span>
                      <Price price={order.total} size="sm" />
                    </div>
                    <p className="text-muted mt-3 font-serif text-sm leading-relaxed italic">
                      Paid securely through Stripe. You&apos;ll get shipment tracking as soon as the
                      label is created.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <section className="border-border bg-surface-1 border p-6 sm:p-8">
                <p className="text-muted font-mono text-[10px] tracking-[0.3em] uppercase">
                  Confirmation Sent
                </p>
                <h2 className="font-display text-text mt-3 text-3xl tracking-[0.08em]">
                  Your payment is complete.
                </h2>
                <p className="text-muted mt-3 max-w-xl font-serif text-base leading-relaxed italic">
                  We couldn&apos;t load the full order snapshot right now, but the payment succeeded
                  and the team has it. Check your inbox for the receipt and reply there if anything
                  needs attention.
                </p>
              </section>
            )}

            <section className="border-border bg-surface-1 border p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <ShieldCheck aria-hidden className="text-gold size-5" />
                <p className="text-muted font-mono text-[10px] tracking-[0.3em] uppercase">
                  What Happens Next
                </p>
              </div>

              <div className="mt-6 grid gap-4">
                {nextSteps.map((step) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.title}
                      className="border-border/80 bg-bg/40 flex gap-4 border p-4"
                    >
                      <div className="border-gold/25 bg-gold/10 flex size-11 shrink-0 items-center justify-center border">
                        <Icon aria-hidden className="text-gold size-5" />
                      </div>
                      <div>
                        <p className="text-text font-mono text-[10px] tracking-[0.25em] uppercase">
                          {step.title}
                        </p>
                        <p className="text-muted mt-2 font-sans text-sm leading-relaxed">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border-border bg-surface-1 border p-6">
              <div className="flex items-center gap-3">
                <MapPin aria-hidden className="text-gold size-5" />
                <p className="text-muted font-mono text-[10px] tracking-[0.3em] uppercase">
                  Support Desk
                </p>
              </div>

              <p className="text-muted mt-4 font-serif text-base leading-relaxed italic">
                Questions, size changes, or shipping issues? Reach out before the order leaves the
                queue.
              </p>

              <div className="mt-5 space-y-3">
                <a
                  href={`mailto:${supportEmail}`}
                  className="border-border bg-bg/45 text-text hover:border-gold/40 flex items-center gap-3 border px-4 py-3 text-sm transition-colors"
                >
                  <Mail aria-hidden className="text-gold size-4" />
                  <span className="min-w-0 break-all font-mono text-[11px] tracking-[0.2em] uppercase">
                    {supportEmail}
                  </span>
                </a>

                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border bg-bg/45 text-text hover:border-gold/40 flex items-center gap-3 border px-4 py-3 text-sm transition-colors"
                >
                  <span
                    aria-hidden
                    className="text-gold flex size-4 items-center justify-center font-mono text-[10px] uppercase"
                  >
                    IG
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase">
                    DM @r1pfitness
                  </span>
                </a>
              </div>
            </section>

            <section className="border-border bg-surface-1 border p-6">
              <p className="text-muted font-mono text-[10px] tracking-[0.3em] uppercase">
                Keep The Momentum
              </p>
              <h2 className="font-display text-text mt-2 text-2xl tracking-[0.08em]">
                Ready for the next drop?
              </h2>
              <p className="text-muted mt-3 font-sans text-sm leading-relaxed">
                The fastest way to miss limited gear is closing this tab and forgetting us for two
                weeks.
              </p>
              <Link
                href={ROUTES.shop}
                className="text-gold hover:text-text mt-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] uppercase transition-colors"
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
