# UI Prompt 02: Candidate Sneaker Check Design

あなたは、TypeScript個人開発プロジェクトのプロダクト設計者兼UI設計者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core推薦ロジックは実装済み
* 公開API `recommendSneakers(input)` は実装済み
* サンプルデータは実装済み
* CLI demoは実装済み
* Preference Diagnosis UI設計書は `docs/ui/01_DIAGNOSIS_UI_SPEC.md` に追加済み
* 現時点ではWeb UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

今回の目的:

`Candidate Sneaker Check` のUI設計書を作成してください。

これは、ユーザーが気になっているスニーカーを手入力し、その候補が自分のPreferenceProfileと合うか、購入判断の材料になるかを確認するための画面です。

今回は実装しません。
今回は設計書だけを追加してください。

重要:

Candidate Sneaker Checkは、Preference Diagnosisとは別画面です。

* Preference Diagnosis: ユーザーの好みを作る診断
* Candidate Sneaker Check: 気になる靴を買うか確認するチェック

今回はWeb UI実装をしないでください。
Reactコンポーネントを作らないでください。
DB、API Route、OpenAI API、Gemini呼び出し、外部価格API、スクレイピングを実装しないでください。

Gemini Adapterが存在していても、UI-02ではGemini説明表示を扱わないでください。
Gemini説明表示はUI-03以降のResult / Detail設計で扱います。

作成してよいファイル:

* `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md`
* `docs/agent-prompts/ui/02-candidate-sneaker-check-design.md`

編集してはいけないファイル:

* `src/**`
* `package.json`
* `pnpm-lock.yaml`
* `README.md`
* `.github/**`
* 既存fixture
* 既存test
* 既存Coreロジック

`docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` に含める内容:

1. Candidate Sneaker Checkの目的
2. Preference Diagnosisとの違い
3. 画面構成
4. 入力ステップ
5. 入力項目
6. タグ選択ルール
7. 金額の扱い
8. priceLevel / budgetFit変換方針
9. 所有靴との被り
10. 結果表示方針
11. エラー・空状態
12. スマホ表示方針
13. アクセシビリティ方針
14. Coreとの境界
15. 実装禁止事項
16. 完了条件

設計方針:

* 入力は3ステップに分ける
  * Step 1: 基本情報
  * Step 2: 特徴タグ
  * Step 3: 確認
* スニーカー名は表示用であり、スコアの根拠にしない
* ブランド名は表示用であり、スコアの根拠にしない
* タグは選択式にする
* 自由入力タグは使わない
* 金額はユーザー入力値として扱う
* 市場価格、相場、在庫、プレ値、真贋は扱わない
* 結果は「買え」ではなく「判断材料」として表示する
* finalScore / Decision / DemotionはCoreが出したものを表示するだけにする

入力項目:

Step 1: 基本情報

* スニーカー名
* ブランド
* 入力金額
* 予算
* メモ

Step 2: 特徴タグ

* クラシック
* ローテク
* ストリート
* シンプル
* ボリューム感
* ランニング系
* バスケット系
* 履きやすい
* 長く履けそう
* レトロ
* 文化背景あり
* 上質・高級感

Step 3: 確認

* 入力内容の確認
* 選択タグの確認
* 価格・予算の入力確認
* 所有靴との被り確認
* Coreへ渡すSneakerCandidateの確認
* 診断するボタン

金額の扱い:

* 入力金額はユーザーが入力した参考値として扱う
* 市場価格として表示しない
* 相場として表示しない
* 最安値として表示しない
* プレ値として表示しない
* 在庫情報と結びつけない
* 価格・予算との相性はbudgetFitとして扱う
* priceLevelは靴側の価格帯として扱う
* budgetFitはユーザー予算との相性として扱う
* priceSensitivityはユーザー側の慎重さとして扱う

UI文言例:

「この金額はユーザー入力です。市場価格や在庫を保証するものではありません。」

タグ選択ルール:

* タグは最大5個まで
* 1個以上選択しないと次へ進めない
* 英語の内部タグはUIに直接出さない
* UIでは日本語ラベルを使う
* 内部ではSneakerTagへ変換する
* AIがタグを推定しない
* ブランド名やスニーカー名からタグを自動決定しない

タグ表示例:

