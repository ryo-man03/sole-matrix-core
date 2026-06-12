import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { checkCoreRecommendationDryRunReadiness } from "./coreRecommendationDryRun";
import type { CandidateInputMappingResult } from "./types";

function makeMappingResult(
  overrides: Partial<CandidateInputMappingResult> = {}
): CandidateInputMappingResult {
  return {
    isValid: true,
    safeCandidateDraft: {
      name: "Nike Air Max 90",
      candidateTagIds: ["classic", "running"],
    },
    warnings: [],
    unsupportedFields: [],
    missingFields: [],
    ...overrides,
  };
}

describe("checkCoreRecommendationDryRunReadiness", () => {
  it("blocks invalid mapping results", () => {
    const check = checkCoreRecommendationDryRunReadiness(
      makeMappingResult({
        isValid: false,
        safeCandidateDraft: null,
        missingFields: ["sneakerName"],
      })
    );

    expect(check.status).toBe("blocked");
    expect(check.canDryRun).toBe(false);
    expect(check.blockedReasons).toContain("candidate input mapping is invalid");
    expect(check.blockedReasons).toContain("safeCandidateDraft is missing");
  });

  it("blocks when safeCandidateDraft is null", () => {
    const check = checkCoreRecommendationDryRunReadiness(
      makeMappingResult({ safeCandidateDraft: null })
    );

    expect(check.status).toBe("blocked");
    expect(check.canDryRun).toBe(false);
    expect(check.blockedReasons).toContain("safeCandidateDraft is missing");
  });

  it("blocks a valid safeCandidateDraft because Core input is still incomplete", () => {
    const check = checkCoreRecommendationDryRunReadiness(makeMappingResult());

    expect(check).toMatchObject({
      status: "blocked",
      canDryRun: false,
    });
    expect(check.missingCoreFields).toEqual([
      "preferenceProfile",
      "candidates[].sneakerId",
      "candidates[].vector",
      "candidates[].tags",
      "candidates[].budgetFit",
    ]);
    expect(check.blockedReasons).toEqual([
      "safeCandidateDraft is not a complete Core input",
      "preferenceProfile has not been created",
      "sneakerId has not been created for the candidate",
      "candidateVector has not been created",
      "priceLevel has not been created",
      "candidateTagIds are UI-derived tag IDs and have not been mapped to Core tags",
      "budgetFit has not been created",
    ]);
  });

  it("carries mapper warnings forward without changing them", () => {
    const warnings = [
      "unsupported candidate tag: unknown_tag",
      "unsupported field: seenPriceText",
    ];

    const check = checkCoreRecommendationDryRunReadiness(
      makeMappingResult({ warnings })
    );

    expect(check.warnings).toEqual(warnings);
    expect(check.warnings).not.toBe(warnings);
  });

  it("records missing Core field names without generating Core values", () => {
    const check = checkCoreRecommendationDryRunReadiness(makeMappingResult());

    expect(check.missingCoreFields).toContain("preferenceProfile");
    expect(check.missingCoreFields).toContain("candidates[].vector");
    expect(check.missingCoreFields).toContain("candidates[].budgetFit");
    expect(check.missingCoreFields).not.toContain(
      "candidates[].vector.priceLevel"
    );
    expect(check).not.toHaveProperty("preferenceProfile");
    expect(check).not.toHaveProperty("candidateVector");
    expect(check).not.toHaveProperty("priceLevel");
    expect(check).not.toHaveProperty("budgetFit");
  });

  it("does not create UI recommendation result values", () => {
    const check = checkCoreRecommendationDryRunReadiness(makeMappingResult());

    expect(check).not.toHaveProperty("finalRecommendation");
    expect(check).not.toHaveProperty("resultList");
    expect(check).not.toHaveProperty("resultDetail");
    expect(check).not.toHaveProperty("buyScore");
    expect(check).not.toHaveProperty("personalFitScore");
    expect(check).not.toHaveProperty("recommendationResult");
  });

  it("keeps the guard independent from Core execution, UI, and external features", () => {
    const source = readFileSync(
      new URL("./coreRecommendationDryRun.ts", import.meta.url),
      "utf8"
    );

    expect(source).not.toMatch(/recommendSneakers/);
    expect(source).not.toMatch(/src\/core|src\/domain|src\/data|@\/src|~\/src/);
    expect(source).not.toMatch(/ResultList|ResultDetail|BuyScore|PersonalFit/);
    expect(source).not.toMatch(/Gemini|OpenAI|fetch\(|localStorage|sessionStorage/);
    expect(source).not.toMatch(/React|useState|useEffect/);
    expect(source).not.toMatch(
      /candidateVector\s*:|priceLevel\s*:|budgetFit\s*:|preferenceProfile\s*:/
    );
  });
});
