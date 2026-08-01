import {
  isStandardAggregationMatch,
  matchSneakerIdentity,
  matchSneakerSeries,
  type CanonicalSneakerIdentity,
  type SneakerVariant,
} from "./identity";

const identity: CanonicalSneakerIdentity = {
  brand: "Nike",
  modelName: "Air Jordan 1 Retro High OG",
  colorwayName: "Chicago",
  styleCode: "DZ5485-612",
  releaseYear: 2022,
};

const variant: SneakerVariant = {
  sizeSystem: "US_M",
  sizeValue: "9.0",
  condition: "new",
};

describe("cross-provider sneaker identity matching", () => {
  it("accepts normalized style-code equality as exact", () => {
    const report = matchSneakerIdentity(identity, {
      ...identity,
      brand: "NIKE",
      styleCode: "dz5485 612",
    });

    expect(report.match).toBe("exact");
    expect(isStandardAggregationMatch(report)).toBe(true);
  });

  it("marks formal model and color equality without two style codes as probable", () => {
    const report = matchSneakerIdentity(identity, {
      ...identity,
      styleCode: null,
    });

    expect(report.match).toBe("probable");
    expect(isStandardAggregationMatch(report)).toBe(false);
  });

  it("does not automatically aggregate a model-only match", () => {
    const report = matchSneakerIdentity(
      { ...identity, styleCode: null, colorwayName: null, releaseYear: null },
      { ...identity, styleCode: null, colorwayName: null, releaseYear: null },
    );

    expect(report.match).toBe("model_only");
    expect(isStandardAggregationMatch(report)).toBe(false);
  });

  it.each([
    [{ ...identity, styleCode: "555088-101" }, "style code differs"],
    [{ ...identity, releaseYear: 2015 }, "release year differs"],
    [{ ...identity, colorwayName: "Bred" }, "colorway differs"],
    [{ ...identity, brand: "adidas" }, "brand differs"],
  ])("rejects contradictory product identity", (observed, reason) => {
    expect(matchSneakerIdentity(identity, observed)).toEqual({
      match: "rejected",
      reasons: [reason],
    });
  });

  it.each([
    [{ ...variant, sizeSystem: "US_W" as const }, "size system or gender differs"],
    [{ ...variant, sizeValue: "10" }, "size differs"],
    [{ ...variant, condition: "used" as const }, "condition differs"],
  ])("keeps variant series separated", (observedVariant, reason) => {
    expect(
      matchSneakerSeries(identity, identity, variant, observedVariant),
    ).toEqual({ match: "rejected", reasons: [reason] });
  });

  it("normalizes equivalent numeric size representations", () => {
    expect(
      matchSneakerSeries(identity, identity, variant, {
        ...variant,
        sizeValue: "9",
      }).match,
    ).toBe("exact");
  });
});
