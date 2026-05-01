import Link from "next/link";
import { Package, Truck } from "lucide-react";
import type { Shipment } from "@/lib/checkout/shipment";

interface ShipmentCardProps {
  shipment: Shipment | null;
  /** Order status from Woo. Used to hide the card for cancelled/refunded orders. */
  orderStatus: string;
}

/**
 * Server component. Renders a tracking card on the order detail page.
 *
 * - When tracking exists: carrier, tracking number, ship date, and a
 *   "Track package" link (only when we have a usable URL).
 * - When the order is `completed` but tracking hasn't propagated yet
 *   ("shipped, no tracking" race): a soft placeholder so the customer
 *   doesn't think the page is broken.
 * - For pre-fulfilment statuses (`processing`, `pending`, etc.) we show
 *   nothing — the existing order header already communicates status.
 * - For `cancelled` / `refunded` / `failed`: nothing.
 */
export function ShipmentCard({ shipment, orderStatus }: ShipmentCardProps) {
  const status = orderStatus.toLowerCase();

  if (["cancelled", "refunded", "failed", "trash"].includes(status)) return null;

  if (!shipment) {
    if (status === "completed") {
      return (
        <section
          aria-label="Shipment tracking"
          className="border border-border bg-surface-1 p-5 sm:p-6"
        >
          <header className="flex items-center gap-3">
            <Package aria-hidden className="size-4 text-muted" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Tracking pending
            </p>
          </header>
          <p className="mt-3 font-serif text-sm italic text-muted">
            Your order is marked complete. Carrier tracking should appear here within
            a few minutes — refresh if you don't see it yet.
          </p>
        </section>
      );
    }
    return null;
  }

  const shippedDate = new Date(shipment.shippedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section
      aria-label="Shipment tracking"
      className="border border-border bg-surface-1 p-5 sm:p-6"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Truck aria-hidden className="size-4 text-gold" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Shipment
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
          On the way
        </span>
      </header>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Carrier
          </dt>
          <dd className="mt-1 font-display text-sm tracking-[0.06em] text-text">
            {shipment.carrierName}
          </dd>
        </div>
        <div className="sm:col-span-2 min-w-0">
          <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Tracking
          </dt>
          <dd className="mt-1 font-mono text-xs text-text break-all">
            {shipment.trackingNumber}
          </dd>
        </div>
        <div className="sm:col-span-3">
          <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            Shipped
          </dt>
          <dd className="mt-1 font-serif text-sm text-subtle">{shippedDate}</dd>
        </div>
      </dl>

      {shipment.trackingUrl && (
        <Link
          href={shipment.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 border border-border bg-bg/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-text hover:bg-bg/60"
        >
          Track package
          <span aria-hidden>↗</span>
        </Link>
      )}
    </section>
  );
}
