"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/checkout/field";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    const confirm = fd.get("confirmPassword") as string;
    const firstName = fd.get("firstName") as string;
    const lastName = fd.get("lastName") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      setIsPending(false);
      return;
    }

    // Call our register API route
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? "Registration failed. Please try again.");
      setIsPending(false);
      return;
    }

    // Auto sign-in after registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsPending(false);

    if (result?.error) {
      // Account created but sign-in failed — send to login
      router.push(ROUTES.login);
      return;
    }

    router.push(ROUTES.account);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="First Name"
          name="firstName"
          autoComplete="given-name"
          required
        />
        <Field
          label="Last Name"
          name="lastName"
          autoComplete="family-name"
          required
        />
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        required
      />
      <Field
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
      />

      {error && (
        <p role="alert" className="font-mono text-xs text-coral">
          {error}
        </p>
      )}

      <Button type="submit" full size="lg" disabled={isPending}>
        {isPending ? "Creating account…" : "Create Account"}
      </Button>
    </form>
  );
}
