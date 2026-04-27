import { ApiError } from "./errors";

const SAME_ORIGIN_ERROR = {
  code: "FORBIDDEN" as const,
  message: "Cross-site requests are not allowed",
  status: 403,
};

export function assertSameOrigin(req: Request): void {
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) {
    throw new ApiError(SAME_ORIGIN_ERROR);
  }

  let sourceOrigin: string;
  try {
    sourceOrigin = new URL(source).origin;
  } catch {
    throw new ApiError(SAME_ORIGIN_ERROR);
  }

  const requestOrigin = new URL(req.url).origin;
  if (sourceOrigin !== requestOrigin) {
    throw new ApiError(SAME_ORIGIN_ERROR);
  }
}