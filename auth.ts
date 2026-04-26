import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { wpAuthenticate } from "@/lib/auth/wp-auth";

/**
 * NextAuth v5 (Auth.js 5) configuration.
 *
 * Provider: Credentials — validates email + password against WordPress JWT
 * auth endpoint (or MOCK_AUTH mock in development).
 *
 * Session strategy: JWT (default for App Router). The JWT callback
 * stores wpToken + wooCustomerId so server components can make
 * authenticated WooCommerce API calls.
 *
 * TypeScript augmentation: next-auth.d.ts extends User/Session/JWT
 * with our custom fields.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const user = await wpAuthenticate(parsed.data.email, parsed.data.password);
        if (!user) return null;

        return {
          id: user.wpId,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          wpToken: user.wpToken,
          wooCustomerId: user.wooCustomerId,
        };
      },
    }),
  ],

  pages: {
    signIn: "/account/login",
    error: "/account/login",
  },

  callbacks: {
    jwt({ token, user }) {
      // On initial sign-in `user` is populated; afterwards only `token` is.
      if (user) {
        token.wpToken = (user as { wpToken?: string }).wpToken ?? "";
        token.wooCustomerId = (user as { wooCustomerId?: string }).wooCustomerId ?? "0";
      }
      return token;
    },
    session({ session, token }) {
      session.user.wpToken = (token.wpToken as string) ?? "";
      session.user.wooCustomerId = (token.wooCustomerId as string) ?? "0";
      return session;
    },
  },

  session: {
    strategy: "jwt",
    // Reduced from 30 to 7 days. JWTs are not server-revocable; a shorter
    // window limits the blast radius of a stolen session token.
    maxAge: 7 * 24 * 60 * 60, // 7 days
    // Slide the cookie expiration each time the user is active, but only
    // re-issue the JWT once per day to avoid a write on every request.
    updateAge: 24 * 60 * 60, // 24 hours
  },
});
