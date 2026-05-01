import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { __setEmailProviderForTesting, emit, subscribeToList } from "./index";
import { stubEmailProvider } from "./providers/stub";

describe("email/index", () => {
  afterEach(() => {
    __setEmailProviderForTesting(null);
    stubEmailProvider.reset();
  });

  it("emit() routes to the override provider and returns its result", async () => {
    __setEmailProviderForTesting(stubEmailProvider);
    const result = await emit({
      type: "newsletter.subscribed",
      payload: { profile: { email: "a@b.co" }, source: "footer_form" },
    });
    expect(result.ok).toBe(true);
    expect(stubEmailProvider.calls).toHaveLength(1);
    expect(stubEmailProvider.calls[0]).toMatchObject({
      kind: "emit",
      event: { type: "newsletter.subscribed" },
    });
  });

  it("emit() never throws when the provider throws", async () => {
    __setEmailProviderForTesting({
      name: "stub",
      async emit() {
        throw new Error("boom");
      },
      async subscribeToList() {
        return { ok: true };
      },
    });
    const result = await emit({
      type: "newsletter.subscribed",
      payload: { profile: { email: "a@b.co" }, source: "manual" },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/boom/);
  });

  it("subscribeToList() throws on empty listId (programmer error)", async () => {
    await expect(
      subscribeToList("", { email: "a@b.co" }, "newsletter_form"),
    ).rejects.toThrow(/listId required/);
  });

  it("subscribeToList() resolves ok:false when provider rejects", async () => {
    __setEmailProviderForTesting({
      name: "stub",
      async emit() {
        return { ok: true };
      },
      async subscribeToList() {
        throw new Error("network down");
      },
    });
    const result = await subscribeToList("L1", { email: "a@b.co" }, "manual");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/network down/);
  });

  it("stub provider records subscribe calls", async () => {
    __setEmailProviderForTesting(stubEmailProvider);
    await subscribeToList("L1", { email: "a@b.co" }, "checkout_optin");
    expect(stubEmailProvider.calls).toMatchObject([
      {
        kind: "subscribeToList",
        listId: "L1",
        profile: { email: "a@b.co" },
        source: "checkout_optin",
      },
    ]);
  });
});
