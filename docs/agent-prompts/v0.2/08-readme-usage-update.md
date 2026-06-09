# 08 README and Usage Update Prompt

あなたは、TypeScript個人開発プロジェクトの技術ドキュメント整備担当です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core推薦ロジックは実装済み
* 公開API `recommendSneakers(input)` は実装済み
* サンプルデータは `src/data/**` に実装済み
* 通常CLI demo `pnpm demo` は実装済み
* ルールベース説明文生成は `src/explanation/**` に実装済み
* Gemini Adapterは `src/ai/**` に実装済み
* Gemini確認用CLI demo `pnpm demo:gemini` は実装済み
* B2Y風診断UI設計書はdocsとして追加済み
* `pnpm test` / `pnpm typecheck` / GitHub Actions CI は成功済み
* Web UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

今回の目的:
READMEとusage docsを更新し、現在のSOLE//MATRIX Core v0.2相当の使い方を、GitHub上で第三者が再現できる状態にしてください。

今回のゴール:

* READMEに現在できることを明記する
* `pnpm demo` の実行方法を書く
* `pnpm demo:gemini` の実行方法を書く
* `GEMINI_API_KEY` がない場合でもrule-based fallbackで動くことを書く
* GeminiはCoreの判定を変えないことを書く
* Web UI / DB / 外部価格API / スクレイピングは未実装であることを明記する
* 詳細な使用手順を `docs/usage/v0.2-cli-usage.md` に分離する
* このPromptを `docs/agent-prompts/v0.2/08-readme-usage-update.md` として保存する

作成・編集してよいファイル:

* `README.md`
* `docs/usage/v0.2-cli-usage.md`
* `docs/agent-prompts/v0.2/08-readme-usage-update.md`

編集してはいけないファイル:

* `src/**`
* `package.json`
* `pnpm-lock.yaml`
* `.github/**`
* 既存fixture
* 既存test
* 既存Coreロジック
* 既存demoロジック
* 既存AI Adapter
* 既存説明生成ロジック

READMEの変更ルール:

* CIバッジが既にある場合、バッジのURLやworkflow名は変更しない
* 未実装機能を実装済みのように書かない
* Geminiが購入判定を決めるように書かない
* 外部価格APIやプレ値予測が完成しているように書かない
* APIキーを直書きしない
* `.env` を作成する手順を書かない

READMEに必ず書く内容:

1. プロジェクト概要
2. 現在できること
3. 現在できないこと
4. 必要環境
5. セットアップ手順
6. 通常demoの実行方法
7. Gemini demoの実行方法
8. Gemini APIキーの扱い
9. fallback設計
10. テストと型チェック
11. GitHub Actions CI
12. ディレクトリ構成の簡単な説明
13. 実装上の安全方針
14. 今後のロードマップ

READMEの文体:

* 日本語で書く
* ポートフォリオとして読まれることを意識する
* 実装済みでないものを実装済みのように書かない
* 「AIがスニーカーを判定する」と書かない
* 「Coreが判定し、Geminiは説明文の自然化補助」と書く
* 「Geminiは無料で無制限に使える」と書かない
* 外部価格APIやプレ値予測が完成しているように書かない

現在できることとして書いてよい内容:

* サンプルデータを使った推薦デモ
* `recommendSneakers(input)` による推薦結果生成
* `finalScore` / `rawDecision` / `finalDecision` / `demotions` の表示
* rule-based説明文生成
* Gemini説明生成Adapter
* `GEMINI_API_KEY` なしでのfallback動作
* `pnpm demo`
* `pnpm demo:gemini`
* `pnpm test`
* `pnpm typecheck`
* GitHub ActionsによるCI

現在できないこととして必ず書く内容:

* Web UIは未実装
* DBは未実装
* ログイン / 認証は未実装
* API Routeは未実装
* 外部価格API連携は未実装
* スクレイピングは未実装
* プレ値予測は未実装
* 実在在庫や真贋判定は扱わない
* Geminiは購入判定を決めない

必要環境:

* Node.js
* pnpm
* Git
* Gemini APIキーは任意

セットアップ手順の例:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm demo
```

Gemini demo:

```bash
pnpm demo:gemini
```

APIキーなしの場合:

```txt
GEMINI_API_KEY not set; using rule-based fallback.
```

PowerShellで一時的にAPIキーを使う例:

```powershell
$env:GEMINI_API_KEY="your_api_key_here"
pnpm demo:gemini
```

Gemini APIキーについて必ず書くこと:

* APIキーをGitHubにcommitしない
* `.env` は今回作成しない
* README内に本物のAPIキーを書かない
* v0.2では `GOOGLE_API_KEY` は読まない
* APIキーがない場合でもdemoは壊れない
* Gemini失敗時もrule-based fallbackで表示する
* Gemini APIにはレート制限があるため、無制限利用を前提にしない

`docs/usage/v0.2-cli-usage.md` に必ず書く内容:

1. このドキュメントの目的
2. 前提環境
3. install
4. 通常CLI demo
5. Gemini CLI demo
6. APIキーなしでのfallback
7. APIキーありでの実行方法
8. テスト
9. 型チェック
10. よくある失敗
11. やってはいけないこと
12. 次に進む作業

よくある失敗に入れる内容:

* PowerShellにプロンプト本文を貼ってしまう
* `PS C:\...>` を一緒に貼ってしまう
* `pnpm-lock.yaml` が意図せず変わる
* APIキーをコードに書いてしまう
* Geminiの文章でDecisionを変えようとしてしまう
* Web UI実装に早く入りすぎる

実装上の安全方針として書く内容:

* Coreのscore / Decision / Demotionは決定論的に計算する
* rule-based説明はfallbackとして必ず残す
* Geminiは説明文の補助のみ
* 外部価格APIやスクレイピングはv0.2では扱わない
* APIキーはソース管理に含めない
* 通常demoとGemini demoを分ける
* `pnpm demo` はAIなしでも動く

禁止事項:

* `src/**` を変更しない
* `package.json` を変更しない
* `pnpm-lock.yaml` を変更しない
* GitHub Actions設定を変更しない
* READMEで未実装機能を実装済みのように書かない
* Geminiが購入判定を決めるように書かない
* APIキーを直書きしない
* `.env` を作成しない
* 外部価格APIやスクレイピングの実装手順を書かない
* プレ値予測ができるように書かない

実行すべきコマンド:

```bash
pnpm test
pnpm typecheck
git status --short --untracked-files=all
git diff --stat
git diff --name-status
```

期待する結果:

* 既存テストがすべて成功する
* typecheckが成功する
* 変更範囲が `README.md`、`docs/usage/v0.2-cli-usage.md`、`docs/agent-prompts/v0.2/08-readme-usage-update.md` のみ
* `src/**` に変更がない
* `package.json` に変更がない
* `pnpm-lock.yaml` に変更がない
* `.github/**` に変更がない

commit message案:

```txt
docs: update README and CLI usage guide
```

完了後に報告すること:

* 追加・変更したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、現在の成果をGitHub上で再現可能にすることです。
実装は変更せず、READMEとusage docsだけを整備してください。
