import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { fail, ok } from "@/lib/api";
import { getCustomerWishlist, updateCustomerWishlist } from "@/lib/auth/woo-customer";

const MoneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3),
});

const ImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const WishlistItemSchema = z.object({
  productId: z.string().regex(/^\d{1,12}$/),
  slug: z.string().min(1).max(220),
  name: z.string().min(1).max(240),
  price: MoneySchema,
  compareAtPrice: MoneySchema.optional(),
  image: ImageSchema.optional(),
  stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock"]),
  isLimited: z.boolean(),
  addedAt: z.string().datetime(),
});

const WishlistRequestSchema = z.object({
  items: z.array(WishlistItemSchema).max(100),
});

async function requireCustomerId() {
  const session = await auth();
  const customerId = session?.user.wooCustomerId;
  return customerId && customerId !== "0" ? customerId : null;
}

export async function GET(): Promise<NextResponse> {
  const customerId = await requireCustomerId();
  if (!customerId) {
    return NextResponse.json(fail("UNAUTHORIZED", "Sign in to sync your wishlist"), {
      status: 401,
    });
  }

  const items = await getCustomerWishlist(customerId);
  return NextResponse.json(ok({ items }));
}

export async function PUT(req: Request): Promise<NextResponse> {
  const customerId = await requireCustomerId();
  if (!customerId) {
    return NextResponse.json(fail("UNAUTHORIZED", "Sign in to sync your wishlist"), {
      status: 401,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail("VALIDATION_FAILED", "Invalid request body"), { status: 400 });
  }

  const parsed = WishlistRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(fail("VALIDATION_FAILED", "Invalid wishlist payload"), {
      status: 422,
    });
  }

  const saved = await updateCustomerWishlist(customerId, parsed.data.items);
  if (!saved) {
    return NextResponse.json(fail("BACKEND_OFFLINE", "Could not save wishlist"), {
      status: 502,
    });
  }

  return NextResponse.json(ok({ items: parsed.data.items }));
}
