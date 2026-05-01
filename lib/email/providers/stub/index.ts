import "server-only";

import type {
  ConsentSource,
  EmailProfile,
  EmailProvider,
  EmitResult,
  OrderLifecycleEvent,
  SubscribeResult,
} from "../../types";

/**
 * No-op provider used in dev (when KLAVIYO_PRIVATE_API_KEY is unset)
 * and in tests. Records every emission on `stubEmailProvider.calls` so
 * suites can assert against it without mocking `fetch`.
 */
export interface StubEmailProvider extends EmailProvider {
  readonly calls: Array<
    | { kind: "emit"; event: OrderLifecycleEvent }
    | { kind: "subscribeToList"; listId: string; profile: EmailProfile; source: ConsentSource }
  >;
  reset(): void;
}

function createStub(): StubEmailProvider {
  const calls: StubEmailProvider["calls"] = [];

  return {
    name: "stub",
    calls,
    reset() {
      calls.length = 0;
    },
    async emit(event: OrderLifecycleEvent): Promise<EmitResult> {
      calls.push({ kind: "emit", event });
      // Surface the dispatch in dev so it's obvious when the stub is in use.
      console.log(
        `[email:stub] emit ${event.type} ${
          "orderId" in event.payload ? event.payload.orderId : ""
        }`.trim(),
      );
      return { ok: true, providerEventId: `stub-${calls.length}` };
    },
    async subscribeToList(
      listId: string,
      profile: EmailProfile,
      source: ConsentSource,
    ): Promise<SubscribeResult> {
      calls.push({ kind: "subscribeToList", listId, profile, source });
      console.log(`[email:stub] subscribe ${maskEmail(profile.email)} → ${listId} (${source})`);
      return { ok: true };
    },
  };
}

export const stubEmailProvider: StubEmailProvider = createStub();

function maskEmail(e: string): string {
  return e.replace(/^(.).*(@.*)$/, "$1***$2");
}
