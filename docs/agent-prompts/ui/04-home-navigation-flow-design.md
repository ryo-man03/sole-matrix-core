# UI Prompt 04: Home / Navigation Flow Design

あなたは、TypeScript個人開発プロジェクトのプロダクト設計者兼UI設計者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core推薦ロジックは実装済み
* 公開API `recommendSneakers(input)` は実装済み
* サンプルデータは実装済み
* CLI demoは実装済み
* Preference Diagnosis UI設計書は `docs/ui/01_DIAGNOSIS_UI_SPEC.md` に追加済み
* Candidate Sneaker Check UI設計書は `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` に追加済み
* Result / Detail Display UI設計書は `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md` に追加済み
* 現時点ではWeb UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

今回の目的:

`Home / Navigation Flow` のUI設計書を作成してください。

これは、SOLE//MATRIXのユーザーが最初にどこから入るか、どの画面へ進むか、各UI設計書がどう接続されるかを固定するための設計書です。

今回は実装しません。
今回は設計書だけを追加してください。

重要:

UI-04ではHome画面と画面遷移の設計だけを行います。

Next.js実装、Reactコンポーネント、DB、API Route、認証、外部価格API、スクレイピングは実装しないでください。

Homeは商品検索ページではありません。
HomeはECサイトではありません。
HomeはAIチャット画面ではありません。
Homeは市場価格や在庫を見る画面ではありません。
Homeは保存済み履歴を見る画面ではありません。
HomeからResult Detailへ直接遷移させないでください。

Homeの目的は、ユーザーの目的に応じて入口を分けることです。

主要入口:

* 好みを診断する
* 気になる靴をチェックする

補助導線:

* 結果の見方

Home初期表示では、以下を主導線にしないでください。

* 前回の結果を見る
* 最初からやり直す
* Result Detailへ直接移動する
* ログイン
* 保存履歴
* AIチャット
* 商品検索
* 購入リンク

DB未実装のため、「前回の結果を見る」は主導線にしないでください。
永続保存された履歴があるように見せないでください。
一時保存や履歴機能はCore v1.0以降の設計として扱ってください。

「最初からやり直す」は、Home初期表示では主導線にしないでください。
やり直し導線は、Preference Diagnosis中、Candidate Sneaker Check中、Result画面など、やり直す対象が明確な文脈でのみ表示してください。

作成してよいファイル:

* `docs/ui/04_HOME_NAVIGATION_FLOW_SPEC.md`
* `docs/agent-prompts/ui/04-home-navigation-flow-design.md`

編集してはいけないファイル:

* `src/**`
* `package.json`
* `pnpm-lock.yaml`
* `README.md`
* `.github/**`
* 既存fixture
* 既存test
* 既存Coreロジック

`docs/ui/04_HOME_NAVIGATION_FLOW_SPEC.md` に含める内容:

1. Home / Navigation Flowの目的
2. 既存UI設計書との関係
3. Home画面の役割
4. Homeで表示する入口
5. Homeで表示しないもの
6. ユーザー目的別の導線
7. 画面遷移図
8. Navigation構造
9. 初回ユーザー導線
10. 2回目以降ユーザー導線
11. Result List / Result Detailへの合流方針
12. 戻る・やり直す導線
13. エラー・空状態
14. スマホ表示方針
15. アクセシビリティ方針
16. Coreとの境界
17. 実装禁止事項
18. 完了条件

設計方針:

* Homeではユーザーの目的を2つに分ける

  * 好みを診断する
  * 気になる靴をチェックする
* HomeではCoreのスコア計算をしない
* Homeでは推薦結果を直接作らない
* Homeでは市場価格、在庫、プレ値、真贋を扱わない
* Homeでは購入リンクを表示しない
* HomeではGemini説明を表示しない
* HomeではAIチャットを主役にしない
* Homeでは保存済み履歴があるように見せない
* HomeではResult Detailへ直接遷移させない
* Homeは白基調、カード型、余白多めの落ち着いたUIを想定する
* CTAは2つまでを主役にする
* 主要CTAの文言はユーザーの目的が分かる日本語にする
* 内部名をそのままユーザーに見せすぎない
* DB未実装のため、保存済み履歴があるように見せない

