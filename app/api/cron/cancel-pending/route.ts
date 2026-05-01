import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  getWooOrder,
  listPendingOrdersBefore,
  markOrderCancelled,
} from "@/lib/checkout/woo-order";
import { emit } from "@/lib/email";
import { buildCancelledOrderEvent } from "@/lib/email/events";

/**
 * GET /api/cron/cancel-pending
 *
 * Vercel Cron entry point. Configured in `vercel.json` to run hourly:
 *
 *     { "crons": [{ "path": "/api/cron/cancel-pending", "schedule": "0 * * * *" }] }
 *
 * Behaviour
 *  - List Woo orders in `pending` status whose `date_modified` is
 *    older than `STALE_PENDING_THRESHOLD_MS` (default 2h).
 *  - For each: mark cancelled with reason `auto_timeout`, then emit
 *    `order.cancelled`.
 *  - Each order is processed in isolation; one Woo or Klaviyo failure
 *    does not abort the rest of the batch.
 *
 * Auth
 *  - Requires `Authorization: Bearer ${CRON_SECRET}`. Vercel sets this
 *    header automatically when invoking a cron path. The route refuses
 *    to run if the secret is unset — better to no-op than to expose an
 *    unauthenticated mass-cancel.
 *
 * Idempotency
 *  - `markOrderCancelled` is a no-op for any order already in
 *    cancelled / refunded / processing / completed, so a duplicate
 *    cron run (or a Woo eventual-consistency lag) is safe.
 *  - `buildCancelledOrderEvent` keys uniqueId on the order id, so a
 *    duplicate emit is collapsed by Klaviyo.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 2 hours. Override via the `staleAfterMs` query string for one-off back-fills. */
const STALE_PENDING_THRESHOLD_MS = 2 * 60 * 60 * 1000;

interface CancelOutcome {
  orderId: string;
  number: string;
  cancelled: boolean;
  emitted: boolean;
  error?: string;
}

export async function GET(req: Request): Promise<NextResponse> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: { code: "BACKEND_OFFLINE", message: "CRON_SECRET not configured" } },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid cron token" } },
      { status: 401 },
    );
  }

  // Allow `?staleAfterMs=N` to override the threshold (admin one-offs);
  // bound it to sane values so a typo cannot cancel a fresh pending order.
  const url = new URL(req.url);
  const overrideRaw = url.searchParams.get("staleAfterMs");
  const override = overrideRaw ? Number(overrideRaw) : NaN;
  const thresholdMs =
    Number.isFinite(override) && override >= 60_000 && override <= 30 * 24 * 60 * 60 * 1000
      ? override
      : STALE_PENDING_THRESHOLD_MS;

  const cutoff = new Date(Date.now() - thresholdMs).toISOString();
  const stale = await listPendingOrdersBefore(cutoff);

  const outcomes: CancelOutcome[] = [];

  for (const o of stale) {
    const outcome: CancelOutcome = {
      orderId: o.id,
      number: o.number,
      cancelled: false,
      emitted: false,
    };

    try {
      await markOrderCancelled(o.id, "Pending checkout abandoned (auto-cancel)");
      outcome.cancelled = true;
    } catch (err) {
      outcome.error = err instanceof Error ? err.message : "cancel_failed";
      outcomes.push(outcome);
      continue;
    }

    // Emit best-effort. We need the full Woo order (line items, billing)
    // for the cancellation email; if the read fails we still succeeded
    // at the cancel — the customer's checkout is closed either way.
    try {
      const order = await getWooOrder(o.id);
      if (order && order.billing.email) {
        await emit({
          type: "order.cancelled",
          payload: buildCancelledOrderEvent({ order, reason: "auto_timeout" }),
        });
        outcome.emitted = true;
      }
    } catch (err) {
      outcome.error = err instanceof Error ? err.message : "emit_failed";
    }

    outcomes.push(outcome);
  }

  console.info(
    `[cron-cancel-pending] cutoff=${cutoff} scanned=${stale.length} cancelled=${outcomes.filter((o) => o.cancelled).length} emitted=${outcomes.filter((o) => o.emitted).length}`,
  );

  return NextResponse.json({
    ok: true,
    data: {
      cutoff,
      scanned: stale.length,
      cancelled: outcomes.filter((o) => o.cancelled).length,
      emitted: outcomes.filter((o) => o.emitted).length,
      outcomes,
    },
  });
}