| UI表示 | 内部タグ |
| --- | --- |
| クラシック | classic |
| ローテク | low_tech |
| ストリート | street |
| シンプル | minimal |
| ボリューム感 | chunky |
| ランニング系 | running |
| バスケット系 | basketball |
| 履きやすい | comfortable |
| 長く履けそう | durable |
| レトロ | retro |
| 文化背景あり | heritage |
| 上質・高級感 | premium |

priceLevel / budgetFit変換方針:

* 入力金額そのものをfinalScoreへ直接入れない
* 入力金額と予算からbudgetFitを作る
* 入力金額の大きさからpriceLevelを作る
* priceSensitivityはPreferencePolicy側の値として扱う
* UIは変換方針を定義するだけで、Coreの最終スコア式を変更しない
* priceLevel / budgetFitの変換表はUI設計上の仕様であり、今回は関数実装しない
* 実装は後続Promptで行う

budgetFitの例:

| 入力金額 / 予算 | budgetFit目安 |
| ---: | ---: |
| 0.7以下 | 95 |
| 1.0以下 | 80 |
| 1.2以下 | 60 |
| 1.5以下 | 40 |
| 1.5超 | 20 |

この表はUI設計上の目安であり、Core実装時には既存のpriceScore仕様と矛盾しないように扱う。

所有靴との被り:

* 所有靴との被りは、選択タグと所有靴のroleTagsから判断する前提にする
* UI-02では所有靴DBがないため、まずは確認欄として扱う
* 実際の永続化はCore v1.0以降に回す
* 「似ている所有靴があるかもしれない」という注意表示を想定する
* UIはoverlapPenaltyを勝手に計算しない
* Coreが返したDemotionを隠さない

結果表示方針:

結果画面では以下を表示する。

* スニーカー名
* finalScore
* rawDecision
* finalDecision
* Demotion
* 合う理由
* 注意すべき理由
* 価格・予算との相性
* 所有靴との被り
* ScoreBreakdownへの導線

表示しないもの:

* 実在価格
* 在庫
* プレ値予測
* 真贋判定
* AI自由推薦
* 外部サイト価格
* 購入リンク
* Gemini説明文

エラー・空状態:

* スニーカー名が空の場合は次へ進めない
* 入力金額が未入力または0以下の場合は注意を出す
* 予算が未入力または0以下の場合は注意を出す
* タグが0件の場合は次へ進めない
* タグが上限を超えた場合は追加できない
* Coreへ渡す入力が不足している場合は診断ボタンを無効にする
* エラー文は短く、ユーザーが次に何を直せばよいか分かる表現にする

スマホ表示方針:

* 1カラムを基本にする
* 入力ステップを上部に表示する
* タグは押しやすいチップ形式にする
* 金額と予算は縦並びにする
* 確認画面ではカードを縦積みにする
* 下部の主要ボタンは押しやすい高さにする

アクセシビリティ方針:

* タグボタン、次へボタン、診断するボタンはスマホでも押しやすいサイズにする
* 選択状態は色だけでなく、枠・文字・ラベルでも分かるようにする
* 無効ボタンは見た目だけでなくdisabled状態にする
* ステップ番号だけに頼らず、現在の入力段階をテキストでも表示する
* キーボード操作でもタグ選択と次へ移動ができる設計にする
* エラー文は入力項目の近くに表示する

Coreとの境界:

UIが行ってよいこと:

* 入力を保持する
* 入力をSneakerCandidateへ変換するための仕様を定義する
* budgetFitの考え方を定義する
* Coreへ渡すinputの形を整理する
* Coreの出力を表示する前提を整理する

UIが行ってはいけないこと:

* finalScoreを再計算する
* Decisionを変更する
* Demotionを隠す
* Geminiの文章を理由に判定を変える
* 市場価格を断言する
* 在庫や真贋を断言する
* AIにタグやスコアを作らせる
* ブランド名やスニーカー名だけでスコアを決める

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

`docs/agent-prompts/ui/02-candidate-sneaker-check-design.md` には、このPromptの内容を保存してください。

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
docs: add candidate sneaker check UI design spec
```

完了後に報告すること:

* 追加したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、スニーカー名・タグ・金額からの購入候補チェック画面を、Preference Diagnosisとは分けて設計することです。
実装はまだ行わず、docsだけで設計を固定してください。
