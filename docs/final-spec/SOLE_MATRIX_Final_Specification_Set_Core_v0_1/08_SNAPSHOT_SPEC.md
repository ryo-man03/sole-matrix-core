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
