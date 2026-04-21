import { NextResponse } from "next/server";
import { z } from "zod";
import { wpRegisterCustomer } from "@/lib/auth/wp-auth";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Validation failed" },
      { status: 422 },
    );
  }

  const result = await wpRegisterCustomer(parsed.data);
  if (!result) {
    return NextResponse.json(
      { error: "Could not create account. Email may already be registered." },
      { status: 409 },
    );
  }

  return NextResponse.json({ customerId: result.customerId }, { status: 201 });
}
