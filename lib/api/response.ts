/**
 * Response envelope used by every `/api/*` route.
 *
 * Success:  { ok: true, data, meta? }
 * Failure:  { ok: false, error: { code, message, details? } }
 *
 * This consistency lets the browser SWR/fetch code treat every endpoint
 * identically — no per-route special casing.
 */

export interface ApiMeta {
  page?: number;
  pageCount?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, meta?: ApiMeta): ApiSuccess<T> {
  return meta !== undefined ? { ok: true, data, meta } : { ok: true, data };
}

export function fail(code: string, message: string, details?: unknown): ApiFailure {
  return details !== undefined
    ? { ok: false, error: { code, message, details } }
    : { ok: false, error: { code, message } };
}
