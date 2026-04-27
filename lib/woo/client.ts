import "server-only";

import { env } from "@/lib/env";
import { WooError, errorCodeForStatus } from "./errors";

/**
 * Low-level WooCommerce HTTP client.
 *
 * Two transports live here:
 *  - `storeFetch`: public WooCommerce Store API (`/wp-json/wc/store/v1`).
 *    Used for anonymous cart/checkout. Sends `Cart-Token` when provided.
 *  - `adminFetch`: WooCommerce REST v3 API (`/wp-json/wc/v3`). Uses HTTP
 *    Basic with consumer key/secret. SERVER ONLY — never call from a Client
 *    Component.
 *
 * Both wrappers:
 *  - Inject base URL and auth.
 *  - Apply sane timeouts.
 *  - Normalize errors to `WooError`.
 *  - Support Next.js fetch caching via `next.tags` / `next.revalidate`.
 */

const DEFAULT_TIMEOUT_MS = 15_000;

interface FetchOptions extends Omit<RequestInit, "body"> {
  /** Relative path, e.g. `/products` — base URL is prepended. */
  path: string;
  /** Arbitrary JSON body — will be stringified. */
  body?: unknown;
  /** Cart-Token to propagate to the Store API. */
  cartToken?: string;
  /** Timeout in ms (default 5000). */
  timeoutMs?: number;
  /** Next.js fetch caching metadata. */
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

function requireBaseUrl(): string {
  const base = env.WOO_BASE_URL;
  if (!base) {
    throw new WooError({
      code: "WOO_UNREACHABLE",
      message: "WOO_BASE_URL is not configured",
      status: 500,
    });
  }
  return base.replace(/\/$/, "");
}

function requireAdminAuth(): string {
  const key = env.WOO_CONSUMER_KEY;
  const secret = env.WOO_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new WooError({
      code: "WOO_UNAUTHENTICATED",
      message: "WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET are not configured",
      status: 500,
    });
  }
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

async function request<T>(
  prefix: string,
  opts: FetchOptions,
  extraHeaders: HeadersInit = {},
): Promise<T> {
  const base = requireBaseUrl();
  const url = `${base}${prefix}${opts.path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...opts,
      method: opts.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(opts.cartToken ? { "Cart-Token": opts.cartToken } : {}),
        ...extraHeaders,
        ...(opts.headers ?? {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      next: opts.next,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let details: unknown = text;
      try {
        details = JSON.parse(text);
      } catch {
        /* text stays as-is */
      }
      throw new WooError({
        code: errorCodeForStatus(res.status),
        message: `Woo request failed: ${res.status} ${res.statusText}`,
        status: res.status,
        details,
      });
    }

    // 204 or empty body
    const contentLength = res.headers.get("content-length");
    if (res.status === 204 || contentLength === "0") {
      return undefined as T;
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof WooError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new WooError({
        code: "WOO_TIMEOUT",
        message: "Woo request timed out",
        status: 504,
        cause: err,
      });
    }
    throw new WooError({
      code: "WOO_UNREACHABLE",
      message: "Woo request failed before a response was received",
      status: 502,
      cause: err,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Call the public WooCommerce Store API (`/wp-json/wc/store/v1`). */
export function storeFetch<T>(opts: FetchOptions): Promise<T> {
  return request<T>("/wp-json/wc/store/v1", opts);
}

/** Call the authenticated WooCommerce REST v3 API. SERVER ONLY. */
export function adminFetch<T>(opts: FetchOptions): Promise<T> {
  return request<T>("/wp-json/wc/v3", opts, { Authorization: requireAdminAuth() });
}
