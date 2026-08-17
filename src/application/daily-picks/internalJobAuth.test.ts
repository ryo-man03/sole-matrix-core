import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeInternalJob, resetInternalJobSecurityState } from "./internalJobAuth";

const secret = "test-internal-signing-secret";
const now = Date.parse("2026-08-18T00:00:00Z");
const body = JSON.stringify({ providerId: "manual_seed" });

describe("internal job auth", () => {
  beforeEach(() => {
    resetInternalJobSecurityState();
    vi.stubEnv("INTERNAL_JOB_SIGNING_SECRET", secret);
  });

  it("accepts an exact body-bound HMAC", () => {
    expect(authorizeInternalJob(signedRequest(), body, "release-ingestion", { now })).toEqual({ ok: true, idempotencyKey: "run-12345678" });
  });

  it.each([
    ["missing signature", { signature: "" }, body, 401],
    ["wrong signature", { signature: "0".repeat(64) }, body, 401],
    ["stale timestamp", { timestamp: String(now - 301_000) }, body, 401],
    ["tampered body", {}, `${body} `, 401],
    ["browser origin", { origin: "https://app.example" }, body, 403],
  ] as const)("rejects %s", (_label, headers, rawBody, status) => {
    expect(authorizeInternalJob(signedRequest(headers), rawBody, "release-ingestion", { now })).toMatchObject({ ok: false, status });
  });

  it("rejects a replay before work is dispatched", () => {
    const request = signedRequest();
    expect(authorizeInternalJob(request, body, "release-ingestion", { now }).ok).toBe(true);
    expect(authorizeInternalJob(request, body, "release-ingestion", { now })).toMatchObject({ ok: false, code: "REPLAYED_JOB" });
  });

  it("rejects an oversized body", () => {
    const largeBody = "x".repeat(65_537);
    expect(authorizeInternalJob(signedRequest({}, largeBody), largeBody, "release-ingestion", { now })).toMatchObject({ ok: false, status: 413 });
  });
});

function signedRequest(
  overrides: { timestamp?: string; signature?: string; origin?: string } = {},
  signedBody = body,
): Request {
  const timestamp = overrides.timestamp ?? String(now);
  const idempotencyKey = "run-12345678";
  const signature = overrides.signature ?? createHmac("sha256", secret).update(`${timestamp}.release-ingestion.${idempotencyKey}.${signedBody}`).digest("hex");
  return new Request("https://app.example/api/internal/jobs/ingest-releases", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sole-matrix-job-timestamp": timestamp,
      "x-sole-matrix-job-idempotency-key": idempotencyKey,
      "x-sole-matrix-job-signature": signature,
      ...(overrides.origin ? { origin: overrides.origin } : {}),
    },
    body: signedBody,
  });
}
