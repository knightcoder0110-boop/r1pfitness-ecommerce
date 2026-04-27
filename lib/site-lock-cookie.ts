export const SITE_UNLOCK_COOKIE = "r1p_site_unlocked";
export const SITE_UNLOCK_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const COOKIE_VERSION = "v1";
const CLOCK_SKEW_SECONDS = 60;
const encoder = new TextEncoder();

function getSigningSecret(): string | undefined {
  return (
    process.env.SITE_UNLOCK_COOKIE_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.SITE_UNLOCK_PASSWORD
  );
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function createSiteUnlockCookieValue(now = Date.now()): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) throw new Error("Site unlock cookie signing secret is not configured.");

  const issuedAt = Math.floor(now / 1000);
  const payload = `${COOKIE_VERSION}.${issuedAt}`;
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function isValidSiteUnlockCookieValue(
  value: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  if (!value) return false;

  const [version, issuedAtRaw, signature, ...extra] = value.split(".");
  if (extra.length > 0 || version !== COOKIE_VERSION || !issuedAtRaw || !signature) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isInteger(issuedAt)) return false;

  const currentSeconds = Math.floor(now / 1000);
  if (issuedAt > currentSeconds + CLOCK_SKEW_SECONDS) return false;
  if (currentSeconds - issuedAt > SITE_UNLOCK_COOKIE_MAX_AGE + CLOCK_SKEW_SECONDS) return false;

  const secret = getSigningSecret();
  if (!secret) return false;

  const expected = await sign(`${COOKIE_VERSION}.${issuedAt}`, secret);
  return timingSafeEqual(signature, expected);
}
