# SOLE//MATRIX Final Specification Set
# Core v0.1 Recommendation Logic & Test Fixture Lock




<!-- FILE: 01_PROJECT_OVERVIEW.md -->

# 01. PROJECT OVERVIEW

## 1. プロジェクト名

```txt
SOLE//MATRIX
```

## 2. 背景

スニーカー購入は、見た目、ブランド、流行、価格、所有靴との被り、履きやすさなど、複数の要素が絡む。  
しかし実際には「なんとなく欲しい」「SNSで見たから欲しい」という判断になりやすい。

SOLE//MATRIXは、その曖昧な購入判断を、再現可能なスコアと判断理由に分解する。

## 3. 解決したい問題

| 問題 | 内容 |
|---|---|
| 判断理由が曖昧 | なぜ欲しいのか説明できない |
| 所有靴との被り | 似た役割の靴を何足も買ってしまう |
| 価格への迷い | 高い靴を買う理由が整理できない |
| AI丸投げ | AIが推薦しても根拠が追えない |
| 再現性不足 | 同じ入力で同じ結果が返る保証がない |

## 4. 対象ユーザー

- スニーカーが好きな学生・個人
- 所有靴が増えて購入判断を整理したい人
- 好みや購入理由を言語化したい人
- AIを使った推薦システムをポートフォリオとして示したい開発者
- 将来的に卒業研究として推薦理由の納得度を分析したい学生

## 5. 目的

SOLE//MATRIXの目的は、スニーカー購入を以下で整理すること。

- 好み
- 所有靴
- 価格感度
- 履きやすさ
- 被り
- 判断理由
- 再現可能なスコア
- Snapshot

## 6. このプロジェクトでやること

- PreferenceProfileを定義する
- SneakerVectorを定義する
- BalancedScoreを実装する
- Decision / Demotionを実装する
- ScoreBreakdownを保存可能にする
- RecommendationSnapshotを固定する
- golden testで再現性を保証する

## 7. このプロジェクトでやらないこと

Core v0.1では以下をやらない。

- UI
- DB
- AI説明生成
- OpenAI API
- 外部価格API
- プレ値予測
- 真贋判定
- 課金
- スクレイピング

## 8. 特徴

| 特徴 | 内容 |
|---|---|
| AI丸投げ禁止 | スコアと判定はコードで決める |
| 再現性 | 同じ入力なら同じ結果 |
| 説明可能性 | ScoreBreakdownで理由を追える |
| Snapshot | 推薦時点の状態を保存できる |
| golden test | 期待値を固定して実装を検証する |

## 9. ポートフォリオとしての見せ方

「AIでおすすめを出すアプリ」では弱い。  
ポートフォリオでは以下のように説明する。

```txt
推薦判定をAIに丸投げせず、
型・スコア計算・Snapshot・golden testで再現可能にした
説明可能なスニーカー購入判断支援システム
```

## 10. 卒業研究への発展可能性

将来的には、質問診断、所有靴、欲しい靴、feedback、AI説明の有無によって、推薦理由への納得度や所有靴との重複回避に差が出るかを評価できる。

## 11. Core v0.1の位置づけ

Core v0.1はブラウザで動くアプリではない。  
推薦ロジックの最小核を完成させる段階である。



<!-- FILE: 02_FINAL_SCOPE.md -->

# 02. FINAL SCOPE

## 1. Core v0.1で実装する範囲

- TasteAxis / QualityAxis
- PreferenceVector
- PreferencePolicy
- AxisImportance
- PreferenceProfile
- SneakerVector
- SneakerTag
- priceScore
- overlapPenalty
- BalancedScore
- Decision
- Demotion
- ScoreBreakdown
- RecommendationSnapshot
- golden test
- Vitest
- TypeScript fixture

## 2. Core v0.1で実装しない範囲

- 診断画面
- Ryo Curator Mode UI
- 所有靴入力UI
- Wishlist
- feedback保存
- Preference Profile DB保存
- Supabase Auth
- RLS
- AI説明生成
- OpenAI API
- Market Observation
- 外部価格API
- プレ値予測
- 真贋判定
- 課金

## 3. Core v0.2以降に回すもの

- 質問診断
- answerToVector
- 最低限の画面
- Ryo Curator Mode比較

## 4. Core v1.0以降に回すもの

- Supabase Auth
- DB保存
- RLS
- AI説明生成
- fallback
- E2E

## 5. Core v2以降に回すもの

- 外部API検証
- StockX等の公式API検討
- 第三者API検討
- 価格推移
- プレ値予測の研究検討

## 6. 今回これ以上広げない理由

Core v0.1の目的は、推薦ロジックの再現性を完成させること。  
UI、DB、AIを入れると、どこが失敗しているか切り分けできなくなる。

```txt
Core v0.1 = ロジックとテスト
Core v0.2以降 = UIや入力体験
Core v1.0以降 = DBとAI説明
```



<!-- FILE: 03_ARCHITECTURE_OVERVIEW.md -->

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



<!-- FILE: 04_FINAL_TYPES.md -->

# 04. FINAL TYPES

```ts
export type TasteAxis =
  | "culture"
  | "styleFit"
  | "simplicity"
  | "street"
  | "volume";

export type QualityAxis =
  | "comfort"
  | "durability";

export type PreferenceVector = {
  culture: number;
  styleFit: number;
  simplicity: number;
  street: number;
  volume: number;
  comfort: number;
  durability: number;
};

export type PreferencePolicy = {
  priceSensitivity: number;
  overlapSensitivity: number;
  explorationTolerance: number;
};

export type AxisImportance = {
  culture: number;
  styleFit: number;
  simplicity: number;
  street: number;
  volume: number;
  comfort: number;
  durability: number;
};

export type PreferenceProfile = {
  userId: string;
  vector: PreferenceVector;
  policy: PreferencePolicy;
  axisImportance: AxisImportance;
  sourceConfidence: {
    diagnosis: number;
    ownedSneakers: number;
    wantedSneakers: number;
    feedback: number;
  };
  profileVersion: number;
  updatedAt: string;
};

export type SneakerVector = {
  culture: number;
  styleFit: number;
  simplicity: number;
  street: number;
  volume: number;
  comfort: number;
  durability: number;
  priceLevel: number;
};

export type SneakerTag =
  | "classic"
  | "low_tech"
  | "canvas"
  | "minimal"
  | "street"
  | "chunky"
  | "basketball"
  | "running"
  | "comfortable"
  | "durable"
  | "retro"
  | "collab"
  | "trail"
  | "outdoor"
  | "premium"
  | "heritage";

export type SneakerCandidate = {
  sneakerId: string;
  name: string;
  vector: SneakerVector;
  tags: SneakerTag[];
  budgetFit: number;
};

export type OwnedSneakerSummary = {
  sneakerId: string;
  roleTags: SneakerTag[];
  wearFrequency: "high" | "medium" | "low";
};

export type ScoreBreakdown = {
  cultureScore: number;
  styleScore: number;
  simplicityScore: number;
  streetScore: number;
  volumeScore: number;
  comfortScore: number;
  durabilityScore: number;
  tagBonus: number;
  featureFitScore: number;
  priceScore: number;
  overlapPenalty: number;
  nonOverlapScore: number;
  finalScore: number;
  axisWeightsApplied: Record<string, number>;
};

export type PurchaseDecision =
  | "STRONG_BUY"
  | "BUY"
  | "WAIT"
  | "WATCH"
  | "SKIP";

export type DemotionReason =
  | "HIGH_CLOSET_OVERLAP"
  | "LOW_PRICE_FIT"
  | "LOW_COMFORT"
  | "LOW_DURABILITY";

export type RecommendationSnapshot = {
  snapshotVersion: "core-v0.1-final-lock";
  profile: PreferenceProfile;
  candidate: SneakerCandidate;
  ownedSneakers: OwnedSneakerSummary[];
  preferredTags: SneakerTag[];
  scoreBreakdown: ScoreBreakdown;
  rawDecision: PurchaseDecision;
  finalDecision: PurchaseDecision;
  demotions: DemotionReason[];
  createdAt: string;
};
```



<!-- FILE: 05_AXIS_AND_SCORE_RULES.md -->

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



<!-- FILE: 06_BALANCED_SCORE_FINAL.md -->

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



<!-- FILE: 07_DECISION_AND_DEMOTION.md -->

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



<!-- FILE: 08_SNAPSHOT_SPEC.md -->

# 08. SNAPSHOT SPEC

## 1. 結論

RecommendationSnapshotは、推薦時点の判断材料を固定するJSON構造である。  
Core v0.1ではDB保存しないが、将来保存する前提で構造を固定する。

## 2. 必須項目

- snapshotVersion
- profile
- candidate
- ownedSneakers
- preferredTags
- scoreBreakdown
- rawDecision
- finalDecision
- demotions
- createdAt

## 3. 型

