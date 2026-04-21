import "server-only";

import { env } from "@/lib/env";

export function getSiteUrl(): string {
  return (env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}