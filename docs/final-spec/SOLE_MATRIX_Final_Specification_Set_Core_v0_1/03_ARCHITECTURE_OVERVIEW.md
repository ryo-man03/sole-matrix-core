# 03. ARCHITECTURE OVERVIEW

## 1. Core v0.1構成

```txt
src/domain/profile/
  preferenceTypes.ts

src/domain/sneaker/
  sneakerVector.ts
  sneakerTag.ts

src/domain/recommendation/
  axes.ts
  scoreUtils.ts
  axisWeights.ts
  tagBonus.ts
  priceScore.ts
  overlapPenalty.ts
  balancedScore.ts
  decision.ts
  demotion.ts
  scoreBreakdown.ts
  snapshot.ts

src/domain/recommendation/__fixtures__/
  samplePreferenceProfiles.ts
  sampleSneakerVectors.ts
  sampleOwnedSneakers.ts
  expectedScoreBreakdowns.ts
  expectedDecisions.ts
  expectedDemotions.ts
  expectedSnapshots.ts

src/domain/recommendation/__tests__/
  balancedScore.golden.test.ts
  decision.test.ts
  demotion.test.ts
```

## 2. 依存方向

```txt
profile types
sneaker types
↓
score utils
axis weights
tag bonus
price score
overlap penalty
↓
balanced score
decision
demotion
snapshot
↓
golden test
```

## 3. 禁止する依存

Core v0.1では以下へ依存しない。

```txt
React
Next.js page
Supabase
OpenAI API
external market API
browser localStorage
```

## 4. 完了条件

- domain層だけでテスト可能
- `pnpm test`でgolden testが通る
- UIなしで仕様を検証できる
