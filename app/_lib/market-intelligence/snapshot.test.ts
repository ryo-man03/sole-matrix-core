import {
  getMarketSeriesKey,
  groupMarketSnapshots,
  MARKET_PRICE_TYPES,
  validateMarketSnapshot,
  type MarketPriceType,
  type MarketSnapshot,
} from "./snapshot";

function snapshot(
  priceType: MarketPriceType,
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
    variant: {
      sizeSystem: "US_M",
      sizeValue: "9",
      condition: "new",
    },
    priceType,
    amount: 42_000,
    currency: "JPY",
    observedAt: "2026-07-30T00:00:00.000Z",
    sourceReference: "stockx:product:variant",
    sampleCount: null,
    identityMatch: "exact",
    sourceQuality: "official_api",
    includesFees: null,
    includesShipping: null,
    includesTax: null,
    ...overrides,
  };
}

describe("transparent market snapshots", () => {
  it("keeps every price meaning in a distinct series", () => {
    const snapshots = MARKET_PRICE_TYPES.map((priceType) =>
      snapshot(priceType),
    );
    const grouped = groupMarketSnapshots(snapshots);

    expect(grouped.size).toBe(MARKET_PRICE_TYPES.length);
    expect(new Set([...grouped.keys()].map((key) => key.split("|").at(-2))))
      .toEqual(new Set(MARKET_PRICE_TYPES));
  });

  it("keeps provider, size, condition, and currency separated", () => {
    const snapshots = [
      snapshot("sold_price"),
      snapshot("sold_price", { provider: "manual_import" }),
      snapshot("sold_price", {
        variant: { sizeSystem: "US_M", sizeValue: "10", condition: "new" },
      }),
      snapshot("sold_price", {
        variant: { sizeSystem: "US_M", sizeValue: "9", condition: "used" },
      }),
      snapshot("sold_price", { currency: "USD" }),
    ];

    expect(groupMarketSnapshots(snapshots).size).toBe(5);
  });

  it("does not turn missing or invalid prices into zero", () => {
    const invalid = snapshot("lowest_ask", { amount: 0 });
    expect(validateMarketSnapshot(invalid)).toEqual({
      valid: false,
      errors: ["amount must be a finite positive number"],
    });
    expect(groupMarketSnapshots([invalid]).size).toBe(0);
  });

  it.each([
    [{ currency: "jpy" }, "currency must be an uppercase ISO 4217 code"],
    [{ observedAt: "not-a-date" }, "observedAt must be a valid timestamp"],
    [{ sampleCount: 0 }, "sampleCount must be null or a positive integer"],
    [{ sourceReference: " " }, "sourceReference must be null or non-empty"],
  ] satisfies readonly [Partial<MarketSnapshot>, string][])(
    "rejects malformed normalized fields",
    (overrides, error) => {
      const validation = validateMarketSnapshot(
        snapshot("listing_price", overrides),
      );
      expect(validation.valid).toBe(false);
      if (!validation.valid) expect(validation.errors).toContain(error);
    },
  );

  it("uses style code before the descriptive identity in series keys", () => {
    const first = snapshot("highest_bid");
    const alias = snapshot("highest_bid", {
      identity: {
        ...first.identity,
        modelName: "AJ1 Retro High",
        colorwayName: "Chicago Reimagined",
      },
    });

    expect(getMarketSeriesKey(first)).toBe(getMarketSeriesKey(alias));
  });

  it("sorts observations chronologically within a series", () => {
    const later = snapshot("lowest_ask", {
      observedAt: "2026-07-30T10:00:00.000Z",
    });
    const earlier = snapshot("lowest_ask", {
      observedAt: "2026-07-29T10:00:00.000Z",
    });
    const grouped = groupMarketSnapshots([later, earlier]);

    expect([...grouped.values()][0]?.map((item) => item.observedAt)).toEqual([
      earlier.observedAt,
      later.observedAt,
    ]);
  });
});
