import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/forgot-password
 *
 * Proxies a password-reset request to WordPress's native lost-password endpoint.
 * WordPress handles the email delivery — no custom email logic needed.
 *
 * Body: { email: string }
 * Response: { success: boolean, error?: string }
 *
 * Security:
 *  - Rate-limit the route in production via middleware or an edge WAF.
 *  - Always returns success=true when the email format is valid (no account
 *    enumeration — same behaviour as WP's own UI).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string };
    const email = body?.email?.trim();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address." },
        { status: 400 },
      );
    }

    const wpBase = process.env.WOO_BASE_URL;
    if (!wpBase) {
      // No WP configured — still return success to avoid account enumeration.
      console.warn("[forgot-password] WOO_BASE_URL not configured");
      return NextResponse.json({ success: true });
    }

    // WordPress lost password endpoint — strips any trailing /wp-json path if present.
    const siteRoot = wpBase.replace(/\/wp-json.*$/, "").replace(/\/$/, "");
    const formData = new URLSearchParams();
    formData.set("user_login", email);
    formData.set("redirect_to", "");
    formData.set("wp-submit", "Get New Password");

    const res = await fetch(`${siteRoot}/wp-login.php?action=lostpassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Mimic a browser form submission so WP doesn't reject it.
        "User-Agent": "R1PFitness/1.0",
      },
      body: formData.toString(),
      redirect: "manual", // WP redirects on success; treat any response as OK.
    });

    // WP responds with 302 (redirect to checkemail page) on success,
    // or 200 with an error page. Either way we return success=true to the
    // client to avoid account enumeration attacks.
    if (res.status >= 200 && res.status < 500) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Password reset service unavailable. Please try again." },
      { status: 503 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
