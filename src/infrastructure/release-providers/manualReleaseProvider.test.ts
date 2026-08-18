import { describe, expect, it } from "vitest";
import { createManualReleaseProvider, normalizeManualReleaseRecord, type ManualReleaseRecord } from "./manualReleaseProvider";

describe("manual release provider", () => {
  it("normalizes an approved manual reference with deterministic content fingerprinting", () => {
    const first = normalizeManualReleaseRecord(record());
    const second = normalizeManualReleaseRecord(record({ fetchedAt: "2026-08-19T00:00:00Z" }));
    expect(first).toMatchObject({ styleCode: "AB1234001", region: "JP", informationState: "official_announced" });
    expect(first.evidence).toMatchObject({ sourceKind: "manual_official_reference", sourceDomain: "www.nike.com", reviewState: "pending" });
    expect(first.evidence.contentFingerprint).toBe(second.evidence.contentFingerprint);
  });

  it.each(["brand_official", "authorized_retailer", "licensed_feed", "editorial_authorized"])("does not let manual input impersonate %s", (sourceKind) => {
    expect(() => normalizeManualReleaseRecord(record({ sourceKind: sourceKind as never }))).toThrow("RELEASE_SOURCE_KIND_DENIED");
  });

  it.each(["https://stockx.com/item", "https://www.ebay.com/item/1", "https://item.rakuten.co.jp/shop/item"])("rejects marketplace evidence %s", (sourceUrl) => {
    expect(() => normalizeManualReleaseRecord(record({ sourceUrl, canonicalOriginUrl: sourceUrl }))).toThrow("MARKETPLACE_RELEASE_SOURCE_DENIED");
  });

  it("uses a bounded deterministic cursor without external requests", async () => {
    const provider = createManualReleaseProvider([record({ externalId: "a" }), record({ externalId: "b" }), record({ externalId: "c" })]);
    const first = await provider.collect({ cursor: null, limit: 2 });
    const second = await provider.collect({ cursor: first.nextCursor, limit: 2 });
    expect(first).toMatchObject({ nextCursor: "2" });
    expect(second.records).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it("collapses reprints that declare the same canonical primary origin", () => {
    const official = normalizeManualReleaseRecord(record());
    const reprint = normalizeManualReleaseRecord(record({ sourceUrl: "https://news.example/reprint", canonicalOriginUrl: "https://www.nike.com/jp/launch/t/991" }));
    expect(reprint.evidence.sourceDomain).toBe("news.example");
    expect(reprint.evidence.sourceIndependenceKey).toBe(official.evidence.sourceIndependenceKey);
  });

  it.each([
    [{ releaseDate: "09/10/2026" }, "RELEASE_DATE_INVALID"],
    [{ sourceQuality: 101 }, "SOURCE_QUALITY_INVALID"],
    [{ sourceUrl: "http://example.com/release" }, "RELEASE_SOURCE_URL_INVALID"],
    [{ informationState: "conflicting_evidence" }, "RELEASE_STATE_INVALID"],
  ] as const)("rejects invalid manual record %j", (overrides, error) => {
    expect(() => normalizeManualReleaseRecord(record(overrides as Partial<ManualReleaseRecord>))).toThrow(error);
  });
});

function record(overrides: Partial<ManualReleaseRecord> = {}): ManualReleaseRecord {
  return {
    externalId: "nike-991-grey-jp",
    providerSourceId: "nike-launch-991",
    brand: "New Balance",
    modelName: "991v2",
    modelFamily: "991",
    generation: "v2",
    audience: "unisex",
    colorwayName: "Grey",
    styleCode: "AB-1234-001",
    gtin: null,
    region: "jp",
    releaseDate: "2026-09-10",
    releaseDatePrecision: "day",
    informationState: "official_announced",
    sourceKind: "manual_official_reference",
    sourceUrl: "https://www.nike.com/jp/launch/t/991",
    canonicalOriginUrl: "https://www.nike.com/jp/launch/t/991",
    sourceTitle: "Official release reference",
    sourceQuality: 90,
    supportsModel: true,
    supportsStyleCode: true,
    supportsColorway: true,
    supportsReleaseDate: true,
    supportsRegion: true,
    verificationState: "verified",
    fetchedAt: "2026-08-18T00:00:00Z",
    ...overrides,
  };
}
