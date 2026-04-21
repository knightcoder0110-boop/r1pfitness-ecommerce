import "server-only";

import { env } from "@/lib/env";
import { adminFetch } from "@/lib/woo/client";

export interface WpAuthUser {
  /** WordPress user ID */
  wpId: string;
  /** WooCommerce customer ID (may differ from wpId for some installs) */
  wooCustomerId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** JWT token returned from WP — stored in session for authenticated API calls */
  wpToken: string;
}

interface WpJwtResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

interface WooCustomerResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Authenticate a customer against WordPress using the JWT Authentication
 * for WP REST API plugin (https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/).
 *
 * Endpoint: POST /wp-json/jwt-auth/v1/token
 * Body: { username: string, password: string }
 *
 * In development (MOCK_AUTH=true), returns a mock user without hitting WordPress.
 *
 * Returns null on invalid credentials.
 */
export async function wpAuthenticate(
  email: string,
  password: string,
): Promise<WpAuthUser | null> {
  // ── Dev mock ──────────────────────────────────────────────────────────────
  if (process.env.MOCK_AUTH === "true") {
    if (email === "dev@r1pfitness.com" && password === "r1p2026") {
      return {
        wpId: "1",
        wooCustomerId: "1",
        email: "dev@r1pfitness.com",
        firstName: "Dev",
        lastName: "User",
        wpToken: "mock-jwt-token",
      };
    }
    return null;
  }

  const base = env.WOO_BASE_URL;
  if (!base) return null;

  // ── Real WP JWT auth ───────────────────────────────────────────────────────
  let jwtRes: WpJwtResponse;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });
    if (!res.ok) return null;
    jwtRes = await res.json();
  } catch {
    return null;
  }

  if (!jwtRes.token) return null;

  // ── Look up Woo customer ID by email ──────────────────────────────────────
  let wooCustomerId = "0";
  try {
    const customers = await adminFetch<WooCustomerResponse[]>({
      path: `/customers?email=${encodeURIComponent(email)}&per_page=1`,
    });
    if (customers[0]?.id) {
      wooCustomerId = String(customers[0].id);
    }
  } catch {
    // Not fatal — customer lookup failing shouldn't block login
  }

  return {
    wpId: "0", // not returned by JWT endpoint; populate if needed
    wooCustomerId,
    email: jwtRes.user_email,
    firstName: jwtRes.user_display_name.split(" ")[0] ?? "",
    lastName: jwtRes.user_display_name.split(" ").slice(1).join(" ") ?? "",
    wpToken: jwtRes.token,
  };
}

/**
 * Register a new customer via WooCommerce REST API.
 * Returns the new customer's ID on success, null on failure.
 */
export async function wpRegisterCustomer(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ customerId: string } | null> {
  // ── Dev mock ──────────────────────────────────────────────────────────────
  if (process.env.MOCK_AUTH === "true") {
    return { customerId: "999" };
  }

  try {
    const customer = await adminFetch<WooCustomerResponse>({
      path: "/customers",
      method: "POST",
      body: {
        email: params.email,
        password: params.password,
        first_name: params.firstName,
        last_name: params.lastName,
        username: params.email,
      },
    });
    return { customerId: String(customer.id) };
  } catch {
    return null;
  }
}
