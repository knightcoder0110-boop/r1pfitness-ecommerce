import "server-only";

/**
 * In-memory idempotency cache for checkout.
 *
 * Why this exists
 * ---------------
 * `/api/checkout` is not naturally idempotent — each call creates a new
 * Woo order and a new Stripe PaymentIntent. A double-click on "Pay", a
 * slow network that triggers a browser retry, or a user navigating
 * back-then-forward can all submit the same logical attempt twice. We
 * must collapse those into a single side effect.
 *
 * Strategy
 * --------
 * The client generates a UUID v4 per submit attempt and sends it in the
 * request body. The server uses that key to cache the in-flight Promise
 * of the (Woo-order + PaymentIntent) work. A second concurrent request
 * with the same key awaits the same Promise and receives the same
 * `CheckoutResult`. After the work resolves, the resolved value remains
 * cached for `TTL_MS` so a retried HTTP request still returns the same
 * `clientSecret` / `orderId`.
 *
 * Failure handling
 * ----------------
 * If the in-flight factory rejects, we evict the entry so the next
 * attempt starts fresh — we never poison the cache with a permanent
 * failure.
 *
 * Bounds
 * ------
 * - `TTL_MS = 30 * 60_000` — 30 minutes is comfortably longer than any
 *   sane checkout session and shorter than the auto-cancel window
 *   (2h) for stale orders, so an evicted entry will never collide with
 *   an order that is still actionable.
 * - `MAX_ENTRIES = 1000` — when the map grows past this we evict the
 *   oldest entry first. Bounds memory under burst traffic and naive DoS.
 *
 * Limitations (acknowledged, addressed in Phase C)
 * ------------------------------------------------
 * - In-process Map: a Vercel deploy may have multiple lambda instances,
 *   and the cache is per-instance. Phase C moves this to Upstash Redis.
 *   Until then, the Stripe-side idempotency key (passed to
 *   `paymentIntents.create`) prevents at least the worst case (double
 *   PaymentIntents) when two concurrent requests land on different
 *   lambdas. A duplicate Woo order is still possible in that scenario;
 *   the auto-cancel cron (PR A-9) cleans it up.
 */

const TTL_MS = 30 * 60_000;
const MAX_ENTRIES = 1000;
// 8-4-4-4-12 hex with hyphens = 36 chars. Accept any RFC-4122 variant.
const KEY_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface CacheEntry<T> {
  promise: Promise<T>;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Test-only clock override. Returns `Date.now()` when not overridden. */
let nowFn: () => number = () => Date.now();

/**
 * Validate that a string is a UUID v4-shaped key. Rejects empty or
 * malformed input so we never use untrusted free-form strings as map
 * keys (defence against log injection and unbounded key proliferation).
 */
export function isValidIdempotencyKey(s: unknown): s is string {
  return typeof s === "string" && KEY_REGEX.test(s);
}

/**
 * Atomic "get cached value, otherwise produce + cache" operation.
 *
 * - If a non-expired entry exists for `key`, returns its Promise. If
 *   that Promise is still pending, this caller awaits the same
 *   in-flight work — the factory is invoked exactly once for
 *   concurrent callers.
 * - Otherwise calls `factory()`, stores the resulting Promise, and
 *   returns it.
 * - If the factory rejects, evicts the entry so the next caller
 *   re-runs the factory.
 *
 * The returned Promise rejection is propagated unchanged — callers
 * surface their own user-facing errors.
 */
export function getOrCreate<T>(
  key: string,
  factory: () => Promise<T>,
): Promise<T> {
  if (!isValidIdempotencyKey(key)) {
    // Programmer error: route handler is responsible for validating
    // before calling. Surface loudly to fail tests, not silently to
    // fail customers.
    throw new Error("intent-cache: invalid idempotency key");
  }

  const now = nowFn();
  const existing = store.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.promise as Promise<T>;
  }
  if (existing) {
    // Expired — drop and fall through to fresh creation.
    store.delete(key);
  }

  if (store.size >= MAX_ENTRIES) {
    evictOldest();
  }

  const promise = factory().catch((err: unknown) => {
    // Don't poison the cache with a permanent failure; evict so the
    // next attempt can retry. Re-check identity before deleting in
    // case an unrelated request has since rotated this slot.
    const current = store.get(key);
    if (current && current.promise === (promise as Promise<unknown>)) {
      store.delete(key);
    }
    throw err;
  });

  store.set(key, { promise: promise as Promise<unknown>, expiresAt: now + TTL_MS });
  return promise;
}

function evictOldest(): void {
  // Map iteration order is insertion order, so the first key is the oldest.
  const oldestKey = store.keys().next().value;
  if (oldestKey !== undefined) {
    store.delete(oldestKey);
  }
}

// ---------------------------------------------------------------------------
// Test-only API
// ---------------------------------------------------------------------------

/** Clear all entries. Test-only. */
export function __resetIntentCacheForTesting(): void {
  store.clear();
  nowFn = () => Date.now();
}

/** Override the clock. Test-only. */
export function __setIntentCacheClockForTesting(fn: () => number): void {
  nowFn = fn;
}

/** Inspect cache size. Test-only. */
export function __intentCacheSizeForTesting(): number {
  return store.size;
}

export const __TTL_MS_FOR_TESTING = TTL_MS;
export const __MAX_ENTRIES_FOR_TESTING = MAX_ENTRIES;
