import type { PurchaseDecision } from "./decision";
import type { ScoreBreakdown } from "./scoreBreakdown";

export type DemotionReason =
  | "HIGH_CLOSET_OVERLAP"
  | "LOW_PRICE_FIT"
  | "LOW_COMFORT"
  | "LOW_DURABILITY";

export function applyDemotions(input: {
  rawDecision: PurchaseDecision;
  scoreBreakdown: ScoreBreakdown;
}): {
  finalDecision: PurchaseDecision;
  demotions: DemotionReason[];
} {
  const demotions: DemotionReason[] = [];
  const isBuyOrAbove =
    input.rawDecision === "STRONG_BUY" || input.rawDecision === "BUY";

  if (isBuyOrAbove && input.scoreBreakdown.overlapPenalty >= 75) {
    demotions.push("HIGH_CLOSET_OVERLAP");
  }

  if (isBuyOrAbove && input.scoreBreakdown.priceScore < 45) {
    demotions.push("LOW_PRICE_FIT");
  }

  if (isBuyOrAbove && input.scoreBreakdown.comfortScore < 40) {
    demotions.push("LOW_COMFORT");
  }

  if (isBuyOrAbove && input.scoreBreakdown.durabilityScore < 45) {
    demotions.push("LOW_DURABILITY");
  }

  return {
    finalDecision: demotions.length > 0 ? "WAIT" : input.rawDecision,
    demotions,
  };
}
