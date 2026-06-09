# 06. BALANCED SCORE FINAL

## 1. featureFitScore

```ts
const featureFitScore =
  cultureScore * weights.culture +
  styleScore * weights.styleFit +
  simplicityScore * weights.simplicity +
  streetScore * weights.street +
  volumeScore * weights.volume +
  comfortScore * weights.comfort +
  durabilityScore * weights.durability +
  tagBonus * weights.tagBonus;
```

## 2. finalScore

```ts
const nonOverlapScore = 100 - overlapPenalty;

const finalScore = clampScore(
  featureFitScore * 0.72 +
  priceScore * 0.18 +
  nonOverlapScore * 0.10
);
```

## 3. calculateBalancedScore()の責務

```ts
export function calculateBalancedScore(input: {
  profile: PreferenceProfile;
  candidate: SneakerCandidate;
  ownedSneakers: OwnedSneakerSummary[];
  preferredTags: SneakerTag[];
}): {
  scoreBreakdown: ScoreBreakdown;
  rawDecision: PurchaseDecision;
  finalDecision: PurchaseDecision;
  demotions: DemotionReason[];
} {
  // 1. 軸スコア
  // 2. weights
  // 3. featureFitScore
  // 4. priceScore
  // 5. overlapPenalty
  // 6. finalScore
  // 7. rawDecision
  // 8. demotion
  // 9. return
}
```

## 4. 禁止

- featureFitScoreにpriceScoreを単純加算しない
- finalScoreを100点超え前提でclampしない
- comfort / durabilityを近さで評価しない
- Ryo Curator Modeを混ぜない
- AIを呼ばない
