import { z } from "zod";
import type { CartLineItem } from "@/lib/woo/types";

// ---------------------------------------------------------------------------
// Address schema — shared by billing + shipping
// ---------------------------------------------------------------------------

export const AddressSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  line1: z.string().min(1, "Address required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City required"),
  region: z.string().min(1, "State required"),
  postalCode: z.string().min(1, "ZIP required"),
  country: z.string().length(2, "2-letter country code").default("US"),
  phone: z.string().optional(),
});

export type AddressInput = z.infer<typeof AddressSchema>;

// ---------------------------------------------------------------------------
// Checkout request — what the client POSTs to /api/checkout
// ---------------------------------------------------------------------------

export const CheckoutRequestSchema = z.object({
  email: z.string().email("Valid email required"),
  billing: AddressSchema,
  /** Ship to billing if omitted. */
  shipping: AddressSchema.optional(),
  /** Local Zustand cart items serialised before POST. */
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variationId: z.string().optional(),
        quantity: z.number().int().positive(),
        unitPrice: z.object({
          amount: z.number().int().nonnegative(),
          currency: z.string().length(3),
        }),
        name: z.string().min(1),
        sku: z.string(),
        attributes: z.record(z.string(), z.string()),
      }),
    )
    .min(1, "Cart is empty"),
  /** Optional Woo coupon codes. */
  coupons: z.array(z.string()).optional(),
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

// A subset matching what we store in cart for convenience
export type CheckoutCartItem = Pick<
  CartLineItem,
  "productId" | "variationId" | "quantity" | "unitPrice" | "name" | "sku" | "attributes"
>;

// ---------------------------------------------------------------------------
// Checkout response — what /api/checkout returns
// ---------------------------------------------------------------------------

export interface CheckoutResult {
  /** Stripe PaymentIntent client_secret — use with Stripe Elements to confirm. */
  clientSecret: string;
  /** Woo order ID — used for the confirmation page. */
  orderId: string;
  /** Woo order key — lets guest confirmation pages show the real order safely. */
  orderKey?: string;
  /** Order total in minor units. */
  totalAmount: number;
  /** ISO currency code. */
  currency: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute order total from local cart items in minor units. */
export function computeOrderTotal(items: CheckoutCartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice.amount * item.quantity, 0);
}
