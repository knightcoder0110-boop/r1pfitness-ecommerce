"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { CartSyncProvider } from "@/lib/cart/sync";
import { useToastStore } from "@/lib/toast";
import Toast from "@/components/toast";
import { initGtmAdapter } from "@/lib/analytics/gtm";
import { initKlaviyoAdapter } from "@/lib/analytics/klaviyo-adapter";
import type { ReactNode } from "react";

/** Renders the global toast notification. Single instance at root level. */
function ToastRoot() {
  const { message, type, visible, dismiss } = useToastStore();
  return <Toast message={message} type={type} visible={visible} onDismiss={dismiss} />;
}

/** Registers the GTM dataLayer analytics adapter on first client-side mount. */
function AnalyticsInit() {
  useEffect(() => {
    initGtmAdapter();
    initKlaviyoAdapter();
  }, []);
  return null;
}

/** Root client providers. Order matters: auth wraps cart so cart can read session if needed. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartSyncProvider>{children}</CartSyncProvider>
      <AnalyticsInit />
      <ToastRoot />
    </SessionProvider>
  );
}
