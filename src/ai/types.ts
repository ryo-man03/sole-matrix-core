import type { RecommendationResult } from "../core/types";
import type { RuleBasedExplanation } from "../explanation/types";

export type GeminiExplanationInput = {
  result: RecommendationResult;
  fallback: RuleBasedExplanation;
};

export type GeminiExplanationOutput = {
  provider: "gemini" | "rule-based";
  sneakerId: string;
  name: string;
  summary: string;
  reasons: string[];
  cautions: string[];
};

