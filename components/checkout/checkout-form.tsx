"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { AddressFields } from "./address-fields";
import { Field } from "./field";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { useCartActions, useCartCoupon, useCartItems, useCartSubtotal } from "@/lib/cart";
import { trackBeginCheckout } from "@/lib/analytics";
import type { CheckoutResult } from "@/lib/checkout/types";
import { ROUTES } from "@/lib/constants";

// ── Stripe loader (singleton) ──────────────────────────────────────────────

let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
    stripePromise = loadStripe(pk);
  }
  return stripePromise;
}

// ── Inner form (inside <Elements>) ─────────────────────────────────────────

interface InnerFormProps {
  orderId: string;
  orderKey?: string;
  totalAmount: number;
  currency: string;
}

function confirmationPath(orderId: string, orderKey?: string) {
  const path = ROUTES.checkoutConfirmation(orderId);
  return orderKey ? `${path}?key=${encodeURIComponent(orderKey)}` : path;
}

function PaymentForm({ orderId, orderKey, totalAmount, currency }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clear } = useCartActions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setPaymentError(null);

    const confirmedPath = confirmationPath(orderId, orderKey);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${confirmedPath}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setPaymentError(error.message ?? "Payment failed. Please try again.");
      setIsProcessing(false);
      return;
    }

    // Payment succeeded without redirect (e.g. cards, some wallets).
    clear();
    router.push(confirmedPath);
  }

  return (
    <div className="flex flex-col gap-6">
      <PaymentElement />
      {paymentError && (
        <p role="alert" className="font-mono text-xs text-coral">
          {paymentError}
        </p>
      )}
      <Button
        full
        size="lg"
        disabled={!stripe || !elements || isProcessing}
        onClick={handleConfirm}
      >
        {isProcessing ? "Processing…" : (
          <>Pay <Price price={{ amount: totalAmount, currency }} /></>
        )}
      </Button>
    </div>
  );
}

// ── Outer form — address collection + submit to /api/checkout ───────────────

export function CheckoutForm() {
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const coupon = useCartCoupon();
  const [step, setStep] = useState<"address" | "payment">("address");
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleAddressSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);

    function pick(prefix: string) {
      return {
        firstName: fd.get(`${prefix}.firstName`) as string,
        lastName: fd.get(`${prefix}.lastName`) as string,
        line1: fd.get(`${prefix}.line1`) as string,
        line2: (fd.get(`${prefix}.line2`) as string) || undefined,
        city: fd.get(`${prefix}.city`) as string,
        region: fd.get(`${prefix}.region`) as string,
        postalCode: fd.get(`${prefix}.postalCode`) as string,
        country: "US",
        phone: (fd.get(`${prefix}.phone`) as string) || undefined,
      };
    }

    const payload = {
      email: fd.get("email") as string,
      billing: pick("billing"),
      items: items.map((item) => ({
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        name: item.name,
        sku: item.sku,
        attributes: item.attributes,
      })),
      ...(coupon ? { coupons: [coupon.code] } : {}),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        // 409 = cart drifted (price/qty changed between page load and submit)
        if (res.status === 409) {
          setServerError(
            "Your cart has changed since you opened this page. " +
              "Please review your cart and try again.",
          );
          return;
        }
        if (json.error?.details ?? json.issues) {
          setFieldErrors((json.error?.details ?? json.issues) as Record<string, string[]>);
        }
        setServerError(
          json.error?.message ?? json.error ?? "Something went wrong. Please try again.",
        );
        return;
      }

      trackBeginCheckout({
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.unitPrice,
          quantity: item.quantity,
          variationId: item.variationId,
        })),
        ...(coupon ? { coupon: coupon.code } : {}),
      });
      setCheckoutResult(json.data as CheckoutResult);
      setStep("payment");
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Payment step ────────────────────────────────────────────────────────

  if (step === "payment" && checkoutResult) {
    const options: StripeElementsOptions = {
      clientSecret: checkoutResult.clientSecret,
      appearance: {
        theme: "night",
        variables: {
          colorBackground: "#0D0D0D",
          colorText: "#F2EDE4",
          colorTextPlaceholder: "#5A5047",
          colorDanger: "#C4572A",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          borderRadius: "0px",
        },
      },
    };

    return (
      <Elements stripe={getStripePromise()} options={options}>
        <div className="flex flex-col gap-6">
          <div className="border border-border p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Order #{checkoutResult.orderId}
            </p>
            <p className="mt-1 font-display text-2xl tracking-wider text-text">
              Complete Payment
            </p>
          </div>
          <PaymentForm
            orderId={checkoutResult.orderId}
            orderKey={checkoutResult.orderKey}
            totalAmount={checkoutResult.totalAmount}
            currency={checkoutResult.currency}
          />
        </div>
      </Elements>
    );
  }

  // ── Address step ────────────────────────────────────────────────────────

  function fieldError(key: string): string | undefined {
    return fieldErrors[key]?.[0];
  }

  return (
    <form onSubmit={handleAddressSubmit} noValidate className="flex flex-col gap-6">
      <fieldset className="border border-border p-5 sm:p-6">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          Contact
        </legend>
        <div className="mt-4">
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={fieldError("email")}
            required
          />
        </div>
      </fieldset>

      <AddressFields
        legend="Billing Address"
        prefix="billing"
        errors={{
          firstName: fieldError("billing.firstName"),
          lastName: fieldError("billing.lastName"),
          line1: fieldError("billing.line1"),
          city: fieldError("billing.city"),
          region: fieldError("billing.region"),
          postalCode: fieldError("billing.postalCode"),
        }}
      />

      {serverError && (
        <p role="alert" className="font-mono text-xs text-coral">
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Subtotal:{" "}
          <span className="text-text">
            <Price price={subtotal} />
          </span>
        </span>
        <Button type="submit" size="lg" full disabled={isSubmitting} className="sm:w-auto">
          {isSubmitting ? "Processing…" : "Continue to Payment"}
        </Button>
      </div>
    </form>
  );
}
