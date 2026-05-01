import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const listPendingOrdersBefore = vi.hoisted(() => vi.fn());
const markOrderCancelled = vi.hoisted(() => vi.fn());
const getWooOrder = vi.hoisted(() => vi.fn());
const emit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/checkout/woo-order", () => ({
  listPendingOrdersBefore,
  markOrderCancelled,
  getWooOrder,
}));

vi.mock("@/lib/email", () => ({ emit }));

const envMock = vi.hoisted(() => ({
  env: { CRON_SECRET: "cron_test_secret_long_enough" as string | undefined },
}));
vi.mock("@/lib/env", () => envMock);

beforeEach(() => {
  envMock.env.CRON_SECRET = "cron_test_secret_long_enough";
  listPendingOrdersBefore.mockReset();
  markOrderCancelled.mockReset().mockResolvedValue(undefined);
  getWooOrder.mockReset();
  emit.mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => vi.resetModules());

function makeOrder(id: string) {
  const usd = (n: number) => ({ amount: n, currency: "USD" });
  return {
    id,
    number: id,
    status: "pending" as const,
    currency: "USD",
    createdAt: "2026-04-30T00:00:00Z",
    updatedAt: "2026-04-30T00:00:00Z",
    subtotal: usd(8000),
    discountTotal: usd(0),
    shippingTotal: usd(1000),
    taxTotal: usd(0),
    total: usd(9000),
    billing: {
      firstName: "Kai",
      lastName: "N.",
      line1: "1",
      city: "HNL",
      region: "HI",
      postalCode: "96813",
      country: "US",
      email: "kai@example.com",
    },
    shipping: {
      firstName: "Kai",
      lastName: "N.",
      line1: "1",
      city: "HNL",
      region: "HI",
      postalCode: "96813",
      country: "US",
    },
    items: [
      {
        key: "p1::v1",
        productId: "p1",
        variationId: "v1",
        name: "Tee",
        sku: "T",
        quantity: 1,
        unitPrice: usd(8000),
        subtotal: usd(8000),
        attributes: {},
      },
    ],
  };
}

function buildReq(opts: { token?: string | null; staleAfterMs?: number } = {}) {
  const url = new URL("https://example.com/api/cron/cancel-pending");
  if (opts.staleAfterMs !== undefined) {
    url.searchParams.set("staleAfterMs", String(opts.staleAfterMs));
  }
  const headers: Record<string, string> = {};
  if (opts.token !== null) {
    headers.authorization = `Bearer ${opts.token ?? "cron_test_secret_long_enough"}`;
  }
  return new Request(url, { method: "GET", headers });
}

async function load() {
  const m = await import("./route");
  return m.GET as (req: Request) => Promise<Response>;
}

describe("GET /api/cron/cancel-pending — auth", () => {
  it("returns 401 when bearer token is missing", async () => {
    const GET = await load();
    const res = await GET(buildReq({ token: null }));
    expect(res.status).toBe(401);
    expect(listPendingOrdersBefore).not.toHaveBeenCalled();
  });

  it("returns 401 when bearer token is wrong", async () => {
    const GET = await load();
    const res = await GET(buildReq({ token: "nope" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 when CRON_SECRET is unset", async () => {
    envMock.env.CRON_SECRET = undefined;
    const GET = await load();
    const res = await GET(buildReq({ token: null }));
    expect(res.status).toBe(503);
  });
});

describe("GET /api/cron/cancel-pending — happy path", () => {
  it("cancels each stale order and emits order.cancelled with auto_timeout", async () => {
    listPendingOrdersBefore.mockResolvedValue([
      { id: "1", number: "1", modifiedAt: "" },
      { id: "2", number: "2", modifiedAt: "" },
    ]);
    getWooOrder.mockImplementation(async (id: string) => makeOrder(id));

    const GET = await load();
    const res = await GET(buildReq());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.scanned).toBe(2);
    expect(body.data.cancelled).toBe(2);
    expect(body.data.emitted).toBe(2);

    expect(markOrderCancelled).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit.mock.calls[0]?.[0].type).toBe("order.cancelled");
    expect(emit.mock.calls[0]?.[0].payload.reason).toBe("auto_timeout");
  });

  it("returns ok with zero outcomes when nothing is stale", async () => {
    listPendingOrdersBefore.mockResolvedValue([]);
    const GET = await load();
    const res = await GET(buildReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.scanned).toBe(0);
    expect(markOrderCancelled).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/cancel-pending — resilience", () => {
  it("continues processing after a single cancel failure", async () => {
    listPendingOrdersBefore.mockResolvedValue([
      { id: "1", number: "1", modifiedAt: "" },
      { id: "2", number: "2", modifiedAt: "" },
    ]);
    markOrderCancelled
      .mockRejectedValueOnce(new Error("woo down"))
      .mockResolvedValueOnce(undefined);
    getWooOrder.mockResolvedValue(makeOrder("2"));

    const GET = await load();
    const res = await GET(buildReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.cancelled).toBe(1);
    expect(body.data.outcomes[0].error).toContain("woo down");
    expect(body.data.outcomes[1].cancelled).toBe(true);
  });

  it("counts cancel as success even when emit fails", async () => {
    listPendingOrdersBefore.mockResolvedValue([
      { id: "1", number: "1", modifiedAt: "" },
    ]);
    getWooOrder.mockResolvedValue(makeOrder("1"));
    emit.mockRejectedValue(new Error("klaviyo down"));

    const GET = await load();
    const res = await GET(buildReq());
    const body = await res.json();
    expect(body.data.cancelled).toBe(1);
    expect(body.data.emitted).toBe(0);
  });

  it("skips emit (but still cancels) when getWooOrder returns null", async () => {
    listPendingOrdersBefore.mockResolvedValue([
      { id: "1", number: "1", modifiedAt: "" },
    ]);
    getWooOrder.mockResolvedValue(null);

    const GET = await load();
    const res = await GET(buildReq());
    const body = await res.json();
    expect(body.data.cancelled).toBe(1);
    expect(body.data.emitted).toBe(0);
    expect(emit).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/cancel-pending — threshold override", () => {
  it("ignores out-of-range overrides (too small)", async () => {
    listPendingOrdersBefore.mockResolvedValue([]);
    const GET = await load();
    await GET(buildReq({ staleAfterMs: 1000 }));

    const cutoff = new Date(listPendingOrdersBefore.mock.calls[0]?.[0]).getTime();
    const expected = Date.now() - 2 * 60 * 60 * 1000;
    // within 5 seconds of "now - 2h" (default threshold)
    expect(Math.abs(cutoff - expected)).toBeLessThan(5_000);
  });

  it("respects in-range overrides", async () => {
    listPendingOrdersBefore.mockResolvedValue([]);
    const GET = await load();
    await GET(buildReq({ staleAfterMs: 60 * 60_000 }));

    const cutoff = new Date(listPendingOrdersBefore.mock.calls[0]?.[0]).getTime();
    const expected = Date.now() - 60 * 60_000;
    expect(Math.abs(cutoff - expected)).toBeLessThan(5_000);
  });
});
