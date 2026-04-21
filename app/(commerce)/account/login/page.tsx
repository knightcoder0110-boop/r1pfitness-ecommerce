import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl tracking-wider text-text">Sign In</h1>
        <p className="mt-2 font-serif italic text-subtle">
          Welcome back, Ohana.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-6 font-mono text-xs text-muted text-center">
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.register}
            className="underline hover:text-text transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
