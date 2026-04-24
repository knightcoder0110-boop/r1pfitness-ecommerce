// NOTE: intentionally no "server-only" — getSiteUrl() reads only a NEXT_PUBLIC_
// env var which is safe to call from both server and client components.
import { env } from "@/lib/env";

export function getSiteUrl(): string {
  return (env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}