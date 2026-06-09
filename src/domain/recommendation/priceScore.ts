import { clampScore } from "./scoreUtils";

export function calculatePriceScore(input: {
  priceSensitivity: number;
  priceLevel: number;
  budgetFit: number;
}): number {
  const sensitivityPenalty =
    (input.priceSensitivity / 100) * (input.priceLevel / 100) * 40;

  return clampScore(input.budgetFit - sensitivityPenalty);
}