```ts
export type RecommendationSnapshot = {
  snapshotVersion: "core-v0.1-final-lock";
  profile: PreferenceProfile;
  candidate: SneakerCandidate;
  ownedSneakers: OwnedSneakerSummary[];
  preferredTags: SneakerTag[];
  scoreBreakdown: ScoreBreakdown;
  rawDecision: PurchaseDecision;
  finalDecision: PurchaseDecision;
  demotions: DemotionReason[];
  createdAt: string;
};
```

## 4. 固定日時

```ts
export const FIXED_TEST_NOW = "2026-06-09T00:00:00Z";
```

## 5. 完了条件

- expectedSnapshots.tsがある
- golden testでSnapshotを比較する
- DBなしでSnapshotを生成する



<!-- FILE: 09_TEST_FIXTURE_LOCK.md -->

# 09. Test Fixture Lock

## 1. 結論

Core v0.1では、fixtureと期待値をTypeScriptで固定する。  
Markdown表だけで終わらせない。

## 2. 作成するfixtureファイル

```txt
src/domain/recommendation/__fixtures__/samplePreferenceProfiles.ts
src/domain/recommendation/__fixtures__/sampleSneakerVectors.ts
src/domain/recommendation/__fixtures__/sampleOwnedSneakers.ts
src/domain/recommendation/__fixtures__/expectedScoreBreakdowns.ts
src/domain/recommendation/__fixtures__/expectedDecisions.ts
src/domain/recommendation/__fixtures__/expectedDemotions.ts
src/domain/recommendation/__fixtures__/expectedSnapshots.ts
```

## 3. `samplePreferenceProfiles.ts`

```ts
export const samplePreferenceProfiles = {
  "caseA": {
    "userId": "sample_user_a",
    "vector": {
      "culture": 60,
      "styleFit": 80,
      "simplicity": 85,
      "street": 30,
      "volume": 20,
      "comfort": 65,
      "durability": 70
    },
    "policy": {
      "priceSensitivity": 85,
      "overlapSensitivity": 80,
      "explorationTolerance": 30
    },
    "axisImportance": {
      "culture": 60,
      "styleFit": 80,
      "simplicity": 85,
      "street": 40,
      "volume": 40,
      "comfort": 70,
      "durability": 65
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseB": {
    "userId": "sample_user_b",
    "vector": {
      "culture": 55,
      "styleFit": 60,
      "simplicity": 35,
      "street": 90,
      "volume": 85,
      "comfort": 55,
      "durability": 50
    },
    "policy": {
      "priceSensitivity": 45,
      "overlapSensitivity": 50,
      "explorationTolerance": 80
    },
    "axisImportance": {
      "culture": 45,
      "styleFit": 60,
      "simplicity": 35,
      "street": 95,
      "volume": 95,
      "comfort": 45,
      "durability": 40
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseC": {
    "userId": "sample_user_c",
    "vector": {
      "culture": 40,
      "styleFit": 60,
      "simplicity": 55,
      "street": 30,
      "volume": 40,
      "comfort": 90,
      "durability": 90
    },
    "policy": {
      "priceSensitivity": 80,
      "overlapSensitivity": 60,
      "explorationTolerance": 35
    },
    "axisImportance": {
      "culture": 30,
      "styleFit": 60,
      "simplicity": 50,
      "street": 30,
      "volume": 40,
      "comfort": 100,
      "durability": 95
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseD": {
    "userId": "sample_user_d",
    "vector": {
      "culture": 70,
      "styleFit": 80,
      "simplicity": 80,
      "street": 40,
      "volume": 25,
      "comfort": 75,
      "durability": 75
    },
    "policy": {
      "priceSensitivity": 25,
      "overlapSensitivity": 100,
      "explorationTolerance": 30
    },
    "axisImportance": {
      "culture": 60,
      "styleFit": 85,
      "simplicity": 80,
      "street": 40,
      "volume": 35,
      "comfort": 70,
      "durability": 70
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseE": {
    "userId": "sample_user_e",
    "vector": {
      "culture": 70,
      "styleFit": 80,
      "simplicity": 75,
      "street": 50,
      "volume": 40,
      "comfort": 80,
      "durability": 80
    },
    "policy": {
      "priceSensitivity": 100,
      "overlapSensitivity": 20,
      "explorationTolerance": 40
    },
    "axisImportance": {
      "culture": 60,
      "styleFit": 80,
      "simplicity": 70,
      "street": 50,
      "volume": 40,
      "comfort": 70,
      "durability": 70
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseF": {
    "userId": "sample_user_f",
    "vector": {
      "culture": 80,
      "styleFit": 85,
      "simplicity": 70,
      "street": 60,
      "volume": 50,
      "comfort": 40,
      "durability": 80
    },
    "policy": {
      "priceSensitivity": 15,
      "overlapSensitivity": 20,
      "explorationTolerance": 30
    },
    "axisImportance": {
      "culture": 80,
      "styleFit": 85,
      "simplicity": 65,
      "street": 60,
      "volume": 50,
      "comfort": 25,
      "durability": 75
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  },
  "caseG": {
    "userId": "sample_user_g",
    "vector": {
      "culture": 80,
      "styleFit": 85,
      "simplicity": 70,
      "street": 60,
      "volume": 50,
      "comfort": 80,
      "durability": 40
    },
    "policy": {
      "priceSensitivity": 15,
      "overlapSensitivity": 20,
      "explorationTolerance": 30
    },
    "axisImportance": {
      "culture": 80,
      "styleFit": 85,
      "simplicity": 65,
      "street": 60,
      "volume": 50,
      "comfort": 75,
      "durability": 25
    },
    "sourceConfidence": {
      "diagnosis": 60,
      "ownedSneakers": 75,
      "wantedSneakers": 45,
      "feedback": 70
    },
    "profileVersion": 1,
    "updatedAt": "2026-06-09T00:00:00Z"
  }
} as const;
```

## 4. `sampleSneakerVectors.ts`

```ts
export const sampleSneakerVectors = {
  "caseA": {
    "A1_canvas_high_overlap": {
      "name": "Canvas Low-Tech High Overlap",
      "vector": {
        "culture": 65,
        "styleFit": 85,
        "simplicity": 90,
        "street": 25,
        "volume": 20,
        "comfort": 55,
        "durability": 65,
        "priceLevel": 35
      },
      "tags": [
        "low_tech",
        "canvas",
        "classic",
        "minimal"
      ],
      "budgetFit": 80
    },
    "A2_expensive_collab": {
      "name": "Expensive Retro Collab",
      "vector": {
        "culture": 85,
        "styleFit": 75,
        "simplicity": 50,
        "street": 75,
        "volume": 60,
        "comfort": 45,
        "durability": 50,
        "priceLevel": 90
      },
      "tags": [
        "collab",
        "retro",
        "street"
      ],
      "budgetFit": 80
    },
    "A3_comfortable_simple_runner": {
      "name": "Comfortable Simple Runner",
      "vector": {
        "culture": 45,
        "styleFit": 75,
        "simplicity": 80,
        "street": 35,
        "volume": 35,
        "comfort": 85,
        "durability": 80,
        "priceLevel": 55
      },
      "tags": [
        "running",
        "minimal",
        "comfortable"
      ],
      "budgetFit": 80
    }
  },
  "caseB": {
    "B1_chunky_street": {
      "name": "Chunky Street Basketball",
      "vector": {
        "culture": 60,
        "styleFit": 65,
        "simplicity": 25,
        "street": 95,
        "volume": 90,
        "comfort": 65,
        "durability": 60,
        "priceLevel": 65
      },
      "tags": [
        "street",
        "chunky",
        "basketball"
      ],
      "budgetFit": 80
    },
    "B2_clean_lowtech_safe": {
      "name": "Clean Low-Tech Safe Choice",
      "vector": {
        "culture": 50,
        "styleFit": 80,
        "simplicity": 90,
        "street": 25,
        "volume": 20,
        "comfort": 70,
        "durability": 65,
        "priceLevel": 40
      },
      "tags": [
        "minimal",
        "classic",
        "low_tech"
      ],
      "budgetFit": 80
    },
    "B3_trail_discovery": {
      "name": "Trail Outdoor Discovery",
      "vector": {
        "culture": 55,
        "styleFit": 55,
        "simplicity": 45,
        "street": 75,
        "volume": 70,
        "comfort": 80,
        "durability": 75,
        "priceLevel": 55
      },
      "tags": [
        "trail",
        "outdoor",
        "chunky"
      ],
      "budgetFit": 80
    }
  },
  "caseC": {
    "C1_comfort_runner": {
      "name": "Comfort Runner",
      "vector": {
        "culture": 55,
        "styleFit": 70,
        "simplicity": 65,
        "street": 35,
        "volume": 45,
        "comfort": 92,
        "durability": 88,
        "priceLevel": 70
      },
      "tags": [
        "running",
        "comfortable",
        "durable"
      ],
      "budgetFit": 75
    },
    "C2_culture_low_comfort": {
      "name": "Culture High Low Comfort",
      "vector": {
        "culture": 95,
        "styleFit": 55,
        "simplicity": 45,
        "street": 65,
        "volume": 60,
        "comfort": 35,
        "durability": 45,
        "priceLevel": 40
      },
      "tags": [
        "heritage",
        "retro",
        "basketball"
      ],
      "budgetFit": 75
    },
    "C3_premium_comfort": {
      "name": "Premium Comfort Model",
      "vector": {
        "culture": 60,
        "styleFit": 75,
        "simplicity": 60,
        "street": 40,
        "volume": 50,
        "comfort": 90,
        "durability": 85,
        "priceLevel": 95
      },
      "tags": [
        "comfortable",
        "premium",
        "running"
      ],
      "budgetFit": 75
    }
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": {
      "name": "High Overlap Buy To Wait",
      "vector": {
        "culture": 70,
        "styleFit": 82,
        "simplicity": 82,
        "street": 38,
        "volume": 25,
        "comfort": 80,
        "durability": 78,
        "priceLevel": 35
      },
      "tags": [
        "low_tech",
        "canvas",
        "classic",
        "minimal"
      ],
      "budgetFit": 90
    }
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": {
      "name": "Low Price Fit Buy To Wait",
      "vector": {
        "culture": 72,
        "styleFit": 82,
        "simplicity": 76,
        "street": 52,
        "volume": 42,
        "comfort": 90,
        "durability": 88,
        "priceLevel": 100
      },
      "tags": [
        "premium",
        "comfortable",
        "classic"
      ],
      "budgetFit": 70
    }
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": {
      "name": "Low Comfort Buy To Wait",
      "vector": {
        "culture": 82,
        "styleFit": 86,
        "simplicity": 72,
        "street": 62,
        "volume": 52,
        "comfort": 35,
        "durability": 90,
        "priceLevel": 30
      },
      "tags": [
        "heritage",
        "street",
        "classic"
      ],
      "budgetFit": 90
    }
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": {
      "name": "Low Durability Buy To Wait",
      "vector": {
        "culture": 82,
        "styleFit": 86,
        "simplicity": 72,
        "street": 62,
        "volume": 52,
        "comfort": 90,
        "durability": 40,
        "priceLevel": 30
      },
      "tags": [
        "heritage",
        "street",
        "classic"
      ],
      "budgetFit": 90
    }
  }
} as const;
```

