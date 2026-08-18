import { describe, expect, it } from "vitest";
import type { ReleaseProvider } from "../../domain/release/release";
import { createManualReleaseProvider, type ManualReleaseRecord } from "../../infrastructure/release-providers/manualReleaseProvider";
import { groupObservations, ingestReleases, type ReleaseEvidenceStore, type ReleaseObservationGroup } from "./ingestReleases";

describe("release ingestion", () => {
  it("normalizes, dedupes, persists, and completes one global run", async () => {
    const store = fakeStore();
    const provider = createManualReleaseProvider([record(), record()]);
    const result = await ingestReleases(provider, store, { idempotencyKey: "release-run-0001", cursor: null, dryRun: false });
    expect(result).toMatchObject({ replayed: false, observedCount: 2, acceptedCount: 1, rejectedCount: 1, conflictCount: 0 });
    expect(store.groups).toHaveLength(1);
    expect(store.completed).toHaveLength(1);
  });

  it("keeps independent conflicting dates and persists no invented date", async () => {
    const store = fakeStore();
    const provider = createManualReleaseProvider([
      record({ externalId: "official", providerSourceId: "official-source", sourceUrl: "https://www.nike.com/jp/release", canonicalOriginUrl: "https://www.nike.com/jp/release", releaseDate: "2026-09-10", reviewState: "accepted" }),
      record({ externalId: "retailer", providerSourceId: "retailer-source", sourceKind: "manual_retailer_reference", sourceUrl: "https://www.atmos-tokyo.com/release", canonicalOriginUrl: "https://www.atmos-tokyo.com/release", releaseDate: "2026-09-17", reviewState: "accepted" }),
    ]);
    const result = await ingestReleases(provider, store, { idempotencyKey: "release-run-0002", cursor: null, dryRun: false });
    expect(result.conflictCount).toBe(1);
    expect(store.groups[0]?.resolution).toMatchObject({ informationState: "conflicting_evidence", releaseDate: null });
    expect(store.groups[0]?.resolution.observedReleaseDates).toEqual(["2026-09-10", "2026-09-17"]);
  });

  it("supports dry-run without catalog or evidence writes", async () => {
    const store = fakeStore();
    const result = await ingestReleases(createManualReleaseProvider([record()]), store, { idempotencyKey: "release-run-0003", cursor: null, dryRun: true });
    expect(result).toMatchObject({ dryRun: true, acceptedCount: 1 });
    expect(store.groups).toHaveLength(0);
    expect(store.completed[0]).toMatchObject({ dryRun: true });
  });

  it("returns an idempotent replay without recollecting", async () => {
    const store = fakeStore({ replayed: true });
    const provider = createManualReleaseProvider([record()]);
    let collected = 0;
    const original = provider.collect;
    provider.collect = async (request) => { collected += 1; return original(request); };
    const result = await ingestReleases(provider, store, { idempotencyKey: "release-run-0004", cursor: "2", dryRun: false });
    expect(result).toMatchObject({ replayed: true, observedCount: 0, cursorAfter: "2" });
    expect(collected).toBe(0);
  });

  it("rejects provider cursor replay and records only a safe error code", async () => {
    const store = fakeStore();
    const provider: ReleaseProvider = {
      ...createManualReleaseProvider([]),
      collect: async () => ({ records: [record()], nextCursor: "0" }),
    };
    await expect(ingestReleases(provider, store, { idempotencyKey: "release-run-0005", cursor: "0", dryRun: false })).rejects.toThrow("PROVIDER_CURSOR_REPLAY");
    expect(store.failed).toEqual(["PROVIDER_CURSOR_REPLAY"]);
  });

  it("isolates invalid records and never exceeds the 100-record contract", async () => {
    const store = fakeStore();
    const records = [record(), { sourceKind: "marketplace" }, ...Array.from({ length: 110 }, (_, index) => record({ externalId: `record-${index}`, styleCode: `STYLE-${String(index).padStart(6, "0")}` }))];
    const result = await ingestReleases(createManualReleaseProvider(records), store, { idempotencyKey: "release-run-0006", cursor: null, dryRun: true, maxRecords: 100 });
    expect(result.observedCount).toBe(100);
    expect(result.rejectedCount).toBeGreaterThanOrEqual(1);
  });

  it("groups the same verified identity regardless of provider order", () => {
    const provider = createManualReleaseProvider([record({ externalId: "a" }), record({ externalId: "b", sourceUrl: "https://www.atmos-tokyo.com/x", canonicalOriginUrl: "https://www.atmos-tokyo.com/x" })]);
    const observations = [provider.normalize(record({ externalId: "a" })), provider.normalize(record({ externalId: "b", sourceUrl: "https://www.atmos-tokyo.com/x", canonicalOriginUrl: "https://www.atmos-tokyo.com/x" }))];
    const forward = groupObservations(observations);
    const reverse = groupObservations([...observations].reverse());
    expect(forward.map((group) => group.resolution)).toEqual(reverse.map((group) => group.resolution));
    expect(forward[0]?.observations.map((item) => item.externalId).sort()).toEqual(reverse[0]?.observations.map((item) => item.externalId).sort());
  });
});

type FakeStore = ReleaseEvidenceStore & { groups: ReleaseObservationGroup[]; completed: unknown[]; failed: string[] };

function fakeStore(options: { replayed?: boolean } = {}): FakeStore {
  const groups: ReleaseObservationGroup[] = [];
  const completed: unknown[] = [];
  const failed: string[] = [];
  return {
    groups,
    completed,
    failed,
    async beginRun() { return { runId: "00000000-0000-4000-8000-000000000001", replayed: options.replayed ?? false }; },
    async persistGroup(_runId, group) { groups.push(group); return group.resolution; },
    async completeRun(_runId, result) { completed.push(result); },
    async failRun(_runId, code) { failed.push(code); },
  };
}

function record(overrides: Partial<ManualReleaseRecord> = {}): ManualReleaseRecord {
  return {
    externalId: "release-a",
    providerSourceId: "source-a",
    brand: "New Balance",
    modelName: "991v2",
    modelFamily: "991",
    generation: "v2",
    audience: "unisex",
    colorwayName: "Grey",
    styleCode: "U991GL2",
    region: "JP",
    releaseDate: "2026-09-10",
    releaseDatePrecision: "day",
    informationState: "official_announced",
    sourceKind: "manual_official_reference",
    sourceUrl: "https://www.newbalance.jp/release/991",
    canonicalOriginUrl: "https://www.newbalance.jp/release/991",
    sourceTitle: "Official reference",
    sourceQuality: 90,
    supportsModel: true,
    supportsStyleCode: true,
    supportsColorway: true,
    supportsReleaseDate: true,
    supportsRegion: true,
    verificationState: "verified",
    reviewState: "pending",
    fetchedAt: "2026-08-18T00:00:00Z",
    ...overrides,
  };
}
