# UI Prompt 05: Wireflow / Low-Fidelity Layout Design

あなたは、TypeScript個人開発プロジェクトのプロダクト設計者兼UI/UX設計者です。

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
* 現時点ではWeb UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

## 今回の目的

`Wireflow / Low-Fidelity Layout` のUI設計書を作成してください。

これは、SOLE//MATRIXの主要画面について、Figma / Pencil / 将来のUI実装Promptに渡せる程度の低忠実度レイアウトと画面間の流れを固定するための設計書です。

今回は実装しません。
今回は高忠実度デザインも作りません。
今回は設計書だけを追加してください。

## 重要

UI-05では、画面の大まかな配置と遷移だけを設計します。

Next.js実装、Reactコンポーネント、DB、API Route、認証、外部価格API、スクレイピングは実装しないでください。

FigmaやPencilで細かい見た目を作る前の、低忠実度ワイヤーフロー仕様として作成してください。

Figma / Pencil / v0などに渡せる仕様を意識してよいですが、今回はコード生成をしません。
v0向けのReact / Tailwind実装Promptは、UI設計書と低忠実度Wireflowが固まった後の別工程で扱います。

色、影、アニメーション、細かい余白、ブランドビジュアルの作り込みは行わないでください。

## 作成してよいファイル

* `docs/ui/05_WIREFLOW_LOW_FIDELITY_LAYOUT_SPEC.md`
* `docs/agent-prompts/ui/05-wireflow-low-fidelity-layout-design.md`

## 編集してはいけないファイル

* `src/**`
* `package.json`
* `pnpm-lock.yaml`
* `README.md`
* `.github/**`
* 既存fixture
* 既存test
* 既存Coreロジック

## `docs/ui/05_WIREFLOW_LOW_FIDELITY_LAYOUT_SPEC.md` に含める内容

1. Wireflow / Low-Fidelity Layoutの目的
2. 既存UI設計書との関係
3. 対象画面一覧
4. 低忠実度レイアウトのルール
5. Home画面レイアウト
6. Preference Diagnosis画面レイアウト
7. Candidate Sneaker Check画面レイアウト
8. Result List画面レイアウト
9. Result Detail画面レイアウト
10. Result Guideの扱い
11. スマホ優先レイアウト方針
12. PC表示方針
13. 画面間Wireflow
14. コンポーネント境界の仮整理
15. 情報優先順位
16. エラー・空状態の配置
17. アクセシビリティ方針
18. Figma / Pencil / 将来のUI実装Promptへ渡すときの注意
19. 実装禁止事項
20. 完了条件

## 設計方針

* Mobile Firstで設計する
* まずスマホ1カラムを基準にする
* PCでは中央寄せのカード型レイアウトにする
* 低忠実度なので、線・箱・ラベル中心で表現する
* 色・影・アニメーションは詰めない
* Apple風の落ち着いた方向性は維持するが、視覚デザインは次工程に回す
* 1画面ごとに「主役の情報」と「補助情報」を分ける
* Homeでは主要CTAを2つまでにする
* Preference Diagnosisでは1画面1質問を守る
* Candidate Sneaker Checkでは3ステップ入力を守る
* Result Listでは一覧性を優先する
* Result DetailではfinalDecision / finalScore / Demotionを最上部に置く
* Gemini説明やrule-based説明は補助情報として扱う
* HomeからResult Detailへ直接遷移させない
* DB未実装のため保存履歴があるように見せない

## 対象画面

1. Home
   * 目的: ユーザーの入口を選ばせる
   * 主導線: 好みを診断する / 気になる靴をチェックする

2. Preference Diagnosis
   * 目的: 8問でPreferenceProfile初期値を作る
   * 主導線: 回答する / 次へ / 診断結果を見る

3. Candidate Sneaker Check
   * 目的: 気になる靴の情報を入力してSneakerCandidateを作る
   * 主導線: 基本情報 / タグ / 確認 / 診断する

4. Result List
   * 目的: 複数候補の比較前一覧を表示する
   * 主導線: 詳細を見る

5. Result Detail
   * 目的: Core出力の判断理由を理解させる
   * 主導線: finalDecision / finalScore / Demotion / ScoreBreakdown

6. Result Guide
   * 目的: 結果の見方を補助的に説明する
   * 注意: Core v0.5時点では、必ず独立ページにするとは決めない
   * 扱い: 独立画面またはResult Detail内の補助セクションとして扱う

## Home画面の低忠実度レイアウト

スマホ:

```txt
[Header: SOLE//MATRIX]

[Hero Text]
スニーカー選びを、好みと理由で整理する

[Primary CTA Card]
好みを診断する
8問でスニーカーの好みを整理します
[開始する]

[Primary CTA Card]
気になる靴をチェックする
名前・タグ・予算から購入判断の材料を作ります
[チェックする]

[Secondary Link]
結果の見方

[Footer Note]
価格・在庫・真贋・プレ値は扱いません
```

PC:

```txt
[Header]

[Hero Text centered]

[Two-column CTA Cards]
左: 好みを診断する
右: 気になる靴をチェックする

[Secondary Link: 結果の見方]

[Footer Note]
```

