import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSiteUnlockCookieValue,
  isValidSiteUnlockCookieValue,
  SITE_UNLOCK_COOKIE_MAX_AGE,
} from "./site-lock-cookie";

describe("site lock cookie", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts signed cookie values", async () => {
    vi.stubEnv("SITE_UNLOCK_PASSWORD", "launch-password");
    const now = Date.UTC(2026, 3, 27);

    const value = await createSiteUnlockCookieValue(now);

    await expect(isValidSiteUnlockCookieValue(value, now)).resolves.toBe(true);
  });

  it("rejects forged plain cookie values", async () => {
    vi.stubEnv("SITE_UNLOCK_PASSWORD", "launch-password");

    await expect(isValidSiteUnlockCookieValue("1")).resolves.toBe(false);
  });

  it("rejects expired signed cookie values", async () => {
    vi.stubEnv("SITE_UNLOCK_PASSWORD", "launch-password");
    const now = Date.UTC(2026, 3, 27);
    const value = await createSiteUnlockCookieValue(now);

    await expect(
      isValidSiteUnlockCookieValue(value, now + (SITE_UNLOCK_COOKIE_MAX_AGE + 120) * 1000),
    ).resolves.toBe(false);
  });
});