## 5. `sampleOwnedSneakers.ts`

```ts
export const sampleOwnedSneakers = {
  "caseA": [
    {
      "sneakerId": "owned_chuck",
      "roleTags": [
        "low_tech",
        "canvas",
        "classic",
        "minimal"
      ],
      "wearFrequency": "high"
    }
  ],
  "caseB": [
    {
      "sneakerId": "owned_minimal",
      "roleTags": [
        "minimal",
        "low_tech",
        "canvas"
      ],
      "wearFrequency": "medium"
    }
  ],
  "caseC": [
    {
      "sneakerId": "owned_runner",
      "roleTags": [
        "running",
        "comfortable"
      ],
      "wearFrequency": "high"
    }
  ],
  "caseD": [
    {
      "sneakerId": "owned_lowtech_canvas",
      "roleTags": [
        "low_tech",
        "canvas",
        "classic",
        "minimal"
      ],
      "wearFrequency": "high"
    }
  ],
  "caseE": [],
  "caseF": [],
  "caseG": []
} as const;
```

## 6. `expectedScoreBreakdowns.ts`

```ts
export const expectedScoreBreakdowns = {
  "caseA": {
    "A1_canvas_high_overlap": {
      "cultureScore": 95.0,
      "styleScore": 95.0,
      "simplicityScore": 95.0,
      "streetScore": 95.0,
      "volumeScore": 100.0,
      "comfortScore": 55.0,
      "durabilityScore": 65.0,
      "tagBonus": 100.0,
      "featureFitScore": 83.92,
      "priceScore": 68.1,
      "overlapPenalty": 100.0,
      "nonOverlapScore": 0.0,
      "finalScore": 72.68,
      "axisWeightsApplied": {
        "culture": 0.1151,
        "styleFit": 0.204,
        "simplicity": 0.1412,
        "street": 0.0785,
        "volume": 0.0628,
        "comfort": 0.1883,
        "durability": 0.1404,
        "tagBonus": 0.0697
      }
    },
    "A2_expensive_collab": {
      "cultureScore": 75.0,
      "styleScore": 95.0,
      "simplicityScore": 65.0,
      "streetScore": 55.0,
      "volumeScore": 60.0,
      "comfortScore": 45.0,
      "durabilityScore": 50.0,
      "tagBonus": 0.0,
      "featureFitScore": 60.77,
      "priceScore": 49.4,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 62.65,
      "axisWeightsApplied": {
        "culture": 0.1151,
        "styleFit": 0.204,
        "simplicity": 0.1412,
        "street": 0.0785,
        "volume": 0.0628,
        "comfort": 0.1883,
        "durability": 0.1404,
        "tagBonus": 0.0697
      }
    },
    "A3_comfortable_simple_runner": {
      "cultureScore": 85.0,
      "styleScore": 95.0,
      "simplicityScore": 95.0,
      "streetScore": 95.0,
      "volumeScore": 85.0,
      "comfortScore": 85.0,
      "durabilityScore": 80.0,
      "tagBonus": 25.0,
      "featureFitScore": 84.35,
      "priceScore": 61.3,
      "overlapPenalty": 32.5,
      "nonOverlapScore": 67.5,
      "finalScore": 78.52,
      "axisWeightsApplied": {
        "culture": 0.1151,
        "styleFit": 0.204,
        "simplicity": 0.1412,
        "street": 0.0785,
        "volume": 0.0628,
        "comfort": 0.1883,
        "durability": 0.1404,
        "tagBonus": 0.0697
      }
    }
  },
  "caseB": {
    "B1_chunky_street": {
      "cultureScore": 95.0,
      "styleScore": 95.0,
      "simplicityScore": 90.0,
      "streetScore": 95.0,
      "volumeScore": 95.0,
      "comfortScore": 65.0,
      "durabilityScore": 60.0,
      "tagBonus": 75.0,
      "featureFitScore": 83.93,
      "priceScore": 68.3,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 82.72,
      "axisWeightsApplied": {
        "culture": 0.1084,
        "styleFit": 0.1882,
        "simplicity": 0.097,
        "street": 0.1378,
        "volume": 0.1103,
        "comfort": 0.1625,
        "durability": 0.1198,
        "tagBonus": 0.076
      }
    },
    "B2_clean_lowtech_safe": {
      "cultureScore": 95.0,
      "styleScore": 80.0,
      "simplicityScore": 45.0,
      "streetScore": 35.0,
      "volumeScore": 35.0,
      "comfortScore": 70.0,
      "durabilityScore": 65.0,
      "tagBonus": 0.0,
      "featureFitScore": 57.56,
      "priceScore": 72.8,
      "overlapPenalty": 40.0,
      "nonOverlapScore": 60.0,
      "finalScore": 60.55,
      "axisWeightsApplied": {
        "culture": 0.1084,
        "styleFit": 0.1882,
        "simplicity": 0.097,
        "street": 0.1378,
        "volume": 0.1103,
        "comfort": 0.1625,
        "durability": 0.1198,
        "tagBonus": 0.076
      }
    },
    "B3_trail_discovery": {
      "cultureScore": 100.0,
      "styleScore": 95.0,
      "simplicityScore": 90.0,
      "streetScore": 85.0,
      "volumeScore": 85.0,
      "comfortScore": 80.0,
      "durabilityScore": 75.0,
      "tagBonus": 25.0,
      "featureFitScore": 82.42,
      "priceScore": 70.1,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 81.96,
      "axisWeightsApplied": {
        "culture": 0.1084,
        "styleFit": 0.1882,
        "simplicity": 0.097,
        "street": 0.1378,
        "volume": 0.1103,
        "comfort": 0.1625,
        "durability": 0.1198,
        "tagBonus": 0.076
      }
    }
  },
  "caseC": {
    "C1_comfort_runner": {
      "cultureScore": 85.0,
      "styleScore": 90.0,
      "simplicityScore": 90.0,
      "streetScore": 95.0,
      "volumeScore": 95.0,
      "comfortScore": 92.0,
      "durabilityScore": 88.0,
      "tagBonus": 75.0,
      "featureFitScore": 89.29,
      "priceScore": 52.6,
      "overlapPenalty": 55.0,
      "nonOverlapScore": 45.0,
      "finalScore": 78.26,
      "axisWeightsApplied": {
        "culture": 0.0858,
        "styleFit": 0.1769,
        "simplicity": 0.1072,
        "street": 0.0715,
        "volume": 0.0643,
        "comfort": 0.2413,
        "durability": 0.1814,
        "tagBonus": 0.0715
      }
    },
    "C2_culture_low_comfort": {
      "cultureScore": 45.0,
      "styleScore": 95.0,
      "simplicityScore": 90.0,
      "streetScore": 65.0,
      "volumeScore": 80.0,
      "comfortScore": 35.0,
      "durabilityScore": 45.0,
      "tagBonus": 0.0,
      "featureFitScore": 56.71,
      "priceScore": 62.2,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 62.03,
      "axisWeightsApplied": {
        "culture": 0.0858,
        "styleFit": 0.1769,
        "simplicity": 0.1072,
        "street": 0.0715,
        "volume": 0.0643,
        "comfort": 0.2413,
        "durability": 0.1814,
        "tagBonus": 0.0715
      }
    },
    "C3_premium_comfort": {
      "cultureScore": 80.0,
      "styleScore": 85.0,
      "simplicityScore": 95.0,
      "streetScore": 90.0,
      "volumeScore": 90.0,
      "comfortScore": 90.0,
      "durabilityScore": 85.0,
      "tagBonus": 50.0,
      "featureFitScore": 85.02,
      "priceScore": 44.6,
      "overlapPenalty": 55.0,
      "nonOverlapScore": 45.0,
      "finalScore": 73.74,
      "axisWeightsApplied": {
        "culture": 0.0858,
        "styleFit": 0.1769,
        "simplicity": 0.1072,
        "street": 0.0715,
        "volume": 0.0643,
        "comfort": 0.2413,
        "durability": 0.1814,
        "tagBonus": 0.0715
      }
    }
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": {
      "cultureScore": 100.0,
      "styleScore": 98.0,
      "simplicityScore": 98.0,
      "streetScore": 98.0,
      "volumeScore": 100.0,
      "comfortScore": 80.0,
      "durabilityScore": 78.0,
      "tagBonus": 100.0,
      "featureFitScore": 92.21,
      "priceScore": 86.5,
      "overlapPenalty": 100.0,
      "nonOverlapScore": 0.0,
      "finalScore": 81.96,
      "axisWeightsApplied": {
        "culture": 0.1145,
        "styleFit": 0.2108,
        "simplicity": 0.1353,
        "street": 0.0781,
        "volume": 0.059,
        "comfort": 0.1873,
        "durability": 0.1457,
        "tagBonus": 0.0694
      }
    }
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": {
      "cultureScore": 98.0,
      "styleScore": 98.0,
      "simplicityScore": 99.0,
      "streetScore": 98.0,
      "volumeScore": 98.0,
      "comfortScore": 90.0,
      "durabilityScore": 88.0,
      "tagBonus": 75.0,
      "featureFitScore": 93.56,
      "priceScore": 30.0,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 82.76,
      "axisWeightsApplied": {
        "culture": 0.1152,
        "styleFit": 0.2042,
        "simplicity": 0.1257,
        "street": 0.0873,
        "volume": 0.0628,
        "comfort": 0.1885,
        "durability": 0.1466,
        "tagBonus": 0.0698
      }
    }
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": {
      "cultureScore": 98.0,
      "styleScore": 99.0,
      "simplicityScore": 98.0,
      "streetScore": 98.0,
      "volumeScore": 98.0,
      "comfortScore": 35.0,
      "durabilityScore": 90.0,
      "tagBonus": 75.0,
      "featureFitScore": 87.7,
      "priceScore": 88.2,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 89.02,
      "axisWeightsApplied": {
        "culture": 0.1397,
        "styleFit": 0.2175,
        "simplicity": 0.1235,
        "street": 0.0985,
        "volume": 0.0716,
        "comfort": 0.1209,
        "durability": 0.1567,
        "tagBonus": 0.0716
      }
    }
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": {
      "cultureScore": 98.0,
      "styleScore": 99.0,
      "simplicityScore": 98.0,
      "streetScore": 98.0,
      "volumeScore": 98.0,
      "comfortScore": 90.0,
      "durabilityScore": 40.0,
      "tagBonus": 75.0,
      "featureFitScore": 89.66,
      "priceScore": 88.2,
      "overlapPenalty": 0.0,
      "nonOverlapScore": 100.0,
      "finalScore": 90.43,
      "axisWeightsApplied": {
        "culture": 0.1372,
        "styleFit": 0.2137,
        "simplicity": 0.1214,
        "street": 0.0967,
        "volume": 0.0704,
        "comfort": 0.1979,
        "durability": 0.0923,
        "tagBonus": 0.0704
      }
    }
  }
} as const;
```

