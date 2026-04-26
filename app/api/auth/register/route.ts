import { NextResponse } from "next/server";
import { z } from "zod";
import { wpRegisterCustomer } from "@/lib/auth/wp-auth";
import { checkRateLimit } from "@/lib/api/ratelimit";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  // Per-IP rate limit: 5 registrations / 15 minutes. Blocks signup-spam
  // bots and account-enumeration via the 409 response code.
  const ip = clientIp(req);
  const rl = checkRateLimit(`register:${ip}`, { max: 5, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

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
