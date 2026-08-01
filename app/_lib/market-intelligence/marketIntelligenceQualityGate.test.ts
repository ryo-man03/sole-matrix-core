import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AccessibleMarketChart,
  buildMarketContexts,
} from "../../_components/MarketIntelligencePanel";
import { forecastMarketSeries } from "./forecast";
import { importMarketData } from "./manualImport";
import {
  MARKET_PRICE_LABELS,
  validateMarketSnapshot,
  type MarketSnapshot,
} from "./snapshot";
import { calculateMarketSeriesSummary } from "./statistics";

function snapshot(
  index: number,
  amount: number,
  overrides: Partial<MarketSnapshot> = {},
): MarketSnapshot {
  return {
    provider: "manual_import",
    identity: {
      brand: "Nike",
      modelName: "Air Jordan 1 Retro High OG",
      colorwayName: "Chicago",
      styleCode: "DZ5485-612",
      releaseYear: 2022,
    },
    variant: { sizeSystem: "US_M", sizeValue: "9", condition: "new" },
    priceType: "sold_price",
    amount,
    currency: "JPY",
    observedAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
    sourceReference: `authorized-fixture:${index}`,
    sampleCount: 1,
    identityMatch: "exact",
    sourceQuality: "manual_import",
    includesFees: false,
    includesShipping: false,
    includesTax: true,
    ...overrides,
  };
}

describe("authorized market intelligence quality gate", () => {
  it("never labels ask or bid as a sold price", () => {
    expect(MARKET_PRICE_LABELS.lowest_ask).toBe("最低出品額");
    expect(MARKET_PRICE_LABELS.highest_bid).toBe("最高入札額");
    expect(MARKET_PRICE_LABELS.sold_price).toBe("成約価格");
    expect(new Set(Object.values(MARKET_PRICE_LABELS)).size)
      .toBe(Object.keys(MARKET_PRICE_LABELS).length);
  });

  it.each([
    [{
      variant: { sizeSystem: "US_M" as const, sizeValue: "10", condition: "new" as const },
    }, "size"],
    [{
      variant: { sizeSystem: "US_W" as const, sizeValue: "9", condition: "new" as const },
    }, "men/women"],
    [{
      variant: { sizeSystem: "US_M" as const, sizeValue: "9", condition: "used" as const },
    }, "used/new"],
    [{ currency: "USD" }, "currency"],
    [{
      identity: {
        brand: "Nike",
        modelName: "Air Jordan 1 Retro High OG",
        colorwayName: "Bred",
        styleCode: "555088-063",
        releaseYear: 2016,
      },
    }, "identity"],
  ] satisfies readonly [Partial<MarketSnapshot>, string][])(
    "does not aggregate a mismatched %s",
    (overrides, _label) => {
      expect(calculateMarketSeriesSummary([
        snapshot(0, 40_000),
        snapshot(1, 41_000, overrides),
      ])).toEqual({ status: "series_mismatch" });
    },
  );

  it("rejects missing prices and zero samples", () => {
    const missingPrice = {
      ...snapshot(0, 40_000),
      amount: undefined,
    } as unknown as MarketSnapshot;
    expect(validateMarketSnapshot(missingPrice).valid).toBe(false);
    expect(validateMarketSnapshot(snapshot(0, 40_000, {
      sampleCount: 0,
    }))).toEqual({
      valid: false,
      errors: ["sampleCount must be null or a positive integer"],
    });
  });

  it("does not produce forecasts for insufficient history", () => {
    expect(forecastMarketSeries(
      Array.from({ length: 29 }, (_, index) => snapshot(index, 40_000)),
      7,
    )).toMatchObject({ forecastStatus: "insufficient_data" });
  });

  it.each([
    ["flat", (_index: number): number => 40_000],
    ["upward", (index: number): number => 30_000 + index * 200],
    ["downward", (index: number): number => 50_000 - index * 150],
    ["volatile", (index: number): number => 40_000 + (index % 2 ? 8_000 : -6_000)],
    ["outlier", (index: number): number => index === 30 ? 100_000 : 40_000 + index * 10],
  ] as const)("backtests a deterministic %s fixture", (_name, amountFor) => {
    const observations = Array.from(
      { length: 60 },
      (_, index) => snapshot(index, amountFor(index)),
    );
    const generatedAt = "2026-07-30T00:00:00.000Z";
    const first = forecastMarketSeries(observations, 30, generatedAt);
    const second = forecastMarketSeries(observations, 30, generatedAt);
    expect(first).toEqual(second);
    expect(first.forecastStatus).toBe("ready");
    if (first.forecastStatus !== "ready") return;
    expect(first.forecast.lowerBound).toBeLessThanOrEqual(
      first.forecast.pointEstimate,
    );
    expect(first.forecast.upperBound).toBeGreaterThanOrEqual(
      first.forecast.pointEstimate,
    );
  });

  it("handles missing dates and lowers confidence from coverage", () => {
    const observations = Array.from({ length: 45 }, (_, index) =>
      snapshot(index * 2, 40_000 + index * 20, {
        observedAt: new Date(
          Date.UTC(2026, 0, 1 + index * 2),
        ).toISOString(),
      })
    );
    const result = forecastMarketSeries(observations, 7);
    expect(result).toMatchObject({
      forecastStatus: "ready",
      forecast: { confidence: "low" },
    });
  });

  it("renders a mobile-safe, keyboard-readable chart with distinct series", () => {
    const observations = [
      snapshot(0, 40_000, { priceType: "lowest_ask" }),
      snapshot(1, 41_000, { priceType: "lowest_ask" }),
      snapshot(0, 38_000, { priceType: "highest_bid" }),
      snapshot(1, 39_000, { priceType: "highest_bid" }),
    ];
    const context = buildMarketContexts(observations)[0]!;
    const markup = renderToStaticMarkup(createElement(
      AccessibleMarketChart,
      { context, currency: "JPY" },
    ));
    expect(markup).toContain("<svg");
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain("最低出品額");
    expect(markup).toContain("最高入札額");
    expect(markup).toContain('stroke-dasharray="8 5"');
    expect(markup).toContain("各点はキーボードで確認できます");
  });

  it("keeps disabled/manual behavior strict for valid and invalid imports", () => {
    const valid = {
      provider: "mercari",
      sourceReference: "user-export:1",
      observedAt: "2026-07-30T00:00:00.000Z",
      brand: "Nike",
      modelName: "Air Jordan 1 Retro High OG",
      colorwayName: "Chicago",
      styleCode: "DZ5485-612",
      releaseYear: 2022,
      sizeSystem: "US_M",
      sizeValue: "9",
      condition: "used",
      currency: "JPY",
      priceType: "listing_price",
      amount: 35_000,
      sampleCount: 1,
      identityMatch: "exact",
      includesFees: null,
      includesShipping: null,
      includesTax: null,
    };
    expect(importMarketData(JSON.stringify([valid]), "json").accepted)
      .toHaveLength(1);
    expect(importMarketData(JSON.stringify([{
      ...valid,
      sourceReference: "",
    }]), "json").rejected).toHaveLength(1);
  });
});
