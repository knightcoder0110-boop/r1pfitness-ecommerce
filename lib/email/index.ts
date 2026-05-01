import "server-only";

import type {
  ConsentSource,
  EmailProfile,
  EmailProvider,
  EmitResult,
  OrderLifecycleEvent,
  SubscribeResult,
} from "./types";
import { klaviyoProvider } from "./providers/klaviyo";
import { stubEmailProvider } from "./providers/stub";

/**
 * Public surface of the email layer.
 *
 * Callers should ALWAYS use `emit(...)` and `subscribeToList(...)` — these
 * are non-throwing wrappers that select the right provider at runtime,
 * apply structured logging, and never propagate provider errors back to
 * webhook / API route handlers (a Klaviyo outage must not cause Stripe
 * to retry our webhook and double-process orders).
 *
 * Test code can swap the provider with `__setEmailProviderForTesting`
 * to inject the stub and assert behaviour.
 */

let providerOverride: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (providerOverride) return providerOverride;
  if (process.env.KLAVIYO_PRIVATE_API_KEY) return klaviyoProvider;
  return stubEmailProvider;
}

/** Test-only: install a provider for the duration of a test. */
export function __setEmailProviderForTesting(p: EmailProvider | null): void {
  providerOverride = p;
}

/**
 * Fire-and-forget event emission. Always resolves; logs failures.
 * Returns the `EmitResult` so callers that genuinely care (e.g. a
 * health-check endpoint) can inspect it, but webhook code should
 * usually `await emit(...)` and ignore the return.
 */
export async function emit(event: OrderLifecycleEvent): Promise<EmitResult> {
  const provider = getEmailProvider();
  const start = Date.now();
  try {
    const result = await provider.emit(event);
    logEmit(provider.name, event, result, Date.now() - start);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(
      JSON.stringify({
        evt: "email.emit.threw",
        provider: provider.name,
        type: event.type,
        ms: Date.now() - start,
        error: message,
      }),
    );
    return { ok: false, error: message };
  }
}

/**
 * Subscribe a profile to a marketing list. Throws only if `listId` is
 * empty (programmer error); provider failures resolve with `ok: false`.
 */
export async function subscribeToList(
  listId: string,
  profile: EmailProfile,
  source: ConsentSource,
): Promise<SubscribeResult> {
  if (!listId) {
    throw new Error("subscribeToList: listId required");
  }
  const provider = getEmailProvider();
  const start = Date.now();
  try {
    const result = await provider.subscribeToList(listId, profile, source);
    console.log(
      JSON.stringify({
        evt: "email.subscribe",
        provider: provider.name,
        listId,
        source,
        ok: result.ok,
        ms: Date.now() - start,
      }),
    );
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(
      JSON.stringify({
        evt: "email.subscribe.threw",
        provider: provider.name,
        listId,
        ms: Date.now() - start,
        error: message,
      }),
    );
    return { ok: false, error: message };
  }
}

function logEmit(
  provider: string,
  event: OrderLifecycleEvent,
  result: EmitResult,
  ms: number,
): void {
  const line = {
    evt: result.ok ? "email.emit" : "email.emit.failed",
    provider,
    type: event.type,
    ok: result.ok,
    ms,
    ...(result.providerEventId ? { providerEventId: result.providerEventId } : {}),
    ...(result.error ? { error: result.error } : {}),
  };
  if (result.ok) {
    console.log(JSON.stringify(line));
  } else {
    console.error(JSON.stringify(line));
  }
}

// Re-export commonly used types so call sites can `import { emit, type ... }`
// from a single module.
export type {
  ConsentSource,
  EmailProfile,
  EmailProvider,
  EmitResult,
  OrderLifecycleEvent,
  SubscribeResult,
} from "./types";