Homeの主要CTA:

1. 好みを診断する

   * 説明文: 8問でスニーカーの好みを整理します
   * 遷移先: Preference Diagnosis
   * 関連設計書: `docs/ui/01_DIAGNOSIS_UI_SPEC.md`

2. 気になる靴をチェックする

   * 説明文: スニーカー名・タグ・予算から購入判断の材料を作ります
   * 遷移先: Candidate Sneaker Check
   * 関連設計書: `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md`

補助導線:

1. 結果の見方

   * 目的: finalDecision、finalScore、Demotionの意味を簡単に説明する
   * 関連設計書: `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md`
   * 注意: 技術用語を前面に出しすぎない
   * 注意: Result Detailへ直接遷移させるのではなく、結果表示の読み方を説明する導線にする

2. 最初からやり直す

   * Home初期表示では主導線にしない
   * Preference Diagnosis中、Candidate Sneaker Check中、Result画面など、やり直す対象が明確な文脈でのみ表示する
   * 入力が消える場合は確認を出す
   * Homeに常時表示しない

3. 前回の結果を見る

   * Core v0.5では主導線にしない
   * DB未実装のため永続履歴があるように見せない
   * Home初期表示では表示しない、または将来機能として非主導線にする
   * 実装する場合はCore v1.0以降で扱う
   * 一時保存やlocal/sessionがある場合のみ、別設計で扱う

Homeで表示しないもの:

* スニーカー一覧
* 実在価格
* 在庫
* プレ値予測
* 真贋判定
* 購入リンク
* 外部サイト価格
* AI自由推薦
* Gemini説明全文
* ログイン必須の導線
* DB保存済みのように見える履歴
* Result Detailへの直接リンク
* 保存済み一覧
* マイページ
* ECサイト的な商品カード
* ランキング
* セール情報
* クーポン情報

ユーザー目的別導線:

1. まだ好みが決まっていないユーザー

   * Home
   * 好みを診断する
   * Preference Diagnosis
   * PreferenceProfile Initial Build
   * Result List
   * Result Detail

2. 買うか迷っている靴があるユーザー

   * Home
   * 気になる靴をチェックする
   * Candidate Sneaker Check
   * Result Detail

3. 結果の意味を確認したいユーザー

   * Home
   * 結果の見方
   * Result / Detail Displayの説明
   * 必要に応じてHomeへ戻る

4. やり直したいユーザー

   * Home初期表示から直接「やり直す」には進めない
   * Preference Diagnosis中、Candidate Sneaker Check中、Result画面など文脈がある場合のみ表示する
   * 入力リセット確認
   * 各入力画面へ戻る

画面遷移図:

```txt
Home
├─ Preference Diagnosis
│  ├─ Question Flow
│  ├─ PreferenceProfile Initial Build
│  └─ Result List
│     └─ Result Detail
│
├─ Candidate Sneaker Check
│  ├─ Step 1 Basic Info
│  ├─ Step 2 Feature Tags
│  ├─ Step 3 Confirm
│  └─ Result Detail
│
└─ Result Guide
   └─ Result / Detail Display Explanation
```

Homeから直接Result Detailへ遷移させないでください。
Result Detailは、Preference DiagnosisまたはCandidate Sneaker Checkの結果がある前提の画面です。

Navigation構造:

* Header

  * SOLE//MATRIX
  * Homeへ戻る
* Main

  * 主要CTAカード2つ
  * 補助導線「結果の見方」
* Footer

  * このアプリで扱わないこと
  * 価格・在庫・真贋は扱わない注意

Header方針:

