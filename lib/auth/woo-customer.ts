import "server-only";

import { adminFetch } from "@/lib/woo/client";
import type { Order } from "@/lib/woo/types";

interface RawWooOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  date_created: string;
  date_modified: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  line_items: Array<{
    id: number;
    product_id: number;
    variation_id?: number;
    quantity: number;
    sku: string;
    name: string;
    price: string;
    total: string;
  }>;
}

interface RawWooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
}

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  billing: {
    firstName?: string;
    lastName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  shipping: {
    firstName?: string;
    lastName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
}

function mapOrder(raw: RawWooOrder): Order {
  const cur = raw.currency;
  const money = (s: string) => ({ amount: Math.round(parseFloat(s || "0") * 100), currency: cur });
  return {
    id: String(raw.id),
    number: raw.number,
    status: raw.status as Order["status"],
    currency: cur,
    createdAt: raw.date_created,
    updatedAt: raw.date_modified,
    subtotal: money(raw.total),
    discountTotal: { amount: 0, currency: cur },
    shippingTotal: { amount: 0, currency: cur },
    taxTotal: { amount: 0, currency: cur },
    total: money(raw.total),
    billing: {
      firstName: raw.billing.first_name ?? "",
      lastName: raw.billing.last_name ?? "",
      line1: raw.billing.address_1 ?? "",
      line2: raw.billing.address_2 || undefined,
      city: raw.billing.city ?? "",
      region: raw.billing.state ?? "",
      postalCode: raw.billing.postcode ?? "",
      country: raw.billing.country ?? "US",
      phone: raw.billing.phone || undefined,
      email: raw.billing.email || undefined,
    },
    shipping: {
      firstName: raw.shipping.first_name ?? "",
      lastName: raw.shipping.last_name ?? "",
      line1: raw.shipping.address_1 ?? "",
      line2: raw.shipping.address_2 || undefined,
      city: raw.shipping.city ?? "",
      region: raw.shipping.state ?? "",
      postalCode: raw.shipping.postcode ?? "",
      country: raw.shipping.country ?? "US",
    },
    items: raw.line_items.map((li) => ({
      key: String(li.id),
      productId: String(li.product_id),
      variationId: li.variation_id ? String(li.variation_id) : undefined,
      name: li.name,
      sku: li.sku,
      quantity: li.quantity,
      unitPrice: money(li.price),
      subtotal: money(li.total),
      attributes: {},
    })),
  };
}

/** Fetch all orders for a given WooCommerce customer ID. */
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  if (!customerId || customerId === "0") return [];
  try {
    const raw = await adminFetch<RawWooOrder[]>({
      path: `/orders?customer=${customerId}&per_page=20&orderby=date&order=desc`,
      next: { revalidate: 60 },
    });
    return raw.map(mapOrder);
  } catch {
    return [];
  }
}

/** Fetch a single order, verifying it belongs to the given customer. */
export async function getCustomerOrder(
  orderId: string,
  _customerId: string,
): Promise<Order | null> {
  try {
    const raw = await adminFetch<RawWooOrder>({
      path: `/orders/${orderId}`,
      next: { revalidate: 30 },
    });
    if (String(raw.id) !== orderId) return null;
    return mapOrder(raw);
  } catch {
    return null;
  }
}

/** Fetch full customer profile including billing + shipping addresses. */
export async function getCustomerProfile(customerId: string): Promise<CustomerProfile | null> {
  if (!customerId || customerId === "0") return null;
  try {
    const raw = await adminFetch<RawWooCustomer>({
      path: `/customers/${customerId}`,
      next: { revalidate: 120 },
    });
    return {
      id: String(raw.id),
      email: raw.email,
      firstName: raw.first_name,
      lastName: raw.last_name,
      billing: {
        firstName: raw.billing.first_name || undefined,
        lastName: raw.billing.last_name || undefined,
        line1: raw.billing.address_1 || undefined,
        line2: raw.billing.address_2 || undefined,
        city: raw.billing.city || undefined,
        region: raw.billing.state || undefined,
        postalCode: raw.billing.postcode || undefined,
        country: raw.billing.country || undefined,
        phone: raw.billing.phone || undefined,
      },
      shipping: {
        firstName: raw.shipping.first_name || undefined,
        lastName: raw.shipping.last_name || undefined,
        line1: raw.shipping.address_1 || undefined,
        line2: raw.shipping.address_2 || undefined,
        city: raw.shipping.city || undefined,
        region: raw.shipping.state || undefined,
        postalCode: raw.shipping.postcode || undefined,
        country: raw.shipping.country || undefined,
      },
    };
  } catch {
    return null;
  }
}

/** Update customer billing or shipping address via Woo REST API. */
export async function updateCustomerAddress(
  customerId: string,
  type: "billing" | "shipping",
  data: Record<string, string>,
): Promise<boolean> {
  try {
    await adminFetch({
      path: `/customers/${customerId}`,
      method: "PUT",
      body: { [type]: data },
    });
    return true;
  } catch {
    return false;
  }
}
