const KLAVIYO_API_BASE = "https://a.klaviyo.com/api";

interface SubscribeResult {
  success: boolean;
  error?: string;
}

export async function subscribeToKlaviyo(email: string): Promise<SubscribeResult> {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    console.error("Klaviyo env vars not configured");
    return { success: false, error: "Email service not configured." };
  }

  try {
    console.log(`[Klaviyo] Subscribing ${email} to list ${listId}...`);

    // Create / update profile and subscribe to list via Klaviyo v3
    const res = await fetch(`${KLAVIYO_API_BASE}/profile-subscription-bulk-create-jobs/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-10-15",
      },
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email,
                    subscriptions: {
                      email: {
                        marketing: {
                          consent: "SUBSCRIBED",
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
          relationships: {
            list: {
              data: {
                type: "list",
                id: listId,
              },
            },
          },
        },
      }),
    });

    if (res.ok || res.status === 202) {
      console.log(`[Klaviyo] ✓ Successfully subscribed ${email} (HTTP ${res.status})`);
      return { success: true };
    }

    const errorBody = await res.text();
    console.error(`[Klaviyo] ✗ Failed for ${email} — HTTP ${res.status}:`, errorBody);
    return { success: false, error: "Failed to subscribe. Please try again." };
  } catch (err) {
    console.error("[Klaviyo] ✗ Network error:", err);
    return { success: false, error: "Network error. Please try again." };
  }
}

/* ─── Order Confirmation Event ─────────────────────────────────────────── */

/**
 * Item shape for the Klaviyo "Placed Order" event. Mirrors the keys
 * Klaviyo's order-confirmation flow templates expect out of the box.
 */
export interface KlaviyoOrderItem {
  productId: string;
  sku?: string;
  name: string;
  quantity: number;
  /** Major-unit price (e.g. 49.99) — Klaviyo expects decimals, not cents. */
  unitPrice: number;
  /** Optional product image URL for the templated email. */
  imageUrl?: string;
  /** Optional canonical product URL. */
  productUrl?: string;
}

export interface KlaviyoPlacedOrderInput {
  email: string;
  orderId: string;
  /** Total in major units (e.g. 49.99). */
  total: number;
  currency: string;
  items: KlaviyoOrderItem[];
  /** Optional billing first/last for personalization. */
  firstName?: string;
  lastName?: string;
}

/**
 * Track a "Placed Order" event for the customer in Klaviyo. This is the
 * standard metric name Klaviyo's order-confirmation flow listens on, so
 * pairing this call with a flow in the Klaviyo dashboard produces a
 * branded confirmation email (and any follow-ups) without further code.
 *
 * Fire-and-forget at call sites: we log on failure but never throw, so a
 * Klaviyo outage cannot block the post-payment webhook from completing.
 */
export async function trackKlaviyoPlacedOrder(
  input: KlaviyoPlacedOrderInput,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!apiKey) {
    console.warn("[Klaviyo] KLAVIYO_PRIVATE_API_KEY not set — skipping Placed Order event");
    return { success: false, error: "Klaviyo not configured" };
  }

  const itemNames = input.items.map((i) => i.name);
  const properties: Record<string, unknown> = {
    OrderId: input.orderId,
    Categories: [],
    ItemNames: itemNames,
    Items: input.items.map((i) => ({
      ProductID: i.productId,
      SKU: i.sku ?? "",
      ProductName: i.name,
      Quantity: i.quantity,
      ItemPrice: i.unitPrice,
      RowTotal: Number((i.unitPrice * i.quantity).toFixed(2)),
      ProductURL: i.productUrl ?? "",
      ImageURL: i.imageUrl ?? "",
    })),
    $value: input.total,
    Currency: input.currency,
  };

  try {
    const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-10-15",
        accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            properties,
            metric: {
              data: {
                type: "metric",
                attributes: { name: "Placed Order" },
              },
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: input.email,
                  ...(input.firstName ? { first_name: input.firstName } : {}),
                  ...(input.lastName ? { last_name: input.lastName } : {}),
                },
              },
            },
            value: input.total,
            unique_id: `order-${input.orderId}`,
          },
        },
      }),
    });

    if (res.ok || res.status === 202) {
      console.log(
        `[Klaviyo] ✓ Placed Order event sent for ${input.email} (order ${input.orderId})`,
      );
      return { success: true };
    }

    const errorBody = await res.text();
    console.error(
      `[Klaviyo] ✗ Placed Order failed for ${input.email} — HTTP ${res.status}:`,
      errorBody,
    );
    return { success: false, error: `HTTP ${res.status}` };
  } catch (err) {
    console.error("[Klaviyo] ✗ Placed Order network error:", err);
    return { success: false, error: "Network error" };
  }
}
