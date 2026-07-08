import { describe, expect, it } from "vitest";

import {
  buildRakutenMarketQuery,
  parseRakutenMarketFindPayload,
} from "./ui";

describe("Rakuten market_find UI helpers", () => {
  it("prefers a specific normalized search keyword", () => {
    expect(buildRakutenMarketQuery({
      name: "Converse Pro Leather",
      searchKeywords: ["おすすめスニーカー", "Converse Pro Leather Black"],
    })).toBe("Converse Pro Leather Black");
  });

  it("falls back to the recommended model title for vague keywords", () => {
    expect(buildRakutenMarketQuery({
      name: "Nike Terminator High Black White",
      searchKeywords: ["クラシック", "黒白"],
    })).toBe("Nike Terminator High Black White");
  });

  it("accepts valid products, limits display count, and rejects unsafe links", () => {
    const product = {
      source: "rakuten",
      slot: "market_find",
      title: "Converse Pro Leather Black",
      normalizedModelName: "Converse Pro Leather Black",
      brand: "Converse",
      url: "https://item.rakuten.co.jp/example/pro-leather/",
      price: 12_800,
      shopName: "Example Shop",
      fetchedAt: "2026-07-09T00:00:00.000Z",
      query: "Converse Pro Leather Black",
      confidence: 0.9,
      disclaimer: "check listing",
    };

    expect(parseRakutenMarketFindPayload({ products: Array.from({ length: 8 }, () => product) })?.products)
      .toHaveLength(6);
    expect(parseRakutenMarketFindPayload({
      products: [{ ...product, url: "javascript:alert(1)" }],
    })?.products).toEqual([]);
    expect(parseRakutenMarketFindPayload({
      products: [{ ...product, reviewAverage: "excellent" }],
    })?.products).toEqual([]);
    expect(parseRakutenMarketFindPayload({ error: "upstream detail" })).toBeNull();
  });
});