## 7. `expectedDecisions.ts`

```ts
export const expectedDecisions = {
  "caseA": {
    "A1_canvas_high_overlap": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    },
    "A2_expensive_collab": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    },
    "A3_comfortable_simple_runner": {
      "rawDecision": "BUY",
      "finalDecision": "BUY"
    }
  },
  "caseB": {
    "B1_chunky_street": {
      "rawDecision": "BUY",
      "finalDecision": "BUY"
    },
    "B2_clean_lowtech_safe": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    },
    "B3_trail_discovery": {
      "rawDecision": "BUY",
      "finalDecision": "BUY"
    }
  },
  "caseC": {
    "C1_comfort_runner": {
      "rawDecision": "BUY",
      "finalDecision": "BUY"
    },
    "C2_culture_low_comfort": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    },
    "C3_premium_comfort": {
      "rawDecision": "WAIT",
      "finalDecision": "WAIT"
    }
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": {
      "rawDecision": "BUY",
      "finalDecision": "WAIT"
    }
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": {
      "rawDecision": "BUY",
      "finalDecision": "WAIT"
    }
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": {
      "rawDecision": "STRONG_BUY",
      "finalDecision": "WAIT"
    }
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": {
      "rawDecision": "STRONG_BUY",
      "finalDecision": "WAIT"
    }
  }
} as const;
```

## 8. `expectedDemotions.ts`

```ts
export const expectedDemotions = {
  "caseA": {
    "A1_canvas_high_overlap": [],
    "A2_expensive_collab": [],
    "A3_comfortable_simple_runner": []
  },
  "caseB": {
    "B1_chunky_street": [],
    "B2_clean_lowtech_safe": [],
    "B3_trail_discovery": []
  },
  "caseC": {
    "C1_comfort_runner": [],
    "C2_culture_low_comfort": [],
    "C3_premium_comfort": []
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": [
      "HIGH_CLOSET_OVERLAP"
    ]
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": [
      "LOW_PRICE_FIT"
    ]
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": [
      "LOW_COMFORT"
    ]
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": [
      "LOW_DURABILITY"
    ]
  }
} as const;
```

## 9. `expectedSnapshots.ts`

