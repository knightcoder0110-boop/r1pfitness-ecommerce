import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("server-only", () => ({}));

const revalidateTag = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (tag: string) => revalidateTag(tag),
}));

const SECRET = "test-webhook-secret";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

function mkRequest(body: string, signature: string | null): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature !== null) headers.set("x-wc-webhook-signature", signature);
  return new Request("http://localhost/api/webhooks/woo/product", {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  process.env.WOO_WEBHOOK_SECRET = SECRET;
  revalidateTag.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/webhooks/woo/product", () => {
  it("rejects a missing signature with 401", async () => {
    const { POST } = await import("./route");
    const body = JSON.stringify({ id: 42, slug: "paradise-tee" });
    const res = await POST(mkRequest(body, null) as never);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature with 401", async () => {
    const { POST } = await import("./route");
    const body = JSON.stringify({ id: 42, slug: "paradise-tee" });
    const res = await POST(mkRequest(body, "bogus") as never);

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects when secret is not configured", async () => {
    delete process.env.WOO_WEBHOOK_SECRET;
    const { POST } = await import("./route");
    const body = JSON.stringify({ id: 42 });
    const res = await POST(mkRequest(body, sign(body, SECRET)) as never);

    expect(res.status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("accepts a valid signature and revalidates product+slug+products+categories tags", async () => {
    const { POST } = await import("./route");
    const body = JSON.stringify({ id: 42, slug: "paradise-tee" });
    const res = await POST(mkRequest(body, sign(body, SECRET)) as never);

    expect(res.status).toBe(200);
    const tags = revalidateTag.mock.calls.map((c) => c[0]);
    expect(tags).toContain("woo:products");
    expect(tags).toContain("woo:categories");
    expect(tags).toContain("woo:product:42");
    expect(tags).toContain("woo:product:42:variations");
    expect(tags).toContain("woo:product:slug:paradise-tee");
  });

  it("returns 400 on malformed JSON body (after signature check)", async () => {
    const { POST } = await import("./route");
    const body = "{not json";
    const res = await POST(mkRequest(body, sign(body, SECRET)) as never);

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("tolerates missing id/slug on the payload", async () => {
    const { POST } = await import("./route");
    const body = JSON.stringify({});
    const res = await POST(mkRequest(body, sign(body, SECRET)) as never);

    expect(res.status).toBe(200);
    const tags = revalidateTag.mock.calls.map((c) => c[0]);
    expect(tags).toEqual(["woo:products", "woo:categories"]);
  });
});
