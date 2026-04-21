import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Create Account",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl tracking-wider text-text">
          Join the Family
        </h1>
        <p className="mt-2 font-serif italic text-subtle">
          Create your R1P account.
        </p>

        <div className="mt-8">
          <RegisterForm />
        </div>

        <p className="mt-6 font-mono text-xs text-muted text-center">
          Already have an account?{" "}
          <Link
            href={ROUTES.login}
            className="underline hover:text-text transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