```ts
export const expectedSnapshots = {
  "caseA": {
    "A1_canvas_high_overlap": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_a",
        "vector": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 30,
          "volume": 20,
          "comfort": 65,
          "durability": 70
        },
        "policy": {
          "priceSensitivity": 85,
          "overlapSensitivity": 80,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 40,
          "volume": 40,
          "comfort": 70,
          "durability": 65
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "A1_canvas_high_overlap",
        "name": "Canvas Low-Tech High Overlap",
        "vector": {
          "culture": 65,
          "styleFit": 85,
          "simplicity": 90,
          "street": 25,
          "volume": 20,
          "comfort": 55,
          "durability": 65,
          "priceLevel": 35
        },
        "tags": [
          "low_tech",
          "canvas",
          "classic",
          "minimal"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_chuck",
          "roleTags": [
            "low_tech",
            "canvas",
            "classic",
            "minimal"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "low_tech",
        "classic",
        "minimal",
        "canvas"
      ],
      "scoreBreakdown": {
        "cultureScore": 95.0,
        "styleScore": 95.0,
        "simplicityScore": 95.0,
        "streetScore": 95.0,
        "volumeScore": 100.0,
        "comfortScore": 55.0,
        "durabilityScore": 65.0,
        "tagBonus": 100.0,
        "featureFitScore": 83.92,
        "priceScore": 68.1,
        "overlapPenalty": 100.0,
        "nonOverlapScore": 0.0,
        "finalScore": 72.68,
        "axisWeightsApplied": {
          "culture": 0.1151,
          "styleFit": 0.204,
          "simplicity": 0.1412,
          "street": 0.0785,
          "volume": 0.0628,
          "comfort": 0.1883,
          "durability": 0.1404,
          "tagBonus": 0.0697
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "A2_expensive_collab": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_a",
        "vector": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 30,
          "volume": 20,
          "comfort": 65,
          "durability": 70
        },
        "policy": {
          "priceSensitivity": 85,
          "overlapSensitivity": 80,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 40,
          "volume": 40,
          "comfort": 70,
          "durability": 65
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "A2_expensive_collab",
        "name": "Expensive Retro Collab",
        "vector": {
          "culture": 85,
          "styleFit": 75,
          "simplicity": 50,
          "street": 75,
          "volume": 60,
          "comfort": 45,
          "durability": 50,
          "priceLevel": 90
        },
        "tags": [
          "collab",
          "retro",
          "street"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_chuck",
          "roleTags": [
            "low_tech",
            "canvas",
            "classic",
            "minimal"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "low_tech",
        "classic",
        "minimal",
        "canvas"
      ],
      "scoreBreakdown": {
        "cultureScore": 75.0,
        "styleScore": 95.0,
        "simplicityScore": 65.0,
        "streetScore": 55.0,
        "volumeScore": 60.0,
        "comfortScore": 45.0,
        "durabilityScore": 50.0,
        "tagBonus": 0.0,
        "featureFitScore": 60.77,
        "priceScore": 49.4,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 62.65,
        "axisWeightsApplied": {
          "culture": 0.1151,
          "styleFit": 0.204,
          "simplicity": 0.1412,
          "street": 0.0785,
          "volume": 0.0628,
          "comfort": 0.1883,
          "durability": 0.1404,
          "tagBonus": 0.0697
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "A3_comfortable_simple_runner": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_a",
        "vector": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 30,
          "volume": 20,
          "comfort": 65,
          "durability": 70
        },
        "policy": {
          "priceSensitivity": 85,
          "overlapSensitivity": 80,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 85,
          "street": 40,
          "volume": 40,
          "comfort": 70,
          "durability": 65
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "A3_comfortable_simple_runner",
        "name": "Comfortable Simple Runner",
        "vector": {
          "culture": 45,
          "styleFit": 75,
          "simplicity": 80,
          "street": 35,
          "volume": 35,
          "comfort": 85,
          "durability": 80,
          "priceLevel": 55
        },
        "tags": [
          "running",
          "minimal",
          "comfortable"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_chuck",
          "roleTags": [
            "low_tech",
            "canvas",
            "classic",
            "minimal"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "low_tech",
        "classic",
        "minimal",
        "canvas"
      ],
      "scoreBreakdown": {
        "cultureScore": 85.0,
        "styleScore": 95.0,
        "simplicityScore": 95.0,
        "streetScore": 95.0,
        "volumeScore": 85.0,
        "comfortScore": 85.0,
        "durabilityScore": 80.0,
        "tagBonus": 25.0,
        "featureFitScore": 84.35,
        "priceScore": 61.3,
        "overlapPenalty": 32.5,
        "nonOverlapScore": 67.5,
        "finalScore": 78.52,
        "axisWeightsApplied": {
          "culture": 0.1151,
          "styleFit": 0.204,
          "simplicity": 0.1412,
          "street": 0.0785,
          "volume": 0.0628,
          "comfort": 0.1883,
          "durability": 0.1404,
          "tagBonus": 0.0697
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "BUY",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseB": {
    "B1_chunky_street": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_b",
        "vector": {
          "culture": 55,
          "styleFit": 60,
          "simplicity": 35,
          "street": 90,
          "volume": 85,
          "comfort": 55,
          "durability": 50
        },
        "policy": {
          "priceSensitivity": 45,
          "overlapSensitivity": 50,
          "explorationTolerance": 80
        },
        "axisImportance": {
          "culture": 45,
          "styleFit": 60,
          "simplicity": 35,
          "street": 95,
          "volume": 95,
          "comfort": 45,
          "durability": 40
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "B1_chunky_street",
        "name": "Chunky Street Basketball",
        "vector": {
          "culture": 60,
          "styleFit": 65,
          "simplicity": 25,
          "street": 95,
          "volume": 90,
          "comfort": 65,
          "durability": 60,
          "priceLevel": 65
        },
        "tags": [
          "street",
          "chunky",
          "basketball"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_minimal",
          "roleTags": [
            "minimal",
            "low_tech",
            "canvas"
          ],
          "wearFrequency": "medium"
        }
      ],
      "preferredTags": [
        "street",
        "chunky",
        "basketball",
        "skate"
      ],
      "scoreBreakdown": {
        "cultureScore": 95.0,
        "styleScore": 95.0,
        "simplicityScore": 90.0,
        "streetScore": 95.0,
        "volumeScore": 95.0,
        "comfortScore": 65.0,
        "durabilityScore": 60.0,
        "tagBonus": 75.0,
        "featureFitScore": 83.93,
        "priceScore": 68.3,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 82.72,
        "axisWeightsApplied": {
          "culture": 0.1084,
          "styleFit": 0.1882,
          "simplicity": 0.097,
          "street": 0.1378,
          "volume": 0.1103,
          "comfort": 0.1625,
          "durability": 0.1198,
          "tagBonus": 0.076
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "BUY",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "B2_clean_lowtech_safe": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_b",
        "vector": {
          "culture": 55,
          "styleFit": 60,
          "simplicity": 35,
          "street": 90,
          "volume": 85,
          "comfort": 55,
          "durability": 50
        },
        "policy": {
          "priceSensitivity": 45,
          "overlapSensitivity": 50,
          "explorationTolerance": 80
        },
        "axisImportance": {
          "culture": 45,
          "styleFit": 60,
          "simplicity": 35,
          "street": 95,
          "volume": 95,
          "comfort": 45,
          "durability": 40
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "B2_clean_lowtech_safe",
        "name": "Clean Low-Tech Safe Choice",
        "vector": {
          "culture": 50,
          "styleFit": 80,
          "simplicity": 90,
          "street": 25,
          "volume": 20,
          "comfort": 70,
          "durability": 65,
          "priceLevel": 40
        },
        "tags": [
          "minimal",
          "classic",
          "low_tech"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_minimal",
          "roleTags": [
            "minimal",
            "low_tech",
            "canvas"
          ],
          "wearFrequency": "medium"
        }
      ],
      "preferredTags": [
        "street",
        "chunky",
        "basketball",
        "skate"
      ],
      "scoreBreakdown": {
        "cultureScore": 95.0,
        "styleScore": 80.0,
        "simplicityScore": 45.0,
        "streetScore": 35.0,
        "volumeScore": 35.0,
        "comfortScore": 70.0,
        "durabilityScore": 65.0,
        "tagBonus": 0.0,
        "featureFitScore": 57.56,
        "priceScore": 72.8,
        "overlapPenalty": 40.0,
        "nonOverlapScore": 60.0,
        "finalScore": 60.55,
        "axisWeightsApplied": {
          "culture": 0.1084,
          "styleFit": 0.1882,
          "simplicity": 0.097,
          "street": 0.1378,
          "volume": 0.1103,
          "comfort": 0.1625,
          "durability": 0.1198,
          "tagBonus": 0.076
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "B3_trail_discovery": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_b",
        "vector": {
          "culture": 55,
          "styleFit": 60,
          "simplicity": 35,
          "street": 90,
          "volume": 85,
          "comfort": 55,
          "durability": 50
        },
        "policy": {
          "priceSensitivity": 45,
          "overlapSensitivity": 50,
          "explorationTolerance": 80
        },
        "axisImportance": {
          "culture": 45,
          "styleFit": 60,
          "simplicity": 35,
          "street": 95,
          "volume": 95,
          "comfort": 45,
          "durability": 40
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "B3_trail_discovery",
        "name": "Trail Outdoor Discovery",
        "vector": {
          "culture": 55,
          "styleFit": 55,
          "simplicity": 45,
          "street": 75,
          "volume": 70,
          "comfort": 80,
          "durability": 75,
          "priceLevel": 55
        },
        "tags": [
          "trail",
          "outdoor",
          "chunky"
        ],
        "budgetFit": 80
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_minimal",
          "roleTags": [
            "minimal",
            "low_tech",
            "canvas"
          ],
          "wearFrequency": "medium"
        }
      ],
      "preferredTags": [
        "street",
        "chunky",
        "basketball",
        "skate"
      ],
      "scoreBreakdown": {
        "cultureScore": 100.0,
        "styleScore": 95.0,
        "simplicityScore": 90.0,
        "streetScore": 85.0,
        "volumeScore": 85.0,
        "comfortScore": 80.0,
        "durabilityScore": 75.0,
        "tagBonus": 25.0,
        "featureFitScore": 82.42,
        "priceScore": 70.1,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 81.96,
        "axisWeightsApplied": {
          "culture": 0.1084,
          "styleFit": 0.1882,
          "simplicity": 0.097,
          "street": 0.1378,
          "volume": 0.1103,
          "comfort": 0.1625,
          "durability": 0.1198,
          "tagBonus": 0.076
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "BUY",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseC": {
    "C1_comfort_runner": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_c",
        "vector": {
          "culture": 40,
          "styleFit": 60,
          "simplicity": 55,
          "street": 30,
          "volume": 40,
          "comfort": 90,
          "durability": 90
        },
        "policy": {
          "priceSensitivity": 80,
          "overlapSensitivity": 60,
          "explorationTolerance": 35
        },
        "axisImportance": {
          "culture": 30,
          "styleFit": 60,
          "simplicity": 50,
          "street": 30,
          "volume": 40,
          "comfort": 100,
          "durability": 95
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "C1_comfort_runner",
        "name": "Comfort Runner",
        "vector": {
          "culture": 55,
          "styleFit": 70,
          "simplicity": 65,
          "street": 35,
          "volume": 45,
          "comfort": 92,
          "durability": 88,
          "priceLevel": 70
        },
        "tags": [
          "running",
          "comfortable",
          "durable"
        ],
        "budgetFit": 75
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_runner",
          "roleTags": [
            "running",
            "comfortable"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "comfortable",
        "durable",
        "running"
      ],
      "scoreBreakdown": {
        "cultureScore": 85.0,
        "styleScore": 90.0,
        "simplicityScore": 90.0,
        "streetScore": 95.0,
        "volumeScore": 95.0,
        "comfortScore": 92.0,
        "durabilityScore": 88.0,
        "tagBonus": 75.0,
        "featureFitScore": 89.29,
        "priceScore": 52.6,
        "overlapPenalty": 55.0,
        "nonOverlapScore": 45.0,
        "finalScore": 78.26,
        "axisWeightsApplied": {
          "culture": 0.0858,
          "styleFit": 0.1769,
          "simplicity": 0.1072,
          "street": 0.0715,
          "volume": 0.0643,
          "comfort": 0.2413,
          "durability": 0.1814,
          "tagBonus": 0.0715
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "BUY",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "C2_culture_low_comfort": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_c",
        "vector": {
          "culture": 40,
          "styleFit": 60,
          "simplicity": 55,
          "street": 30,
          "volume": 40,
          "comfort": 90,
          "durability": 90
        },
        "policy": {
          "priceSensitivity": 80,
          "overlapSensitivity": 60,
          "explorationTolerance": 35
        },
        "axisImportance": {
          "culture": 30,
          "styleFit": 60,
          "simplicity": 50,
          "street": 30,
          "volume": 40,
          "comfort": 100,
          "durability": 95
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "C2_culture_low_comfort",
        "name": "Culture High Low Comfort",
        "vector": {
          "culture": 95,
          "styleFit": 55,
          "simplicity": 45,
          "street": 65,
          "volume": 60,
          "comfort": 35,
          "durability": 45,
          "priceLevel": 40
        },
        "tags": [
          "heritage",
          "retro",
          "basketball"
        ],
        "budgetFit": 75
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_runner",
          "roleTags": [
            "running",
            "comfortable"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "comfortable",
        "durable",
        "running"
      ],
      "scoreBreakdown": {
        "cultureScore": 45.0,
        "styleScore": 95.0,
        "simplicityScore": 90.0,
        "streetScore": 65.0,
        "volumeScore": 80.0,
        "comfortScore": 35.0,
        "durabilityScore": 45.0,
        "tagBonus": 0.0,
        "featureFitScore": 56.71,
        "priceScore": 62.2,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 62.03,
        "axisWeightsApplied": {
          "culture": 0.0858,
          "styleFit": 0.1769,
          "simplicity": 0.1072,
          "street": 0.0715,
          "volume": 0.0643,
          "comfort": 0.2413,
          "durability": 0.1814,
          "tagBonus": 0.0715
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    },
    "C3_premium_comfort": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_c",
        "vector": {
          "culture": 40,
          "styleFit": 60,
          "simplicity": 55,
          "street": 30,
          "volume": 40,
          "comfort": 90,
          "durability": 90
        },
        "policy": {
          "priceSensitivity": 80,
          "overlapSensitivity": 60,
          "explorationTolerance": 35
        },
        "axisImportance": {
          "culture": 30,
          "styleFit": 60,
          "simplicity": 50,
          "street": 30,
          "volume": 40,
          "comfort": 100,
          "durability": 95
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "C3_premium_comfort",
        "name": "Premium Comfort Model",
        "vector": {
          "culture": 60,
          "styleFit": 75,
          "simplicity": 60,
          "street": 40,
          "volume": 50,
          "comfort": 90,
          "durability": 85,
          "priceLevel": 95
        },
        "tags": [
          "comfortable",
          "premium",
          "running"
        ],
        "budgetFit": 75
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_runner",
          "roleTags": [
            "running",
            "comfortable"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "comfortable",
        "durable",
        "running"
      ],
      "scoreBreakdown": {
        "cultureScore": 80.0,
        "styleScore": 85.0,
        "simplicityScore": 95.0,
        "streetScore": 90.0,
        "volumeScore": 90.0,
        "comfortScore": 90.0,
        "durabilityScore": 85.0,
        "tagBonus": 50.0,
        "featureFitScore": 85.02,
        "priceScore": 44.6,
        "overlapPenalty": 55.0,
        "nonOverlapScore": 45.0,
        "finalScore": 73.74,
        "axisWeightsApplied": {
          "culture": 0.0858,
          "styleFit": 0.1769,
          "simplicity": 0.1072,
          "street": 0.0715,
          "volume": 0.0643,
          "comfort": 0.2413,
          "durability": 0.1814,
          "tagBonus": 0.0715
        }
      },
      "rawDecision": "WAIT",
      "finalDecision": "WAIT",
      "demotions": [],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseD": {
    "D1_high_overlap_buy_to_wait": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_d",
        "vector": {
          "culture": 70,
          "styleFit": 80,
          "simplicity": 80,
          "street": 40,
          "volume": 25,
          "comfort": 75,
          "durability": 75
        },
        "policy": {
          "priceSensitivity": 25,
          "overlapSensitivity": 100,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 85,
          "simplicity": 80,
          "street": 40,
          "volume": 35,
          "comfort": 70,
          "durability": 70
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "D1_high_overlap_buy_to_wait",
        "name": "High Overlap Buy To Wait",
        "vector": {
          "culture": 70,
          "styleFit": 82,
          "simplicity": 82,
          "street": 38,
          "volume": 25,
          "comfort": 80,
          "durability": 78,
          "priceLevel": 35
        },
        "tags": [
          "low_tech",
          "canvas",
          "classic",
          "minimal"
        ],
        "budgetFit": 90
      },
      "ownedSneakers": [
        {
          "sneakerId": "owned_lowtech_canvas",
          "roleTags": [
            "low_tech",
            "canvas",
            "classic",
            "minimal"
          ],
          "wearFrequency": "high"
        }
      ],
      "preferredTags": [
        "low_tech",
        "classic",
        "minimal",
        "canvas"
      ],
      "scoreBreakdown": {
        "cultureScore": 100.0,
        "styleScore": 98.0,
        "simplicityScore": 98.0,
        "streetScore": 98.0,
        "volumeScore": 100.0,
        "comfortScore": 80.0,
        "durabilityScore": 78.0,
        "tagBonus": 100.0,
        "featureFitScore": 92.21,
        "priceScore": 86.5,
        "overlapPenalty": 100.0,
        "nonOverlapScore": 0.0,
        "finalScore": 81.96,
        "axisWeightsApplied": {
          "culture": 0.1145,
          "styleFit": 0.2108,
          "simplicity": 0.1353,
          "street": 0.0781,
          "volume": 0.059,
          "comfort": 0.1873,
          "durability": 0.1457,
          "tagBonus": 0.0694
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "WAIT",
      "demotions": [
        "HIGH_CLOSET_OVERLAP"
      ],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseE": {
    "E1_low_price_fit_buy_to_wait": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_e",
        "vector": {
          "culture": 70,
          "styleFit": 80,
          "simplicity": 75,
          "street": 50,
          "volume": 40,
          "comfort": 80,
          "durability": 80
        },
        "policy": {
          "priceSensitivity": 100,
          "overlapSensitivity": 20,
          "explorationTolerance": 40
        },
        "axisImportance": {
          "culture": 60,
          "styleFit": 80,
          "simplicity": 70,
          "street": 50,
          "volume": 40,
          "comfort": 70,
          "durability": 70
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "E1_low_price_fit_buy_to_wait",
        "name": "Low Price Fit Buy To Wait",
        "vector": {
          "culture": 72,
          "styleFit": 82,
          "simplicity": 76,
          "street": 52,
          "volume": 42,
          "comfort": 90,
          "durability": 88,
          "priceLevel": 100
        },
        "tags": [
          "premium",
          "comfortable",
          "classic"
        ],
        "budgetFit": 70
      },
      "ownedSneakers": [],
      "preferredTags": [
        "premium",
        "comfortable",
        "classic"
      ],
      "scoreBreakdown": {
        "cultureScore": 98.0,
        "styleScore": 98.0,
        "simplicityScore": 99.0,
        "streetScore": 98.0,
        "volumeScore": 98.0,
        "comfortScore": 90.0,
        "durabilityScore": 88.0,
        "tagBonus": 75.0,
        "featureFitScore": 93.56,
        "priceScore": 30.0,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 82.76,
        "axisWeightsApplied": {
          "culture": 0.1152,
          "styleFit": 0.2042,
          "simplicity": 0.1257,
          "street": 0.0873,
          "volume": 0.0628,
          "comfort": 0.1885,
          "durability": 0.1466,
          "tagBonus": 0.0698
        }
      },
      "rawDecision": "BUY",
      "finalDecision": "WAIT",
      "demotions": [
        "LOW_PRICE_FIT"
      ],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseF": {
    "F1_low_comfort_buy_to_wait": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_f",
        "vector": {
          "culture": 80,
          "styleFit": 85,
          "simplicity": 70,
          "street": 60,
          "volume": 50,
          "comfort": 40,
          "durability": 80
        },
        "policy": {
          "priceSensitivity": 15,
          "overlapSensitivity": 20,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 80,
          "styleFit": 85,
          "simplicity": 65,
          "street": 60,
          "volume": 50,
          "comfort": 25,
          "durability": 75
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "F1_low_comfort_buy_to_wait",
        "name": "Low Comfort Buy To Wait",
        "vector": {
          "culture": 82,
          "styleFit": 86,
          "simplicity": 72,
          "street": 62,
          "volume": 52,
          "comfort": 35,
          "durability": 90,
          "priceLevel": 30
        },
        "tags": [
          "heritage",
          "street",
          "classic"
        ],
        "budgetFit": 90
      },
      "ownedSneakers": [],
      "preferredTags": [
        "heritage",
        "street",
        "classic"
      ],
      "scoreBreakdown": {
        "cultureScore": 98.0,
        "styleScore": 99.0,
        "simplicityScore": 98.0,
        "streetScore": 98.0,
        "volumeScore": 98.0,
        "comfortScore": 35.0,
        "durabilityScore": 90.0,
        "tagBonus": 75.0,
        "featureFitScore": 87.7,
        "priceScore": 88.2,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 89.02,
        "axisWeightsApplied": {
          "culture": 0.1397,
          "styleFit": 0.2175,
          "simplicity": 0.1235,
          "street": 0.0985,
          "volume": 0.0716,
          "comfort": 0.1209,
          "durability": 0.1567,
          "tagBonus": 0.0716
        }
      },
      "rawDecision": "STRONG_BUY",
      "finalDecision": "WAIT",
      "demotions": [
        "LOW_COMFORT"
      ],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  },
  "caseG": {
    "G1_low_durability_buy_to_wait": {
      "snapshotVersion": "core-v0.1-final-lock",
      "profile": {
        "userId": "sample_user_g",
        "vector": {
          "culture": 80,
          "styleFit": 85,
          "simplicity": 70,
          "street": 60,
          "volume": 50,
          "comfort": 80,
          "durability": 40
        },
        "policy": {
          "priceSensitivity": 15,
          "overlapSensitivity": 20,
          "explorationTolerance": 30
        },
        "axisImportance": {
          "culture": 80,
          "styleFit": 85,
          "simplicity": 65,
          "street": 60,
          "volume": 50,
          "comfort": 75,
          "durability": 25
        },
        "sourceConfidence": {
          "diagnosis": 60,
          "ownedSneakers": 75,
          "wantedSneakers": 45,
          "feedback": 70
        },
        "profileVersion": 1,
        "updatedAt": "2026-06-09T00:00:00Z"
      },
      "candidate": {
        "sneakerId": "G1_low_durability_buy_to_wait",
        "name": "Low Durability Buy To Wait",
        "vector": {
          "culture": 82,
          "styleFit": 86,
          "simplicity": 72,
          "street": 62,
          "volume": 52,
          "comfort": 90,
          "durability": 40,
          "priceLevel": 30
        },
        "tags": [
          "heritage",
          "street",
          "classic"
        ],
        "budgetFit": 90
      },
      "ownedSneakers": [],
      "preferredTags": [
        "heritage",
        "street",
        "classic"
      ],
      "scoreBreakdown": {
        "cultureScore": 98.0,
        "styleScore": 99.0,
        "simplicityScore": 98.0,
        "streetScore": 98.0,
        "volumeScore": 98.0,
        "comfortScore": 90.0,
        "durabilityScore": 40.0,
        "tagBonus": 75.0,
        "featureFitScore": 89.66,
        "priceScore": 88.2,
        "overlapPenalty": 0.0,
        "nonOverlapScore": 100.0,
        "finalScore": 90.43,
        "axisWeightsApplied": {
          "culture": 0.1372,
          "styleFit": 0.2137,
          "simplicity": 0.1214,
          "street": 0.0967,
          "volume": 0.0704,
          "comfort": 0.1979,
          "durability": 0.0923,
          "tagBonus": 0.0704
        }
      },
      "rawDecision": "STRONG_BUY",
      "finalDecision": "WAIT",
      "demotions": [
        "LOW_DURABILITY"
      ],
      "createdAt": "2026-06-09T00:00:00Z"
    }
  }
} as const;
```

