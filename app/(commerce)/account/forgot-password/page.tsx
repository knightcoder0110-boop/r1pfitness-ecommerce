"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

type State = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "loading" || state === "success") return;

    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    setState("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        setState("success");
      } else {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setState("error");
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl tracking-wider text-text">
          Reset Password
        </h1>
        <p className="mt-2 font-serif italic text-subtle">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {state === "success" ? (
          <div className="mt-8 border border-gold/30 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold mb-2">
              ✓ Check your inbox
            </p>
            <p className="font-serif text-sm text-subtle">
              If an account exists for that email, a password reset link is on
              its way. Check your spam folder if you don&apos;t see it within a
              few minutes.
            </p>
            <Link
              href={ROUTES.login}
              className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.25em] text-muted underline hover:text-text transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                disabled={state === "loading"}
                className="bg-bg border border-border px-4 py-3 font-mono text-sm text-text placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 transition-opacity"
              />
            </div>

            {state === "error" && errorMsg && (
              <p role="alert" className="font-mono text-xs text-coral">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={state === "loading"}
            >
              {state === "loading" ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}

        <p className="mt-6 font-mono text-xs text-muted text-center">
          Remember your password?{" "}
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
