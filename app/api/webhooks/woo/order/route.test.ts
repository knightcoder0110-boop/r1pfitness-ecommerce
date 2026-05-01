import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("server-only", () => ({}));

const emit = vi.hoisted(() => vi.fn());
vi.mock("@/lib/email", () => ({ emit }));

const SECRET = "whsec_woo_test";

beforeEach(() => {
  process.env.WOO_WEBHOOK_SECRET = SECRET;
  emit.mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => vi.resetModules());

function sign(rawBody: string): string {
  return createHmac("sha256", SECRET).update(rawBody, "utf8").digest("base64");
}

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 1042,
    number: "1042",
    status: "completed",
    currency: "USD",
    date_created: "2026-04-30T12:00:00",
    date_modified: "2026-04-30T13:00:00",
    billing: {
      first_name: "Kai",
      last_name: "N.",
      address_1: "1",
      address_2: "",
      city: "HNL",
      state: "HI",
      postcode: "96813",
      country: "US",
      email: "kai@example.com",
      phone: "",
    },
    shipping: {
      first_name: "Kai",
      last_name: "N.",
      address_1: "1",
      address_2: "",
      city: "HNL",
      state: "HI",
      postcode: "96813",
      country: "US",
    },
    line_items: [
      {
        id: 1,
        product_id: 42,
        variation_id: 420,
        quantity: 1,
        sku: "T",
        name: "Tee",
        price: "40.00",
        total: "40.00",
      },
    ],
    meta_data: [
      {
        key: "_wc_shipment_tracking_items",
        value: [
          {
            tracking_provider: "usps",
            tracking_number: "9400111200000000000000",
            date_shipped: "2026-04-30",
            tracking_provider_name: "USPS",
          },
        ],
      },
    ],
    ...overrides,
  };
}

function buildReq(body: object, opts: { signed?: boolean; topic?: string } = {}) {
  const raw = JSON.stringify(body);
  const headers: Record<string, string> = {
    "x-wc-webhook-topic": opts.topic ?? "order.updated",
  };
  if (opts.signed !== false) {
    headers["x-wc-webhook-signature"] = sign(raw);
  }
  return new Request("https://example.com/api/webhooks/woo/order", {
    method: "POST",
    headers,
    body: raw,
  });
}

async function load() {
  const m = await import("./route");
  return m.POST as (req: Request) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// Auth + parsing guard
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/woo/order — auth", () => {
  it("returns 503 when WOO_WEBHOOK_SECRET is unset", async () => {
    delete process.env.WOO_WEBHOOK_SECRET;
    const POST = await load();
    const res = await POST(buildReq({}));
    expect(res.status).toBe(503);
  });

  it("returns 401 when signature header is missing", async () => {
    const POST = await load();
    const res = await POST(buildReq(makePayload(), { signed: false }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when signature is wrong", async () => {
    const POST = await load();
    const raw = JSON.stringify(makePayload());
    const req = new Request("https://example.com/api/webhooks/woo/order", {
      method: "POST",
      headers: {
        "x-wc-webhook-signature": "wrong-sig",
        "x-wc-webhook-topic": "order.updated",
      },
      body: raw,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed JSON body", async () => {
    const POST = await load();
    const headers = {
      "x-wc-webhook-signature": sign("{not json"),
      "x-wc-webhook-topic": "order.updated",
    };
    const req = new Request("https://example.com/api/webhooks/woo/order", {
      method: "POST",
      headers,
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Event routing
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/woo/order — order.shipped", () => {
  it("emits order.shipped when status=completed and tracking present", async () => {
    const POST = await load();
    const res = await POST(buildReq(makePayload()));

    expect(res.status).toBe(200);
    expect(emit).toHaveBeenCalledTimes(1);
    const evt = emit.mock.calls[0]?.[0];
    expect(evt.type).toBe("order.shipped");
    expect(evt.payload.trackingNumber).toBe("9400111200000000000000");
    expect(evt.payload.carrier).toBe("usps");
    expect(evt.payload.uniqueId).toBe("ship-1042-9400111200000000000000");
  });

  it("does NOT emit when status=completed but tracking is missing", async () => {
    const POST = await load();
    const payload = makePayload({ meta_data: [] });
    const res = await POST(buildReq(payload));

    expect(res.status).toBe(200);
    expect(emit).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/woo/order — order.cancelled", () => {
  it("emits order.cancelled when status=cancelled", async () => {
    const POST = await load();
    const res = await POST(buildReq(makePayload({ status: "cancelled" })));

    expect(res.status).toBe(200);
    const evt = emit.mock.calls[0]?.[0];
    expect(evt.type).toBe("order.cancelled");
    expect(evt.payload.uniqueId).toBe("cancel-1042");
  });
});

describe("POST /api/webhooks/woo/order — ignored statuses", () => {
  it.each(["pending", "processing", "on-hold", "refunded", "failed"] as const)(
    "ignores status=%s without emitting",
    async (status) => {
      const POST = await load();
      const res = await POST(buildReq(makePayload({ status })));
      expect(res.status).toBe(200);
      expect(emit).not.toHaveBeenCalled();
    },
  );
});

describe("POST /api/webhooks/woo/order — resilience", () => {
  it("returns 200 even when the email emit throws (no Woo retry storm)", async () => {
    emit.mockRejectedValue(new Error("klaviyo down"));
    const POST = await load();
    const res = await POST(buildReq(makePayload()));
    expect(res.status).toBe(200);
  });

  it("skips emit when billing email is missing (cannot route)", async () => {
    const payload = makePayload();
    payload.billing.email = "";
    const POST = await load();
    const res = await POST(buildReq(payload));
    expect(res.status).toBe(200);
    expect(emit).not.toHaveBeenCalled();
  });
});
