import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { PlacedOrderPayload } from "../../types";
import { klaviyoProvider } from "./index";

const ORIGINAL_FETCH = globalThis.fetch;

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

function installFetch(response: { status: number; body?: unknown }): {
  captured: CapturedRequest[];
} {
  const captured: CapturedRequest[] = [];
  globalThis.fetch = vi.fn(async (input, init) => {
    const url = typeof input === "string" ? input : (input as URL | Request).toString();
    const headers: Record<string, string> = {};
    const rawHeaders = (init?.headers ?? {}) as Record<string, string>;
    for (const [k, v] of Object.entries(rawHeaders)) headers[k.toLowerCase()] = String(v);

    let parsedBody: unknown = undefined;
    if (typeof init?.body === "string") {
      try {
        parsedBody = JSON.parse(init.body);
      } catch {
        parsedBody = init.body;
      }
    }
    captured.push({
      url,
      method: init?.method ?? "GET",
      headers,
      body: parsedBody,
    });
    return new Response(
      response.body !== undefined ? JSON.stringify(response.body) : "",
      { status: response.status },
    );
  }) as typeof fetch;
  return { captured };
}

describe("klaviyoProvider.emit", () => {
  beforeEach(() => {
    vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "pk_test_x");
    vi.stubEnv("KLAVIYO_LIST_ID", "L1");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("returns ok:false when API key not configured", async () => {
    vi.unstubAllEnvs();
    const r = await klaviyoProvider.emit({
      type: "order.placed",
      payload: makePlacedPayload(),
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not configured/);
  });

  it("posts a Placed Order event with the correct shape", async () => {
    const { captured } = installFetch({ status: 202 });
    const r = await klaviyoProvider.emit({
      type: "order.placed",
      payload: makePlacedPayload(),
    });

    expect(r.ok).toBe(true);
    expect(captured).toHaveLength(1);
    const req = captured[0]!;
    expect(req.url).toBe("https://a.klaviyo.com/api/events/");
    expect(req.method).toBe("POST");
    expect(req.headers["authorization"]).toBe("Klaviyo-API-Key pk_test_x");
    expect(req.headers["revision"]).toBe("2024-10-15");

    const body = req.body as {
      data: {
        attributes: {
          metric: { data: { attributes: { name: string } } };
          profile: { data: { attributes: { email: string } } };
          properties: Record<string, unknown>;
          unique_id: string;
          value: number;
        };
      };
    };
    expect(body.data.attributes.metric.data.attributes.name).toBe("Placed Order");
    expect(body.data.attributes.profile.data.attributes.email).toBe("kai@example.com");
    expect(body.data.attributes.unique_id).toBe("order-1042");
    expect(body.data.attributes.value).toBe(97.2);
    expect(body.data.attributes.properties.OrderId).toBe("1042");
    expect(body.data.attributes.properties.Total).toBe(97.2);
    expect(body.data.attributes.properties.PaymentMethod).toBe("card");
  });

  it("maps order.refunded to the Refunded Order metric", async () => {
    const { captured } = installFetch({ status: 202 });
    const r = await klaviyoProvider.emit({
      type: "order.refunded",
      payload: {
        profile: { email: "kai@example.com" },
        orderId: "1042",
        orderNumber: "1042",
        refundAmount: 40,
        currency: "USD",
        isPartial: true,
        uniqueId: "refund-ch_x",
      },
    });
    expect(r.ok).toBe(true);
    const body = captured[0]!.body as {
      data: { attributes: { metric: { data: { attributes: { name: string } } } } };
    };
    expect(body.data.attributes.metric.data.attributes.name).toBe("Refunded Order");
  });

  it("returns ok:false with HTTP status when Klaviyo rejects", async () => {
    installFetch({ status: 422, body: { errors: [{ detail: "bad" }] } });
    const r = await klaviyoProvider.emit({
      type: "order.placed",
      payload: makePlacedPayload(),
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/HTTP 422/);
  });

  it("redacts emails from error messages", async () => {
    installFetch({
      status: 400,
      body: { detail: "profile email kai@example.com is invalid" },
    });
    const r = await klaviyoProvider.emit({
      type: "order.placed",
      payload: makePlacedPayload(),
    });
    expect(r.ok).toBe(false);
    expect(r.error).not.toMatch(/kai@example\.com/);
    expect(r.error).toMatch(/<email>/);
  });
});

describe("klaviyoProvider.subscribeToList", () => {
  beforeEach(() => {
    vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "pk_test_x");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("posts a subscription bulk-create job", async () => {
    const { captured } = installFetch({ status: 202 });
    const r = await klaviyoProvider.subscribeToList(
      "L1",
      { email: "a@b.co" },
      "newsletter_form",
    );
    expect(r.ok).toBe(true);
    expect(captured).toHaveLength(1);
    expect(captured[0]!.url).toBe(
      "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
    );
    const body = captured[0]!.body as {
      data: {
        attributes: {
          custom_source: string;
          profiles: { data: Array<{ attributes: { email: string } }> };
        };
        relationships: { list: { data: { id: string } } };
      };
    };
    expect(body.data.attributes.custom_source).toBe("newsletter_form");
    expect(body.data.attributes.profiles.data[0]?.attributes.email).toBe("a@b.co");
    expect(body.data.relationships.list.data.id).toBe("L1");
  });
});

function makePlacedPayload(): PlacedOrderPayload {
  return {
    profile: {
      email: "kai@example.com",
      firstName: "Kai",
      lastName: "Nakoa",
    },
    orderId: "1042",
    orderNumber: "1042",
    items: [
      {
        productId: "p1",
        variantId: "v1",
        sku: "TT-M",
        name: "Tribal Tee — M",
        quantity: 2,
        unitPrice: 40,
        rowTotal: 80,
      },
    ],
    subtotal: 80,
    shipping: 10,
    tax: 7.2,
    discount: 0,
    total: 97.2,
    currency: "USD",
    paymentMethod: "card",
    orderUrl: "https://r1pfitness.com/account/orders/1042",
    siteUrl: "https://r1pfitness.com",
    uniqueId: "order-1042",
  };
}
