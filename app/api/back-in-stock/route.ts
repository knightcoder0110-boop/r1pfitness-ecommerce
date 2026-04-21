import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/back-in-stock
 *
 * Records a Klaviyo "Back In Stock Subscribe" event so a Klaviyo Flow can
 * send the customer an email when the product is restocked in WooCommerce.
 *
 * Setup in Klaviyo:
 *  1. Create a Flow triggered by the metric "Back In Stock Subscribe".
 *  2. Add a time-delay + email step with a link back to the product URL.
 *
 * Body: { email, productId, productName, variationId? }
 * Response: { success: boolean, error?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      productId?: string;
      productName?: string;
      variationId?: string;
    };

    const email = body.email?.trim();
    const productId = body.productId;
    const productName = body.productName ?? "Unknown Product";

    // Input validation
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 },
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address." },
        { status: 400 },
      );
    }
    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    if (!apiKey) {
      // Gracefully degrade — log and tell the client it worked.
      console.warn("[back-in-stock] KLAVIYO_PRIVATE_API_KEY not configured");
      return NextResponse.json({ success: true });
    }

    // Track the event via Klaviyo v3 Events API.
    const payload = {
      data: {
        type: "event",
        attributes: {
          metric: {
            data: {
              type: "metric",
              attributes: { name: "Back In Stock Subscribe" },
            },
          },
          profile: {
            data: {
              type: "profile",
              attributes: { email },
            },
          },
          properties: {
            product_id: productId,
            product_name: productName,
            ...(body.variationId ? { variation_id: body.variationId } : {}),
          },
        },
      },
    };

    const res = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-10-15",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok && res.status !== 202) {
      const text = await res.text();
      console.error("[back-in-stock] Klaviyo error", res.status, text);
      return NextResponse.json(
        { success: false, error: "Could not save your notification request." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
