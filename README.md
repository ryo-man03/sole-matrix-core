# SOLE//MATRIX Core v0.1

## 1. プロジェクト名

SOLE//MATRIX Core v0.1

## 2. 概要

SOLE//MATRIX Core v0.1 は、スニーカー購入判断を支援するための推薦ロジックを TypeScript で実装したプロジェクトです。

人気、プレ値、トレンドだけで判断するのではなく、ユーザーの好み、予算との相性、所有靴との被り、履きやすさ、耐久性などをスコアとして分解し、同じ入力から同じ結果を返せる推薦ロジックを目指しています。

Core v0.1 は UI を持つアプリではなく、推薦ロジックの最小核を実装・検証する段階です。

## 3. 作成背景

スニーカーを買うときは、デザイン、ブランド、価格、流行、履きやすさ、手持ちの靴との被りなど、複数の要素を同時に考える必要があります。

一方で、実際の購入判断は「なんとなく欲しい」「SNSで見たから欲しい」のように曖昧になりやすく、なぜその一足を選ぶのかを説明しづらいと感じました。

そこで、購入判断を感覚だけに任せず、好みとの適合度や所有靴との重複を数値化し、ScoreBreakdown と Snapshot で判断材料を追える形にしました。

## 4. Core v0.1で実装した範囲

- ユーザーの好みを表す `PreferenceProfile`
- スニーカーの特徴を表す `SneakerVector`
- タグを表す `SneakerTag`
- TasteAxis / QualityAxis の分離
- TasteAxis の近さ評価
- comfort / durability の品質値評価
- axisWeights による重みづけ
- `tagBonus`
- `priceScore`
- `overlapPenalty`
- `finalScore`
- `Decision`
- `Demotion`
- `RecommendationSnapshot`
- TypeScript fixture
- Vitest による golden test

## 5. Core v0.1で実装していない範囲

- UI
- DB
- API
- AI説明生成
- 外部価格API
- プレ値予測
- 真贋判定
- 画像認識
- 認証
- リアルタイム監視
- 課金
- スクレイピング

## 6. 技術スタック

- TypeScript
- Node.js
- pnpm
- Vitest
- tsx

## 7. ディレクトリ構成

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
  smoke.test.ts
```

## 8. 主な機能

`calculateBalancedScore` では、ユーザーの `PreferenceProfile` と候補スニーカーの `SneakerCandidate` を受け取り、以下を返します。

- 各軸のスコア
- 価格適合度
- 所有靴との重複ペナルティ
- 最終スコア
- 購入判断
- 降格理由
- 判断根拠を保存しやすい ScoreBreakdown

`createRecommendationSnapshot` では、推薦時点の profile、candidate、ownedSneakers、preferredTags、scoreBreakdown、decision を固定した JSON 構造としてまとめます。

## 9. スコア計算の考え方

スコア計算では、TasteAxis と QualityAxis を分けています。

TasteAxis は、ユーザーの好みとスニーカーの特徴がどれだけ近いかで評価します。

```txt
culture
styleFit
simplicity
street
volume
```

QualityAxis は、ユーザーの好みに近いかではなく、靴側の品質値として評価します。

```txt
comfort
durability
```

最終スコアは、以下の要素を組み合わせて算出します。

- `featureFitScore`: 軸スコアと tagBonus を重みづけしたスコア
- `priceScore`: 候補スニーカーの価格とユーザーの予算との相性から計算
- `nonOverlapScore`: 所有靴との被りが少ないほど高くなるスコア

Core v0.1 では、計算結果の再現性を優先し、ScoreBreakdown 保存時の丸めルールも固定しています。

## 10. Decision / Demotion の考え方

Decision は `finalScore` から購入判断を返します。

```txt
85以上: STRONG_BUY
75以上: BUY
60以上: WAIT
45以上: WATCH
45未満: SKIP
```

Demotion は、スコアだけでは見落としやすいリスクを反映するための降格処理です。

`STRONG_BUY` または `BUY` の場合でも、以下に該当すると `WAIT` に降格します。

- 所有靴との被りが高い
- 価格適合度が低い
- comfort が低い
- durability が低い

これにより、単に点数が高い候補を出すだけでなく、「買ってよいかを一度待つべき理由」も扱えるようにしています。

## 11. テスト

Vitest で以下を検証しています。

- golden test による Case A から Case G までの期待値比較
- ScoreBreakdown の一致
- rawDecision / finalDecision の一致
- Demotion 理由の一致
- RecommendationSnapshot の一致
- Decision 閾値の単体テスト
- Demotion ルールの単体テスト

現在のテスト結果:

```txt
Test Files  4 passed
Tests       11 passed
```

## 12. 実行方法

依存関係をインストールします。

```bash
pnpm install
```

テストを実行します。

```bash
pnpm test
```

型チェックを実行します。

```bash
pnpm typecheck
```

## 13. バージョン

```txt
Core v0.1
package version: 0.1.0
snapshotVersion: core-v0.1-final-lock
Git tag: v0.1.0-core
```

Core v0.1 は、推薦ロジック、型定義、fixture、golden test を固定するバージョンです。

## 14. 今後の展望

今後の段階では、Core v0.1 で固定したロジックを土台にして、入力体験や保存機能を追加していく想定です。

- Core v0.2 以降: 質問診断、answerToVector、最低限の画面
- Core v1.0 以降: DB保存、認証、AI説明生成
- Core v2 以降: 外部API検証、価格推移、プレ値予測の研究検討

現時点では、これらは未実装です。

## 15. 学習・工夫した点

このプロジェクトでは、推薦ロジックを「なんとなく良さそう」ではなく、型とテストで確認できる形にすることを意識しました。

特に工夫した点は以下です。

- TasteAxis と QualityAxis を分け、好みの近さと靴側の品質を混同しないようにした
- Decision と Demotion を分離し、スコア判定とリスクによる降格を別の責務にした
- RecommendationSnapshot により、推薦時点の判断材料を固定できるようにした
- fixture と expected values を TypeScript で固定し、golden test で再現性を確認できるようにした
- UI や DB を先に作らず、Core v0.1 ではドメインロジックの正しさに集中した
