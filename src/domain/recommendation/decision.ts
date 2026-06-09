export type PurchaseDecision =
  | "STRONG_BUY"
  | "BUY"
  | "WAIT"
  | "WATCH"
  | "SKIP";

export function decideFromScore(finalScore: number): PurchaseDecision {
  if (finalScore >= 85) return "STRONG_BUY";
  if (finalScore >= 75) return "BUY";
  if (finalScore >= 60) return "WAIT";
  if (finalScore >= 45) return "WATCH";
  return "SKIP";
}
