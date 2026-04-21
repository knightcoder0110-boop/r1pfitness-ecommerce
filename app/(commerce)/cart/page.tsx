import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the pieces you've claimed before checking out.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-display text-4xl tracking-[0.15em] text-text sm:text-5xl">
          Your Cart
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-text/50">
          Limited drops. Secure yours before they&apos;re gone.
        </p>
      </header>
      <CartView />
    </div>
  );
}
