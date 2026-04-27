"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerCart } from "@/lib/cart";
import { useToastStore } from "@/lib/toast";
import { trackAddToCart } from "@/lib/analytics";
import type { Product, ProductVariation } from "@/lib/woo/types";

export interface BuyNowButtonProps {
  product: Product;
  variation?: ProductVariation | undefined;
  disabled?: boolean;
  className?: string;
}

/**
 * Express checkout — adds the item to cart and routes straight to /checkout,
 * skipping the cart drawer.
 *
 * NOTE: This is the v1 implementation. The v2 swap-in is the Stripe Payment
 * Request API (Apple Pay / Google Pay native sheets). The component contract
 * stays the same — internals change. See `13-current-code-gap-table.md`.
 *
 * Why "secondary" not "primary": the primary CTA is always Add-to-Cart so
 * users who want to keep shopping aren't accidentally dropped into checkout.
 * Buy-now is the *high-intent* path — visually clear, not visually loud.
 */
export function BuyNowButton({
  product,
  variation,
  disabled,
  className,
}: BuyNowButtonProps) {
  const router = useRouter();
  const { addItem } = useServerCart();
  const showToast = useToastStore((s) => s.show);
  const [isPending, setIsPending] = useState(false);

  async function handleBuyNow() {
    if (disabled || isPending) return;
    setIsPending(true);
    try {
      await addItem({
        product,
        ...(variation ? { variation } : {}),
        quantity: 1,
      });
      trackAddToCart({
        productId: product.id,
        ...(variation?.id ? { variationId: variation.id } : {}),
        name: product.name,
        price: variation?.price ?? product.price,
        quantity: 1,
      });
      router.push("/checkout");
    } catch {
      showToast("Couldn't start checkout. Try again.", "error");
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="tertiary"
      size="lg"
      full
      disabled={disabled || isPending}
      onClick={handleBuyNow}
      leadingIcon={<Zap aria-hidden strokeWidth={2} className="size-4" />}
      className={className}
    >
      {isPending ? "Starting checkout..." : "Buy It Now"}
    </Button>
  );
}
