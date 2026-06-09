# UI Prompt 06: Web UI Implementation Boundary Design

あなたは、TypeScript個人開発プロジェクトのプロダクト設計者兼フロントエンド設計者です。

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
* 現時点ではWeb UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

## 今回の目的

`Web UI Implementation Boundary Spec` を作成してください。

これは、Next.js / React / TailwindなどでWeb UI実装に入る前に、後続のWeb UI実装Promptでどこまで実装してよいか、何を実装してはいけないか、Core APIをどう扱うかを固定するための設計書です。

今回は実装しません。
今回はReactコンポーネントを作りません。
今回はNext.jsアプリを作りません。
今回は設計書だけを追加してください。

## 重要

UI-06は実装Promptではありません。
UI-06は、次のWeb UI実装Promptを安全に作るための境界仕様です。

このPrompt内で「実装してよい範囲」と書く場合、それは今回実装するという意味ではありません。
必ず「後続のWeb UI実装Promptで実装してよい範囲」として扱ってください。

## 作成してよいファイル

* `docs/ui/06_WEB_UI_IMPLEMENTATION_BOUNDARY_SPEC.md`
* `docs/agent-prompts/ui/06-web-ui-implementation-boundary-design.md`

## 編集してはいけないファイル

* `src/**`
* `package.json`
* `pnpm-lock.yaml`
* `README.md`
* `.github/**`
* 既存fixture
* 既存test
* 既存Coreロジック

## `docs/ui/06_WEB_UI_IMPLEMENTATION_BOUNDARY_SPEC.md` に含める内容

1. Web UI Implementation Boundaryの目的
2. 既存UI設計書との関係
3. 後続のWeb UI実装Promptで実装してよい範囲
4. 後続のWeb UI実装Promptでも実装してはいけない範囲
5. 使用してよいCore API
6. 使用してよいデータ
7. mock dataの扱い
8. DBなしの状態管理方針
9. API Routeを作らない方針
10. Gemini / AI説明の扱い
11. 価格・在庫・真贋・プレ値・購入リンクの禁止
12. 画面ごとの実装境界
13. Client state / temporary stateの扱い
14. Result dataの扱い
15. package.json / pnpm-lock.yamlの扱い
16. エラー・空状態の扱い
17. アクセシビリティ最低条件
18. 実装Promptへ渡すときの禁止事項
19. 実装禁止事項
20. 完了条件

## 後続のWeb UI実装Promptで実装してよい範囲

* Home画面の静的UI
* Preference Diagnosisの入力UI
* Candidate Sneaker Checkの入力UI
* Result Listの表示UI
* Result Detailの表示UI
* Result Guideの補助表示
* UI-01〜UI-05で定義した画面遷移
* sample dataを使ったmock表示
* `recommendSneakers(input)` を呼ぶ前提のUI構造
* Core出力を表示するUI構造
* 画面内またはセッション中の一時状態
* DBなしで成立する最小UI

注意:

* これは今回実装するという意味ではない
* UI-06ではコードを作らない
* UI-06では設計境界だけを固定する

## 後続のWeb UI実装Promptでも実装してはいけない範囲

* DB保存
* 認証
* ログイン
* API Route
* Gemini API呼び出し
* OpenAI API呼び出し
* 外部価格API
* スクレイピング
* 実在価格表示
* 在庫表示
* プレ値予測
* 真贋判定
* 購入リンク
* ECサイト的な商品一覧
* 保存済み履歴
* マイページ
* 決済
* 通知
* AIチャット
* AIによるスコア生成
* AIによるDecision生成
* AIによるDemotion生成
* Coreロジックの変更
* ScoreBreakdownキー名の変更

## 使用してよいCore API

* `recommendSneakers(input)`

使用してはいけないこと:

* UI側でfinalScoreを再計算する
* UI側でrawDecisionを変更する
* UI側でfinalDecisionを変更する
* UI側でDemotionを隠す
* UI都合でCoreの型やスコア式を変更する
* ScoreBreakdownのキー名を変更する
* AI説明を理由にCore出力を変更する

## 使用してよいデータ

* 既存のsampleSneakers
* 既存のsampleProfiles
* 既存のsampleOwnedSneakers
* UI入力から作る一時的なPreferenceProfile
* UI入力から作る一時的なSneakerCandidate
* Coreが返したRecommendation結果
* rule-based説明または固定サンプル説明

## mock dataの扱い

* mock dataはUI確認用として扱う
* 実在価格として表示しない
* 実在在庫として表示しない
* 実在販売情報として表示しない
* sample dataであることが分かるようにする
* mock dataを外部APIの代わりに見せない
* mock dataを市場情報のように見せない
* mock dataから購入リンクを作らない

