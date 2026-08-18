import { beforeEach, describe, expect, it } from "vitest";

import type { MarketListing, MarketProviderResult, MarketSearchContext } from "./contracts";
import { emptyProviderAudit } from "./contracts";
import { resetMarketReliabilityForTests, type ProviderMetricEvent } from "./reliability";
import { searchCurrentMarketPrices, type MarketProviderSearch } from "./search";

beforeEach(() => resetMarketReliabilityForTests());

describe("searchCurrentMarketPrices", () => {
  it("keeps successful providers when another provider throws or returns the wrong identity", async () => {
    const providers: MarketProviderSearch[] = [
      { provider: "rakuten", search: async () => emptyResult("rakuten") },
      { provider: "yahoo", search: async () => { throw new Error("malformed upstream"); } },
      { provider: "ebay", search: async () => emptyResult("rakuten") },
    ];

    const result = await searchCurrentMarketPrices(context(), providers);

    expect(result.providers[0]).toMatchObject({ provider: "rakuten", status: "empty" });
    expect(result.providers[1]).toMatchObject({ provider: "yahoo", status: "schema_error", listings: [] });
    expect(result.providers[2]).toMatchObject({ provider: "ebay", status: "schema_error", listings: [] });
    expect(result.recommendationRankingChanged).toBe(false);
  });

  it("records a real cache hit on the second equivalent request", async () => {
    let calls = 0;
    const provider: MarketProviderSearch = {
      provider: "rakuten",
      search: async () => { calls += 1; return successResult(); },
    };
    await searchCurrentMarketPrices(context(), [provider]);
    const metrics: Omit<ProviderMetricEvent, "at">[] = [];
    await searchCurrentMarketPrices(context(), [provider], (event) => metrics.push(event));
    expect(calls).toBe(1);
    expect(metrics).toContainEqual(expect.objectContaining({ provider: "rakuten", status: "cache_hit", normalizedCount: 1 }));
  });

  it("records reuse when concurrent equivalent requests share one provider flight", async () => {
    let calls = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const provider: MarketProviderSearch = {
      provider: "rakuten",
      search: async () => { calls += 1; await gate; return successResult(); },
    };
    const firstMetrics: Omit<ProviderMetricEvent, "at">[] = [];
    const secondMetrics: Omit<ProviderMetricEvent, "at">[] = [];
    const first = searchCurrentMarketPrices(context(), [provider], (event) => firstMetrics.push(event));
    const second = searchCurrentMarketPrices(context(), [provider], (event) => secondMetrics.push(event));
    release();
    await Promise.all([first, second]);
    expect(calls).toBe(1);
    expect([...firstMetrics, ...secondMetrics].filter((event) => event.status === "single_flight_hit")).toHaveLength(1);
  });
});

function emptyResult(provider: "rakuten" | "yahoo" | "ebay"): MarketProviderResult {
  return { provider, status: "empty", listings: [], fetchedAt: null, audit: emptyProviderAudit(provider), message: "empty" };
}

function successResult(): MarketProviderResult {
  const listing: MarketListing = {
    provider: "rakuten", externalId: "item", title: "Example Shoe", canonicalBrand: "Example", canonicalModelName: "Shoe",
    modelFamily: "Shoe", generation: null, colorwayName: null, styleCode: null, audience: "unknown", price: 20_000,
    currency: "JPY", shippingPrice: null, shippingKnown: false, totalDisplayedPrice: null, priceType: "current_retail_price",
    listingFormat: "fixed_price", condition: "new", providerConditionLabel: "new", sizeSystem: "UNKNOWN", size: null,
    inStock: true, imageUrl: null, itemUrl: "https://example.com/item", shopName: "Example", matchLevel: "probable",
    matchReasons: ["model"], mismatchWarnings: [], fetchedAt: "2026-08-18T00:00:00.000Z", cacheExpiresAt: null,
  };
  return {
    provider: "rakuten", status: "success", listings: [listing], fetchedAt: listing.fetchedAt,
    audit: { ...emptyProviderAudit("rakuten"), normalizedCount: 1, probableCount: 1, currencyCount: { JPY: 1 } }, message: "ok",
  };
}

function context(): MarketSearchContext {
  return {
    query: "Example Shoe",
    identity: { brand: "Example", modelName: "Shoe", colorwayName: null, styleCode: null, verificationState: "model_only" },
    gender: "unknown",
    sizeSystem: "UNKNOWN",
    size: null,
    condition: "unknown",
  };
}
