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