## DBなしの状態管理方針

* Core v0.5時点では永続保存しない
* 入力内容は画面内またはセッション中の一時状態として扱う
* ページ更新後に保存されることを保証しない
* 「保存済み」「履歴」「前回の結果」といった永続保存に見える表現を避ける
* localStorageやsessionStorageを使う場合も、別Promptで明示的に設計する
* UI-06では具体実装しない
* 状態管理ライブラリを追加しない
* 既存依存関係を増やさない

## API Routeを作らない方針

* Web UI初期実装ではAPI Routeを作らない
* Coreロジックはフロント側から直接呼ぶ前提にする
* サーバー処理や外部API連携はCore v1.0以降で扱う
* Geminiや外部価格APIの呼び出し口を作らない
* APIキーやSecretsを要求しない
* `.env` を追加しない
* CoreをClient Componentから直接importできるかは、WEB-02以降で確認する
* CoreがNode専用API、環境変数、外部API、サーバー専用処理に依存している場合は、直接Client Componentからimportしない
* その場合は作業を止め、別PromptでAdapter方針を設計する

## Gemini / AI説明の扱い

* Gemini説明はUI-03で表示方針だけ定義済み
* v0.5初期実装ではGemini APIを呼ばない
* Gemini説明パネルを実装するかどうかは、後続Promptで明示された場合のみ扱う
* 初期実装ではrule-based説明または固定サンプル説明を優先する
* Gemini説明が存在する場合でも補助説明として扱う
* Gemini説明はfinalScore / Decision / Demotionを変更しない
* AIが購入判断をしたように見せない
* Gemini APIキーを要求しない
* `.env` やSecretsを追加しない
* Gemini説明をUIの主役にしない
* Gemini説明がなくてもResult Detail画面が成立するようにする

## 価格・在庫・真贋・購入リンクの禁止

* 実在価格を表示しない
* 現在価格と書かない
* 相場価格と書かない
* 最安値と書かない
* 在庫あり / 在庫なしと書かない
* プレ値予測を表示しない
* 真贋判定を表示しない
* 購入リンクを表示しない
* 外部販売サイトへ誘導しない
* セール情報を表示しない
* クーポン情報を表示しない
* ECサイト的な商品カードを作らない

## 画面ごとの実装境界

### Home

後続Promptで実装してよい:

* 2つの主要CTA
* 結果の見方
* アプリで扱わないことの注意

後続Promptでも実装してはいけない:

* 保存済み履歴
* 商品一覧
* 購入リンク
* AIチャット
* Result Detailへの直接リンク
* ログイン必須導線
* マイページ

### Preference Diagnosis

後続Promptで実装してよい:

* 8問の入力
* 好き / 普通 / 苦手
* 回答保持
* PreferenceProfile初期値の生成前提

後続Promptでも実装してはいけない:

* 診断だけでBUY / WAIT / SKIPを確定
* AIによる判定
* 価格や在庫の表示
* Gemini API呼び出し

### Candidate Sneaker Check

後続Promptで実装してよい:

* スニーカー名
* ブランド
* 入力金額
* 予算
* タグ選択
* 確認画面

後続Promptでも実装してはいけない:

* 外部価格取得
* 在庫取得
* AIタグ推定
* 購入リンク
* 真贋判定
* スクレイピング

### Result List

後続Promptで実装してよい:

* finalDecision
* finalScore
* 短い理由
* 注意ラベル
* 詳細を見る

後続Promptでも実装してはいけない:

* rawDecisionの強調表示
* Gemini説明全文
* 実在価格
* 在庫
* 購入リンク
* 外部販売サイト誘導

### Result Detail

後続Promptで実装してよい:

* finalDecision
* finalScore
* demotions
* scoreBreakdown
* reasons
* cautions
* provider表示
* snapshot summary

後続Promptでも実装してはいけない:

* finalScore再計算
* Decision変更
* Demotion非表示
* AIによる購入判断表示
* 価格・在庫・真贋・購入リンク表示
* Gemini API呼び出し

### Result Guide

後続Promptで実装してよい:

* finalDecisionの説明
* finalScoreの説明
* Demotionの説明
* ScoreBreakdownの説明
* このアプリで扱わないことの説明

後続Promptでも実装してはいけない:

* Result Detailへの直接遷移
* 技術用語だらけの説明
* AI判断の強調
* 購入誘導

## Client state / temporary stateの扱い

* Preference Diagnosisの回答は一時状態として保持する
* Candidate Sneaker Checkの入力は一時状態として保持する
* Result dataはCore出力として一時的に保持する
* DB保存があるように見せない
* 永続化は実装しない
* 状態管理ライブラリを追加しない
* 既存依存関係を増やさない
* 複数画面で状態を共有する場合は、共通の親または画面フロー上の一時状態として扱う
* localStorage / sessionStorageを使う場合は別Promptで明示的に扱う

