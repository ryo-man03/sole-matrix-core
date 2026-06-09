# SOLE//MATRIX Core v0.2

[![CI](https://github.com/ryo-man03/sole-matrix-core/actions/workflows/ci.yml/badge.svg)](https://github.com/ryo-man03/sole-matrix-core/actions/workflows/ci.yml)

## プロジェクト概要

SOLE//MATRIX Coreは、スニーカー購入判断を支援するためのTypeScript製推薦ロジックです。

このリポジトリでは、ユーザーの好み、予算、所有済みスニーカーとの重複、履きやすさ、耐久性などをCoreが決定論的に計算し、候補スニーカーごとに推薦結果を返します。

v0.2相当では、公開API `recommendSneakers(input)`、サンプルデータ、CLI demo、rule-based説明文生成、Gemini Adapter、Gemini確認用CLI demoまでを扱います。Coreが判定し、Geminiは説明文の自然化補助だけを担当します。

## 現在できること

- `src/data/**` のサンプルデータを使った推薦デモ
- 公開API `recommendSneakers(input)` による推薦結果生成
- `finalScore` / `rawDecision` / `finalDecision` / `demotions` の表示
- rule-based説明文生成
- Gemini説明生成Adapter
- `GEMINI_API_KEY` なしでのrule-based fallback動作
- 通常CLI demoの実行: `pnpm demo`
- Gemini CLI demoの実行: `pnpm demo:gemini`
- `pnpm test` による既存テスト実行
- `pnpm typecheck` による型チェック
- GitHub ActionsによるCI

## 現在できないこと

- Web UIは未実装
- DBは未実装
- ログイン / 認証は未実装
- API Routeは未実装
- 外部価格API連携は未実装
- スクレイピングは未実装
- プレ値予測は未実装
- 実在在庫や真贋判定は扱わない
- Geminiは購入判定を決めない

## 必要環境

- Node.js
- pnpm
- Git
- Gemini APIキーは任意

## セットアップ手順

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm demo
```

詳細なCLI利用手順は [docs/usage/v0.2-cli-usage.md](docs/usage/v0.2-cli-usage.md) を参照してください。

## 通常demoの実行方法

```bash
pnpm demo
```

通常demoはAIを使わず、サンプルデータをCore推薦ロジックに渡して推薦結果を表示します。出力には `finalScore`、`rawDecision`、`finalDecision`、`demotions` が含まれます。

## Gemini demoの実行方法

```bash
pnpm demo:gemini
```

Gemini demoは、まずCoreが推薦結果を決定し、その結果に対して説明文を生成します。`GEMINI_API_KEY` が設定されている場合はGemini Adapterによる説明文生成を試し、APIキーがない場合やGemini呼び出しに失敗した場合はrule-based説明文にfallbackします。

APIキーがない場合の表示例:

```txt
GEMINI_API_KEY not set; using rule-based fallback.
```

PowerShellで一時的にAPIキーを使う例:

```powershell
$env:GEMINI_API_KEY="your_api_key_here"
pnpm demo:gemini
```

## Gemini APIキーの扱い

- APIキーをGitHubにcommitしない
- `.env` は今回作成しない
- README内に本物のAPIキーを書かない
- v0.2では `GOOGLE_API_KEY` は読まない
- APIキーがない場合でもdemoは壊れない
- Gemini失敗時もrule-based fallbackで表示する
- Gemini APIにはレート制限があるため、無制限利用を前提にしない

## fallback設計

SOLE//MATRIX Coreでは、説明文生成においてrule-based説明を必ずfallbackとして残します。

`pnpm demo` はAIなしで動きます。`pnpm demo:gemini` も、Coreの推薦結果を先に確定させたうえで説明文だけを生成します。Geminiは `finalScore`、`rawDecision`、`finalDecision`、`demotions` を変更しません。

## テストと型チェック

```bash
pnpm test
pnpm typecheck
```

テストでは、Core推薦ロジック、公開API、サンプルデータ、説明文生成、Gemini Adapter、CLI表示フォーマットなどを検証します。型チェックは `tsc --noEmit` で実行されます。

## GitHub Actions CI

GitHub Actions CIでは、リポジトリ上でテストと型チェックを実行します。CIバッジはREADME上部に表示しています。

## ディレクトリ構成

```txt
src/core/
  recommendSneakers(input) の公開API

src/domain/
  score / Decision / Demotion などのCore推薦ロジック

src/data/
  CLI demoで使うサンプルプロフィール、候補、所有済みスニーカー

src/demo/
  pnpm demo / pnpm demo:gemini の実行エントリと表示整形

src/explanation/
  rule-based説明文生成

src/ai/
  Gemini説明生成Adapter

docs/ui/
  B2Y風診断UI設計書

docs/usage/
  CLI利用手順

docs/agent-prompts/
  開発作業ごとのPrompt記録
```

## 実装上の安全方針

- Coreのscore / Decision / Demotionは決定論的に計算する
- rule-based説明はfallbackとして必ず残す
- Geminiは説明文の補助のみ
- Geminiが購入判定を決める設計にはしない
- 外部価格APIやスクレイピングはv0.2では扱わない
- APIキーはソース管理に含めない
- 通常demoとGemini demoを分ける
- `pnpm demo` はAIなしでも動く

## 今後のロードマップ

- 診断UIの実装
- 診断回答から `PreferenceProfile` へ変換する処理の追加
- CLI以外の利用口の検討
- DB保存の検討
- API Routeの検討
- 認証の検討
- 外部価格API連携の調査
- スクレイピングを使わない価格情報取得方針の検討
- プレ値予測を扱う場合の根拠、責任範囲、検証方法の設計

現時点では、Web UI、DB、API Route、認証、外部価格API、スクレイピング、プレ値予測は未実装です。
