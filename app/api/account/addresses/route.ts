import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { updateCustomerAddress } from "@/lib/auth/woo-customer";

const AddressDataSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
});

const RequestSchema = z.object({
  type: z.enum(["billing", "shipping"]),
  data: AddressDataSchema,
});

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user.wooCustomerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const ok = await updateCustomerAddress(
    session.user.wooCustomerId,
    parsed.data.type,
    Object.fromEntries(
      Object.entries(parsed.data.data).filter(([, v]) => v !== undefined)
    ) as Record<string, string>,
  );

  if (!ok) {
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
