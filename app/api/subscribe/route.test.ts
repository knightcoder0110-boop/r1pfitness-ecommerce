import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const subscribeToKlaviyoMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/klaviyo", () => ({
  subscribeToKlaviyo: subscribeToKlaviyoMock,
}));

import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    subscribeToKlaviyoMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns subscribed: true and alreadySubscribed: false on a fresh signup", async () => {
    subscribeToKlaviyoMock.mockResolvedValueOnce({
      success: true,
      alreadySubscribed: false,
    });

    const res = await POST(makeRequest({ email: "fresh@example.com" }));
    const json = (await res.json()) as { ok: boolean; data: unknown };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data).toEqual({ subscribed: true, alreadySubscribed: false });
  });

  it("surfaces alreadySubscribed: true when the email is already on the list", async () => {
    subscribeToKlaviyoMock.mockResolvedValueOnce({
      success: true,
      alreadySubscribed: true,
    });

    const res = await POST(makeRequest({ email: "dup@example.com" }));
    const json = (await res.json()) as {
      ok: boolean;
      data: { subscribed: boolean; alreadySubscribed: boolean };
    };

    expect(res.status).toBe(200);
    expect(json.data.alreadySubscribed).toBe(true);
  });

  it("returns 502 when Klaviyo fails", async () => {
    subscribeToKlaviyoMock.mockResolvedValueOnce({
      success: false,
      error: "Klaviyo down",
    });

    const res = await POST(makeRequest({ email: "broken@example.com" }));

    expect(res.status).toBe(502);
  });

  it("returns 422 for an invalid email shape", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));

    expect(res.status).toBe(422);
    expect(subscribeToKlaviyoMock).not.toHaveBeenCalled();
  });

  it("returns 422 when the body is empty", async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(422);
    expect(subscribeToKlaviyoMock).not.toHaveBeenCalled();
  });
});
