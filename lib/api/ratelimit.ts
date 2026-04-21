/**
 * Lightweight in-memory rate limiter (sliding window counter).
 *
 * Designed for Next.js App Router BFF routes. No external dependencies.
 *
 * Trade-offs vs Upstash / Redis:
 *  + Zero latency — synchronous, no network hop.
 *  + No extra service to provision.
 *  - Counts reset on cold starts / process restarts.
 *  - Does not coordinate across Vercel Edge instances (each node counts
 *    independently). Sufficient to slow down abuse; not a hard cap.
 *
 * Swap for `@upstash/ratelimit` when you need distributed enforcement.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Module-level store. Survives across requests in the same Node.js process.
 * Keys are caller-supplied identifiers (typically IP address).
 */
const store = new Map<string, Bucket>();

/**
 * Periodically clean up expired buckets so the Map doesn't grow unbounded
 * in long-running processes. Runs at most once per minute.
 */
let lastCleanup = 0;
function maybePurge(): void {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Unix ms at which the current window resets. */
  resetAt: number;
}

export interface RateLimitOptions {
  /** Maximum requests allowed in the window. Default: 30. */
  max?: number;
  /** Window duration in milliseconds. Default: 60 000 (1 minute). */
  windowMs?: number;
}

/**
 * Check whether the given `key` (typically a client IP) has exceeded the
 * configured rate limit. Mutates the in-memory store as a side effect.
 *
 * @param key      - Unique identifier for the rate-limited entity.
 * @param options  - `max` requests per `windowMs`. Defaults: 30 / 60 s.
 */
export function checkRateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const max = options.max ?? 30;
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();

  maybePurge();

  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    // New window.
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetAt: now + windowMs };
  }

  bucket.count += 1;

  if (bucket.count > max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  return { ok: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}
