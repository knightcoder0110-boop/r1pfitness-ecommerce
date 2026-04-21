import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the pieces you've claimed before checking out.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <Container size="md" className="py-8 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <Heading level={1} size="xl" className="text-3xl sm:text-4xl lg:text-5xl tracking-[0.15em]">
          Your Cart
        </Heading>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Limited drops. Secure yours before they&apos;re gone.
        </p>
      </header>
      <CartView />
    </Container>
  );
}
