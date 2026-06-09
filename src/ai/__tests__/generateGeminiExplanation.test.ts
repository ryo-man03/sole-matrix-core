import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { RecommendationResult, ScoreBreakdown } from "../../core/types";
import type { RuleBasedExplanation } from "../../explanation/types";
import { generateGeminiExplanation } from "../generateGeminiExplanation";
import type { GeminiExplanationInput } from "../types";

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
  sneakerId: "fallback-id-should-not-win",
  name: "Fallback Name Should Not Win",
  summary: "Rule-based fallback summary.",
  reasons: ["Rule-based fallback reason."],
  cautions: ["Rule-based fallback caution."],
};

const input: GeminiExplanationInput = { result, fallback };

const originalGeminiApiKey = process.env.GEMINI_API_KEY;
const originalGoogleApiKey = process.env.GOOGLE_API_KEY;

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
});

afterEach(() => {
  restoreEnv("GEMINI_API_KEY", originalGeminiApiKey);
  restoreEnv("GOOGLE_API_KEY", originalGoogleApiKey);
  vi.restoreAllMocks();
});

describe("generateGeminiExplanation", () => {
  test("returns rule-based fallback when apiKey is missing", async () => {
    const fetcher = vi.fn(async () => createGeminiResponse(successText()));

    const output = await generateGeminiExplanation(input, {
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(output).toEqual({
      provider: "rule-based",
      sneakerId: result.sneakerId,
      name: result.name,
      summary: fallback.summary,
      reasons: fallback.reasons,
      cautions: fallback.cautions,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("returns provider gemini when fetcher returns a successful response", async () => {
    const fetcher = vi.fn(async () => createGeminiResponse(successText()));

    const output = await generateGeminiExplanation(input, {
      apiKey: "test-api-key",
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(output).toEqual({
      provider: "gemini",
      sneakerId: result.sneakerId,
      name: result.name,
      summary: "Natural Gemini summary.",
      reasons: ["Natural Gemini reason."],
      cautions: ["Natural Gemini caution."],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("falls back when Gemini response text is empty", async () => {
    const fetcher = vi.fn(async () => createGeminiResponse(""));

    const output = await generateGeminiExplanation(input, {
      apiKey: "test-api-key",
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(output.provider).toBe("rule-based");
    expect(output.summary).toBe(fallback.summary);
  });

  test("falls back when fetcher throws", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("network disabled in tests");
    });

    const output = await generateGeminiExplanation(input, {
      apiKey: "test-api-key",
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(output.provider).toBe("rule-based");
    expect(output.summary).toBe(fallback.summary);
  });

  test("keeps sneakerId and name from input result", async () => {
    const fetcher = vi.fn(async () => createGeminiResponse(successText()));

    const output = await generateGeminiExplanation(input, {
      apiKey: "test-api-key",
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(output.sneakerId).toBe(result.sneakerId);
    expect(output.name).toBe(result.name);
  });

  test("does not perform real network communication during tests", async () => {
    const globalFetch = vi.spyOn(globalThis, "fetch");
    const fetcher = vi.fn(async () => createGeminiResponse(successText()));

    await generateGeminiExplanation(input, {
      apiKey: "test-api-key",
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(globalFetch).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("returns the same result for the same mock input", async () => {
    const fetcher = vi.fn(async () => createGeminiResponse(successText()));

    const first = await generateGeminiExplanation(input, {
      apiKey: "test-api-key",
      fetcher: fetcher as unknown as typeof fetch,
    });
    const second = await generateGeminiExplanation(input, {
      apiKey: "test-api-key",
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(first).toEqual(second);
  });

  test("does not call fetcher when GEMINI_API_KEY is missing", async () => {
    const fetcher = vi.fn(async () => createGeminiResponse(successText()));

    await generateGeminiExplanation(input, {
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(fetcher).not.toHaveBeenCalled();
  });

  test("falls back when only GOOGLE_API_KEY is present in v0.2", async () => {
    process.env.GOOGLE_API_KEY = "google-api-key-for-other-clients";
    const fetcher = vi.fn(async () => createGeminiResponse(successText()));

    const output = await generateGeminiExplanation(input, {
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(output.provider).toBe("rule-based");
    expect(fetcher).not.toHaveBeenCalled();
  });
});

function successText(): string {
  return JSON.stringify({
    summary: "Natural Gemini summary.",
    reasons: ["Natural Gemini reason."],
    cautions: ["Natural Gemini caution."],
  });
}

function createGeminiResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

