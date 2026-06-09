import { describe, expect, test } from "vitest";

import type { RecommendationResult, ScoreBreakdown } from "../../core/types";
import { createRuleBasedExplanation } from "../createRuleBasedExplanation";

const baseScoreBreakdown: ScoreBreakdown = {
  cultureScore: 72,
  styleScore: 80,
  simplicityScore: 68,
  streetScore: 62,
  volumeScore: 55,
  comfortScore: 76,
  durabilityScore: 70,
  tagBonus: 4,
  featureFitScore: 82,
  priceScore: 65,
  overlapPenalty: 20,
  nonOverlapScore: 80,
  finalScore: 78,
  axisWeightsApplied: {
    culture: 1,
    style: 1,
    simplicity: 1,
    street: 1,
    volume: 1,
    comfort: 1,
    durability: 1,
  },
};

function createResult(
  overrides: Partial<RecommendationResult> = {}
): RecommendationResult {
  return {
    sneakerId: "test-sneaker",
    name: "Test Sneaker",
    inputIndex: 0,
    scoreBreakdown: baseScoreBreakdown,
    rawDecision: "BUY",
    finalDecision: "BUY",
    demotions: [],
    ...overrides,
  };
}

function cloneResult(result: RecommendationResult): RecommendationResult {
  return JSON.parse(JSON.stringify(result)) as RecommendationResult;
}

describe("createRuleBasedExplanation", () => {
  test("generates an explanation from RecommendationResult", () => {
    const explanation = createRuleBasedExplanation(createResult());

    expect(explanation).toEqual(
      expect.objectContaining({
        sneakerId: expect.any(String),
        name: expect.any(String),
        summary: expect.any(String),
        reasons: expect.any(Array),
        cautions: expect.any(Array),
      })
    );
  });

  test("includes sneakerId and name in the return value", () => {
    const explanation = createRuleBasedExplanation(
      createResult({
        sneakerId: "abc-123",
        name: "Matrix Runner",
      })
    );

    expect(explanation.sneakerId).toBe("abc-123");
    expect(explanation.name).toBe("Matrix Runner");
  });

  test("returns a non-empty summary", () => {
    const explanation = createRuleBasedExplanation(createResult());

    expect(explanation.summary.trim()).not.toBe("");
  });

  test("generates at least one reason", () => {
    const explanation = createRuleBasedExplanation(createResult());

    expect(explanation.reasons.length).toBeGreaterThanOrEqual(1);
  });

  test("reflects demotions in cautions or reasons when demotions exist", () => {
    const explanation = createRuleBasedExplanation(
      createResult({
        rawDecision: "BUY",
        finalDecision: "WAIT",
        demotions: ["HIGH_CLOSET_OVERLAP"],
        scoreBreakdown: {
          ...baseScoreBreakdown,
          overlapPenalty: 80,
          nonOverlapScore: 20,
        },
      })
    );

    const text = [...explanation.reasons, ...explanation.cautions].join("\n");
    expect(text).toContain("所有靴との被り");
  });

  test("does not break when demotions are empty", () => {
    const explanation = createRuleBasedExplanation(
      createResult({ demotions: [] })
    );

    expect(explanation.summary.trim()).not.toBe("");
    expect(explanation.reasons.length).toBeGreaterThanOrEqual(1);
    expect(explanation.cautions).toEqual(expect.any(Array));
  });

  test.each(["BUY", "WAIT", "SKIP"] as const)(
    "generates explanation for %s decision",
    (decision) => {
      const explanation = createRuleBasedExplanation(
        createResult({
          rawDecision: decision,
          finalDecision: decision,
          scoreBreakdown: {
            ...baseScoreBreakdown,
            finalScore:
              decision === "BUY" ? 78 : decision === "WAIT" ? 62 : 40,
          },
        })
      );

      expect(explanation.summary).toContain(decision);
      expect(explanation.reasons.length).toBeGreaterThanOrEqual(1);
    }
  );

  test("does not mutate the input RecommendationResult", () => {
    const result = createResult({
      rawDecision: "BUY",
      finalDecision: "WAIT",
      demotions: ["LOW_COMFORT"],
      scoreBreakdown: {
        ...baseScoreBreakdown,
        comfortScore: 30,
      },
    });
    const before = cloneResult(result);

    createRuleBasedExplanation(result);

    expect(result).toEqual(before);
  });

  test("does not include statements about real-world price, stock, resale value, or authenticity", () => {
    const explanation = createRuleBasedExplanation(
      createResult({
        rawDecision: "BUY",
        finalDecision: "WAIT",
        demotions: ["LOW_PRICE_FIT"],
        scoreBreakdown: {
          ...baseScoreBreakdown,
          priceScore: 30,
        },
      })
    );
    const text = [
      explanation.summary,
      ...explanation.reasons,
      ...explanation.cautions,
    ].join("\n");

    expect(text).not.toMatch(
      /実在価格|実売価格|在庫|プレ値|リセール|真贋|本物|偽物|正規品|絶対に買うべき/
    );
  });

  test("returns the same explanation for the same input", () => {
    const result = createResult({
      rawDecision: "BUY",
      finalDecision: "WAIT",
      demotions: ["LOW_DURABILITY"],
      scoreBreakdown: {
        ...baseScoreBreakdown,
        durabilityScore: 40,
      },
    });

    expect(createRuleBasedExplanation(result)).toEqual(
      createRuleBasedExplanation(result)
    );
  });
});
