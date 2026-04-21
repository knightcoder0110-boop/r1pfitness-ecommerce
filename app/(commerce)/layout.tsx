import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteHeader, SiteFooter } from "@/components/layout";

/**
 * Shared layout for all commerce routes — `/shop`, `/product/*`, `/cart`.
 * Landing page and drop pages are NOT wrapped by this layout (they live
 * outside this route group).
 */
export default function CommerceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-[calc(100vh-10rem)]">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
