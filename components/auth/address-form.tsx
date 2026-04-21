"use client";

import { useState } from "react";
import type { CustomerProfile } from "@/lib/auth/woo-customer";
import { Field } from "@/components/checkout/field";
import { Button } from "@/components/ui/button";

type AddressType = "billing" | "shipping";

interface AddressFormProps {
  type: AddressType;
  initial: CustomerProfile["billing"] | CustomerProfile["shipping"];
  customerId: string;
}

export function AddressForm({ type, initial, customerId }: AddressFormProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setSaved(false);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    fd.forEach((v, k) => {
      body[k] = v as string;
    });

    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data: body, customerId }),
    });

    setIsPending(false);

    if (!res.ok) {
      setError("Failed to save address. Please try again.");
      return;
    }

    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {type === "billing" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First Name"
              name="firstName"
              defaultValue={(initial as CustomerProfile["billing"]).firstName ?? ""}
              autoComplete="billing given-name"
              required
            />
            <Field
              label="Last Name"
              name="lastName"
              defaultValue={(initial as CustomerProfile["billing"]).lastName ?? ""}
              autoComplete="billing family-name"
              required
            />
          </div>
          <Field
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={(initial as CustomerProfile["billing"]).phone ?? ""}
            autoComplete="billing tel"
          />
        </>
      )}

      {type === "shipping" && (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First Name"
            name="firstName"
            defaultValue={(initial as CustomerProfile["shipping"]).firstName ?? ""}
            autoComplete="shipping given-name"
          />
          <Field
            label="Last Name"
            name="lastName"
            defaultValue={(initial as CustomerProfile["shipping"]).lastName ?? ""}
            autoComplete="shipping family-name"
          />
        </div>
      )}

      <Field
        label="Address"
        name="line1"
        defaultValue={initial.line1 ?? ""}
        autoComplete={`${type} address-line1`}
        required
      />
      <Field
        label="Apt / Suite (optional)"
        name="line2"
        defaultValue={initial.line2 ?? ""}
        autoComplete={`${type} address-line2`}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="City"
          name="city"
          defaultValue={initial.city ?? ""}
          autoComplete={`${type} address-level2`}
          required
        />
        <Field
          label="State"
          name="region"
          defaultValue={initial.region ?? ""}
          autoComplete={`${type} address-level1`}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="ZIP"
          name="postalCode"
          defaultValue={initial.postalCode ?? ""}
          autoComplete={`${type} postal-code`}
          required
        />
        <Field
          label="Country"
          name="country"
          defaultValue={initial.country ?? "US"}
          autoComplete={`${type} country`}
          required
        />
      </div>

      {error && (
        <p role="alert" className="font-mono text-xs text-coral">
          {error}
        </p>
      )}
      {saved && (
        <p className="font-mono text-xs text-emerald-500">
          Address saved ✓
        </p>
      )}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Saving…" : "Save Address"}
      </Button>
    </form>
  );
}
