import { afterEach, describe, expect, test, vi } from "vitest";

import type { GeminiExplanationOutput } from "../../ai/types";
import type { RecommendationResult } from "../../core/types";
import {
  formatGeminiRecommendationDemo,
  formatGeminiRecommendationDemoItem,
  type GeminiRecommendationDemoItem,
} from "../formatGeminiRecommendationDemo";

function buildRecommendationResult(
  overrides: Partial<RecommendationResult> = {}
): RecommendationResult {
  return {
    sneakerId: "demo_gemini_test_sneaker",
    name: "Demo Gemini Test Sneaker",
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
      finalScore: 88.75,
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

function buildExplanation(
  overrides: Partial<GeminiExplanationOutput> = {}
): GeminiExplanationOutput {
  return {
    provider: "gemini",
    sneakerId: "demo_gemini_test_sneaker",
    name: "Demo Gemini Test Sneaker",
    summary: "A concise demo summary.",
    reasons: ["Strong style fit.", "Comfort score is high."],
    cautions: ["Check personal fit before buying."],
    ...overrides,
  };
}

function buildDemoItem(
  overrides: Partial<GeminiRecommendationDemoItem> = {}
): GeminiRecommendationDemoItem {
  return {
    result: buildRecommendationResult(),
    explanation: buildExplanation(),
    ...overrides,
  };
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: originalFetch,
  });
});

describe("formatGeminiRecommendationDemo", () => {
  test("formats one Gemini demo recommendation item", () => {
    const formatted = formatGeminiRecommendationDemo([buildDemoItem()]);

    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toContain("Demo Gemini Test Sneaker");
  });

  test("includes rank, sneakerId, name, finalScore, and finalDecision", () => {
    const formatted = formatGeminiRecommendationDemoItem(buildDemoItem(), 2);

    expect(formatted).toContain("rank: 2");
    expect(formatted).toContain("sneakerId: demo_gemini_test_sneaker");
    expect(formatted).toContain("name: Demo Gemini Test Sneaker");
    expect(formatted).toContain("finalScore: 88.75");
    expect(formatted).toContain("finalDecision: BUY");
  });

  test("shows provider when Gemini is used", () => {
    const formatted = formatGeminiRecommendationDemo([
      buildDemoItem({
        explanation: buildExplanation({ provider: "gemini" }),
      }),
    ]);

    expect(formatted).toContain("explanationProvider: gemini");
  });

  test("shows provider when rule-based fallback is used", () => {
    const formatted = formatGeminiRecommendationDemo([
      buildDemoItem({
        explanation: buildExplanation({ provider: "rule-based" }),
      }),
    ]);

    expect(formatted).toContain("explanationProvider: rule-based");
  });

  test("does not break when demotions are empty", () => {
    const formatted = formatGeminiRecommendationDemo([
      buildDemoItem({
        result: buildRecommendationResult({ demotions: [] }),
      }),
    ]);

    expect(formatted).toContain("demotions: none");
  });

  test("shows demotions when they exist", () => {
    const formatted = formatGeminiRecommendationDemo([
      buildDemoItem({
        result: buildRecommendationResult({
          finalDecision: "WAIT",
          demotions: ["HIGH_CLOSET_OVERLAP", "LOW_PRICE_FIT"],
        }),
      }),
    ]);

    expect(formatted).toContain(
      "demotions: HIGH_CLOSET_OVERLAP, LOW_PRICE_FIT"
    );
  });

  test("shows reasons and cautions", () => {
    const formatted = formatGeminiRecommendationDemo([
      buildDemoItem({
        explanation: buildExplanation({
          reasons: ["Reason one.", "Reason two."],
          cautions: ["Caution one."],
        }),
      }),
    ]);

    expect(formatted).toContain("reasons:");
    expect(formatted).toContain("- Reason one.");
    expect(formatted).toContain("- Reason two.");
    expect(formatted).toContain("cautions:");
    expect(formatted).toContain("- Caution one.");
  });

  test("does not mutate input objects", () => {
    const item = buildDemoItem({
      result: buildRecommendationResult({
        rawDecision: "STRONG_BUY",
        finalDecision: "WAIT",
        demotions: ["LOW_COMFORT"],
      }),
    });
    const before = structuredClone(item);

    formatGeminiRecommendationDemo([item]);
    formatGeminiRecommendationDemoItem(item, 1);

    expect(item).toEqual(before);
  });

  test("does not perform real network access", () => {
    const fetchMock = vi.fn();
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchMock,
    });

    formatGeminiRecommendationDemo([buildDemoItem()]);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
