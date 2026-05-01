import "server-only";

const KLAVIYO_API_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

export interface KlaviyoApiError {
  status: number;
  message: string;
}

export interface KlaviyoApi {
  /** POST /events — create a metric/event for a profile. */
  postEvent(body: unknown): Promise<KlaviyoApiResult<{ id?: string }>>;
  /** POST /profile-subscription-bulk-create-jobs — list-subscribe a profile. */
  postSubscriptionJob(body: unknown): Promise<KlaviyoApiResult<void>>;
}

export type KlaviyoApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: KlaviyoApiError };

/**
 * Build the Klaviyo HTTP client. Pure function over the API key so tests
 * can supply a stub key and (via fetch mocks) inspect the request shape.
 */
export function createKlaviyoApi(apiKey: string): KlaviyoApi {
  const baseHeaders = {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    "Content-Type": "application/json",
    revision: KLAVIYO_REVISION,
    accept: "application/json",
  } as const;

  async function post<T>(
    path: string,
    body: unknown,
  ): Promise<KlaviyoApiResult<T>> {
    let res: Response;
    try {
      res = await fetch(`${KLAVIYO_API_BASE}${path}`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify(body),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "network error";
      return { ok: false, error: { status: 0, message } };
    }

    if (res.ok || res.status === 202) {
      // 202 returns no body for bulk jobs; events return JSON with id.
      let parsed: T = undefined as unknown as T;
      const text = await safeText(res);
      if (text) {
        try {
          const body = JSON.parse(text) as { data?: T };
          parsed = body?.data ?? (undefined as unknown as T);
        } catch {
          // Klaviyo returned a non-JSON 2xx — accept it.
        }
      }
      return { ok: true, data: parsed };
    }

    const message = await safeText(res);
    return {
      ok: false,
      error: { status: res.status, message: redact(message) || `HTTP ${res.status}` },
    };
  }

  return {
    postEvent: (body) => post<{ id?: string }>("/events/", body),
    postSubscriptionJob: (body) =>
      post<void>("/profile-subscription-bulk-create-jobs/", body),
  };
}

/** Read the configured Klaviyo API key, or null when not set. */
export function getKlaviyoApiKey(): string | null {
  return process.env.KLAVIYO_PRIVATE_API_KEY ?? null;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * Strip anything that looks like an email address from an error
 * message before logging. Defence in depth so a 4xx body containing
 * `"profile email": "user@example.com"` doesn't leak into logs.
 */
function redact(s: string): string {
  return s.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "<email>");
}