## 10. Case Aの確定説明

```txt
A1_canvas_high_overlapは所有靴との被りが強いため、finalScoreが下がりWAITになる。
ただしrawDecision時点でWAITなのでDemotionは発生しない。
```

## 11. fixture変更ルール

fixtureの期待値は、実装に合わせて勝手に変えない。  
テストが落ちた場合、まず実装が仕様から外れていないか確認する。



<!-- FILE: 10_GOLDEN_TEST_SPEC.md -->

# 10. Golden Test Spec

## 1. 結論

`balancedScore.golden.test.ts` は、Core v0.1の正誤判定の中心である。

## 2. `balancedScore.golden.test.ts`

```ts
import { describe, expect, test } from "vitest";

import { calculateBalancedScore } from "../balancedScore";
import { createRecommendationSnapshot } from "../snapshot";

import { samplePreferenceProfiles } from "../__fixtures__/samplePreferenceProfiles";
import { sampleSneakerVectors } from "../__fixtures__/sampleSneakerVectors";
import { sampleOwnedSneakers } from "../__fixtures__/sampleOwnedSneakers";
import { expectedScoreBreakdowns } from "../__fixtures__/expectedScoreBreakdowns";
import { expectedDecisions } from "../__fixtures__/expectedDecisions";
import { expectedDemotions } from "../__fixtures__/expectedDemotions";
import { expectedSnapshots } from "../__fixtures__/expectedSnapshots";

export const FIXED_TEST_NOW = "2026-06-09T00:00:00Z";

const preferredTags = {
  caseA: ["low_tech", "classic", "minimal", "canvas"],
  caseB: ["street", "chunky", "basketball", "skate"],
  caseC: ["comfortable", "durable", "running"],
  caseD: ["low_tech", "classic", "minimal", "canvas"],
  caseE: ["premium", "comfortable", "classic"],
  caseF: ["heritage", "street", "classic"],
  caseG: ["heritage", "street", "classic"],
} as const;

type CaseKey = keyof typeof samplePreferenceProfiles;

function runCandidate(caseKey: CaseKey, candidateKey: string) {
  const candidateGroup = sampleSneakerVectors[caseKey] as Record<string, any>;
  const candidate = candidateGroup[candidateKey];

  const result = calculateBalancedScore({
    profile: samplePreferenceProfiles[caseKey],
    candidate,
    ownedSneakers: sampleOwnedSneakers[caseKey],
    preferredTags: preferredTags[caseKey],
  });

  const snapshot = createRecommendationSnapshot({
    profile: samplePreferenceProfiles[caseKey],
    candidate,
    ownedSneakers: sampleOwnedSneakers[caseKey],
    preferredTags: preferredTags[caseKey],
    scoreBreakdown: result.scoreBreakdown,
    rawDecision: result.rawDecision,
    finalDecision: result.finalDecision,
    demotions: result.demotions,
    createdAt: FIXED_TEST_NOW,
  });

  return { result, snapshot };
}

describe("SOLE//MATRIX Core v0.1 golden tests", () => {
  test("Case A: A1_canvas_high_overlap becomes WAIT without Demotion", () => {
    const { result, snapshot } = runCandidate("caseA", "A1_canvas_high_overlap");

    expect(result.scoreBreakdown).toEqual(expectedScoreBreakdowns.caseA.A1_canvas_high_overlap);
    expect(result.rawDecision).toBe(expectedDecisions.caseA.A1_canvas_high_overlap.rawDecision);
    expect(result.finalDecision).toBe(expectedDecisions.caseA.A1_canvas_high_overlap.finalDecision);
    expect(result.demotions).toEqual(expectedDemotions.caseA.A1_canvas_high_overlap);
    expect(snapshot).toEqual(expectedSnapshots.caseA.A1_canvas_high_overlap);
  });

  test("Case B: street and volume candidate is Best Fit candidate", () => {
    const { result, snapshot } = runCandidate("caseB", "B1_chunky_street");

    expect(result.scoreBreakdown).toEqual(expectedScoreBreakdowns.caseB.B1_chunky_street);
    expect(result.rawDecision).toBe(expectedDecisions.caseB.B1_chunky_street.rawDecision);
    expect(result.finalDecision).toBe(expectedDecisions.caseB.B1_chunky_street.finalDecision);
    expect(result.demotions).toEqual(expectedDemotions.caseB.B1_chunky_street);
    expect(snapshot).toEqual(expectedSnapshots.caseB.B1_chunky_street);
  });

  test("Case C: comfort and durability candidate is evaluated above low-comfort heritage candidate", () => {
    const c1 = runCandidate("caseC", "C1_comfort_runner");
    const c2 = runCandidate("caseC", "C2_culture_low_comfort");

    expect(c1.result.scoreBreakdown).toEqual(expectedScoreBreakdowns.caseC.C1_comfort_runner);
    expect(c2.result.scoreBreakdown).toEqual(expectedScoreBreakdowns.caseC.C2_culture_low_comfort);
    expect(c1.result.scoreBreakdown.finalScore).toBeGreaterThan(c2.result.scoreBreakdown.finalScore);
  });

  test("Case D: HIGH_CLOSET_OVERLAP demotes BUY or above to WAIT", () => {
    const { result } = runCandidate("caseD", "D1_high_overlap_buy_to_wait");

    expect(result.scoreBreakdown).toEqual(expectedScoreBreakdowns.caseD.D1_high_overlap_buy_to_wait);
    expect(result.rawDecision).toBe(expectedDecisions.caseD.D1_high_overlap_buy_to_wait.rawDecision);
    expect(result.finalDecision).toBe(expectedDecisions.caseD.D1_high_overlap_buy_to_wait.finalDecision);
    expect(result.demotions).toEqual(["HIGH_CLOSET_OVERLAP"]);
  });

  test("Case E: LOW_PRICE_FIT demotes BUY or above to WAIT", () => {
    const { result } = runCandidate("caseE", "E1_low_price_fit_buy_to_wait");

    expect(result.scoreBreakdown).toEqual(expectedScoreBreakdowns.caseE.E1_low_price_fit_buy_to_wait);
    expect(result.rawDecision).toBe(expectedDecisions.caseE.E1_low_price_fit_buy_to_wait.rawDecision);
    expect(result.finalDecision).toBe(expectedDecisions.caseE.E1_low_price_fit_buy_to_wait.finalDecision);
    expect(result.demotions).toEqual(["LOW_PRICE_FIT"]);
  });

  test("Case F: LOW_COMFORT demotes BUY or above to WAIT", () => {
    const { result } = runCandidate("caseF", "F1_low_comfort_buy_to_wait");

    expect(result.scoreBreakdown).toEqual(expectedScoreBreakdowns.caseF.F1_low_comfort_buy_to_wait);
    expect(result.rawDecision).toBe(expectedDecisions.caseF.F1_low_comfort_buy_to_wait.rawDecision);
    expect(result.finalDecision).toBe(expectedDecisions.caseF.F1_low_comfort_buy_to_wait.finalDecision);
    expect(result.demotions).toEqual(["LOW_COMFORT"]);
  });

  test("Case G: LOW_DURABILITY demotes BUY or above to WAIT", () => {
    const { result } = runCandidate("caseG", "G1_low_durability_buy_to_wait");

    expect(result.scoreBreakdown).toEqual(expectedScoreBreakdowns.caseG.G1_low_durability_buy_to_wait);
    expect(result.rawDecision).toBe(expectedDecisions.caseG.G1_low_durability_buy_to_wait.rawDecision);
    expect(result.finalDecision).toBe(expectedDecisions.caseG.G1_low_durability_buy_to_wait.finalDecision);
    expect(result.demotions).toEqual(["LOW_DURABILITY"]);
  });
});
```

