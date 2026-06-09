import type { GeminiExplanationOutput } from "../ai/types";
import type { RecommendationResult } from "../core/types";

export type GeminiRecommendationDemoItem = {
  result: RecommendationResult;
  explanation: GeminiExplanationOutput;
};

export function formatGeminiRecommendationDemo(
  items: GeminiRecommendationDemoItem[],
  limit = 3
): string {
  const visibleItems = items.slice(0, limit);

  if (visibleItems.length === 0) {
    return "No recommendation results.";
  }

  return visibleItems
    .map((item, index) => formatGeminiRecommendationDemoItem(item, index + 1))
    .join("\n\n");
}

export function formatGeminiRecommendationDemoItem(
  item: GeminiRecommendationDemoItem,
  rank: number
): string {
  const { result, explanation } = item;
  const demotions =
    result.demotions.length > 0 ? result.demotions.join(", ") : "none";

  return [
    `rank: ${rank}`,
    `sneakerId: ${result.sneakerId}`,
    `name: ${result.name}`,
    `finalScore: ${formatScore(result.scoreBreakdown.finalScore)}`,
    `rawDecision: ${result.rawDecision}`,
    `finalDecision: ${result.finalDecision}`,
    `demotions: ${demotions}`,
    `explanationProvider: ${explanation.provider}`,
    `summary: ${explanation.summary}`,
    "reasons:",
    formatList(explanation.reasons),
    "cautions:",
    formatList(explanation.cautions),
  ].join("\n");
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- none";
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}
