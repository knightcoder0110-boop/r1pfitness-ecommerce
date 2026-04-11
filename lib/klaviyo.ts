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