## 3. 完了条件

- Case A〜Gがある
- ScoreBreakdownを比較する
- rawDecisionを比較する
- finalDecisionを比較する
- demotionsを比較する
- RecommendationSnapshotを比較する



<!-- FILE: 11_ROUNDING_POLICY.md -->

# 11. ROUNDING POLICY

## 1. 結論

丸め規則を固定する。  
丸めが曖昧だとgolden testが不安定になる。

## 2. ルール

| 項目 | ルール |
|---|---|
| 内部計算 | 丸めない |
| ScoreBreakdown保存 | 小数第2位 |
| axisWeightsApplied | 小数第4位 |
| Decision判定 | 丸め前finalScoreを使う |
| fixture比較 | 丸め後の値を使う |
| createdAt | テスト用固定値を使う |

## 3. 固定日時

```ts
export const FIXED_TEST_NOW = "2026-06-09T00:00:00Z";
```

## 4. 実装例

```ts
export function roundScore(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundWeight(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
```

## 5. 禁止

- 実装ごとに丸め桁を変えない
- Decision判定に丸め後だけを使わない
- createdAtに現在時刻を使ってgolden testを壊さない



<!-- FILE: 12_README_FINAL.md -->

# 12. README FINAL

# SOLE//MATRIX

## プロジェクト概要

