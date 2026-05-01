import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { subscribeToKlaviyo } from "./klaviyo";

/**
 * The Klaviyo subscribe path makes up to two outbound HTTP calls:
 *   1. GET  /lists/{id}/profiles?filter=equals(email,…)   — duplicate probe
 *   2. POST /profile-subscription-bulk-create-jobs/        — actual subscribe
 *
 * We stub global.fetch and assert per-call behaviour.
 */

type FetchMock = ReturnType<typeof vi.fn>;

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_LIST_ID = process.env.KLAVIYO_LIST_ID;
const ORIGINAL_API_KEY = process.env.KLAVIYO_PRIVATE_API_KEY;

function mockResponse(status: number, body: unknown): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("subscribeToKlaviyo", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    process.env.KLAVIYO_LIST_ID = "TEST_LIST";
    process.env.KLAVIYO_PRIVATE_API_KEY = "pk_test";
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    process.env.KLAVIYO_LIST_ID = ORIGINAL_LIST_ID;
    process.env.KLAVIYO_PRIVATE_API_KEY = ORIGINAL_API_KEY;
    vi.restoreAllMocks();
  });

  it("returns alreadySubscribed when the probe finds the profile in the list", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, { data: [{ id: "01H...", type: "profile" }] }),
    );

    const result = await subscribeToKlaviyo("dup@example.com");

    expect(result).toEqual({ success: true, alreadySubscribed: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0]!;
    const url = call[0] as string;
    const init = call[1] as RequestInit;
    expect(url).toContain("/lists/TEST_LIST/profiles/");
    expect(url).toContain(encodeURIComponent('equals(email,"dup@example.com")'));
    expect(init.method).toBe("GET");
  });

  it("subscribes via the bulk-create job when the probe returns no profiles", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { data: [] })) // probe — empty
      .mockResolvedValueOnce(mockResponse(202, "")); // create job

    const result = await subscribeToKlaviyo("new@example.com");

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const subscribeCall = fetchMock.mock.calls[1]!;
    expect(subscribeCall[0]).toContain(
      "/profile-subscription-bulk-create-jobs/",
    );
    expect((subscribeCall[1] as RequestInit).method).toBe("POST");
  });

  it("falls through to subscribe when the probe fails (never blocks legit signups)", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(500, "Server explosion")) // probe fails
      .mockResolvedValueOnce(mockResponse(202, "")); // bulk-create still runs

    const result = await subscribeToKlaviyo("flaky@example.com");

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns success: false when env vars are missing", async () => {
    delete process.env.KLAVIYO_LIST_ID;

    const result = await subscribeToKlaviyo("x@example.com");

    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns success: false when the bulk-create job errors", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { data: [] })) // probe
      .mockResolvedValueOnce(mockResponse(401, "unauthorized"));

    const result = await subscribeToKlaviyo("err@example.com");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects emails containing double quotes (filter-injection guard)", async () => {
    // probe should short-circuit and the bulk-create job still runs once
    fetchMock.mockResolvedValueOnce(mockResponse(202, ""));

    const result = await subscribeToKlaviyo('weird"name@example.com');

    expect(result).toEqual({ success: true });
    // only one call: probe was bypassed, only POST happened
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const onlyCall = fetchMock.mock.calls[0]!;
    expect(onlyCall[0]).toContain(
      "/profile-subscription-bulk-create-jobs/",
    );
  });

  it("returns success: false on network errors during subscribe", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { data: [] })) // probe ok
      .mockRejectedValueOnce(new Error("ECONNRESET"));

    const result = await subscribeToKlaviyo("net@example.com");

    expect(result.success).toBe(false);
  });
});
