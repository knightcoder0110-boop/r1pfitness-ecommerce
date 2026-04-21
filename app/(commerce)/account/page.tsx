import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Price } from "@/components/ui/price";
import { getCustomerOrders } from "@/lib/auth/woo-customer";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  const customerId = session?.user.wooCustomerId ?? "0";
  const orders = await getCustomerOrders(customerId);
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="flex flex-col gap-10">
      {/* ── Quick stats ────────────────────────────────────────────── */}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Orders", value: String(orders.length) },
          {
            label: "Last Order",
            value: recentOrders[0]
              ? `#${recentOrders[0].number}`
              : "—",
          },
          {
            label: "Member Since",
            value: "2026",
          },
        ].map((stat) => (
          <li
            key={stat.label}
            className="border border-border p-4 flex flex-col gap-1"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              {stat.label}
            </span>
            <span className="font-display text-2xl tracking-wider text-text">
              {stat.value}
            </span>
          </li>
        ))}
      </ul>

      {/* ── Recent orders ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Recent Orders
          </h2>
          {orders.length > 3 && (
            <Link
              href={ROUTES.accountOrders}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted underline hover:text-text"
            >
              View all
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="border border-dashed border-border py-10 text-center">
            <p className="font-display text-xl tracking-wider text-muted">No orders yet</p>
            <p className="mt-2 font-serif italic text-sm text-subtle">
              When you place your first order it&apos;ll show up here.
            </p>
            <Link
              href={ROUTES.shop}
              className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.25em] text-muted underline hover:text-text"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={ROUTES.accountOrder(order.id)}
                  className="flex items-center justify-between py-4 hover:bg-bg/60 transition-colors px-1 -mx-1"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs tracking-[0.2em] text-text">
                      #{order.number}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted capitalize">
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right flex flex-col gap-0.5">
                    <Price price={order.total} size="sm" />
                    <span className="font-mono text-[10px] text-subtle">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Quick links ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: "View all orders", href: ROUTES.accountOrders },
          { label: "Manage addresses", href: ROUTES.accountAddresses },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-border p-4 font-mono text-xs uppercase tracking-[0.25em] text-muted hover:text-text hover:border-border-strong transition-colors"
          >
            {link.label} →
          </Link>
        ))}
      </section>
    </div>
  );
}