SOLE//MATRIXは、スニーカーを「なんとなく欲しい」ではなく、好み・所有靴・価格感度・履きやすさ・被り・判断理由に基づいて整理する、説明可能なスニーカー購入判断支援システムである。

## Core v0.1の目的

Core v0.1では、UIやDBではなく、推薦ロジックの再現性を完成させる。

## 必要環境

- Node.js 24 LTS または 22 LTS
- pnpm
- TypeScript
- Vitest

## セットアップ

```bash
pnpm install
```

## テスト実行

```bash
pnpm test
```

Core v0.1にはUIがないため、`pnpm dev` は必須ではない。

## Core v0.1でできること

- PreferenceProfileを使った推薦スコア計算
- SneakerVectorとの比較
- ScoreBreakdown生成
- Decision生成
- Demotion適用
- RecommendationSnapshot生成
- golden testによる再現性確認

## Core v0.1でできないこと

- ブラウザUI
- 診断画面
- DB保存
- Supabase Auth
- AI説明生成
- 外部価格API連携
- プレ値予測
- 真贋判定

## 今後のロードマップ

- Core v0.2: 質問診断、answerToVector、最低限の画面
- Core v0.3: 所有靴、欲しい靴、Wishlist、Closet Conflict
- Core v0.4: feedback、Preference Profile更新、偏り防止
- Core v1.0: Supabase Auth、DB保存、RLS、AI説明生成、fallback、E2E
- Core v1.1: Market Observation、manualMarketAdapter、confidence表示
- Core v2: 外部API検証

## Dockerを使うタイミング

Core v0.1ではDocker不要。  
Supabase localを使うCore v1.0以降でDockerを使う。

## Supabaseを使うタイミング

Core v1.0以降。

## AIを使うタイミング

Core v1.0以降。  
AIは説明文生成のみに使い、スコアや判定を作らせない。



<!-- FILE: 13_ROADMAP_FINAL.md -->

# 13. ROADMAP FINAL

## Core v0.1

推薦ロジック、型、スコア、Decision、Demotion、Snapshot、golden test。

## Core v0.2

質問診断、answerToVector、最低限の画面。

## Core v0.3

所有靴、欲しい靴、Wishlist、Closet Conflict。

## Core v0.4

feedback、Preference Profile更新、偏り防止。

## Core v1.0

Supabase Auth、DB保存、RLS、AI説明生成、fallback、E2E。

## Core v1.1

Market Observation、manualMarketAdapter、confidence表示。

## Core v2

外部API検証、StockX等の公式API検討、第三者API検討。

## Core v2以降も慎重

プレ値予測、真贋判定、課金はCore価値ではないため慎重に扱う。



<!-- FILE: 14_AI_AGENT_INSTRUCTIONS.md -->

# 14. AI AGENT INSTRUCTIONS

## 1. 実装順

1. 型定義を実装する
2. scoreUtilsを実装する
3. axisWeights / tagBonus / priceScore / overlapPenaltyを実装する
4. balancedScoreを実装する
5. decision / demotionを実装する
6. snapshotを実装する
7. fixturesを実装する
8. golden testを通す

## 2. 禁止事項

- 新機能を追加しない
- UIを作らない
- DBを作らない
- APIを叩かない
- AI説明生成を入れない
- 外部価格APIを入れない
- PreferenceVectorにpriceSensitivityを戻さない
- SneakerVectorにpriceSensitivityを戻さない
- comfort / durabilityを近さで評価しない
- finalScoreを100点超え前提でclampしない
- fixtureの期待値を実装に合わせて勝手に変えない
- テストが落ちたら期待値ではなく実装を疑う

## 3. 実装完了条件

- `pnpm test` が通る
- golden testが通る
- Case A〜Gが通る
- Snapshot比較が通る



<!-- FILE: 15_FINAL_CHECKLIST.md -->

# 15. FINAL CHECKLIST

## 1. スコープ

- [ ] Core v0.1の範囲が広がっていない
- [ ] UIが入っていない
- [ ] DBが入っていない
- [ ] AIが入っていない
- [ ] 外部APIが入っていない

## 2. 型

- [ ] TasteAxisがある
- [ ] QualityAxisがある
- [ ] PreferenceVectorがある
- [ ] PreferenceVectorにpriceSensitivityがない
- [ ] PreferencePolicyがある
- [ ] AxisImportanceがある
- [ ] PreferenceProfileがある
- [ ] SneakerVectorがある
- [ ] SneakerVectorにpriceSensitivityがない

## 3. スコア

- [ ] TasteAxisは近さで評価
- [ ] QualityAxisは靴側の値で評価
- [ ] finalScoreは100点内配分
- [ ] priceScoreはPolicyから計算
- [ ] overlapPenaltyはPolicyから計算
- [ ] Demotion発生ケースがある

## 4. fixture / test

- [ ] fixtureがTypeScriptで出ている
- [ ] golden testがある
- [ ] expectedScoreBreakdownsがある
- [ ] expectedDecisionsがある
- [ ] expectedDemotionsがある
- [ ] expectedSnapshotsがある
- [ ] Case AのA1_canvas_high_overlap名が修正済み
- [ ] Snapshot期待値がある

## 5. ドキュメント

- [ ] READMEがある
- [ ] AI Agent向け禁止事項がある
- [ ] ロードマップが固定されている
- [ ] ここから実装に進める
