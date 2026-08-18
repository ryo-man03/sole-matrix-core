import { describe, expect, it } from "vitest";

import { evaluateDataQuality, type ProviderObservation } from "./quality";

describe("data quality observation → metric → threshold → state", () => {
  it("keeps a healthy fixture healthy and sends no notification", () => {
    const result = evaluateDataQuality(input(Array.from({ length: 20 }, () => observation())));
    expect(result.state).toBe("healthy");
    expect(result.notificationsSent).toBe(false);
  });

  it.each([
    ["401 fixture", { status: "unauthorized", safeErrorCode: "HTTP_401" }, "401_rate"],
    ["429 fixture", { status: "rate_limited", safeErrorCode: "HTTP_429" }, "429_rate"],
    ["schema failure", { status: "schema_error", safeErrorCode: "SCHEMA_INVALID" }, "schema_error_rate"],
  ] as const)("degrades for %s", (_label, patch, metricId) => {
    const rows = Array.from({ length: 20 }, (_, index) => observation(index < (metricId === "429_rate" ? 2 : 1) ? patch : {}));
    const result = evaluateDataQuality(input(rows));
    expect(result.metrics.find((metric) => metric.id.endsWith(metricId))?.state).toBe("degraded");
  });

  it("blocks a release conflict spike", () => {
    const result = evaluateDataQuality(input([observation()], { releaseCount: 10, conflictCount: 3 }));
    expect(result.metrics.find((metric) => metric.id === "release.conflict_rate")?.state).toBe("blocked");
  });

  it("detects duplicate and stale release evidence", () => {
    const result = evaluateDataQuality(input([observation()], { releaseCount: 100, duplicateCandidateCount: 3, evidenceCount: 10, staleEvidenceCount: 3 }));
    expect(result.metrics.find((metric) => metric.id === "release.duplicate_candidate_rate")?.state).toBe("degraded");
    expect(result.metrics.find((metric) => metric.id === "release.stale_evidence_rate")?.state).toBe("degraded");
  });

  it("returns unknown when there are zero records", () => {
    const result = evaluateDataQuality(input([], { releaseCount: 0, evidenceCount: 0 }, { ownedCount: 0, sizeRecordCount: 0, fitFeedbackCount: 0 }));
    expect(result.metrics.find((metric) => metric.id === "provider.request_count")?.state).toBe("unknown");
    expect(result.metrics.find((metric) => metric.id === "release.conflict_rate")?.state).toBe("unknown");
  });

  it("keeps an exact threshold boundary healthy", () => {
    const rows = Array.from({ length: 20 }, (_, index) => observation(index === 0 ? { status: "rate_limited", safeErrorCode: "HTTP_429" } : {}));
    expect(evaluateDataQuality(input(rows)).metrics.find((metric) => metric.id.endsWith("429_rate"))?.state).toBe("healthy");
  });

  it("marks p95 unknown when the sample is insufficient", () => {
    expect(evaluateDataQuality(input([observation()])).metrics.find((metric) => metric.id.endsWith("p95_latency"))?.state).toBe("unknown");
  });

  it("blocks critical user-link observations above zero", () => {
    const result = evaluateDataQuality(input([observation()], {}, { orphanFeedbackCount: 1 }));
    expect(result.metrics.find((metric) => metric.id === "user.orphan_feedback_count")?.state).toBe("blocked");
  });
});

function observation(patch: Partial<ProviderObservation> = {}): ProviderObservation {
  return { providerId: "rakuten", status: "success", durationMs: 200, cacheStatus: "hit", normalizedCount: 10, exactCount: 6, probableCount: 3, rejectedCount: 1, safeErrorCode: null, ...patch };
}

function input(
  providerObservations: ProviderObservation[],
  releasePatch: Partial<Parameters<typeof evaluateDataQuality>[0]["release"]> = {},
  userPatch: Partial<Parameters<typeof evaluateDataQuality>[0]["user"]> = {},
): Parameters<typeof evaluateDataQuality>[0] {
  return {
    generatedAt: "2026-08-18T00:00:00.000Z",
    window: "24h",
    providerObservations,
    release: { releaseCount: 10, styleCodeMissingCount: 0, releaseDateMissingCount: 0, regionMissingCount: 0, colorwayMissingCount: 0, conflictCount: 0, duplicateCandidateCount: 0, evidenceCount: 10, staleEvidenceCount: 0, officialEvidenceCount: 10, manualReviewPendingCount: 0, ...releasePatch },
    user: { ownedCount: 10, ownedIdentityMatchCount: 10, sizeRecordCount: 10, unknownSizeSystemCount: 0, fitFeedbackCount: 10, completedFitFeedbackCount: 10, orphanFeedbackCount: 0, preferenceCount: 10, invalidPreferenceCount: 0, snapshotLinkedCount: 10, snapshotLinkErrorCount: 0, ...userPatch },
  };
}
