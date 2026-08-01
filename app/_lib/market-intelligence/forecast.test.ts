import { forecastMarketSeries } from "./forecast";
import type { MarketSnapshot } from "./snapshot";

function series(
  count: number,
  amountFor: (index: number) => number,
  stepDays = 1,
): MarketSnapshot[] {
  return Array.from({ length: count }, (_, index) => ({
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
    amount: amountFor(index),
    currency: "JPY",
    observedAt: new Date(
      Date.UTC(2026, 0, 1 + index * stepDays),
    ).toISOString(),
    sourceReference: `fixture:${index}`,
    sampleCount: 1,
    identityMatch: "exact",
    sourceQuality: "manual_import",
    includesFees: false,
    includesShipping: false,
    includesTax: true,
  }));
}

describe("backtested market trend forecasts", () => {
  it("requires at least 30 observations", () => {
    expect(forecastMarketSeries(series(29, () => 100), 7)).toEqual({
      forecastStatus: "insufficient_data",
      reason: "observation_count",
    });
  });

  it("requires at least 21 days of history", () => {
    const observations = series(30, () => 100).map((snapshot, index) => ({
      ...snapshot,
      observedAt: new Date(
        Date.UTC(2026, 0, 1, index),
      ).toISOString(),
    }));
    expect(forecastMarketSeries(observations, 7)).toEqual({
      forecastStatus: "insufficient_data",
      reason: "history_days",
    });
  });

  it("refuses mixed price types and probable identity", () => {
    const observations = series(30, (index) => 100 + index);
    expect(forecastMarketSeries([
      ...observations.slice(0, 29),
      { ...observations[29]!, priceType: "listing_price" },
    ], 7)).toEqual({
      forecastStatus: "insufficient_data",
      reason: "series_mismatch",
    });
    expect(forecastMarketSeries(
      observations.map((snapshot) => ({
        ...snapshot,
        identityMatch: "probable" as const,
      })),
      7,
    )).toEqual({
      forecastStatus: "insufficient_data",
      reason: "identity_not_exact",
    });
  });

  it("keeps the naive model for a stable series", () => {
    const result = forecastMarketSeries(
      series(45, () => 40_000),
      7,
      "2026-07-30T00:00:00.000Z",
    );
    expect(result.forecastStatus).toBe("ready");
    if (result.forecastStatus !== "ready") return;
    expect(result.forecast).toMatchObject({
      model: "naive",
      pointEstimate: 40_000,
      lowerBound: 40_000,
      upperBound: 40_000,
      backtestMae: 0,
      backtestSmape: 0,
      directionalAccuracy: null,
    });
  });

  it("adopts a trend model only when it clearly beats naive backtesting", () => {
    const result = forecastMarketSeries(
      series(60, (index) => 30_000 + index * 250),
      30,
      "2026-07-30T00:00:00.000Z",
    );
    expect(result.forecastStatus).toBe("ready");
    if (result.forecastStatus !== "ready") return;
    expect(["linear_trend", "holt"]).toContain(result.forecast.model);
    expect(result.forecast.pointEstimate).toBeGreaterThan(44_750);
    expect(result.forecast.backtestMae).toBeLessThan(250);
    expect(result.forecast.directionalAccuracy).toBe(1);
  });

  it("returns deterministic 7-day and 30-day estimates with uncertainty bounds", () => {
    const observations = series(
      60,
      (index) => 40_000 + index * 20 + (index % 3) * 100,
    );
    const generatedAt = "2026-07-30T00:00:00.000Z";
    const seven = forecastMarketSeries(observations, 7, generatedAt);
    const sevenAgain = forecastMarketSeries(observations, 7, generatedAt);
    const thirty = forecastMarketSeries(observations, 30, generatedAt);
    expect(seven).toEqual(sevenAgain);
    expect(seven.forecastStatus).toBe("ready");
    expect(thirty.forecastStatus).toBe("ready");
    if (
      seven.forecastStatus !== "ready" ||
      thirty.forecastStatus !== "ready"
    ) return;
    expect(seven.forecast.lowerBound).toBeLessThanOrEqual(
      seven.forecast.pointEstimate,
    );
    expect(seven.forecast.upperBound).toBeGreaterThanOrEqual(
      seven.forecast.pointEstimate,
    );
    expect(thirty.forecast.upperBound - thirty.forecast.lowerBound)
      .toBeGreaterThanOrEqual(
        seven.forecast.upperBound - seven.forecast.lowerBound,
      );
  });

  it("derives confidence from coverage and backtest error", () => {
    const low = forecastMarketSeries(
      series(30, (index) => 100 + (index % 2) * 100),
      7,
    );
    const high = forecastMarketSeries(
      series(100, (index) => 10_000 + index),
      7,
    );
    expect(low).toMatchObject({
      forecastStatus: "ready",
      forecast: { confidence: "low" },
    });
    expect(high).toMatchObject({
      forecastStatus: "ready",
      forecast: { confidence: "high" },
    });
  });

  it("uses risk language without purchase or profit claims", () => {
    const result = forecastMarketSeries(series(45, () => 40_000), 7);
    expect(result.forecastStatus).toBe("ready");
    if (result.forecastStatus !== "ready") return;
    const warnings = result.forecast.warnings.join(" ");
    expect(warnings).toContain("保証しません");
    expect(warnings).not.toMatch(
      /必ず上がる|確実に下がる|今買うべき|投資向け|利益が出る/u,
    );
  });
});

