import { describe, expect, it } from "vitest";

import type { MarketProviderResult, MarketSearchContext } from "./contracts";
import { emptyProviderAudit } from "./contracts";
import { searchCurrentMarketPrices, type MarketProviderSearch } from "./search";

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
});

function emptyResult(provider: "rakuten" | "yahoo" | "ebay"): MarketProviderResult {
  return { provider, status: "empty", listings: [], audit: emptyProviderAudit(provider), message: "empty" };
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
