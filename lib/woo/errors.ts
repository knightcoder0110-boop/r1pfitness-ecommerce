/**
 * Stable, machine-readable error codes for the Woo domain layer.
 * These codes are safe to expose to the browser and are used by UI to map
 * errors to user-facing messages.
 */
export const WOO_ERROR_CODES = {
  // Network / infrastructure
  WOO_UNREACHABLE: "WOO_UNREACHABLE",
  WOO_TIMEOUT: "WOO_TIMEOUT",
  WOO_UNEXPECTED: "WOO_UNEXPECTED",

  // Auth
  WOO_UNAUTHENTICATED: "WOO_UNAUTHENTICATED",
  WOO_FORBIDDEN: "WOO_FORBIDDEN",

  // Resource
  NOT_FOUND: "NOT_FOUND",

  // Cart
  CART_INVALID_TOKEN: "CART_INVALID_TOKEN",
  CART_ITEM_NOT_FOUND: "CART_ITEM_NOT_FOUND",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  INVALID_QUANTITY: "INVALID_QUANTITY",

  // Checkout
  CHECKOUT_FAILED: "CHECKOUT_FAILED",
  PAYMENT_FAILED: "PAYMENT_FAILED",

  // Validation
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

export type WooErrorCode = (typeof WOO_ERROR_CODES)[keyof typeof WOO_ERROR_CODES];

/**
 * Structured error thrown by the Woo client and BFF layer.
 * Never throw raw `Error`s — always `WooError` so the handler knows what
 * code / HTTP status to emit.
 */
export class WooError extends Error {
  readonly code: WooErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(params: {
    code: WooErrorCode;
    message: string;
    status?: number;
    details?: unknown;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = "WooError";
    this.code = params.code;
    this.status = params.status ?? 500;
    this.details = params.details;
  }
}

/**
 * Map an HTTP response status to a reasonable default error code.
 */
export function errorCodeForStatus(status: number): WooErrorCode {
  if (status === 401) return WOO_ERROR_CODES.WOO_UNAUTHENTICATED;
  if (status === 403) return WOO_ERROR_CODES.WOO_FORBIDDEN;
  if (status === 404) return WOO_ERROR_CODES.NOT_FOUND;
  if (status === 408 || status === 504) return WOO_ERROR_CODES.WOO_TIMEOUT;
  if (status >= 500) return WOO_ERROR_CODES.WOO_UNREACHABLE;
  return WOO_ERROR_CODES.WOO_UNEXPECTED;
}
