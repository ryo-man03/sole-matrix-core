const buckets = new Map<string, { count: number; resetAt: number }>();
const DEFAULT_MAX_BODY_BYTES = 32 * 1024;
const DEFAULT_MAX_QUERY_LENGTH = 2_048;
const MAX_JSON_DEPTH = 20;
const MAX_JSON_NODES = 2_000;
const forbiddenObjectKeys = new Set(["__proto__", "prototype", "constructor"]);

export class RequestBodyError extends Error {
  constructor(public readonly code: "BODY_TOO_LARGE" | "INVALID_JSON" | "UNSAFE_JSON") {
    super(code);
    this.name = "RequestBodyError";
  }
}

export function validateMutationRequest(request: Request, options: {
  key: string;
  limit?: number;
  bodyRequired?: boolean;
  maxBodyBytes?: number;
  maxQueryLength?: number;
}) {
  const contentType = request.headers.get("content-type") ?? "";
  if (options.bodyRequired !== false && !contentType.toLowerCase().startsWith("application/json")) return { ok: false as const, status: 415, code: "JSON_REQUIRED" };
  const requestUrl = new URL(request.url);
  const maxQueryLength = options.maxQueryLength ?? DEFAULT_MAX_QUERY_LENGTH;
  if (requestUrl.search.length > maxQueryLength || [...requestUrl.searchParams].length > 50) return { ok: false as const, status: 414, code: "QUERY_TOO_LARGE" };
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0 || parsedLength > (options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES)) {
      return { ok: false as const, status: 413, code: "BODY_TOO_LARGE" };
    }
  }
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

/** Reads JSON without trusting Content-Length and rejects pollution-shaped data. */
export async function readBoundedJsonBody(request: Request, maximumBytes = DEFAULT_MAX_BODY_BYTES): Promise<unknown> {
  const bytes = await readBoundedBody(request, maximumBytes);
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: false }).decode(bytes)) as unknown; }
  catch { throw new RequestBodyError("INVALID_JSON"); }
  assertSafeJson(value);
  return value;
}

export async function readBoundedTextBody(request: Request, maximumBytes = DEFAULT_MAX_BODY_BYTES): Promise<string> {
  return new TextDecoder("utf-8", { fatal: false }).decode(await readBoundedBody(request, maximumBytes));
}

export async function readBoundedBody(request: Request, maximumBytes = DEFAULT_MAX_BODY_BYTES): Promise<Uint8Array> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0 || parsedLength > maximumBytes) throw new RequestBodyError("BODY_TOO_LARGE");
  }
  if (!request.body) throw new RequestBodyError("INVALID_JSON");

  const reader = request.body.getReader();
  let totalBytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyError("BODY_TOO_LARGE");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function assertSafeJson(value: unknown): void {
  let nodes = 0;
  const visit = (entry: unknown, depth: number): void => {
    nodes += 1;
    if (nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) throw new RequestBodyError("UNSAFE_JSON");
    if (Array.isArray(entry)) {
      for (const item of entry) visit(item, depth + 1);
      return;
    }
    if (!entry || typeof entry !== "object") return;
    for (const [key, item] of Object.entries(entry as Record<string, unknown>)) {
      if (forbiddenObjectKeys.has(key)) throw new RequestBodyError("UNSAFE_JSON");
      visit(item, depth + 1);
    }
  };
  visit(value, 0);
}

function forwardedHost(request: Request) { return request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? request.headers.get("host") ?? new URL(request.url).host; }
