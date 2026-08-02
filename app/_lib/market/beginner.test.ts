import { describe, expect, it } from "vitest";

import { parseMarketSearchResponse } from "./beginner";
import type { MarketListing, MarketProviderId, MarketProviderResult } from "./contracts";
import { emptyProviderAudit } from "./contracts";

describe("parseMarketSearchResponse", () => {
  it.each([
    ["matchReasons", undefined],
    ["mismatchWarnings", undefined],
    ["shippingPrice", "free"],
    ["totalDisplayedPrice", Number.NaN],
    ["condition", "mint"],
    ["size", 27],
    ["sizeSystem", "CM"],
    ["listingFormat", "buy_now"],
  ] as const)("isolates a provider whose listing has malformed %s", (field, malformedValue) => {
    const response = validResponse();
    const ebay = response.providers[2]!;
    const malformedListing = { ...ebay.listings[0], [field]: malformedValue };
    const parsed = parseMarketSearchResponse({
      ...response,
      providers: [response.providers[0], response.providers[1], { ...ebay, listings: [malformedListing] }],
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.providers[0]).toMatchObject({ provider: "rakuten", status: "success" });
    expect(parsed?.providers[1]).toMatchObject({ provider: "yahoo", status: "success" });
    expect(parsed?.providers[2]).toMatchObject({ provider: "ebay", status: "schema_error", listings: [] });
  });
});

function validResponse() {
  return {
    query: "Example Shoe",
    searchedAt: "2026-08-02T00:00:00.000Z",
    recommendationRankingChanged: false,
    providers: (["rakuten", "yahoo", "ebay"] as const).map(providerResult),
  };
}

function providerResult(provider: MarketProviderId): MarketProviderResult {
  return {
    provider,
    status: "success",
    listings: [listing(provider)],
    audit: { ...emptyProviderAudit(provider), normalizedCount: 1, exactCount: 1 },
    message: "ok",
  };
}

function listing(provider: MarketProviderId): MarketListing {
  return {
    provider,
    providerItemId: `${provider}-1`,
    title: "Example Shoe White",
    modelName: "Example Shoe",
    colorwayName: "White",
    styleCode: "AB1234-100",
    productFamily: "Example",
    releaseYear: 2026,
    gender: "unisex",
    price: 12_000,
    currency: provider === "ebay" ? "USD" : "JPY",
    shippingPrice: null,
    totalDisplayedPrice: null,
    priceType: provider === "ebay" ? "current_listing_price" : "current_retail_price",
    listingFormat: "fixed_price",
    condition: "new",
    sizeSystem: "US_M",
    size: "9",
    inStock: true,
    imageUrl: "https://images.example/shoe.jpg",
    itemUrl: `https://market.example/${provider}/1`,
    shopName: "Example Shop",
    matchLevel: "exact",
    matchReasons: ["model"],
    mismatchWarnings: [],
    fetchedAt: "2026-08-02T00:00:00.000Z",
    cacheExpiresAt: null,
  };
}
