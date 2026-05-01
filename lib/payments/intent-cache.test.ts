import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  __MAX_ENTRIES_FOR_TESTING,
  __TTL_MS_FOR_TESTING,
  __intentCacheSizeForTesting,
  __resetIntentCacheForTesting,
  __setIntentCacheClockForTesting,
  getOrCreate,
  isValidIdempotencyKey,
} from "./intent-cache";

const KEY_A = "11111111-1111-4111-8111-111111111111";
const KEY_B = "22222222-2222-4222-8222-222222222222";

afterEach(() => {
  __resetIntentCacheForTesting();
});

describe("isValidIdempotencyKey", () => {
  it("accepts canonical UUID v4 strings", () => {
    expect(isValidIdempotencyKey(KEY_A)).toBe(true);
    expect(isValidIdempotencyKey("11111111-1111-4111-9111-111111111111")).toBe(true);
  });

  it("rejects empty / non-string / wrong-shape input", () => {
    expect(isValidIdempotencyKey("")).toBe(false);
    expect(isValidIdempotencyKey("not-a-uuid")).toBe(false);
    expect(isValidIdempotencyKey(undefined)).toBe(false);
    expect(isValidIdempotencyKey(null)).toBe(false);
    expect(isValidIdempotencyKey(42)).toBe(false);
    // 35 chars (one too short)
    expect(isValidIdempotencyKey("11111111-1111-4111-8111-11111111111")).toBe(false);
    // Wrong version digit (7 not 1-5)
    expect(isValidIdempotencyKey("11111111-1111-7111-8111-111111111111")).toBe(false);
  });
});

describe("getOrCreate", () => {
  it("invokes the factory once and returns its result", async () => {
    const factory = vi.fn().mockResolvedValue({ orderId: "1042" });
    const result = await getOrCreate(KEY_A, factory);
    expect(result).toEqual({ orderId: "1042" });
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("returns the cached result on a subsequent call with the same key", async () => {
    const factory = vi.fn().mockResolvedValue({ orderId: "1042" });
    const r1 = await getOrCreate(KEY_A, factory);
    const r2 = await getOrCreate(KEY_A, factory);
    expect(r1).toBe(r2); // same object identity — same resolved Promise
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("shares the in-flight Promise for concurrent callers", async () => {
    let resolve!: (v: { orderId: string }) => void;
    const factory = vi.fn().mockImplementation(
      () =>
        new Promise<{ orderId: string }>((r) => {
          resolve = r;
        }),
    );

    const p1 = getOrCreate(KEY_A, factory);
    const p2 = getOrCreate(KEY_A, factory);
    expect(factory).toHaveBeenCalledTimes(1);

    resolve({ orderId: "1042" });
    await expect(p1).resolves.toEqual({ orderId: "1042" });
    await expect(p2).resolves.toEqual({ orderId: "1042" });
  });

  it("evicts the entry when the factory rejects so a retry runs again", async () => {
    const factory = vi
      .fn()
      .mockRejectedValueOnce(new Error("woo down"))
      .mockResolvedValueOnce({ orderId: "1042" });

    await expect(getOrCreate(KEY_A, factory)).rejects.toThrow(/woo down/);
    expect(__intentCacheSizeForTesting()).toBe(0);

    const result = await getOrCreate(KEY_A, factory);
    expect(result).toEqual({ orderId: "1042" });
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("treats expired entries as missing", async () => {
    let now = 1_000_000;
    __setIntentCacheClockForTesting(() => now);

    const factory = vi
      .fn()
      .mockResolvedValueOnce({ orderId: "first" })
      .mockResolvedValueOnce({ orderId: "second" });

    await getOrCreate(KEY_A, factory);
    expect(factory).toHaveBeenCalledTimes(1);

    // Advance past TTL.
    now += __TTL_MS_FOR_TESTING + 1;
    const r2 = await getOrCreate(KEY_A, factory);
    expect(r2).toEqual({ orderId: "second" });
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("isolates different keys", async () => {
    const factory = vi
      .fn()
      .mockImplementation(async (orderId: string) => ({ orderId }));

    const a = await getOrCreate(KEY_A, () => factory("A"));
    const b = await getOrCreate(KEY_B, () => factory("B"));
    expect(a).toEqual({ orderId: "A" });
    expect(b).toEqual({ orderId: "B" });
    expect(__intentCacheSizeForTesting()).toBe(2);
  });

  it("evicts the oldest entry when the cap is reached", async () => {
    // Pre-fill MAX_ENTRIES synchronously-resolved entries.
    for (let i = 0; i < __MAX_ENTRIES_FOR_TESTING; i++) {
      const key = mintKey(i);
      await getOrCreate(key, async () => ({ i }));
    }
    expect(__intentCacheSizeForTesting()).toBe(__MAX_ENTRIES_FOR_TESTING);

    const oldestKey = mintKey(0);
    const overflow = mintKey(__MAX_ENTRIES_FOR_TESTING + 1);
    await getOrCreate(overflow, async () => ({ overflow: true }));

    expect(__intentCacheSizeForTesting()).toBe(__MAX_ENTRIES_FOR_TESTING);

    // The oldest entry should have been evicted — re-querying it now
    // re-runs the factory.
    const factory = vi.fn().mockResolvedValue({ revived: true });
    await getOrCreate(oldestKey, factory);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("throws when given an invalid key (programmer error)", () => {
    expect(() => getOrCreate("not-a-uuid", async () => 1)).toThrow(
      /invalid idempotency key/,
    );
  });
});

function mintKey(i: number): string {
  // Deterministic UUID-shaped string for cap tests.
  const hex = i.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}
