const KLAVIYO_API_BASE = "https://a.klaviyo.com/api";

interface SubscribeResult {
  success: boolean;
  /** True when the email was already a member of the list. */
  alreadySubscribed?: boolean;
  error?: string;
}

/**
 * Check whether an email is already a member of the configured list.
 *
 * Klaviyo's bulk-create-jobs endpoint is async and returns 202 even when
 * the profile is already on the list, so we cannot tell the user they're
 * already subscribed from the create response alone. We therefore probe
 * the list membership endpoint first.
 *
 * Endpoint: `GET /lists/{listId}/profiles?filter=equals(email,"x@y.com")`
 *  - 200 with `data.length > 0`  → already a member
 *  - 200 with `data.length === 0` → not a member
 *  - 401/403/5xx                  → throws so the caller can fall through
 *                                    to "best effort" subscribe (we never
 *                                    block legit signups on probe failure).
 */
async function isAlreadyOnList(email: string): Promise<boolean> {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY!;
  const listId = process.env.KLAVIYO_LIST_ID!;

  // Email values inside the filter must be quoted; Klaviyo's filter parser
  // does not allow embedded double quotes, so reject them defensively.
  if (email.includes('"')) return false;

  const url =
    `${KLAVIYO_API_BASE}/lists/${encodeURIComponent(listId)}/profiles/` +
    `?filter=${encodeURIComponent(`equals(email,"${email}")`)}` +
    `&fields[profile]=email&page[size]=1`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      revision: "2024-10-15",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Klaviyo list-membership probe failed (HTTP ${res.status}): ${body}`);
  }

  const json = (await res.json().catch(() => null)) as
    | { data?: Array<unknown> }
    | null;
  return Array.isArray(json?.data) && json.data.length > 0;
}

/**
 * Fire a "Joined VIP List" metric event for `email`.
 *
 * This triggers any Klaviyo Flow that has "Metric: Joined VIP List" as its
 * entry condition — e.g. the VIP welcome email flow. The event is fired
 * fire-and-forget after a successful NEW subscription (not for duplicates).
 *
 * Klaviyo automatically creates the profile if it doesn't exist yet and
 * associates the event with the existing profile when it does.
 */
async function trackVIPSignupEvent(email: string, apiKey: string): Promise<void> {
  const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      "Content-Type": "application/json",
      revision: "2024-10-15",
    },
    body: JSON.stringify({
      data: {
        type: "event",
        attributes: {
          metric: {
            data: {
              type: "metric",
              attributes: { name: "Joined VIP List" },
            },
          },
          profile: {
            data: {
              type: "profile",
              attributes: { email },
            },
          },
          properties: {
            source: "VIP signup form",
          },
          time: new Date().toISOString(),
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Klaviyo event track failed (HTTP ${res.status}): ${body}`);
  }
  console.log(`[Klaviyo] ✓ Fired "Joined VIP List" event for ${email}`);
}

export async function subscribeToKlaviyo(email: string): Promise<SubscribeResult> {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    console.error("Klaviyo env vars not configured");
    return { success: false, error: "Email service not configured." };
  }

  // ── 1. Probe list membership so we can show a friendly "already on the
  //      list" message instead of silently re-confirming a duplicate.
  //      Probe failures are logged but never block subscription — the
  //      bulk-create job below is idempotent on Klaviyo's side anyway.
  try {
    const already = await isAlreadyOnList(email);
    if (already) {
      console.log(`[Klaviyo] ${email} is already on list ${listId}`);
      return { success: true, alreadySubscribed: true };
    }
  } catch (err) {
    console.warn("[Klaviyo] membership probe failed, falling through to subscribe:", err);
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
      // Fire a metric event so a "Joined VIP List" Klaviyo Flow can send the
      // welcome email. We fire-and-forget — a failure here must never block
      // the subscription success response.
      trackVIPSignupEvent(email, apiKey).catch((err) =>
        console.warn("[Klaviyo] VIP event track failed (non-fatal):", err),
      );
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
