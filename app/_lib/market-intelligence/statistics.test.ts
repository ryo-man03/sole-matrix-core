import {
  calculateMarketSeriesSummary,
  calculateMarketTrends,
} from "./statistics";
import type { MarketSnapshot } from "./snapshot";

function snapshot(
  day: number,
  amount: number,
  overrides: Partial<MarketSnapshot> = {},
): MarketSnapshot {
  return {
    provider: "stockx",
    identity: {
      brand: "Nike",
      modelName: "Air Jordan 1 Retro High OG",
      colorwayName: "Chicago",
      styleCode: "DZ5485-612",
      releaseYear: 2022,
    },
    variant: { sizeSystem: "US_M", sizeValue: "9", condition: "new" },
    priceType: "lowest_ask",
    amount,
    currency: "JPY",
    observedAt: new Date(
      Date.UTC(2026, 5, 30 + day),
    ).toISOString(),
    sourceReference: `fixture:${day}`,
    sampleCount: null,
    identityMatch: "exact",
    sourceQuality: "official_api",
    includesFees: null,
    includesShipping: null,
    includesTax: null,
    ...overrides,
  };
}

describe("transparent sneaker market trends", () => {
  it("calculates descriptive statistics and bounded-period changes", () => {
    const series = Array.from(
      { length: 31 },
      (_, index) => snapshot(index, 100 + index),
    );
    const result = calculateMarketSeriesSummary(series);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data).toMatchObject({
      observations: 31,
      latest: 130,
      min: 100,
      max: 130,
      median: 115,
      mean: 115,
      change7d: 5.6911,
      change30d: 30,
    });
    expect(result.data.volatility30d).toBeGreaterThan(0);
  });

  it("returns null changes when observation coverage is too short", () => {
    const result = calculateMarketSeriesSummary([
      snapshot(0, 100),
      snapshot(2, 110),
    ]);
    expect(result).toMatchObject({
      status: "success",
      data: {
        change7d: null,
        change30d: null,
      },
    });
  });

  it.each([
    [{ provider: "manual_import" as const }, "provider"],
    [{
      variant: { sizeSystem: "US_M" as const, sizeValue: "10", condition: "new" as const },
    }, "size"],
    [{
      variant: { sizeSystem: "US_M" as const, sizeValue: "9", condition: "used" as const },
    }, "condition"],
    [{ priceType: "highest_bid" as const }, "price type"],
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
    "refuses to mix a different %s series",
    (overrides, _label) => {
      expect(
        calculateMarketSeriesSummary([
          snapshot(0, 100),
          snapshot(1, 110, overrides),
        ]),
      ).toEqual({ status: "series_mismatch" });
    },
  );

  it("does not discard outliers or mutate raw observations", () => {
    const series = [
      snapshot(0, 100),
      snapshot(1, 101),
      snapshot(2, 10_000),
    ];
    const original = structuredClone(series);
    const result = calculateMarketSeriesSummary(series);
    expect(result).toMatchObject({
      status: "success",
      data: { observations: 3, max: 10_000, latest: 10_000 },
    });
    expect(series).toEqual(original);
  });

  it("groups separate series rather than returning one market price", () => {
    const trends = calculateMarketTrends([
      snapshot(0, 100),
      snapshot(0, 90, { priceType: "highest_bid" }),
      snapshot(0, 120, { currency: "USD" }),
    ]);
    expect(trends.size).toBe(3);
  });

  it("rejects zero-price observations rather than showing zero", () => {
    expect(
      calculateMarketSeriesSummary([snapshot(0, 0)]),
    ).toEqual({ status: "invalid_snapshot" });
  });
});
