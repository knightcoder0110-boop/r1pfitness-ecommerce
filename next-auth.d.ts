import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      /** JWT token returned by WordPress JWT auth plugin */
      wpToken: string;
      /** WooCommerce customer ID — used for order/address lookups */
      wooCustomerId: string;
    };
  }

  interface User {
    wpToken?: string;
    wooCustomerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    wpToken?: string;
    wooCustomerId?: string;
  }
}
