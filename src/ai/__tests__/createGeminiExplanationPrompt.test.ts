import { describe, expect, test } from "vitest";

import type { RecommendationResult, ScoreBreakdown } from "../../core/types";
import type { RuleBasedExplanation } from "../../explanation/types";
import { createGeminiExplanationPrompt } from "../createGeminiExplanationPrompt";

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

const result: RecommendationResult = {
  sneakerId: "matrix-runner-001",
  name: "Matrix Runner",
  inputIndex: 0,
  scoreBreakdown: baseScoreBreakdown,
  rawDecision: "BUY",
  finalDecision: "WAIT",
  demotions: ["HIGH_CLOSET_OVERLAP"],
};

const fallback: RuleBasedExplanation = {
  sneakerId: "matrix-runner-001",
  name: "Matrix Runner",
  summary: "Fallback summary from deterministic rules.",
  reasons: ["Fallback reason one.", "Fallback reason two."],
  cautions: ["Fallback caution one."],
};

describe("createGeminiExplanationPrompt", () => {
  test("includes sneakerId, name, finalDecision, and finalScore", () => {
    const prompt = createGeminiExplanationPrompt({ result, fallback });

    expect(prompt).toContain("matrix-runner-001");
    expect(prompt).toContain("Matrix Runner");
    expect(prompt).toContain('"finalDecision": "WAIT"');
    expect(prompt).toContain('"finalScore": 78');
  });

  test("instructs Gemini not to change scores or decisions", () => {
    const prompt = createGeminiExplanationPrompt({ result, fallback });

    expect(prompt).toMatch(/Do not change, reinterpret, recalculate, or override any score/i);
    expect(prompt).toMatch(/Do not change finalDecision/i);
    expect(prompt).toMatch(/Do not change rawDecision/i);
    expect(prompt).toMatch(/Do not change demotions/i);
  });

  test("instructs Gemini not to assert price, stock, resale premium, or authenticity", () => {
    const prompt = createGeminiExplanationPrompt({ result, fallback });

    expect(prompt).toMatch(/real-world prices/i);
    expect(prompt).toMatch(/stock availability/i);
    expect(prompt).toMatch(/resale premiums/i);
    expect(prompt).toMatch(/authenticity/i);
  });

  test("includes fallback explanation content", () => {
    const prompt = createGeminiExplanationPrompt({ result, fallback });

    expect(prompt).toContain(fallback.summary);
    expect(prompt).toContain(fallback.reasons[0]);
    expect(prompt).toContain(fallback.reasons[1]);
    expect(prompt).toContain(fallback.cautions[0]);
  });
});

