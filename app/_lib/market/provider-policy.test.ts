import { describe, expect, it } from "vitest";

import {
  MarketProviderOperationDeniedError,
  assertMarketProviderOperationAllowed,
  countMarketProviderPolicyBreaches,
  countRawProviderResponsePersistence,
  countRecommendationRankingMutations,
  countSensitiveMarketValueExposures,
} from "./provider-policy";

describe("market provider operation policy", () => {
  it("allows eBay only for temporary UI display", () => {
    expect(() => assertMarketProviderOperationAllowed("ebay", "temporary_display")).not.toThrow();
    for (const operation of ["persist", "forecast", "recommendation_score"] as const) {
      expect(() => assertMarketProviderOperationAllowed("ebay", operation))
        .toThrow(MarketProviderOperationDeniedError);
    }
  });

  it.each(["rakuten", "yahoo"] as const)(
    "keeps %s listings request-scoped and non-persistent",
    (provider) => {
      expect(() => assertMarketProviderOperationAllowed(provider, "temporary_display"))
        .not.toThrow();
      expect(() => assertMarketProviderOperationAllowed(provider, "persist"))
        .toThrow(MarketProviderOperationDeniedError);
    },
  );

  it("makes every safety metric react to an intentionally broken fixture", () => {
    expect(countRecommendationRankingMutations(["one", "two"], ["two", "one"])).toBeGreaterThan(0);
    expect(countSensitiveMarketValueExposures(
      { authorization: "Bearer intentionally-exposed-token" },
      ["intentionally-exposed-token"],
    )).toBeGreaterThan(0);
    expect(countRawProviderResponsePersistence({ rawProviderResponse: { item: "unsafe" } })).toBeGreaterThan(0);
    expect(countMarketProviderPolicyBreaches([
      { provider: "ebay", operation: "persist", allowed: true },
    ])).toBeGreaterThan(0);
    expect(countMarketProviderPolicyBreaches([
      { provider: "ebay", operation: "forecast", allowed: true },
    ])).toBeGreaterThan(0);
  });
});
