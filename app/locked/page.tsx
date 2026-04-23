import type { Metadata } from "next";
import SiteLockScreen from "@/components/site-lock-screen";

export const metadata: Metadata = {
  title: "Private Access — R1P FITNESS",
  description:
    "Enter your password to unlock R1P FITNESS. Exclusive drops, limited releases.",
  robots: { index: false, follow: false },
};

/**
 * /locked — shown to anyone who hasn't unlocked the site yet.
 *
 * This page is always public (excluded from the middleware site-lock check)
 * so unauthenticated visitors can reach it and enter the password.
 * On correct entry, /api/site-unlock sets an HTTP-only cookie and the
 * browser is redirected to /.
 */
export default function LockedPage() {
  return <SiteLockScreen />;
}
