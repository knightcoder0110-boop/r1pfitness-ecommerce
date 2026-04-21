import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { WooError } from "@/lib/woo/errors";
import { ApiError } from "./errors";
import { fail, ok, type ApiMeta, type ApiResponse } from "./response";

/**
 * Higher-order handler that wraps an App Router route handler with:
 *  - Optional Zod schema validation of the JSON body.
 *  - Consistent success/failure envelope (`ok`/`fail`).
 *  - Unified error mapping: `ApiError`, `WooError`, `ZodError`, anything else.
 *
 * Usage:
 *
 *   const schema = z.object({ email: z.string().email() });
 *
 *   export const POST = withApi({
 *     schema,
 *     handler: async ({ input }) => {
 *       await subscribe(input.email);
 *       return { subscribed: true };
 *     },
 *   });
 */
export interface HandlerContext<TInput> {
  req: NextRequest;
  input: TInput;
}

export interface HandlerResult<TData> {
  data: TData;
  meta?: ApiMeta;
}

export interface WithApiConfig<TSchema extends ZodType | undefined, TData> {
  schema?: TSchema;
  handler: (
    ctx: HandlerContext<TSchema extends ZodType ? TSchema["_output"] : undefined>,
  ) => Promise<TData | HandlerResult<TData>>;
}

export function withApi<TSchema extends ZodType | undefined, TData>(
  config: WithApiConfig<TSchema, TData>,
) {
  return async function routeHandler(req: NextRequest): Promise<NextResponse<ApiResponse<TData>>> {
    try {
      let input: unknown = undefined;
      if (config.schema) {
        const raw = await safeJson(req);
        input = config.schema.parse(raw);
      }

      const result = await config.handler({
        req,
        input: input as TSchema extends ZodType ? TSchema["_output"] : undefined,
      });

      const { data, meta } = isHandlerResult(result) ? result : { data: result, meta: undefined };

      return NextResponse.json(ok(data, meta));
    } catch (err) {
      return handleError<TData>(err);
    }
  };
}

function isHandlerResult<T>(value: unknown): value is HandlerResult<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in (value as Record<string, unknown>) &&
    Object.keys(value as Record<string, unknown>).every((k) => k === "data" || k === "meta")
  );
}

async function safeJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

function handleError<TData>(err: unknown): NextResponse<ApiResponse<TData>> {
  if (err instanceof ZodError) {
    return NextResponse.json(
      fail("VALIDATION_FAILED", "Input failed validation", err.issues),
      { status: 422 },
    );
  }

  if (err instanceof ApiError) {
    return NextResponse.json(fail(err.code, err.message, err.details), { status: err.status });
  }

  if (err instanceof WooError) {
    return NextResponse.json(fail(err.code, err.message, err.details), { status: err.status });
  }

  // Unknown — log and return a generic envelope.
  console.error("[api] unhandled error:", err);
  return NextResponse.json(fail("INTERNAL", "An unexpected error occurred"), { status: 500 });
}
