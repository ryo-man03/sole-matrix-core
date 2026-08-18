import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const replayKeys = new Map<string, number>();
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export type InternalJobAuthorization =
  | { ok: true; idempotencyKey: string }
  | { ok: false; status: 400 | 401 | 403 | 409 | 413 | 415 | 429; code: string };

export function authorizeInternalJob(
  request: Request,
  rawBody: string,
  jobName: string,
  options: { now?: number; maxAgeSeconds?: number; maxBodyBytes?: number; rateLimit?: number } = {},
): InternalJobAuthorization {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return denied(415, "JSON_REQUIRED");
  if (new URL(request.url).search) return denied(400, "QUERY_NOT_ALLOWED");
  if (request.headers.has("origin")) return denied(403, "BROWSER_ORIGIN_DENIED");
  const maxBodyBytes = options.maxBodyBytes ?? 65_536;
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null && (!/^\d+$/u.test(declaredLength) || Number(declaredLength) > maxBodyBytes)) return denied(413, "BODY_TOO_LARGE");
  if (Buffer.byteLength(rawBody, "utf8") > maxBodyBytes) return denied(413, "BODY_TOO_LARGE");

  const secret = process.env.INTERNAL_JOB_SIGNING_SECRET ?? process.env.INTERNAL_DAILY_PICK_JOB_SECRET;
  const timestamp = request.headers.get("x-sole-matrix-job-timestamp") ?? "";
  const idempotencyKey = request.headers.get("x-sole-matrix-job-idempotency-key") ?? "";
  const signature = request.headers.get("x-sole-matrix-job-signature") ?? "";
  if (!secret || !/^\d{10,13}$/u.test(timestamp) || !/^[A-Za-z0-9:_-]{8,128}$/u.test(idempotencyKey) || !/^[a-f0-9]{64}$/u.test(signature)) return denied(401, "UNAUTHORIZED_JOB");

  const now = options.now ?? Date.now();
  const timestampMs = timestamp.length === 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (!Number.isSafeInteger(timestampMs) || Math.abs(now - timestampMs) > (options.maxAgeSeconds ?? 300) * 1000) return denied(401, "STALE_JOB_SIGNATURE");

  const expected = createHmac("sha256", secret).update(`${timestamp}.${jobName}.${idempotencyKey}.${rawBody}`).digest("hex");
  const actualBytes = Buffer.from(signature, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return denied(401, "UNAUTHORIZED_JOB");

  for (const [key, expiresAt] of replayKeys) if (expiresAt <= now) replayKeys.delete(key);
  const replayKey = `${jobName}:${idempotencyKey}:${signature}`;
  if (replayKeys.has(replayKey)) return denied(409, "REPLAYED_JOB");

  const identity = `${jobName}:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "internal"}`;
  const bucket = rateBuckets.get(identity);
  if (!bucket || bucket.resetAt <= now) rateBuckets.set(identity, { count: 1, resetAt: now + 60_000 });
  else if (++bucket.count > (options.rateLimit ?? 10)) return denied(429, "RATE_LIMITED");

  replayKeys.set(replayKey, now + (options.maxAgeSeconds ?? 300) * 1000);
  return { ok: true, idempotencyKey };
}

export function resetInternalJobSecurityState(): void {
  replayKeys.clear();
  rateBuckets.clear();
}

function denied(status: 400 | 401 | 403 | 409 | 413 | 415 | 429, code: string): InternalJobAuthorization {
  return { ok: false, status, code };
}
