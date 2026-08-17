import { describe, expect, it } from "vitest";

import type { MarketListing } from "./contracts";
import { dedupeListings } from "./listing-match";
import { summarizeMarketPrices } from "./price-summary";

const permutations = Array.from({ length: 30 }, (_, index) => index);
const relatedInsertions = Array.from({ length: 20 }, (_, index) => index);

describe("Market Intelligence metamorphic invariants (50 cases)", () => {
  it.each(permutations)("keeps price statistics under listing permutation %s", (seed) => {
    const source = [listing("a", 10_000), listing("b", 20_000), listing("c", 30_000), listing("d", 40_000)];
    const rotated = source.slice(seed % source.length).concat(source.slice(0, seed % source.length));
    expect(summarizeMarketPrices(rotated)).toEqual(summarizeMarketPrices(source));
  });

  it.each(relatedInsertions)("keeps summaries unchanged when related evidence is inserted %s", (index) => {
    const primary = [listing("a", 20_000), listing("b", 30_000)];
    const mixed = [...primary];
    mixed.splice(index % 3, 0, listing(`related-${index}`, 1, "related"));
    expect(summarizeMarketPrices(mixed)).toEqual(summarizeMarketPrices(primary));
  });

  it("deduplicates by provider and external identity without mutating input", () => {
    const original = [listing("a", 20_000), listing("a", 99_999), listing("b", 30_000)];
    const before = JSON.stringify(original);
    expect(dedupeListings(original)).toMatchObject({ duplicateCount: 1, listings: [{ externalId: "a" }, { externalId: "b" }] });
    expect(JSON.stringify(original)).toBe(before);
  });
});

function listing(externalId: string, price: number, matchLevel: MarketListing["matchLevel"] = "exact"): MarketListing {
  return {
    provider: "rakuten", externalId, title: `New Balance 991v2 ${externalId}`, canonicalBrand: "New Balance",
    canonicalModelName: "991v2", modelFamily: "991", generation: "v2", colorwayName: "Grey", styleCode: "U991GL2",
    audience: "unisex", price, currency: "JPY", shippingPrice: null, shippingKnown: false, totalDisplayedPrice: null,
    priceType: "current_retail_price", listingFormat: "fixed_price", condition: "new", providerConditionLabel: "new",
    sizeSystem: "JP", size: "26", inStock: true, imageUrl: null, itemUrl: `https://example.com/${externalId}`,
    shopName: "Example", matchLevel, matchReasons: [], mismatchWarnings: [], fetchedAt: "2026-08-12T00:00:00.000Z",
    cacheExpiresAt: null,
  };
}
