import type { RecommendationResult } from "../core/types";

export function formatRecommendationResult(
  result: RecommendationResult,
  rank: number
): string {
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
  ].join("\n");
}

export function formatRecommendationResults(
  results: RecommendationResult[],
  limit = 5
): string {
  const visibleResults = results.slice(0, limit);

  if (visibleResults.length === 0) {
    return "No recommendation results.";
  }

  return visibleResults
    .map((result, index) => formatRecommendationResult(result, index + 1))
    .join("\n\n");
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}
