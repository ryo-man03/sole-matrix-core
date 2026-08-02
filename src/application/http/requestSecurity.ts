const buckets = new Map<string, { count: number; resetAt: number }>();

export function validateMutationRequest(request: Request, options: { key: string; limit?: number; bodyRequired?: boolean }) {
  const contentType = request.headers.get("content-type") ?? "";
  if (options.bodyRequired !== false && !contentType.toLowerCase().startsWith("application/json")) return { ok: false as const, status: 415, code: "JSON_REQUIRED" };
  const origin = request.headers.get("origin");
  const host = forwardedHost(request);
  if (origin) {
    try { if (new URL(origin).host !== host) return { ok: false as const, status: 403, code: "INVALID_ORIGIN" }; }
    catch { return { ok: false as const, status: 403, code: "INVALID_ORIGIN" }; }
  } else if (process.env.NODE_ENV === "production") return { ok: false as const, status: 403, code: "ORIGIN_REQUIRED" };
  const now = Date.now();
  const identity = `${options.key}:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"}`;
  const bucket = buckets.get(identity);
  if (!bucket || bucket.resetAt <= now) buckets.set(identity, { count: 1, resetAt: now + 60_000 });
  else if (++bucket.count > (options.limit ?? 30)) return { ok: false as const, status: 429, code: "RATE_LIMITED" };
  return { ok: true as const };
}

function forwardedHost(request: Request) { return request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? request.headers.get("host") ?? new URL(request.url).host; }
