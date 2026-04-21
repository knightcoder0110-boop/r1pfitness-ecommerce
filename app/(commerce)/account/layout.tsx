import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/lib/constants";

const ACCOUNT_NAV = [
  { label: "Dashboard", href: ROUTES.account },
  { label: "Orders", href: ROUTES.accountOrders },
  { label: "Addresses", href: ROUTES.accountAddresses },
];

/**
 * Layout for all /account/* pages (except login + register, which live here
 * too but redirect in middleware if already logged-in).
 *
 * Desktop: two-column grid — sidebar with nav on left, content on right.
 * Mobile: stacked — nav scrolls horizontally above content.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect(ROUTES.login);

  return (
    <Container size="lg" as="div" className="py-10 sm:py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
        Account
      </p>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl tracking-wider text-text">
        {session.user.name ?? session.user.email}
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        {/* ── Sidebar nav ──────────────────────────────────────────── */}
        <nav
          aria-label="Account"
          className="flex flex-row gap-4 overflow-x-auto lg:flex-col lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ACCOUNT_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 font-mono text-xs uppercase tracking-[0.25em] text-muted hover:text-text transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {/* Sign out — server action */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: ROUTES.home });
            }}
          >
            <button
              type="submit"
              className="font-mono text-xs uppercase tracking-[0.25em] text-muted hover:text-text transition-colors"
            >
              Sign Out
            </button>
          </form>
        </nav>

        {/* ── Page content ─────────────────────────────────────────── */}
        <main>{children}</main>
      </div>
    </Container>
  );
}
