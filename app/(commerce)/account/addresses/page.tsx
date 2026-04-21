import type { Metadata } from "next";
import { auth } from "@/auth";
import { getCustomerProfile } from "@/lib/auth/woo-customer";
import { AddressForm } from "@/components/auth/address-form";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false, follow: false },
};

const EMPTY_ADDRESS = {
  firstName: "",
  lastName: "",
  line1: "",
  city: "",
  region: "",
  postalCode: "",
  country: "US",
};

export default async function AddressesPage() {
  const session = await auth();
  const customerId = session?.user.wooCustomerId ?? "0";
  const profile = await getCustomerProfile(customerId);

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted mb-6">
          Billing Address
        </h2>
        <AddressForm
          type="billing"
          initial={profile?.billing ?? EMPTY_ADDRESS}
          customerId={customerId}
        />
      </section>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted mb-6">
          Shipping Address
        </h2>
        <AddressForm
          type="shipping"
          initial={profile?.shipping ?? EMPTY_ADDRESS}
          customerId={customerId}
        />
      </section>
    </div>
  );
}
