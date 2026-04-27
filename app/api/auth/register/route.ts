import { NextResponse } from "next/server";
export async function POST(req: Request): Promise<NextResponse> {
  void req;
  return NextResponse.json({ error: "Account creation is currently unavailable." }, { status: 404 });
}