* Headerは最小限にする
* 最初はグローバルナビを増やさない
* ログイン、マイページ、保存済み一覧は現段階では出さない
* Homeへ戻る導線は用意する
* スマホではHeaderを簡潔にする

Result List / Result Detailへの合流方針:

* Preference Diagnosis後は複数候補が出るためResult Listへ進む
* Candidate Sneaker Check後は単一候補のためResult Detailへ進む
* どちらも最終的にはResult / Detail Display設計に従う
* Result画面ではCore出力を表示するだけにする
* Result画面でHomeの導線を再表示しすぎない
* HomeからResult Detailへ直接行かせない
* Result Detailへ行くには、必ず診断結果または候補チェック結果がある前提にする

戻る・やり直す導線:

* Preference Diagnosis中は前の質問へ戻れる
* Candidate Sneaker Check中は前のステップへ戻れる
* Result画面からHomeへ戻れる
* Result画面から同じ入力を修正する導線を用意する
* やり直す場合は入力消失の確認を表示する
* Home初期表示では「最初からやり直す」を主導線にしない
* DB未実装のため、保存されるような表現は避ける

エラー・空状態:

* 初回アクセス時に履歴がない場合、「前回の結果を見る」を表示しない、または将来機能として非主導線にする
* 途中入力がない場合は、Homeから再開ではなく最初から開始にする
* Resultがない場合は、Preference DiagnosisまたはCandidate Sneaker Checkへ誘導する
* Result Detailに必要な結果データがない場合は、Homeへ戻すのではなく、目的に応じてPreference DiagnosisまたはCandidate Sneaker Checkへ誘導する
* エラー文は短く、次に進む行動を明確にする

スマホ表示方針:

* HomeのCTAカードは縦積みにする
* 主要CTAは画面上部に配置する
* 補助導線は下部にまとめる
* Headerは最小限にする
* CTAボタンは押しやすい高さにする
* 情報を詰め込みすぎない
* 2つの主要CTAが同じ重要度で見えるようにする
* 「結果の見方」は主要CTAより弱く表示する

アクセシビリティ方針:

* CTAは色だけで区別しない
* CTAカード全体を押せる設計にする場合も、ボタン文言を明確にする
* キーボード操作で主要CTAに移動できる設計にする
* 現在の画面位置が分かる見出しを用意する
* アイコンだけに頼らず、テキストラベルを併記する
* ボタンやカードはスマホでも押しやすいサイズにする
* 主要CTAの目的がスクリーンリーダーでも分かる文言にする

Coreとの境界:

UIが行ってよいこと:

* 画面入口を整理する
* 画面遷移を定義する
* ユーザー目的別の導線を定義する
* Coreへ渡す前の画面構成を整理する
* Core出力画面への合流方針を整理する
* Home上の文言とCTAの優先順位を設計する

UIが行ってはいけないこと:

* HomeでfinalScoreを計算する
* HomeでDecisionを作る
* HomeでDemotionを作る
* HomeでGemini説明を生成する
* Homeで市場価格を取得する
* Homeで在庫や真贋を表示する
* Homeで購入リンクを表示する
* Homeで保存済み履歴があるように見せる
* HomeからResult Detailへ直接遷移させる
* Homeを商品検索ページにする
* HomeをECページにする
* HomeをAIチャット画面にする

実装禁止事項:

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

実行すべきコマンド:

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

期待する結果:

* 既存テストがすべて成功する
* typecheckが成功する
* 変更範囲が `docs/ui/**` と `docs/agent-prompts/ui/**` のみ
* `src/**` に変更がない
* `package.json` に変更がない
* `pnpm-lock.yaml` に変更がない
* `README.md` に変更がない
* `.github/**` に変更がない

commit message案:

```txt
docs: add home navigation flow UI design spec
```

完了後に報告すること:

* 追加したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、Home画面とNavigation Flowを設計し、Preference Diagnosis / Candidate Sneaker Check / Result Detail の導線を固定することです。
実装はまだ行わず、docsだけで設計を固定してください。
