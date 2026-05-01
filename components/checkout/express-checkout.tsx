"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type StripeElementsOptions,
  type StripeExpressCheckoutElementConfirmEvent,
  type StripeExpressCheckoutElementOptions,
} from "@stripe/stripe-js";
import { useCartActions, useCartCoupon, useCartItems, useCartSubtotal } from "@/lib/cart";
import {
  FLAT_SHIPPING_RATE_CENTS,
  STANDARD_SHIPPING_METHOD_TITLE,
  calculateShippingCents,
} from "@/lib/constants/shipping";
import { trackBeginCheckout } from "@/lib/analytics";
import type { CheckoutResult } from "@/lib/checkout/types";
import { ROUTES } from "@/lib/constants";
import { mintIdempotencyKey } from "@/lib/checkout/idempotency-key";

// ── Stripe loader (singleton) ──────────────────────────────────────────────

let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripePromise() {
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
    stripePromise = loadStripe(pk);
  }
  return stripePromise;
}

// ── Address normalisation ──────────────────────────────────────────────────

interface CheckoutAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string;
}

function splitName(fullName: string | undefined): { firstName: string; lastName: string } {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: parts[0]! };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

function normaliseExpressAddress(
  name: string | undefined,
  address: StripeExpressCheckoutElementConfirmEvent["billingDetails"] extends infer T
    ? T extends { address: infer A }
      ? A
      : never
    : never,
  phone?: string,
): CheckoutAddress {
  const { firstName, lastName } = splitName(name);
  return {
    firstName,
    lastName,
    line1: address.line1,
    ...(address.line2 ? { line2: address.line2 } : {}),
    city: address.city,
    region: address.state,
    postalCode: address.postal_code,
    country: address.country,
    ...(phone ? { phone } : {}),
  };
}

// ── Inner component (inside <Elements>) ────────────────────────────────────

function ExpressCheckoutInner({
  shippingCents,
  shippingFree,
}: {
  shippingCents: number;
  shippingFree: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clear } = useCartActions();
  const items = useCartItems();
  const coupon = useCartCoupon();
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    if (!stripe || !elements) return;
    setError(null);

    const billingDetails = event.billingDetails;
    const shippingDetails = event.shippingAddress;

    if (!billingDetails || !billingDetails.address) {
      event.paymentFailed({ reason: "invalid_billing_address" });
      setError("Wallet did not provide billing details. Please try again.");
      return;
    }

    const billing = normaliseExpressAddress(
      billingDetails.name,
      billingDetails.address,
      billingDetails.phone,
    );
    const shipping = shippingDetails?.address
      ? normaliseExpressAddress(shippingDetails.name, shippingDetails.address)
      : undefined;

    const email = billingDetails.email;
    if (!email) {
      event.paymentFailed({ reason: "fail", message: "Email required" });
      setError("Wallet did not provide an email. Enable email sharing and try again.");
      return;
    }

    // Validate Elements (no-op for ECE but required by deferred-clientSecret flow).
    const { error: submitError } = await elements.submit();
    if (submitError) {
      event.paymentFailed({ reason: "fail", message: submitError.message });
      setError(submitError.message ?? "Could not submit payment.");
      return;
    }

    // Server: create Woo order + Stripe PaymentIntent.
    let result: CheckoutResult;
    try {
      const res = await fetch("/api/checkout/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          billing,
          ...(shipping ? { shipping } : {}),
          idempotencyKey: mintIdempotencyKey(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const message =
          json.error?.message ?? json.error ?? "Could not create order. Please try again.";
        event.paymentFailed({ reason: "fail", message });
        setError(message);
        return;
      }
      result = json.data as CheckoutResult;
    } catch {
      event.paymentFailed({ reason: "fail", message: "Network error" });
      setError("Network error. Please check your connection and try again.");
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

    const confirmedPath = result.orderKey
      ? `${ROUTES.checkoutConfirmation(result.orderId)}?key=${encodeURIComponent(result.orderKey)}`
      : ROUTES.checkoutConfirmation(result.orderId);

    // Drive the wallet handoff. Stripe enforces that the Elements amount
    // matches the PaymentIntent amount — both equal subtotal + shipping
    // (no client-side tax preview; merchant must use tax-inclusive pricing).
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: result.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}${confirmedPath}`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      event.paymentFailed({ reason: "fail", message: confirmError.message });
      setError(confirmError.message ?? "Payment failed. Please try a different method.");
      return;
    }

    // Confirmed without redirect (typical for wallets). Clear cart, navigate.
    clear();
    router.push(confirmedPath);
  }

  const elementOptions: StripeExpressCheckoutElementOptions = {
    buttonType: { applePay: "buy", googlePay: "buy" },
    buttonHeight: 48,
    paymentMethods: { applePay: "auto", googlePay: "auto", link: "auto" },
    paymentMethodOrder: ["apple_pay", "google_pay", "link"],
    emailRequired: true,
    phoneNumberRequired: false,
    shippingAddressRequired: true,
    allowedShippingCountries: ["US"],
    shippingRates: [
      {
        id: "standard",
        amount: shippingCents,
        displayName: shippingFree ? "Free Shipping" : STANDARD_SHIPPING_METHOD_TITLE,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3">
      <ExpressCheckoutElement
        options={elementOptions}
        onConfirm={handleConfirm}
      />
      {error && (
        <p role="alert" className="font-mono text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Outer wrapper — mounts Elements with predicted amount ──────────────────

export function ExpressCheckout() {
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const coupon = useCartCoupon();

  // Predicted amount the wallet will display. The /api/checkout/express
  // endpoint creates a PaymentIntent for this exact amount so Stripe's
  // Elements-vs-PI amount guard passes. This implies tax-inclusive pricing
  // (current Woo config) — switch to Stripe Tax for jurisdictions that need
  // line-item tax breakdown in the wallet sheet.
  const discounted = Math.max(0, subtotal.amount - (coupon?.discount.amount ?? 0));
  const shippingFree = !!coupon?.freeShipping;
  const shippingCents = shippingFree ? 0 : calculateShippingCents(discounted);
  const amount = discounted + shippingCents;

  // Stripe rejects amount === 0; bail out cleanly if cart is empty or fully
  // discounted to free.
  if (!items.length || amount <= 0) return null;
  // Defensive — if we ever drop the threshold check upstream we still want a
  // sane minimum so Stripe doesn't 400 us.
  if (amount < FLAT_SHIPPING_RATE_CENTS) return null;

  const options: StripeElementsOptions = {
    mode: "payment",
    amount,
    currency: subtotal.currency.toLowerCase(),
    appearance: {
      theme: "night",
      variables: {
        colorBackground: "#0D0D0D",
        colorText: "#F2EDE4",
        borderRadius: "0px",
      },
    },
  };

  return (
    <Elements stripe={getStripePromise()} options={options}>
      <ExpressCheckoutInner
        shippingCents={shippingCents}
        shippingFree={shippingFree}
      />
    </Elements>
  );
}
