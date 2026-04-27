import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { WishlistPageClient } from "@/components/wishlist/wishlist-page-client";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Saved R1P FITNESS products.",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <Container size="lg" as="main" className="py-10 sm:py-16">
      <header className="mb-10">
        <p className="text-gold font-mono text-[10px] tracking-[0.35em] uppercase">Wishlist</p>
        <Heading level={1} size="xl" className="mt-3 text-4xl sm:text-5xl lg:text-6xl">
          Saved for later.
        </Heading>
        <p className="text-muted mt-3 max-w-xl font-serif text-lg leading-relaxed italic">
          Build your next drop list, then come back when it is time to move.
        </p>
      </header>
      <WishlistPageClient />
    </Container>
  );
}
