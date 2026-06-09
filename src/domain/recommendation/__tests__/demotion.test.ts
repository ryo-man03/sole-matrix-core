import { describe, expect, test } from "vitest";

import { applyDemotions } from "../demotion";
import type { ScoreBreakdown } from "../scoreBreakdown";

const baseBreakdown: ScoreBreakdown = {
  cultureScore: 100,
  styleScore: 100,
  simplicityScore: 100,
  streetScore: 100,
  volumeScore: 100,
  comfortScore: 80,
  durabilityScore: 80,
  tagBonus: 0,
  featureFitScore: 90,
  priceScore: 80,
  overlapPenalty: 0,
  nonOverlapScore: 100,
  finalScore: 85,
  axisWeightsApplied: {},
};

describe("applyDemotions", () => {
  test("does not demote WAIT or below", () => {
    expect(
      applyDemotions({
        rawDecision: "WAIT",
        scoreBreakdown: {
          ...baseBreakdown,
          overlapPenalty: 100,
          priceScore: 30,
          comfortScore: 35,
          durabilityScore: 40,
        },
      })
    ).toEqual({
      finalDecision: "WAIT",
      demotions: [],
    });
  });

  test("demotes BUY or above to WAIT by Core v0.1 reasons", () => {
    expect(
      applyDemotions({
        rawDecision: "BUY",
        scoreBreakdown: {
          ...baseBreakdown,
          overlapPenalty: 75,
          priceScore: 44.99,
          comfortScore: 39.99,
          durabilityScore: 44.99,
        },
      })
    ).toEqual({
      finalDecision: "WAIT",
      demotions: [
        "HIGH_CLOSET_OVERLAP",
        "LOW_PRICE_FIT",
        "LOW_COMFORT",
        "LOW_DURABILITY",
      ],
    });
  });
});
