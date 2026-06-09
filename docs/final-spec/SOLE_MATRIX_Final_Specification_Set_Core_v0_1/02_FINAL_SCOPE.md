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
