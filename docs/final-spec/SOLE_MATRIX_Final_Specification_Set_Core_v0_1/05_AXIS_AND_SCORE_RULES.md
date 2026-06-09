# 05. AXIS AND SCORE RULES

## 1. TasteAxisは近さで評価する

```ts
export function calculateTasteAxisScore(userValue: number, sneakerValue: number): number {
  return clampScore(100 - Math.abs(userValue - sneakerValue));
}
```

## 2. QualityAxisは靴側の値を基本にする

```ts
export function calculateQualityAxisScore(sneakerValue: number): number {
  return clampScore(sneakerValue);
}
```

comfort / durabilityを近さで評価しない。

## 3. calculateAxisWeights()

```ts
const BASE_FEATURE_WEIGHTS = {
  culture: 0.12,
  styleFit: 0.18,
  simplicity: 0.12,
  street: 0.10,
  volume: 0.08,
  comfort: 0.18,
  durability: 0.14,
  tagBonus: 0.08,
} as const;

export function calculateAxisWeights(axisImportance: AxisImportance) {
  const raw = {
    culture: BASE_FEATURE_WEIGHTS.culture * (0.5 + axisImportance.culture / 100),
    styleFit: BASE_FEATURE_WEIGHTS.styleFit * (0.5 + axisImportance.styleFit / 100),
    simplicity: BASE_FEATURE_WEIGHTS.simplicity * (0.5 + axisImportance.simplicity / 100),
    street: BASE_FEATURE_WEIGHTS.street * (0.5 + axisImportance.street / 100),
    volume: BASE_FEATURE_WEIGHTS.volume * (0.5 + axisImportance.volume / 100),
    comfort: BASE_FEATURE_WEIGHTS.comfort * (0.5 + axisImportance.comfort / 100),
    durability: BASE_FEATURE_WEIGHTS.durability * (0.5 + axisImportance.durability / 100),
    tagBonus: BASE_FEATURE_WEIGHTS.tagBonus,
  };

  return normalizeWeights(raw);
}
```

## 4. calculateTagBonus()

```ts
export function calculateTagBonus(candidateTags: SneakerTag[], preferredTags: SneakerTag[]): number {
  const matched = candidateTags.filter((tag) => preferredTags.includes(tag)).length;
  return clampScore(Math.min(100, matched * 25));
}
```

## 5. calculatePriceScore()

```ts
export function calculatePriceScore(input: {
  priceSensitivity: number;
  priceLevel: number;
  budgetFit: number;
}): number {
  const sensitivityPenalty =
    (input.priceSensitivity / 100) *
    (input.priceLevel / 100) *
    40;

  return clampScore(input.budgetFit - sensitivityPenalty);
}
```

## 6. calculateOverlapPenalty()

```ts
export function calculateOverlapPenalty(input: {
  candidateTags: SneakerTag[];
  ownedSneakers: OwnedSneakerSummary[];
  overlapSensitivity: number;
}): number {
  const maxOverlap = Math.max(
    0,
    ...input.ownedSneakers.map((owned) => {
      const overlapCount = input.candidateTags.filter((tag) =>
        owned.roleTags.includes(tag)
      ).length;

      const base = Math.min(100, overlapCount * 25);

      const wearFrequencyFactor =
        owned.wearFrequency === "high" ? 1.0 :
        owned.wearFrequency === "medium" ? 0.8 :
        0.6;

      return base * wearFrequencyFactor;
    })
  );

  const sensitivityFactor = 0.5 + input.overlapSensitivity / 100;
  return clampScore(maxOverlap * sensitivityFactor);
}
```

## 7. rounding policy

- 内部計算は丸めない
- ScoreBreakdown保存時は小数第2位
- axisWeightsAppliedは小数第4位
- Decision判定は丸め前finalScore
- fixture比較では丸め後の値
