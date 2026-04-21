import type { AnalyticsEvent } from "./events";

type Adapter = (event: AnalyticsEvent) => void;

/**
 * Dev-mode console adapter. In Phase 7 this is swapped for GA4 / Klaviyo
 * fan-out. Keep the surface area tiny now — callers only import `track()`
 * and the per-event helpers.
 */
const consoleAdapter: Adapter = (event) => {
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event.name, event.payload);
  }
};

const adapters: Adapter[] = [consoleAdapter];

/** Register an additional adapter. Called once at boot in Phase 7. */
export function registerAnalyticsAdapter(a: Adapter): void {
  adapters.push(a);
}

/** Fan-out dispatch. Errors in adapters never throw into caller code. */
export function track(event: AnalyticsEvent): void {
  for (const a of adapters) {
    try {
      a(event);
    } catch {
      // Swallow — analytics must never break the user flow.
    }
  }
}