Homeで表示しないもの:

* スニーカー一覧
* 実在価格
* 在庫
* プレ値予測
* 真贋判定
* 購入リンク
* 保存済み履歴
* Result Detailへの直接リンク
* AIチャット
* EC商品カード

## Preference Diagnosis画面の低忠実度レイアウト

スマホ:

```txt
[Header: SOLE//MATRIX]

[Progress]
Question 1 / 8

[Illustration Placeholder]

[Question Card]
質問文
補足文

[Answer Buttons]
[好き]
[普通]
[苦手]

[Navigation]
[前へ] [次へ]
最終質問のみ [診断結果を見る]
```

PC:

```txt
[Header]

[Centered Diagnosis Card]
左: Illustration Placeholder
右:
  Question 1 / 8
  質問文
  補足文
  [好き] [普通] [苦手]

[Bottom Navigation]
```

設計ルール:

* 1画面1質問
* 未回答では次へ進めない
* 戻った場合は回答を保持する
* 最終質問で診断結果を見るを有効化する
* 質問文は短くする
* 補足文で専門用語を補う

## Candidate Sneaker Check画面の低忠実度レイアウト

Step 1: 基本情報

```txt
[Header]

[Step Indicator]
1 / 3 基本情報

[Form Card]
スニーカー名
ブランド
入力金額
予算
メモ

[Notice]
この金額はユーザー入力です。市場価格や在庫を保証するものではありません。

[Navigation]
[戻る] [次へ]
```

Step 2: 特徴タグ

```txt
[Step Indicator]
2 / 3 特徴タグ

[Tag Chips]
クラシック
ローテク
ストリート
シンプル
ボリューム感
ランニング系
バスケット系
履きやすい
長く履けそう
レトロ
文化背景あり
上質・高級感

[Selected Count]
3 / 5 選択中

[Navigation]
[戻る] [次へ]
```

Step 3: 確認

```txt
[Step Indicator]
3 / 3 確認

[Summary Card]
スニーカー名
ブランド
入力金額
予算
選択タグ
所有靴との被り確認

[Action]
[診断する]
```

設計ルール:

* タグは最大5個
* タグ0個では次へ進めない
* 自由入力タグは使わない
* AIがタグを推定しない
* 入力金額を市場価格として表示しない
* 診断する前に確認画面を挟む

## Result List画面の低忠実度レイアウト

スマホ:

```txt
[Header]

[Result Summary]
あなたに合いそうな候補

[Result Card]
finalDecision
finalScore
スニーカー名
短い理由
注意ラベル
[詳細を見る]

[Result Card]
...

[Footer Note]
判定はCoreロジックに基づいています
```

PC:

```txt
[Header]

[Result Summary]

[Card List or Grid]
Result Card
Result Card
Result Card
```

設計ルール:

* 一覧ではscoreBreakdownを全部出さない
* finalDecisionを最も目立たせる
* finalScoreは補助として表示する
* Demotionがある場合は注意ラベルを出す
* rawDecisionは一覧では表示しない
* Gemini説明全文は一覧では表示しない

## Result Detail画面の低忠実度レイアウト

スマホ:

```txt
[Header]

[Decision Summary Card]
finalDecision
finalScore
スニーカー名

[Demotion Alert]
判定を慎重にしている理由

[Reasons Card]
合っている理由

[Cautions Card]
注意すべき理由

[Score Breakdown Accordion]
cultureScore
styleScore
simplicityScore
streetScore
volumeScore
comfortScore
durabilityScore
priceScore
overlapPenalty

[Explanation Panel]
rule-based / Gemini provider
補助説明文

[Snapshot Summary Accordion]
入力条件と結果の要約

[Actions]
[入力を修正する]
[Homeへ戻る]
```

PC:

```txt
[Header]

[Two-column Detail Layout]
左:
  Decision Summary
  Demotion Alert
  Reasons
  Cautions

右:
  Score Breakdown
  Explanation Panel
  Snapshot Summary
```

設計ルール:

* finalDecisionを最上部に置く
* finalScoreはfinalDecisionの近くに置く
* Demotionは隠さない
* reasonsとcautionsは混ぜない
* scoreBreakdownは詳細で表示する
* overlapPenaltyは高いほど注意と分かるようにする
* Gemini説明は補助説明として扱う
* AIが判定したように見せない
* 実在価格・在庫・真贋・プレ値・購入リンクは表示しない

## Result Guideの扱い

```txt
[Result Guide or Result Detail Help Section]

[Guide Title]
結果の見方

[Guide Section]
finalDecisionとは

[Guide Section]
finalScoreとは

[Guide Section]
Demotionとは

[Guide Section]
ScoreBreakdownとは

[Guide Section]
このアプリで扱わないこと
価格・在庫・真贋・プレ値は対象外

[CTA]
[Homeへ戻る]
```

設計ルール:

* Core v0.5時点では、必ず独立ページにするとは決めない
* 独立画面またはResult Detail内の補助セクションとして扱う
* 技術用語を前面に出しすぎない
* ユーザー向けの日本語にする
* Result Detailへ直接遷移させる導線ではなく、結果の読み方を説明する導線にする
* 説明目的に留める

