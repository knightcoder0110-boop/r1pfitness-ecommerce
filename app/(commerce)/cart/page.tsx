import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the pieces you've claimed before checking out.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <Container size="content" className="py-8 sm:py-10">
      <Breadcrumbs items={[{ label: "Cart" }]} className="mb-6" />

      <PageHeader
        title="Your Cart"
        subtitle="Limited drops. Secure yours before they’re gone."
        className="mb-8 sm:mb-10"
      />

      <CartView />
    </Container>
  );
}
