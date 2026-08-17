import { describe, expect, it } from "vitest";

import type { MarketCondition, MarketListing, MarketProviderId } from "./contracts";
import { summarizeMarketPrices } from "./price-summary";

const summaryCases = Array.from({ length: 50 }, (_, index) => ({
  provider: (["rakuten", "yahoo", "ebay"] as const)[index % 3]!,
  condition: (["new", "used", "unknown"] as const)[index % 3]!,
  currency: index % 3 === 2 ? "USD" : "JPY",
  prices: [index + 10, index + 30, index + 20],
}));

describe("Market Intelligence V2 price semantics", () => {
  it.each(summaryCases)("separates $provider $condition $currency summary", ({ provider, condition, currency, prices }) => {
    const primary = prices.map((price, index) => listing(provider, condition, currency, price, index));
    const unrelated = listing(provider, condition, currency, 1, 90, "related");
    const otherCondition = listing(provider, condition === "new" ? "used" : "new", currency, 2, 91);
    const otherCurrency = listing(provider, condition, currency === "JPY" ? "USD" : "JPY", 3, 92);
    const summaries = summarizeMarketPrices([...primary, unrelated, otherCondition, otherCurrency]);
    const summary = summaries.find((value) => value.provider === provider && value.condition === condition && value.currency === currency);
    expect(summary).toMatchObject({ listingCount: 3, minimum: prices[0], median: prices[2], maximum: prices[1] });
    expect(summary?.minimum).not.toBe(1);
    expect(summaries.some((value) => value.condition !== condition)).toBe(true);
    expect(summaries.some((value) => value.currency !== currency)).toBe(true);
  });
});

function listing(
  provider: MarketProviderId,
  condition: MarketCondition,
  currency: string,
  price: number,
  index: number,
  matchLevel: MarketListing["matchLevel"] = "probable",
): MarketListing {
  return {
    provider,
    externalId: `${provider}-${index}`,
    title: `Example ${index}`,
    canonicalBrand: "Example",
    canonicalModelName: "Example Model",
    modelFamily: "Example",
    generation: null,
    colorwayName: null,
    styleCode: null,
    audience: "unknown",
    price,
    currency,
    shippingPrice: null,
    shippingKnown: false,
    totalDisplayedPrice: null,
    priceType: provider === "ebay" ? "current_listing_price" : "current_retail_price",
    listingFormat: "fixed_price",
    condition,
    providerConditionLabel: condition,
    sizeSystem: "UNKNOWN",
    size: null,
    inStock: true,
    imageUrl: null,
    itemUrl: `https://market.example/${provider}/${index}`,
    shopName: "Example Shop",
    matchLevel,
    matchReasons: ["test"],
    mismatchWarnings: [],
    fetchedAt: `2026-08-12T00:${String(index % 60).padStart(2, "0")}:00.000Z`,
    cacheExpiresAt: null,
  };
}
