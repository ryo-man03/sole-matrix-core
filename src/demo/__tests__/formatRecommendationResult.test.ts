import { describe, expect, test } from "vitest";

import type { RecommendationResult } from "../../core/types";
import {
  formatRecommendationResult,
  formatRecommendationResults,
} from "../formatRecommendationResult";

function buildRecommendationResult(
  overrides: Partial<RecommendationResult> = {}
): RecommendationResult {
  return {
    sneakerId: "demo_test_sneaker",
    name: "Demo Test Sneaker",
    inputIndex: 0,
    scoreBreakdown: {
      cultureScore: 80,
      styleScore: 81,
      simplicityScore: 82,
      streetScore: 83,
      volumeScore: 84,
      comfortScore: 85,
      durabilityScore: 86,
      tagBonus: 3,
      featureFitScore: 82.5,
      priceScore: 76,
      overlapPenalty: 10,
      nonOverlapScore: 90,
      finalScore: 78.52,
      axisWeightsApplied: {
        culture: 1,
      },
    },
    rawDecision: "BUY",
    finalDecision: "BUY",
    demotions: [],
    ...overrides,
  };
}

describe("formatRecommendationResult", () => {
  test("formats one recommendation result", () => {
    const formatted = formatRecommendationResult(buildRecommendationResult(), 1);

    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toContain("Demo Test Sneaker");
  });

  test("includes rank, sneakerId, name, finalScore, and finalDecision", () => {
    const formatted = formatRecommendationResult(buildRecommendationResult(), 2);

    expect(formatted).toContain("rank: 2");
    expect(formatted).toContain("sneakerId: demo_test_sneaker");
    expect(formatted).toContain("name: Demo Test Sneaker");
    expect(formatted).toContain("finalScore: 78.52");
    expect(formatted).toContain("finalDecision: BUY");
  });

  test("shows demotions when they exist", () => {
    const formatted = formatRecommendationResult(
      buildRecommendationResult({
        finalDecision: "WAIT",
        demotions: ["HIGH_CLOSET_OVERLAP", "LOW_PRICE_FIT"],
      }),
      1
    );

    expect(formatted).toContain(
      "demotions: HIGH_CLOSET_OVERLAP, LOW_PRICE_FIT"
    );
  });

  test("does not break when demotions are empty", () => {
    const formatted = formatRecommendationResult(
      buildRecommendationResult({ demotions: [] }),
      1
    );

    expect(formatted).toContain("demotions: none");
  });

  test("does not mutate score or decision values", () => {
    const result = buildRecommendationResult({
      rawDecision: "STRONG_BUY",
      finalDecision: "WAIT",
      demotions: ["LOW_COMFORT"],
    });
    const before = structuredClone(result);

    formatRecommendationResult(result, 1);
    formatRecommendationResults([result]);

    expect(result).toEqual(before);
    expect(result.scoreBreakdown.finalScore).toBe(78.52);
    expect(result.rawDecision).toBe("STRONG_BUY");
    expect(result.finalDecision).toBe("WAIT");
  });
});