## 画面間Wireflow

```txt
Home
├─ 好みを診断する
│  └─ Preference Diagnosis
│     ├─ Q1
│     ├─ Q2
│     ├─ ...
│     ├─ Q8
│     └─ Result List
│        └─ Result Detail
│
├─ 気になる靴をチェックする
│  └─ Candidate Sneaker Check
│     ├─ Step 1 Basic Info
│     ├─ Step 2 Feature Tags
│     ├─ Step 3 Confirm
│     └─ Result Detail
│
└─ 結果の見方
   └─ Result Guide または Result Detail内の補助セクション
      └─ Home
```

禁止する遷移:

```txt
Home → Result Detail
Home → Previous Result
Home → External Price
Home → Purchase Link
Home → AI Chat
Home → Login Required Page
Home → Saved History
```

## コンポーネント境界の仮整理

* Header
* HeroText
* PrimaryCtaCard
* SecondaryLink
* DiagnosisQuestionCard
* AnswerButtonGroup
* StepIndicator
* CandidateInputForm
* TagChipGroup
* CandidateConfirmCard
* ResultCard
* DecisionBadge
* DemotionAlert
* ScoreBreakdownPanel
* ExplanationPanel
* SnapshotSummaryPanel
* FooterNotice

注意:

* これは実装コンポーネントではない
* Reactコンポーネントを作らない
* ファイル名・props・実装責務までは定義しない
* 名前は将来の画面整理のための仮ラベル
* 実装時に変更してよいが、Core境界は変えない

## 情報優先順位

Home:

1. 何のアプリか
2. 好みを診断する
3. 気になる靴をチェックする
4. 結果の見方
5. 扱わない情報

Preference Diagnosis:

1. 現在の質問
2. 回答ボタン
3. 進捗
4. 前へ / 次へ

Candidate Sneaker Check:

1. 現在のステップ
2. 必須入力
3. 注意文
4. 次へ / 診断する

Result List:

1. finalDecision
2. finalScore
3. スニーカー名
4. 短い理由
5. 注意ラベル
6. 詳細を見る

Result Detail:

1. finalDecision
2. finalScore
3. Demotion
4. reasons
5. cautions
6. scoreBreakdown
7. explanation provider
8. snapshot summary

## エラー・空状態の配置

* エラー文は入力欄の近くに置く
* 入力不足時は次へボタンをdisabledにする
* Resultがない場合はHomeではなく、目的に応じた入力画面へ誘導する
* Gemini説明がない場合でもResult Detail全体は表示する
* Snapshotがない場合はSnapshot欄に取得できない旨を表示する
* 空状態で購入リンクや価格情報へ誘導しない

## スマホ優先方針

* 1カラム
* CTAカード縦積み
* タグは折り返しチップ
* Result Detailは縦積み
* ScoreBreakdownは折りたたみ
* Snapshotは最下部
* 主要ボタンは親指で押しやすい位置に置く
* 情報密度を上げすぎない

## PC表示方針

* 中央幅を制限する
* Homeは2カラムCTAも可
* Result Detailは2カラムも可
* ただしPCだけの情報を追加しない
* スマホとPCで情報の意味を変えない

## アクセシビリティ方針

* CTAは色だけで区別しない
* Decisionは色だけでなくラベルで示す
* Demotionはアイコンだけに頼らない
* タグ選択はキーボード操作でもできる前提にする
* 折りたたみは開閉状態が分かる文言にする
* スコアバーには数値ラベルを併記する
* 主要ボタンはスマホでも押しやすいサイズにする

## Figma / Pencil / 将来のUI実装Promptへ渡すときの注意

* 低忠実度として渡す
* 色指定を細かくしない
* アニメーションを要求しない
* DBやAPI前提の画面を作らせない
* 実在価格や在庫を出させない
* Gemini説明を判定主体に見せない
* HomeからResult Detailへ直接行かせない
* 保存済み履歴があるように見せない
* まずスマホ版を作らせる
* PC版はその後に派生させる
* v0などのコード生成AIに渡す場合も、React / Tailwind実装は別Promptで扱う

## Coreとの境界

UIが行ってよいこと:

* 画面配置を定義する
* 画面遷移を定義する
* 低忠実度レイアウトを定義する
* Core出力をどこに表示するかを設計する
* Coreへ渡す前の入力画面を整理する

UIが行ってはいけないこと:

* finalScoreを計算する
* rawDecisionを変更する
* finalDecisionを変更する
* Demotionを隠す
* ScoreBreakdownのキー名を変更する
* Gemini説明を理由に判定を変える
* 実在価格を表示する
* 在庫を表示する
* プレ値予測を表示する
* 真贋判定を表示する
* 購入リンクを表示する
* 保存済み履歴があるように見せる

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
docs: add wireflow low fidelity layout UI spec
```

## 完了後に報告すること

* 追加したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、Figma / Pencil / 将来のUI実装Promptに渡せる低忠実度レイアウトと画面間Wireflowをdocsだけで固定することです。
実装はまだ行わず、docsだけで設計を固定してください。

