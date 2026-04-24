/**
 * Image proxy — serves WooCommerce-hosted images through Next.js's own origin.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Cloudways resolves to a NAT64 address (`64:ff9b::/96`) when DNS is queried
 * from an IPv6-only environment. Next.js's image optimiser (and its patched
 * global `fetch`) rejects the request when it detects what it considers a
 * "private" IP — even though the embedded IPv4 (e.g. 45.32.x.x) is fully
 * public.
 *
 * IMPORTANT: we intentionally use Node's native `https` module here rather
 * than `fetch`. Next.js patches the global `fetch` inside route handlers and
 * applies the same private-IP check, so using `fetch` in this proxy would
 * just reproduce the original problem. `https.get` goes directly to Node's
 * TLS stack and has no IP-range restrictions.
 *
 * SECURITY
 * ────────
 * Only URLs whose hostname matches the explicit allow-list (derived from
 * WOO_BASE_URL + hard-coded fallbacks) are proxied. Any other hostname
 * returns 403. This prevents open-redirect or SSRF abuse.
 *
 * CACHING
 * ───────
 * Responses carry `Cache-Control: public, max-age=31536000, immutable` so
 * browsers (and Next.js's own image cache) hold them for a year.
 */

import https from "node:https";
import http from "node:http";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Build the set of allowed image hostnames from environment + known defaults. */
function buildAllowedHostnames(): Set<string> {
  const set = new Set<string>();
  const wooBase = process.env.WOO_BASE_URL;
  if (wooBase) {
    try {
      set.add(new URL(wooBase).hostname);
    } catch {
      // malformed env — ignore
    }
  }
  set.add("woocommerce-1616698-6370177.cloudwaysapps.com");
  set.add("lightslategrey-ibex-799942.hostingersite.com");
  return set;
}

/**
 * Fetch a URL using Node's native https/http module, bypassing Next.js's
 * patched global fetch and its private-IP restrictions.
 */
function nodeGet(
  url: string,
): Promise<{ statusCode: number; contentType: string; data: Buffer }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "User-Agent": "R1P-Image-Proxy/1.0",
        },
      },
      (res) => {
        // Follow a single redirect (Cloudways sometimes issues a 301).
        if (
          (res.statusCode === 301 || res.statusCode === 302) &&
          res.headers.location
        ) {
          nodeGet(res.headers.location).then(resolve).catch(reject);
          res.resume(); // drain original response
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 200,
            contentType: res.headers["content-type"] ?? "image/jpeg",
            data: Buffer.concat(chunks),
          });
        });
        res.on("error", reject);
      },
    );
    req.setTimeout(12_000, () => {
      req.destroy(new Error("Request timed out"));
    });
    req.on("error", reject);
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return new NextResponse("Missing required `url` query parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return new NextResponse("Unsupported protocol", { status: 400 });
  }

  const allowed = buildAllowedHostnames();
  if (!allowed.has(parsed.hostname)) {
    return new NextResponse("Hostname not allowed", { status: 403 });
  }

  let result: Awaited<ReturnType<typeof nodeGet>>;
  try {
    result = await nodeGet(rawUrl);
  } catch (err) {
    console.error("[image-proxy] upstream fetch failed:", rawUrl, err);
    return new NextResponse("Failed to fetch image from upstream", { status: 502 });
  }

  if (result.statusCode < 200 || result.statusCode >= 300) {
    return new NextResponse("Upstream image not found", { status: result.statusCode });
  }

  if (!result.contentType.startsWith("image/")) {
    return new NextResponse("Upstream did not return an image", { status: 502 });
  }

  // Convert Buffer → Uint8Array so TypeScript's BodyInit check is satisfied.
  return new NextResponse(new Uint8Array(result.data), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Proxy-Source": parsed.hostname,
    },
  });
}

