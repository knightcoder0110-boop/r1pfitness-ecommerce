"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Wrap client-side session access for components that use useSession(). */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
