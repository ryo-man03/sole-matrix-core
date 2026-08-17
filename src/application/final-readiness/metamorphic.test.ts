import { describe, expect, it } from "vitest";

import type { MarketListing, MarketProviderId } from "../../../app/_lib/market/contracts";
import { summarizeMarketPrices } from "../../../app/_lib/market/price-summary";
import type { ReleaseEvidence } from "../../domain/release/release";
import { countIndependentSources, resolveReleaseEvidence } from "../../domain/release/releaseEvidence";
import {
  FEEDBACK_EVALUATION_DATASET_VERSION,
  evaluateFeedbackDataset,
  type FeedbackEvaluationRecord,
} from "../offline-evaluation/feedbackEvaluation";

const threeItemPermutations = [
  [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
] as const;
const permutationCases = threeItemPermutations.map((order) => [order] as const);
const insertionPositions = [0, 1, 2, 3] as const;

describe("final cross-domain metamorphic invariants", () => {
  const providerListings = [
    listing("rakuten", "r", "new", "JPY", 30_000),
    listing("yahoo", "y", "new", "JPY", 29_000),
    listing("ebay", "e", "used", "USD", 180),
  ];
  const providerBaseline = summarizeMarketPrices(providerListings);

  it.each(permutationCases)("keeps provider semantics under order %j", (order) => {
    expect(summarizeMarketPrices(order.map((index) => providerListings[index]!))).toEqual(providerBaseline);
  });

  const releaseEvidence = [
    evidence("official", "nike:launch", "2026-09-10", "brand_official"),
    evidence("retailer", "retailer:calendar", "2026-09-17", "authorized_retailer"),
    evidence("editorial", "editorial:report", "2026-09-17", "editorial_authorized"),
  ];
  const releaseBaseline = resolveReleaseEvidence(releaseEvidence);

  it.each(permutationCases)("keeps release resolution under evidence order %j", (order) => {
    expect(resolveReleaseEvidence(order.map((index) => releaseEvidence[index]!))).toEqual(releaseBaseline);
  });

  it.each(insertionPositions)("does not increase source count for a duplicate source at position %s", (position) => {
    const values = [...releaseEvidence];
    values.splice(position, 0, evidence(`duplicate-${position}`, "nike:launch", "2026-09-10", "brand_official"));
    expect(countIndependentSources(values)).toBe(countIndependentSources(releaseEvidence));
    expect(resolveReleaseEvidence(values).independentSourceCount).toBe(releaseBaseline.independentSourceCount);
  });

  const exactListings = [
    listing("rakuten", "a", "new", "JPY", 20_000),
    listing("rakuten", "b", "new", "JPY", 30_000),
    listing("rakuten", "c", "new", "JPY", 40_000),
  ];
  const exactBaseline = summarizeMarketPrices(exactListings);

  it.each(insertionPositions)("keeps exact summary when related evidence is inserted at %s", (position) => {
    const values = [...exactListings];
    values.splice(position, 0, listing("rakuten", `related-${position}`, "new", "JPY", 1, "related"));
    expect(summarizeMarketPrices(values)).toEqual(exactBaseline);
  });

  it.each(insertionPositions)("keeps the new summary separate when used evidence is inserted at %s", (position) => {
    const values = [...exactListings];
    values.splice(position, 0, listing("rakuten", `used-${position}`, "used", "JPY", 5_000));
    const summaries = summarizeMarketPrices(values);
    expect(summaries.filter((summary) => summary.condition === "new")).toEqual(exactBaseline);
    expect(summaries.find((summary) => summary.condition === "used")).toMatchObject({ listingCount: 1, currency: "JPY" });
  });

  it.each(insertionPositions)("never mixes currencies when USD evidence is inserted at %s", (position) => {
    const values = [...exactListings];
    values.splice(position, 0, listing("rakuten", `usd-${position}`, "new", "USD", 200));
    const summaries = summarizeMarketPrices(values);
    expect(summaries.filter((summary) => summary.currency === "JPY")).toEqual(exactBaseline);
    expect(summaries.find((summary) => summary.currency === "USD")).toMatchObject({ listingCount: 1, minimum: 200, maximum: 200 });
  });

  const feedbackRecords = [
    feedback("event-a", "liked"),
    feedback("event-b", "purchased"),
    feedback("event-c", "satisfied"),
  ];
  const feedbackBaseline = evaluateFeedbackDataset(dataset(feedbackRecords));

  it.each(permutationCases)("keeps feedback aggregate under event order %j", (order) => {
    expect(evaluateFeedbackDataset(dataset(order.map((index) => feedbackRecords[index]!)))).toEqual(feedbackBaseline);
  });

  it.each(insertionPositions)("does not increase feedback counts for replay at %s", (position) => {
    const values = [...feedbackRecords];
    values.splice(position, 0, feedbackRecords[0]!);
    expect(evaluateFeedbackDataset(dataset(values))).toEqual(feedbackBaseline);
  });
});

function listing(
  provider: MarketProviderId,
  externalId: string,
  condition: MarketListing["condition"],
  currency: string,
  price: number,
  matchLevel: MarketListing["matchLevel"] = "exact",
): MarketListing {
  return {
    provider, externalId, title: `New Balance 991v2 ${externalId}`, canonicalBrand: "New Balance",
    canonicalModelName: "991v2", modelFamily: "991", generation: "v2", colorwayName: "Grey", styleCode: "U991GL2",
    audience: "unisex", price, currency, shippingPrice: null, shippingKnown: false, totalDisplayedPrice: null,
    priceType: condition === "new" ? "current_retail_price" : "current_listing_price", listingFormat: "fixed_price", condition,
    providerConditionLabel: condition, sizeSystem: "JP", size: "26", inStock: true, imageUrl: null,
    itemUrl: `https://example.com/${provider}/${externalId}`, shopName: "Example", matchLevel, matchReasons: [], mismatchWarnings: [],
    fetchedAt: "2026-08-18T00:00:00.000Z", cacheExpiresAt: null,
  };
}

function evidence(
  evidenceId: string,
  sourceIndependenceKey: string,
  observedReleaseDate: string,
  sourceKind: ReleaseEvidence["sourceKind"],
): ReleaseEvidence {
  return {
    evidenceId, providerId: "fixture", sourceKind, sourceUrl: `https://example.com/${evidenceId}`, sourceDomain: "example.com",
    canonicalOriginUrl: `https://example.com/${evidenceId}`, sourceIndependenceKey, externalId: evidenceId,
    contentFingerprint: evidenceId.padEnd(64, "0").slice(0, 64), supportsModel: true, supportsStyleCode: true,
    supportsColorway: true, supportsReleaseDate: true, supportsRegion: true, observedReleaseDate,
    observedState: "official_announced", fetchedAt: "2026-08-18T00:00:00.000Z", verificationState: "verified",
    reviewState: "accepted", supersedesEvidenceId: null, sourceTitle: evidenceId, sourceQuality: 90,
  };
}

function feedback(eventId: string, sentiment: FeedbackEvaluationRecord["feedback"]): FeedbackEvaluationRecord {
  return {
    eventId, recommendationSnapshotId: `snapshot-${eventId}`, canonicalExpected: "newbalance:991v2", canonicalActual: "new balance 991v2",
    recommendedTopK: ["newbalance:991v2", "nike:aj1", "asics:gelkayano14"], previousTopK: ["nike:aj1", "newbalance:991v2"],
    feedback: sentiment, ryoExpectedRoles: ["evidence", "caution"], ryoActualRoles: ["caution", "evidence"],
    fitWarningExpected: true, fitWarningActual: true,
  };
}

function dataset(records: readonly FeedbackEvaluationRecord[]) {
  return { version: FEEDBACK_EVALUATION_DATASET_VERSION, generatedAt: "2026-08-18T00:00:00.000Z", records };
}
