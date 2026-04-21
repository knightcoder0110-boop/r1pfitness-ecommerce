"use client";

import { SessionProvider } from "next-auth/react";
import { CartSyncProvider } from "@/lib/cart/sync";
import type { ReactNode } from "react";

/** Root client providers. Order matters: auth wraps cart so cart can read session if needed. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartSyncProvider>{children}</CartSyncProvider>
    </SessionProvider>
  );
}
