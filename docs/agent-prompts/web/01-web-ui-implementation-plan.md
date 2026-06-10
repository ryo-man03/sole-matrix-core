# WEB Prompt 01: Web UI Implementation Plan

あなたは、TypeScript個人開発プロジェクトのフロントエンド設計者兼実装計画者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

## 現在の状態

* Core推薦ロジックは実装済み
* 公開API `recommendSneakers(input)` は実装済み
* サンプルデータは実装済み
* CLI demoは実装済み
* Preference Diagnosis UI設計書は `docs/ui/01_DIAGNOSIS_UI_SPEC.md` に追加済み
* Candidate Sneaker Check UI設計書は `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` に追加済み
* Result / Detail Display UI設計書は `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md` に追加済み
* Home / Navigation Flow UI設計書は `docs/ui/04_HOME_NAVIGATION_FLOW_SPEC.md` に追加済み
* Wireflow / Low-Fidelity Layout UI設計書は `docs/ui/05_WIREFLOW_LOW_FIDELITY_LAYOUT_SPEC.md` に追加済み
* Web UI Implementation Boundary Specは `docs/ui/06_WEB_UI_IMPLEMENTATION_BOUNDARY_SPEC.md` に追加済み
* Visual Design Direction Specは `docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md` に追加済み
* Figma / Pencil Design Prompt Specは `docs/design/02_FIGMA_PENCIL_DESIGN_PROMPT_SPEC.md` に追加済み
* Figma Mobile Wireframe Review Summaryは `docs/design/03_FIGMA_MOBILE_WIREFRAME_REVIEW_SUMMARY.md` に追加済み
* Figma Mobile minor fixesは完了扱い
* Candidate CheckはStep 1 / Step 2 / Step 3の分割方針が明確になった
* Result DetailはfinalDecision / Demotion Alertを上位に置き、ScoreBreakdownを補助扱いにする方針が固まった
* 現時点ではWeb UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

## 今回の目的

`WEB-01: Web UI Implementation Plan` を作成してください。

これは、Web UI実装に入る前に、実装順序・変更範囲・画面単位の分割・状態管理方針・Core API連携方針・禁止事項をdocsで固定するための実装計画書です。

今回は実装しません。
今回はReactコンポーネントを作りません。
今回はNext.jsアプリを作りません。
今回はTailwind設定をしません。
今回はpackage.jsonを変更しません。
今回はpnpm-lock.yamlを変更しません。
今回はsrc配下を変更しません。
今回は設計書だけを追加してください。

重要:

WEB-01は実装Promptではありません。
WEB-01は、WEB-02以降の実装Promptを安全に分割するための計画書です。

今回やることは、Web UIをどういう順番で実装するか、どのPromptで何を変更してよいか、どの時点でpackage.json変更を許可するかを整理することです。

## 作成してよいファイル

* `docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md`
* `docs/agent-prompts/web/01-web-ui-implementation-plan.md`

`docs/web/` や `docs/agent-prompts/web/` が存在しない場合は、新規作成してよいです。

## 編集してはいけないファイル

* `src/**`
* `package.json`
* `pnpm-lock.yaml`
* `README.md`
* `.github/**`
* `tsconfig.json`
* test設定ファイル
* 既存fixture
* 既存test
* 既存Coreロジック
* `docs/ui/**` の既存ファイル
* `docs/design/**` の既存ファイル

## `docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md` に含める内容

1. WEB-01の目的
2. 参照する既存ドキュメント
3. Web UI実装の前提
4. WEB-02以降の実装分割
5. 実装してよい範囲
6. 実装してはいけない範囲
7. 技術スタック確認方針
8. Next.js / React / Tailwind導入判断の扱い
9. Core API連携方針
10. CoreのClient import安全性確認
11. Adapter方針の扱い
12. create-next-app相当の初期化禁止方針
13. 画面構成計画
14. ルート / ページ構成案
15. コンポーネント分割案
16. 状態管理方針
17. Candidate CheckのStep分割方針
18. Result Detailの表示優先順位
19. ScoreBreakdownの扱い
20. タグ表示名と内部タグの対応
21. データ利用方針
22. テスト方針
23. WEB-02へ進む条件
24. WEB実装Promptでの禁止事項
25. 完了条件

## 実行すべきコマンド

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

## 期待する結果

* 既存テストがすべて成功する
* typecheckが成功する
* 変更範囲が `docs/web/**` と `docs/agent-prompts/web/**` のみ
* `src/**` に変更がない
* `package.json` に変更がない
* `pnpm-lock.yaml` に変更がない
* `README.md` に変更がない
* `.github/**` に変更がない
* `tsconfig.json` に変更がない
* test設定に変更がない
* `docs/ui/**` の既存ファイルに変更がない
* `docs/design/**` の既存ファイルに変更がない

## commit message案

```txt
docs: add web UI implementation plan
```

## 完了後に報告すること

* 追加したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* WEB-02へ進んでよいかの判断

今回の目的は、Web UI実装に入る前に、実装順序と変更範囲をdocsだけで固定することです。
React実装・Next.js導入・Tailwind設定・package.json変更はまだ行わないでください。
