import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildCoreInputFromValidatedBoundary,
  type CoreInputBoundaryInput,
} from "./coreInputBoundary";

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
  overrides: Partial<CoreInputBoundaryInput> = {}
): CoreInputBoundaryInput {
  return {
    safeCandidateInput: {
      name: "Unresolved UI Candidate Name",
      candidateTagIds: ["classic", "minimal", "running"],
    },
    resolvedCatalogItem: makeCatalogItem(),
    userBudgetYen: 30_000,
    profileMeta: {
      userId: "user-001",
      updatedAt: "2026-06-23T12:00:00Z",
    },
    ...overrides,
  };
}

describe("buildCoreInputFromValidatedBoundary", () => {
  it("connects validated boundary inputs to a Core-compatible RecommendSneakersInput", () => {
    const result = buildCoreInputFromValidatedBoundary(makeInput());

    expect(result.status).toBe("ready");

    if (result.status !== "ready") {
      throw new Error("expected ready result");
    }

    expect(result.coreInput.preferenceProfile).toEqual({
      userId: "user-001",
      vector: {
        culture: 100,
        styleFit: 100,
        simplicity: 0,
        street: 0,
        volume: 0,
        comfort: 100,
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
        simplicity: 0,
        street: 0,
        volume: 0,
        comfort: 100,
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
    });
    expect(result.coreInput.candidates).toEqual([
      {
        sneakerId: "smx-snk-0001",
        name: "Canonical Catalog Sneaker",
        vector: featureValues,
        tags: ["classic", "comfortable"],
        budgetFit: 75,
      },
    ]);
    expect(Object.keys(result.coreInput.candidates[0]?.vector ?? {})).toHaveLength(
      8
    );
    expect(result.coreInput.preferredTags).toEqual([
      "classic",
      "minimal",
      "running",
    ]);
  });

  it("uses the resolved catalog canonical ID instead of the unresolved candidate name", () => {
    const result = buildCoreInputFromValidatedBoundary(
      makeInput({
        safeCandidateInput: {
          name: "This must never become an ID",
          candidateTagIds: ["classic"],
        },
      })
    );

    expect(result.status).toBe("ready");

    if (result.status === "ready") {
      expect(result.coreInput.candidates[0]?.sneakerId).toBe("smx-snk-0001");
      expect(result.coreInput.candidates[0]?.sneakerId).not.toBe(
        "This must never become an ID"
      );
    }
  });

  it.each([
    [30_000, 30_000, 100],
    [30_000, 40_000, 75],
    [30_000, 60_000, 50],
  ])(
    "maps budget %i and comparison price %i to budgetFit %i",
    (userBudgetYen, comparisonPriceYen, expectedBudgetFit) => {
      const result = buildCoreInputFromValidatedBoundary(
        makeInput({
          userBudgetYen,
          resolvedCatalogItem: {
            ...makeCatalogItem(),
            comparisonPriceYen,
          },
        })
      );

      expect(result.status).toBe("ready");

      if (result.status === "ready") {
        expect(result.coreInput.candidates[0]?.budgetFit).toBe(
          expectedBudgetFit
        );
      }
    }
  );

  it.each([
    [
      "empty tag ids",
      { safeCandidateInput: { name: "Candidate", candidateTagIds: [] } },
      "preference_tags_empty",
    ],
    [
      "unsupported tag id",
      {
        safeCandidateInput: {
          name: "Candidate",
          candidateTagIds: ["classic", "unknown"],
        },
      },
      "preference_tag_unsupported",
    ],
    [
      "duplicate tag id",
      {
        safeCandidateInput: {
          name: "Candidate",
          candidateTagIds: ["classic", "classic"],
        },
      },
      "preference_tag_duplicate",
    ],
    [
      "tag limit exceeded",
      {
        safeCandidateInput: {
          name: "Candidate",
          candidateTagIds: [
            "classic",
            "retro",
            "heritage",
            "minimal",
            "low_tech",
            "street",
          ],
        },
      },
      "preference_tag_limit_exceeded",
    ],
    [
      "resolved catalog item missing",
      { resolvedCatalogItem: null },
      "catalog_unresolved",
    ],
    [
      "catalog id missing",
      { resolvedCatalogItem: { ...makeCatalogItem(), id: undefined } },
      "catalog_id_invalid",
    ],
    [
      "catalog displayName missing",
      {
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          displayName: undefined,
        },
      },
      "catalog_display_name_invalid",
    ],
    [
      "catalog featureValues missing",
      {
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          featureValues: undefined,
        },
      },
      "catalog_feature_values_invalid",
    ],
    [
      "feature dimension missing",
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
    ["budget missing", { userBudgetYen: undefined }, "user_budget_invalid"],
    ["budget invalid", { userBudgetYen: 0 }, "user_budget_invalid"],
    [
      "comparison price missing",
      {
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          comparisonPriceYen: undefined,
        },
      },
      "comparison_price_invalid",
    ],
    [
      "comparison price invalid",
      {
        resolvedCatalogItem: {
          ...makeCatalogItem(),
          comparisonPriceYen: -1,
        },
      },
      "comparison_price_invalid",
    ],
    [
      "userId empty",
      {
        profileMeta: {
          userId: " ",
          updatedAt: "2026-06-23T12:00:00Z",
        },
      },
      "user_id_invalid",
    ],
    [
      "updatedAt invalid",
      {
        profileMeta: {
          userId: "user-001",
          updatedAt: "not-an-iso-date",
        },
      },
      "updated_at_invalid",
    ],
  ] as const)("blocks %s without partial Core input", (_name, overrides, code) => {
    const result = buildCoreInputFromValidatedBoundary(makeInput(overrides));

    expect(result.status).toBe("blocked");
    expect(result.coreInput).toBeNull();
    expect(result.errors.map((error) => error.code)).toContain(code);
  });

  it("does not import or call recommendSneakers and does not create Result UI", () => {
    const source = readFileSync(
      new URL("./coreInputBoundary.ts", import.meta.url),
      "utf8"
    );

    expect(source).not.toMatch(/from\s+["'][^"']*recommendSneakers/);
    expect(source).not.toMatch(/\brecommendSneakers\s*\(/);
    expect(source).not.toMatch(/React|ResultUI|ResultList|ResultDetail/);
  });
});

function makeCatalogItem() {
  return {
    id: "smx-snk-0001",
    displayName: "Canonical Catalog Sneaker",
    tags: ["classic", "comfortable"],
    comparisonPriceYen: 40_000,
    featureValues,
  };
}

function omitFeature(axis: keyof typeof featureValues) {
  const result: Partial<typeof featureValues> = { ...featureValues };
  delete result[axis];
  return result;
}
