import { afterEach, describe, expect, it, vi } from "vitest";

import type { MarketSearchContext } from "./contracts";
import { toPricePresentation } from "./contracts";
import { styleCodeFromTitle } from "./listing-match";
import { MARKET_PROVIDER_CAPABILITIES, searchEbayListings, searchYahooListings } from "./providers";
import { fetchMarketJson, MarketProviderRequestError } from "./provider-request";
import { getEbayApplicationToken, resetEbayTokenManagerForTests } from "./ebay-token-manager";

afterEach(() => {
  resetEbayTokenManagerForTests();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("current market provider adapters", () => {
  it("distinguishes implemented adapters from live-verified providers", () => {
    const currentPriceProviders = MARKET_PROVIDER_CAPABILITIES.filter(({ provider }) => (
      provider === "rakuten" || provider === "yahoo" || provider === "ebay"
    ));
    expect(currentPriceProviders.find(({ provider }) => provider === "rakuten")?.status).toBe("implemented_unverified");
    expect(currentPriceProviders.filter(({ status }) => status === "live_verified").map(({ provider }) => provider)).toEqual(["yahoo", "ebay"]);
  });

  it("normalizes Yahoo retail price and keeps unknown shipping unknown", async () => {
    vi.stubEnv("YAHOO_SHOPPING_APP_ID", "secret-app-id");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ hits: [{
      name: "Nike Air Force 1 Low White Black HF2893-100",
      price: 15_400,
      url: "https://store.shopping.yahoo.co.jp/example/af1.html",
      code: "example-af1",
      condition: "new",
      inStock: true,
      shipping: { code: 1 },
      image: { medium: "https://item-shopping.c.yimg.jp/i/g/example" },
      seller: { name: "Example Store" },
    }] }));
    const result = await searchYahooListings(context(), fetcher);
    expect(result.status).toBe("success");
    expect(result.listings[0]).toMatchObject({
      provider: "yahoo",
      priceType: "current_retail_price",
      price: 15_400,
      currency: "JPY",
      shippingPrice: null,
      matchLevel: "exact",
    });
    expect(toPricePresentation(result.listings[0]!).totalKnown).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret-app-id");
  });

  it("uses an application token in memory and normalizes eBay listing price", async () => {
    vi.stubEnv("EBAY_PRODUCTION_CLIENT_ID", "client-secret-id");
    vi.stubEnv("EBAY_PRODUCTION_CLIENT_SECRET", "client-secret-value");
    vi.stubEnv("EBAY_PRODUCTION_MARKETPLACE_ID", "EBAY_US");
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ access_token: "<test-oauth-token>", expires_in: 7200 }))
      .mockResolvedValueOnce(json({ itemSummaries: [{
        itemId: "v1|123|0",
        title: "Nike Air Force 1 Low White Black HF2893-100 Size 9",
        itemWebUrl: "https://www.ebay.com/itm/123",
        price: { value: "119.99", currency: "USD" },
        condition: "New with box",
        buyingOptions: ["FIXED_PRICE"],
        shippingOptions: [{ shippingCost: { value: "12.00", currency: "USD" } }],
        localizedAspects: [
          { name: "Style Code", value: "HF2893-100" },
          { name: "Size", value: "9" },
          { name: "Department", value: "Men" },
        ],
      }] }));
    const result = await searchEbayListings(context({ gender: "men", sizeSystem: "US_M", size: "9" }), fetcher);
    expect(result.listings[0]).toMatchObject({
      priceType: "current_listing_price",
      currency: "USD",
      shippingPrice: 12,
      listingFormat: "fixed_price",
      condition: "new",
      sizeSystem: "US_M",
      size: "9",
    });
    expect(toPricePresentation(result.listings[0]!).totalKnown).toBe(false);
    const searchHeaders = new Headers(fetcher.mock.calls[1]?.[1]?.headers);
    expect(searchHeaders.get("authorization")).toBe("Bearer <test-oauth-token>");
    expect(JSON.stringify(result)).not.toMatch(/temporary-token|client-secret/iu);
  });

  it("single-flights concurrent eBay application token requests", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ access_token: "shared-token", expires_in: 7200 }));
    const credentials = { clientId: "client-id", clientSecret: "client-secret" };
    await expect(Promise.all([
      getEbayApplicationToken(credentials, fetcher, 1_000),
      getEbayApplicationToken(credentials, fetcher, 1_000),
      getEbayApplicationToken(credentials, fetcher, 1_000),
    ])).resolves.toEqual(["shared-token", "shared-token", "shared-token"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("invalidates an eBay token on 401 and retries authorization exactly once", async () => {
    vi.stubEnv("EBAY_PRODUCTION_CLIENT_ID", "client-id");
    vi.stubEnv("EBAY_PRODUCTION_CLIENT_SECRET", "client-secret");
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ access_token: "expired-token", expires_in: 7200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(json({ access_token: "fresh-token", expires_in: 7200 }))
      .mockResolvedValueOnce(json({ itemSummaries: [] }));
    const result = await searchEbayListings(context(), fetcher);
    expect(result.status).toBe("empty");
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(new Headers(fetcher.mock.calls[3]?.[1]?.headers).get("authorization")).toBe("Bearer fresh-token");
    expect(JSON.stringify(result)).not.toMatch(/expired-token|fresh-token|client-secret/iu);
  });

  it("does not retry 429 and retries one temporary 503", async () => {
    const limited = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 429, headers: { "Retry-After": "30" } }));
    await expect(fetchMarketJson("https://provider.example/items", {}, limited)).rejects.toMatchObject({ status: "rate_limited", retryAfter: 30 });
    expect(limited).toHaveBeenCalledTimes(1);

    const temporary = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(json({ ok: true }));
    await expect(fetchMarketJson("https://provider.example/items", {}, temporary)).resolves.toEqual({ ok: true });
    expect(temporary).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid JSON and oversized bodies without exposing content", async () => {
    const invalid = vi.fn<typeof fetch>().mockResolvedValue(new Response("not-json", { status: 200 }));
    await expect(fetchMarketJson("https://provider.example/items", {}, invalid)).rejects.toBeInstanceOf(MarketProviderRequestError);
  });

  it("does not inject the recommended model into unrelated provider listings", async () => {
    vi.stubEnv("YAHOO_SHOPPING_APP_ID", "secret-app-id");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ hits: [{
      name: "Completely Different Running Shoe",
      price: 9_900,
      url: "https://store.shopping.yahoo.co.jp/example/other.html",
      code: "other",
    }] }));
    const result = await searchYahooListings(context({
      identity: { ...context().identity, styleCode: null, verificationState: "model_color_verified" },
    }), fetcher);
    expect(result.status).toBe("empty");
    expect(result.audit.rejectedCount).toBe(1);
  });

  it("accepts only a complete Style Code token from a title", () => {
    expect(styleCodeFromTitle("Nike Air Force 1 HF2893-100", "HF2893-100")).toBe("HF2893100");
    expect(styleCodeFromTitle("Nike Air Force 1 HF2893-100X", "HF2893-100")).not.toBe("HF2893100");
  });
});

function context(overrides: Partial<MarketSearchContext> = {}): MarketSearchContext {
  return {
    query: "Nike Air Force 1 Low White Black HF2893-100",
    identity: {
      brand: "Nike",
      modelName: "Nike Air Force 1 Low",
      colorwayName: "White / Black",
      styleCode: "HF2893-100",
      verificationState: "model_color_style_verified",
    },
    gender: "unknown",
    sizeSystem: "UNKNOWN",
    size: null,
    condition: "unknown",
    ...overrides,
  };
}

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
}
