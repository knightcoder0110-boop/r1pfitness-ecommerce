import Link from "next/link";
import { auth } from "@/auth";
import { ROUTES } from "@/lib/constants";

/** Account icon/avatar for the SiteHeader. Server component — reads session via auth(). */
export async function AccountButton() {
  const session = await auth();
  const isLoggedIn = !!session;

  if (isLoggedIn) {
    const initials = session.user.name
      ? session.user.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : session.user.email?.[0]?.toUpperCase() ?? "A";

    return (
      <Link
        href={ROUTES.account}
        aria-label="My account"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/30 font-mono text-[10px] text-accent hover:ring-accent transition-all"
      >
        {initials}
      </Link>
    );
  }

  return (
    <Link
      href={ROUTES.login}
      aria-label="Sign in"
      className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted hover:text-text transition-colors"
    >
      Sign In
    </Link>
  );
}
