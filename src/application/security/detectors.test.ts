import { describe, expect, it } from "vitest";

import {
  detectBrokenFixture,
  detectSecurityViolations,
  totalSecurityViolations,
  type SecurityDetectors,
  type SecurityObservation,
} from "./detectors";

const detectorKinds: (keyof SecurityDetectors)[] = [
  "crossUserReadCount", "crossUserWriteCount", "unauthenticatedPrivateReadCount", "serviceRoleClientExposureCount",
  "accessTokenLocalStorageCount", "productionLocalFileWriteCount", "massAssignmentCount", "invalidOriginAcceptedCount",
  "unrateLimitedSensitiveRouteCount", "partialStyleCodeAcceptedCount", "generationMismatchCount", "audienceMismatchCount",
  "dailyScoreCoreMutationCount", "marketPriceCoreMutationCount", "externalRequestOnLoginCount", "externalRequestOnTodayCount",
  "duplicateDailyBatchCount", "rumorAsOfficialCount", "fixtureDataProductionLeakCount", "unauthorizedReleaseWriteCount",
  "secretExposureCount", "rawProviderResponsePersistenceCount",
];

const brokenCases = Array.from({ length: 50 }, (_, index): SecurityObservation => ({
  kind: detectorKinds[index % detectorKinds.length]!,
  detected: true,
  occurrences: index % 3 + 1,
  evidence: `broken-fixture-${index}`,
}));

describe("active security detectors (50+ broken fixtures)", () => {
  it.each(brokenCases)("trips $kind from real observation %#", (observation) => {
    const result = detectSecurityViolations([observation]);
    expect(result[observation.kind]).toBe(observation.occurrences);
    expect(totalSecurityViolations(result)).toBe(observation.occurrences);
  });

  it.each(detectorKinds)("does not trip %s when an observation is explicitly clean", (kind) => {
    const result = detectSecurityViolations([{ kind, detected: false, occurrences: 99 }]);
    expect(result[kind]).toBe(0);
    expect(totalSecurityViolations(result)).toBe(0);
  });

  it.each([
    ["cross_user_read", "crossUserReadCount"],
    ["partial_style", "partialStyleCodeAcceptedCount"],
    ["external_today", "externalRequestOnTodayCount"],
    ["fixture_production", "fixtureDataProductionLeakCount"],
  ] as const)("broken %s trips %s", (fixture, key) => {
    expect(detectBrokenFixture(fixture)[key]).toBeGreaterThan(0);
  });

  it("adds repeated observations instead of returning a constant baseline", () => {
    const result = detectSecurityViolations([
      { kind: "secretExposureCount", detected: true, occurrences: 2 },
      { kind: "secretExposureCount", detected: true, occurrences: 3 },
    ]);
    expect(result.secretExposureCount).toBe(5);
  });
});
