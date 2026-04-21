import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Price } from "@/components/ui/price";
import { getCustomerOrders } from "@/lib/auth/woo-customer";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-muted",
  processing: "text-amber-500",
  on_hold: "text-muted",
  completed: "text-emerald-500",
  cancelled: "text-coral",
  refunded: "text-muted",
  failed: "text-coral",
};

export default async function OrdersPage() {
  const session = await auth();
  const orders = await getCustomerOrders(session?.user.wooCustomerId ?? "0");

  return (
    <div>
      <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted mb-6">
        Order History
      </h2>

      {orders.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center">
          <p className="font-display text-2xl tracking-wider text-muted">No orders yet</p>
          <p className="mt-2 font-serif italic text-sm text-subtle">
            Your order history will appear here once you place your first order.
          </p>
          <Link
            href={ROUTES.shop}
            className="mt-5 inline-block font-mono text-xs uppercase tracking-[0.25em] text-muted underline hover:text-text"
          >
            Shop now
          </Link>
        </div>
      ) : (
        <>
          {/* Header row — desktop only */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-4 pb-2 border-b border-border font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            <span>Order</span>
            <span>Date</span>
            <span>Status</span>
            <span className="text-right">Total</span>
          </div>

          <ul className="divide-y divide-border">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={ROUTES.accountOrder(order.id)}
                  className="flex sm:grid sm:grid-cols-[1fr_1fr_auto_auto] items-center gap-4 py-4 hover:bg-bg/60 transition-colors px-1 -mx-1 flex-wrap"
                >
                  {/* Order number */}
                  <span className="font-mono text-xs tracking-[0.2em] text-text w-full sm:w-auto">
                    #{order.number}
                  </span>

                  {/* Date */}
                  <span className="font-mono text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  {/* Status badge */}
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] ${STATUS_COLORS[order.status] ?? "text-muted"}`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>

                  {/* Total */}
                  <div className="sm:text-right ml-auto sm:ml-0">
                    <Price price={order.total} size="sm" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
