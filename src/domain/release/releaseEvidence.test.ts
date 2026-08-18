import { describe, expect, it } from "vitest";
import type { ReleaseEvidence, ReleaseObservation } from "./release";
import { compareReleaseIdentity, countIndependentSources, dedupeReleaseObservations, resolveReleaseEvidence } from "./releaseEvidence";

describe("release evidence resolution", () => {
  it.each([
    "official_announced",
    "retailer_confirmed",
    "editorial_reported",
    "rumor",
    "released",
    "restocked",
    "cancelled",
    "date_changed",
    "unknown",
  ] as const)("preserves supported state %s", (observedState) => {
    expect(resolveReleaseEvidence([evidence({ observedState })]).informationState).toBe(observedState);
  });

  it("retains every independent date and marks a conflict without choosing the oldest", () => {
    const result = resolveReleaseEvidence([
      evidence({ evidenceId: "a", sourceIndependenceKey: "nike:launch", observedReleaseDate: "2026-09-10" }),
      evidence({ evidenceId: "b", sourceIndependenceKey: "retailer:calendar", observedReleaseDate: "2026-09-17", sourceKind: "authorized_retailer" }),
    ]);
    expect(result).toMatchObject({ informationState: "conflicting_evidence", releaseDate: null, hasConflict: true, independentSourceCount: 2 });
    expect(result.observedReleaseDates).toEqual(["2026-09-10", "2026-09-17"]);
  });

  it("does not count a reprint of the same primary source independently", () => {
    const items = [
      evidence({ evidenceId: "a", sourceIndependenceKey: "nike:launch", observedReleaseDate: "2026-09-10", fetchedAt: "2026-08-17T00:00:00Z" }),
      evidence({ evidenceId: "b", sourceIndependenceKey: "nike:launch", observedReleaseDate: "2026-09-17", fetchedAt: "2026-08-18T00:00:00Z" }),
    ];
    expect(countIndependentSources(items)).toBe(1);
    expect(resolveReleaseEvidence(items)).toMatchObject({ hasConflict: false, releaseDate: "2026-09-17", independentSourceCount: 1 });
  });

  it("is invariant to evidence ordering", () => {
    const items = [evidence({ evidenceId: "a", sourceIndependenceKey: "a", observedReleaseDate: "2026-09-10" }), evidence({ evidenceId: "b", sourceIndependenceKey: "b", observedReleaseDate: "2026-09-17" })];
    expect(resolveReleaseEvidence(items)).toEqual(resolveReleaseEvidence([...items].reverse()));
  });

  it("does not promote pending or unverified evidence", () => {
    expect(resolveReleaseEvidence([evidence({ reviewState: "pending" }), evidence({ evidenceId: "b", verificationState: "unverified" })])).toMatchObject({ informationState: "unknown", releaseDate: null, independentSourceCount: 0 });
  });
});

describe("release canonical dedupe", () => {
  it("matches only a full normalized style code", () => {
    expect(compareReleaseIdentity(observation({ styleCode: "AB-1234-001" }), observation({ externalId: "b", styleCode: "AB1234001" }))).toBe("exact_style_code");
    expect(compareReleaseIdentity(observation({ styleCode: "AB-1234" }), observation({ externalId: "b", styleCode: "AB-1234-001" }))).toBe("different");
  });

  it.each([
    ["991", "v1", "991", "v2"],
    ["990", "v3", "990", "v4"],
    ["samba", "og", "samba", "adv"],
    ["authentic", "original", "authentic", "44-dx"],
    ["air-jordan-1-low", "original", "air-jordan-1-low", "golf"],
  ])("keeps %s/%s separate from %s/%s", (familyA, generationA, familyB, generationB) => {
    expect(compareReleaseIdentity(observation({ modelFamily: familyA, generation: generationA }), observation({ externalId: "b", modelFamily: familyB, generation: generationB }))).toBe("different");
  });

  it("keeps adult audience segments separate", () => {
    expect(compareReleaseIdentity(observation({ audience: "men" }), observation({ externalId: "b", audience: "women" }))).toBe("different");
    expect(compareReleaseIdentity(observation({ audience: "men" }), observation({ externalId: "b", audience: "kids" }))).toBe("different");
  });

  it("requires verified colorway and matching region when style code is absent", () => {
    expect(compareReleaseIdentity(observation(), observation({ externalId: "b" }))).toBe("exact_verified_identity");
    expect(compareReleaseIdentity(observation(), observation({ externalId: "b", region: "US" }))).toBe("review_required");
    expect(compareReleaseIdentity(observation(), observation({ externalId: "b", verificationState: "model_only" }))).toBe("review_required");
  });

  it("never merges on GTIN alone", () => {
    expect(compareReleaseIdentity(observation({ gtin: "000123", modelFamily: "991" }), observation({ externalId: "b", gtin: "000123", modelFamily: "990" }))).toBe("different");
  });

  it("removes exact content duplicates without losing independent evidence", () => {
    const a = observation();
    const duplicate = observation({ externalId: "duplicate", evidence: { ...a.evidence } });
    const independent = observation({ externalId: "independent", sourceIndependenceKey: "retailer:calendar", contentFingerprint: "f".repeat(64) });
    expect(dedupeReleaseObservations([a, duplicate, independent])).toEqual([a, independent]);
  });
});

function evidence(overrides: Partial<ReleaseEvidence> = {}): ReleaseEvidence {
  return {
    evidenceId: "evidence",
    providerId: "test",
    sourceKind: "brand_official",
    sourceUrl: "https://example.com/release",
    sourceDomain: "example.com",
    canonicalOriginUrl: "https://example.com/release",
    sourceIndependenceKey: "example:release",
    externalId: "external",
    contentFingerprint: "a".repeat(64),
    supportsModel: true,
    supportsStyleCode: false,
    supportsColorway: true,
    supportsReleaseDate: true,
    supportsRegion: true,
    observedReleaseDate: "2026-09-10",
    observedState: "official_announced",
    fetchedAt: "2026-08-18T00:00:00Z",
    verificationState: "verified",
    reviewState: "accepted",
    supersedesEvidenceId: null,
    sourceTitle: "Release",
    sourceQuality: 90,
    ...overrides,
  };
}

function observation(overrides: Partial<ReleaseObservation> & { sourceIndependenceKey?: string; contentFingerprint?: string; verificationState?: ReleaseEvidence["verificationState"]; evidence?: ReleaseEvidence } = {}): ReleaseObservation {
  const evidenceOverrides: Partial<ReleaseEvidence> = { externalId: overrides.externalId ?? "a" };
  if (overrides.sourceIndependenceKey !== undefined) evidenceOverrides.sourceIndependenceKey = overrides.sourceIndependenceKey;
  if (overrides.contentFingerprint !== undefined) evidenceOverrides.contentFingerprint = overrides.contentFingerprint;
  if (overrides.verificationState !== undefined) evidenceOverrides.verificationState = overrides.verificationState;
  const baseEvidence = overrides.evidence ?? evidence(evidenceOverrides);
  const { sourceIndependenceKey: _sourceIndependenceKey, contentFingerprint: _contentFingerprint, verificationState: _verificationState, ...observationOverrides } = overrides;
  return {
    externalId: "a",
    providerSourceId: null,
    brand: "New Balance",
    modelName: "991",
    modelFamily: "991",
    generation: "v1",
    audience: "unisex",
    colorwayName: "Grey",
    styleCode: null,
    gtin: null,
    region: "JP",
    releaseDate: "2026-09-10",
    releaseDatePrecision: "day",
    informationState: "official_announced",
    evidence: baseEvidence,
    ...observationOverrides,
  };
}
