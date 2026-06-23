import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildCoreInput,
  evaluateBudgetFit,
  mapPreferenceProfile,
  type CoreInputAdapterInput,
} from "./coreInputAdapter";

const featureValues = {
  culture: 90,
  styleFit: 80,
  simplicity: 70,
  street: 60,
  volume: 50,
  comfort: 40,
  durability: 30,
  priceLevel: 20,
};

function makeInput(
  overrides: Partial<CoreInputAdapterInput> = {}
): CoreInputAdapterInput {
  return {
    candidateTagIds: ["classic", "minimal", "low_tech", "street", "chunky"],
    userId: "user-001",
    updatedAt: "2026-06-23T12:00:00Z",
    userBudgetYen: 30_000,
    resolvedCatalogItem: {
      id: "smx-snk-0001",
      displayName: "Catalog Sneaker",
      tags: ["classic", "comfortable"],
      comparisonPriceYen: 40_000,
      featureValues,
    },
    ...overrides,
  };
}

describe("buildCoreInput", () => {
  it("builds a Core-compatible input from validated adapter inputs", () => {
    const result = buildCoreInput(makeInput());

    expect(result.status).toBe("ready");

    if (result.status !== "ready") {
      throw new Error("expected ready result");
    }

    expect(result.coreInput).toEqual({
      preferenceProfile: {
        userId: "user-001",
        vector: {
          culture: 100,
          styleFit: 100,
          simplicity: 100,
          street: 100,
          volume: 100,
          comfort: 0,
          durability: 0,
        },
        policy: {
          priceSensitivity: 50,
          overlapSensitivity: 50,
          explorationTolerance: 50,
        },
        axisImportance: {
          culture: 100,
          styleFit: 100,
          simplicity: 100,
          street: 100,
          volume: 100,
          comfort: 0,
          durability: 0,
        },
        sourceConfidence: {
          diagnosis: 0,
          ownedSneakers: 0,
          wantedSneakers: 100,
          feedback: 0,
        },
        profileVersion: 1,
        updatedAt: "2026-06-23T12:00:00Z",
      },
      candidates: [
        {
          sneakerId: "smx-snk-0001",
          name: "Catalog Sneaker",
          vector: featureValues,
          tags: ["classic", "comfortable"],
          budgetFit: 75,
        },
      ],
    });
  });

  it.each([
    ["retro", "culture"],
    ["classic", "culture"],
    ["heritage", "culture"],
    ["minimal", "styleFit"],
    ["low_tech", "simplicity"],
    ["street", "street"],
    ["chunky", "volume"],
    ["running", "comfort"],
    ["basketball", "comfort"],
  ] as const)("maps %s to PreferenceProfile.%s", (tagId, axis) => {
    const profile = mapPreferenceProfile({
      candidateTagIds: [tagId],
      userId: "user-001",
      updatedAt: "2026-06-23T12:00:00Z",
    });

    expect(profile.vector[axis]).toBe(100);
    expect(profile.axisImportance[axis]).toBe(100);
  });

  it("keeps durability at 0 even when sporty or durable tags are selected", () => {
    const result = buildCoreInput(
      makeInput({ candidateTagIds: ["running", "durable"] })
    );

    expect(result.status).toBe("ready");

    if (result.status === "ready") {
      expect(result.coreInput.preferenceProfile.vector.comfort).toBe(100);
      expect(result.coreInput.preferenceProfile.vector.durability).toBe(0);
      expect(result.coreInput.preferenceProfile.axisImportance.durability).toBe(
        0
      );
    }
  });

  it("passes all eight manually registered catalog feature values through unchanged", () => {
    const result = buildCoreInput(makeInput());

    expect(result.status).toBe("ready");

    if (result.status === "ready") {
      expect(result.coreInput.candidates[0]?.vector).toEqual(featureValues);
    }
  });

  it.each([
    [30_000, 30_000, 100],
    [30_000, 40_000, 75],
    [30_000, 60_000, 50],
  ])(
    "maps budget %i and comparison price %i to budgetFit %i",
    (budget, price, expected) => {
      expect(evaluateBudgetFit(budget, price)).toBe(expected);
    }
  );

  it.each([
    ["empty tags", { candidateTagIds: [] }, "preference_tags_empty"],
    [
      "unsupported tag",
      { candidateTagIds: ["classic", "unknown"] },
      "preference_tag_unsupported",
    ],
    [
      "tag limit",
      {
        candidateTagIds: [
          "classic",
          "retro",
          "heritage",
          "minimal",
          "low_tech",
          "street",
        ],
      },
      "preference_tag_limit_exceeded",
    ],
    [
      "duplicate tag",
      { candidateTagIds: ["classic", "classic"] },
      "preference_tag_duplicate",
    ],
    ["empty userId", { userId: " " }, "user_id_invalid"],
    ["invalid updatedAt", { updatedAt: "June 23" }, "updated_at_invalid"],
    [
      "invalid calendar date",
      { updatedAt: "2026-02-31T12:00:00Z" },
      "updated_at_invalid",
    ],
    ["unresolved catalog", { resolvedCatalogItem: null }, "catalog_unresolved"],
    [
      "missing catalog id",
      { resolvedCatalogItem: { ...makeCatalogItem(), id: undefined } },
      "catalog_id_invalid",
    ],
    [
      "missing display name",
      {
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          displayName: undefined,
        },
      },
      "catalog_display_name_invalid",
    ],
    [
      "missing catalog tags",
      { resolvedCatalogItem: { ...makeCatalogItem(), tags: undefined } },
      "catalog_tags_invalid",
    ],
    [
      "missing feature dimension",
      {
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          featureValues: omitFeature("comfort"),
        },
      },
      "catalog_feature_dimension_missing",
    ],
    [
      "feature value out of range",
      {
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          featureValues: { ...featureValues, culture: 101 },
        },
      },
      "catalog_feature_value_invalid",
    ],
    [
      "feature value not number",
      {
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          featureValues: { ...featureValues, culture: "90" },
        },
      },
      "catalog_feature_value_invalid",
    ],
  ] as const)("blocks %s", (_name, overrides, errorCode) => {
    const result = buildCoreInput(makeInput(overrides));

    expect(result.status).toBe("blocked");
    expect(result.coreInput).toBeNull();
    expect(result.errors.map((error) => error.code)).toContain(errorCode);
  });

  it.each([
    ["missing", undefined],
    ["not a number", "30000"],
    ["zero", 0],
    ["negative", -1],
    ["non-integer", 30_000.5],
    ["NaN", Number.NaN],
    ["infinity", Number.POSITIVE_INFINITY],
  ])("blocks %s user budget", (_name, userBudgetYen) => {
    const result = buildCoreInput(makeInput({ userBudgetYen }));

    expect(result.status).toBe("blocked");
    expect(result.errors.map((error) => error.code)).toContain(
      "user_budget_invalid"
    );
  });

  it.each([
    ["missing", undefined],
    ["not a number", "40000"],
    ["zero", 0],
    ["negative", -1],
    ["non-integer", 40_000.5],
    ["NaN", Number.NaN],
    ["infinity", Number.POSITIVE_INFINITY],
  ])("blocks %s comparison price", (_name, comparisonPriceYen) => {
    const result = buildCoreInput(
      makeInput({
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          comparisonPriceYen,
        },
      })
    );

    expect(result.status).toBe("blocked");
    expect(result.errors.map((error) => error.code)).toContain(
      "comparison_price_invalid"
    );
  });

  it("allows an empty manually registered catalog tag array", () => {
    const result = buildCoreInput(
      makeInput({
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          tags: [],
        },
      })
    );

    expect(result.status).toBe("ready");

    if (result.status === "ready") {
      expect(result.coreInput.candidates[0]?.tags).toEqual([]);
    }
  });

  it("does not import or execute recommendSneakers", () => {
    const source = readFileSync(
      new URL("./coreInputAdapter.ts", import.meta.url),
      "utf8"
    );

    expect(source).not.toMatch(/from\s+["'][^"']*recommendSneakers/);
    expect(source).not.toMatch(/\brecommendSneakers\s*\(/);
  });
});

function makeCatalogItem() {
  return {
    id: "smx-snk-0001",
    displayName: "Catalog Sneaker",
    tags: ["classic"],
    comparisonPriceYen: 40_000,
    featureValues,
  };
}

function omitFeature(axis: keyof typeof featureValues) {
  const result: Partial<typeof featureValues> = { ...featureValues };
  delete result[axis];
  return result;
}
