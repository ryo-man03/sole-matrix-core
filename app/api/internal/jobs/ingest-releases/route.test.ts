import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetInternalJobSecurityState } from "../../../../../src/application/daily-picks/internalJobAuth";
import { POST } from "./route";

describe("release ingestion route boundary", () => {
  beforeEach(() => {
    resetInternalJobSecurityState();
    vi.stubEnv("INTERNAL_JOB_SIGNING_SECRET", "route-test-secret");
  });

  it("denies a normal user request before database access", async () => {
    const response = await POST(new Request("https://app.example/api/internal/jobs/ingest-releases", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ providerId: "manual_seed", records: [], dryRun: true }) }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: { code: "UNAUTHORIZED_JOB" } });
  });

  it("does not accept the retired secret header", async () => {
    const response = await POST(new Request("https://app.example/api/internal/jobs/ingest-releases", { method: "POST", headers: { "content-type": "application/json", "x-sole-matrix-job-secret": "route-test-secret" }, body: "{}" }));
    expect(response.status).toBe(401);
  });

  it("rejects a declared oversized body before reading it", async () => {
    const response = await POST(new Request("https://app.example/api/internal/jobs/ingest-releases", { method: "POST", headers: { "content-type": "application/json", "content-length": "65537" }, body: "{}" }));
    expect(response.status).toBe(413);
  });
});
