import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MarketListing, MarketProviderId, MarketSearchContext } from "./contracts";
import { fetchMarketJson, MarketProviderRequestError } from "./provider-request";
import { planMarketQueries } from "./query-planner";
import {
  getMarketCache,
  isProviderCircuitOpen,
  providerSingleFlight,
  recordProviderOutcome,
  resetMarketReliabilityForTests,
  setMarketCache,
} from "./reliability";
import { isMarketListing } from "./runtime-validation";

beforeEach(() => resetMarketReliabilityForTests());

const queryCases = Array.from({ length: 30 }, (_, index) => ({
  provider: (["rakuten", "yahoo", "ebay"] as const)[index % 3]!,
  styleCode: index % 2 ? "U991-BB2" : null,
  colorway: index % 3 ? "Grey" : null,
}));

const invalidListingCases = Array.from({ length: 30 }, (_, index) => {
  const mutations: Array<[keyof MarketListing, unknown]> = [
    ["provider", "stockx"], ["title", ""], ["externalId", 1], ["canonicalBrand", 1],
    ["canonicalModelName", 1], ["modelFamily", 1], ["generation", 1], ["colorwayName", 1],
    ["styleCode", 1], ["audience", "adult"], ["price", Number.NaN], ["currency", "JP"],
    ["shippingPrice", -1], ["shippingKnown", "yes"], ["totalDisplayedPrice", -1],
    ["priceType", "sold_price"], ["listingFormat", "offer"], ["condition", "refurbished"],
    ["providerConditionLabel", 1], ["sizeSystem", "CM"], ["size", 9], ["inStock", "yes"],
    ["imageUrl", "javascript:alert(1)"], ["itemUrl", "http://127.0.0.1/private"], ["shopName", 1],
    ["matchLevel", "high"], ["matchReasons", "exact"], ["mismatchWarnings", [1]],
    ["fetchedAt", "yesterday"], ["cacheExpiresAt", "later"],
  ];
  return mutations[index]!;
});

const httpCases = [400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504, 400, 401, 403, 404, 409, 422, 429, 500, 504, 502, 503];

describe("Market Intelligence V2 provider foundation (100+ deterministic cases)", () => {
  it.each(queryCases)("plans bounded $provider query $styleCode $colorway", ({ styleCode, colorway }) => {
    const planned = planMarketQueries(context(styleCode, colorway));
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.length).toBeLessThanOrEqual(5);
    expect(planned.at(-1)).toMatchObject({ mode: "model_only", reason: "model" });
    expect(new Set(planned.map(({ query }) => query.toLocaleLowerCase("en-US"))).size).toBe(planned.length);
    if (styleCode) expect(planned[0]).toMatchObject({ mode: "strict", reason: "style_code", query: "U991BB2" });
  });

  it.each(invalidListingCases)("rejects invalid normalized listing field %s", (field, value) => {
    expect(isMarketListing({ ...listing(), [field]: value }, "rakuten")).toBe(false);
  });

  it.each(httpCases)("maps upstream HTTP %s without leaking the body", async (status) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("sensitive-upstream-body", {
      status,
      ...(status === 429 ? { headers: { "Retry-After": "12" } } : {}),
    }));
    let caught: unknown;
    try {
      await fetchMarketJson("https://provider.example/search", {}, fetcher);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(MarketProviderRequestError);
    expect(String(caught)).not.toContain("sensitive-upstream-body");
    expect(fetcher).toHaveBeenCalledTimes([502, 503, 504].includes(status) ? 2 : 1);
  });

  it.each(Array.from({ length: 20 }, (_, index) => index))("isolates cache, flight, and circuit case %s", async (index) => {
    const provider: MarketProviderId = (["rakuten", "yahoo", "ebay"] as const)[index % 3]!;
    const key = `${provider}:${index}`;
    setMarketCache(key, { provider, index }, 1_000, 100);
    expect(getMarketCache(key, 101)).toEqual({ provider, index });
    expect(getMarketCache(key, 1_101)).toBeNull();

    let calls = 0;
    const operation = () => providerSingleFlight(key, async () => { calls += 1; return index; });
    await expect(Promise.all([operation(), operation(), operation()])).resolves.toEqual([index, index, index]);
    expect(calls).toBe(1);

    recordProviderOutcome(provider, "timeout", 1_000);
    recordProviderOutcome(provider, "temporarily_unavailable", 1_001);
    recordProviderOutcome(provider, "timeout", 1_002);
    expect(isProviderCircuitOpen(provider, 1_003)).toBe(true);
    expect(isProviderCircuitOpen(provider, 31_003)).toBe(false);
  });
});

function context(styleCode: string | null, colorwayName: string | null): MarketSearchContext {
  return {
    query: "New Balance 991v2",
    identity: {
      brand: "New Balance",
      modelName: "New Balance 991v2",
      colorwayName,
      styleCode,
      verificationState: styleCode ? "model_color_style_verified" : colorwayName ? "model_color_verified" : "model_only",
    },
    gender: "unknown",
    sizeSystem: "UNKNOWN",
    size: null,
    condition: "unknown",
  };
}

function listing(): MarketListing {
  return {
    provider: "rakuten",
    externalId: "shop:item",
    title: "New Balance 991v2 Grey U991BB2",
    canonicalBrand: "New Balance",
    canonicalModelName: "New Balance 991v2",
    modelFamily: "991",
    generation: "v2",
    colorwayName: "Grey",
    styleCode: "U991BB2",
    audience: "unisex",
    price: 32_800,
    currency: "JPY",
    shippingPrice: null,
    shippingKnown: false,
    totalDisplayedPrice: null,
    priceType: "current_retail_price",
    listingFormat: "fixed_price",
    condition: "new",
    providerConditionLabel: "new",
    sizeSystem: "JP",
    size: "27",
    inStock: true,
    imageUrl: null,
    itemUrl: "https://example.com/item",
    shopName: "Example",
    matchLevel: "exact",
    matchReasons: ["Style Code が完全一致"],
    mismatchWarnings: [],
    fetchedAt: "2026-08-12T00:00:00.000Z",
    cacheExpiresAt: null,
  };
}