## Result dataの扱い

* Result dataはCore出力として扱う
* UI側で改変しない
* 表示名の日本語変換はしてよい
* Coreキー名は変更しない
* scoreBreakdownのキー名はCore定義に従う
* Demotionは必ず表示する
* rawDecisionとfinalDecisionの差分は詳細画面で補助表示する
* finalDecisionを主表示にする
* rawDecisionを主表示にしない

## package.json / pnpm-lock.yamlの扱い

* UI-06ではpackage.jsonとpnpm-lock.yamlを変更しない
* UI-06では依存関係やscriptsを追加しない
* 後続のWeb UI実装PromptでNext.js導入が必要な場合は、別Promptで明示的に扱う
* Next.js導入、React設定、Tailwind設定、scripts追加はWEB系Promptで扱う
* このUI-06では依存関係の追加可否を決めるだけに留める
* UI-06の変更範囲はdocsのみとする

注意:
Next.js導入が必要な場合は、WEB-02以降の別Promptで明示的に扱う。
このUI-06では、後続Promptに渡す禁止事項として記録するだけにする。

## エラー・空状態

* 入力不足時は次へ進めない
* Core出力がない場合は、目的に応じた入力画面へ戻す
* Result Detailに必要なデータがない場合は、HomeではなくPreference DiagnosisまたはCandidate Sneaker Checkへ誘導する
* Gemini説明がない場合でも画面全体を壊さない
* Snapshotがない場合は取得できない旨を表示する
* 価格・購入リンク・外部サイトへ誘導しない
* エラー文は短く、次に何をすればよいか分かる表現にする

## アクセシビリティ最低条件

* 主要ボタンは押しやすいサイズにする
* 選択状態は色だけで区別しない
* Decisionはラベルで表示する
* Demotionはアイコンだけで表示しない
* スコアバーには数値を併記する
* キーボード操作を妨げない
* エラー文は対象入力の近くに表示する
* CTAやフォーム操作はスマホでも押しやすくする

## 実装Promptへ渡すときの禁止事項

* DBを追加しない
* API Routeを追加しない
* 外部APIを追加しない
* Gemini APIを呼ばない
* OpenAI APIを呼ばない
* package.jsonに依存関係を追加しない
* pnpm-lock.yamlを変更しない
* README.mdを変更しない
* Coreロジックを変更しない
* テストfixtureを変更しない
* GitHub Actionsを変更しない
* 価格・在庫・真贋・購入リンクを出さない
* AIにスコアやDecisionを作らせない
* 保存済み履歴を作らない

## 実装禁止事項

* UI実装をしない
* Reactコンポーネントを作らない
* Next.js実装をしない
* DBを作らない
* API Routeを作らない
* Gemini APIを呼ばない
* OpenAI APIを入れない
* 外部価格APIを入れない
* スクレイピングを提案しない
* 実在価格を表示しない
* 在庫を表示しない
* プレ値予測を表示しない
* 真贋判定を表示しない
* 購入リンクを表示しない
* AIにスコアやDecisionを作らせない
* CoreのfinalScoreやDecision仕様をUI都合で変更しない

## 完了条件

* Web UI実装前の境界が明確になっている
* 後続のWeb UI実装Promptで実装してよい範囲が明確になっている
* 後続のWeb UI実装Promptでも実装してはいけない範囲が明確になっている
* Core APIの扱いが明確になっている
* mock dataの扱いが明確になっている
* DBなしの状態管理方針が明確になっている
* Gemini / AI説明の扱いが補助扱いとして明確になっている
* 価格・在庫・真贋・購入リンクを禁止している
* package.json / pnpm-lock.yamlをUI-06では変更しないことが明確になっている
* Next.js導入は後続Promptで明示的に扱うことが明確になっている
* CoreをClient Componentから直接importしてよいかはWEB-02以降で確認する方針が明確になっている
* 次のWEB-01実装計画Promptへ渡せる内容になっている

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
* 変更範囲が `docs/ui/**` と `docs/agent-prompts/ui/**` のみ
* `src/**` に変更がない
* `package.json` に変更がない
* `pnpm-lock.yaml` に変更がない
* `README.md` に変更がない
* `.github/**` に変更がない

## commit message案

```txt
docs: add web UI implementation boundary spec
```

## 完了後に報告すること

* 追加したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、Web UI実装に入る前に、後続Promptで実装してよい範囲と禁止範囲をdocsだけで固定することです。
実装はまだ行わず、docsだけで境界を固定してください。
