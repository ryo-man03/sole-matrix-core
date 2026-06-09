# 07. DECISION AND DEMOTION

## 1. Decision閾値

```ts
export function decideFromScore(finalScore: number): PurchaseDecision {
  if (finalScore >= 85) return "STRONG_BUY";
  if (finalScore >= 75) return "BUY";
  if (finalScore >= 60) return "WAIT";
  if (finalScore >= 45) return "WATCH";
  return "SKIP";
}
```

## 2. Demotion理由

```ts
export type DemotionReason =
  | "HIGH_CLOSET_OVERLAP"
  | "LOW_PRICE_FIT"
  | "LOW_COMFORT"
  | "LOW_DURABILITY";
```

## 3. Demotionルール

| 条件 | 処理 |
|---|---|
| overlapPenalty >= 75 and rawDecision is BUY以上 | WAITへ降格 |
| priceScore < 45 and rawDecision is BUY以上 | WAITへ降格 |
| comfortScore < 40 and rawDecision is BUY以上 | WAITへ降格 |
| durabilityScore < 45 and rawDecision is BUY以上 | WAITへ降格 |

## 4. 実装例

```ts
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
```
