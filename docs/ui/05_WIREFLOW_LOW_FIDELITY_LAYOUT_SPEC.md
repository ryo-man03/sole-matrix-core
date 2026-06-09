# SOLE//MATRIX UI-05: Wireflow / Low-Fidelity Layout Spec

## 1. Wireflow / Low-Fidelity Layoutの目的

Wireflow / Low-Fidelity Layoutは、SOLE//MATRIXの主要画面について、画面の大まかな配置と画面間の流れを固定するためのUI設計書である。

UI-05では、Figma / Pencil / 将来のUI実装Promptに渡せる程度の低忠実度レイアウトを定義する。ここで扱うのは、線、箱、ラベル、情報の優先順位、遷移の方向であり、視覚デザインの完成形ではない。

この設計書で固定すること:

- 主要画面の低忠実度レイアウト
- スマホ優先の1カラム構造
- PC表示時の中央寄せ、または2カラム化の方針
- 画面ごとの主役の情報と補助情報
- Homeから始まる画面間Wireflow
- Result画面でCore出力をどこに表示するか
- 実装前に守るべき禁止事項

この設計書で固定しないこと:

- 色
- 影
- アニメーション
- 細かな余白
- タイポグラフィの詳細
- ブランドビジュアルの作り込み
- Reactコンポーネント設計
- Next.js実装
- DB / API Route / 認証 / 外部連携

Apple風の落ち着いた方向性は維持する。ただし、Apple風らしさを色、影、余白、アニメーションで詰める工程はUI-05の対象外とする。

## 2. 既存UI設計書との関係

UI-05は、既存のUI設計書を横断して、画面配置と画面間遷移を低忠実度でまとめる上位のWireflow仕様である。

| 設計書 | 対象 | UI-05での扱い |
| --- | --- | --- |
| `docs/ui/01_DIAGNOSIS_UI_SPEC.md` | Preference Diagnosis | 1画面1質問の低忠実度レイアウトとして整理する |
| `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` | Candidate Sneaker Check | 3ステップ入力の低忠実度レイアウトとして整理する |
| `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md` | Result / Detail Display | Result List / Result Detail / Result Guideの配置として整理する |
| `docs/ui/04_HOME_NAVIGATION_FLOW_SPEC.md` | Home / Navigation Flow | Homeの入口と画面遷移をWireflowとして整理する |

UI-05は既存設計書を置き換えない。既存設計書の判断を、Figma / Pencil / 将来のUI実装Promptへ渡しやすい画面単位の箱として再整理する。

## 3. 対象画面一覧

UI-05で対象にする画面は以下である。

| 画面 | 目的 | 主導線 |
| --- | --- | --- |
| Home | ユーザーの入口を選ばせる | 好みを診断する / 気になる靴をチェックする |
| Preference Diagnosis | 8問でPreferenceProfile初期値を作る | 回答する / 次へ / 診断結果を見る |
| Candidate Sneaker Check | 気になる靴の情報を入力してSneakerCandidateを作る | 基本情報 / タグ / 確認 / 診断する |
| Result List | 複数候補の比較前一覧を表示する | 詳細を見る |
| Result Detail | Core出力の判断理由を理解させる | finalDecision / finalScore / Demotion / ScoreBreakdown |
| Result Guide | 結果の見方を補助的に説明する | Homeへ戻る、またはResult Detail内で読む |

Result Guideは、Core v0.5時点では必ず独立ページにするとは決めない。独立画面、またはResult Detail内の補助セクションとして扱う。

## 4. 低忠実度レイアウトのルール

低忠実度レイアウトでは、画面の構造と流れだけを固定する。

基本ルール:

- Mobile Firstで設計する
- まずスマホ1カラムを基準にする
- PCでは中央寄せのカード型レイアウトを基本にする
- 必要に応じてPCのみ2カラム化する
- 線、箱、ラベル中心で表現する
- 色、影、アニメーションは詰めない
- 細かい余白、角丸、フォントサイズは決めすぎない
- 1画面ごとに主役の情報と補助情報を分ける
- 専門用語は必要な場所だけに出す
- Core出力のキー名は変更しない
- DB未実装のため保存履歴があるように見せない

低忠実度ワイヤー上の表現ルール:

- `[Header]` のような箱ラベルで画面要素を表す
- `[CTA]`、`[Navigation]`、`[Action]` などで操作の役割を表す
- テキストは最終コピーではなく、方向性を示す仮文言として扱う
- 画面下部に置く注意文はFooterまたはNoticeとして扱う
- 折りたたみ要素はAccordionとして表す
- 将来のコンポーネント名は仮ラベルとして扱い、実装名やpropsまでは定義しない

## 5. Home画面レイアウト

Homeの目的は、ユーザーが最初にどちらの入口から始めるかを選ぶことである。Homeでは主要CTAを2つまでに絞る。

主役の情報:

- 何のアプリか
- 好みを診断する
- 気になる靴をチェックする

補助情報:

- 結果の見方
- 価格・在庫・真贋・プレ値を扱わない注意

### 5.1 スマホ

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

### 5.2 PC

```txt
[Header]

[Hero Text centered]

[Two-column CTA Cards]
左: 好みを診断する
右: 気になる靴をチェックする

[Secondary Link: 結果の見方]

[Footer Note]
```

PCでは2つのCTAカードを横並びにしてよい。ただし、CTAの意味や優先順位はスマホと変えない。

### 5.3 Homeで表示しないもの

Homeでは以下を表示しない。

- スニーカー一覧
- 実在価格
- 在庫
- プレ値予測
- 真贋判定
- 購入リンク
- 保存済み履歴
- Result Detailへの直接リンク
- AIチャット
- EC商品カード
- ログイン必須ページへの導線
- 外部価格ページへの導線

Homeは入口を選ぶ画面であり、商品検索、EC、履歴、チャット、価格確認の画面ではない。

## 6. Preference Diagnosis画面レイアウト

Preference Diagnosisの目的は、8問でPreferenceProfile初期値を作ることである。1画面1質問を守り、回答に集中できる構造にする。

主役の情報:

- 現在の質問
- 回答ボタン

補助情報:

- 進捗
- 補足文
- 前へ / 次へ

### 6.1 スマホ

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

### 6.2 PC

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

### 6.3 設計ルール

- 1画面1質問にする
- 8問の進捗を常に分かるようにする
- 未回答では次へ進めない
- 戻った場合は回答を保持する
- 最終質問で診断結果を見るを有効化する
- 質問文は短くする
- 補足文で専門用語を補う
- 回答選択肢は同じ位置に置く
- 回答の見た目は色だけで区別しない

## 7. Candidate Sneaker Check画面レイアウト

Candidate Sneaker Checkの目的は、気になる靴の情報を入力してSneakerCandidateを作ることである。入力は3ステップに分ける。

主役の情報:

- 現在のステップ
- 必須入力
- 診断する前の確認

補助情報:

- 注意文
- 選択数
- 戻る / 次へ

### 7.1 Step 1: 基本情報

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

Step 1では、ユーザー入力の金額を市場価格として扱わないことを明示する。

### 7.2 Step 2: 特徴タグ

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

タグは候補から選ぶ。自由入力タグは使わず、AIによるタグ推定も行わない。

### 7.3 Step 3: 確認

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

診断する前に確認画面を挟み、入力内容をユーザーが見直せるようにする。

### 7.4 設計ルール

- 3ステップ入力を守る
- Step 1は基本情報
- Step 2は特徴タグ
- Step 3は確認
- タグは最大5個
- タグ0個では次へ進めない
- 自由入力タグは使わない
- AIがタグを推定しない
- 入力金額を市場価格として表示しない
- 診断する前に確認画面を挟む
- 入力不足のエラーは該当入力欄の近くに置く

## 8. Result List画面レイアウト

Result Listの目的は、複数候補の比較前一覧を表示することである。一覧性を優先し、詳細情報を出しすぎない。

主役の情報:

- finalDecision
- finalScore
- スニーカー名

補助情報:

- 短い理由
- 注意ラベル
- 詳細を見る

### 8.1 スマホ

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

### 8.2 PC

```txt
[Header]

[Result Summary]

[Card List or Grid]
Result Card
Result Card
Result Card
```

PCでは一覧またはグリッドにしてよい。ただし、一覧で表示する情報量はスマホと変えない。

### 8.3 設計ルール

- 一覧ではscoreBreakdownを全部出さない
- finalDecisionを最も目立たせる
- finalScoreは補助として表示する
- Demotionがある場合は注意ラベルを出す
- rawDecisionは一覧では表示しない
- Gemini説明全文は一覧では表示しない
- 詳細を見るからResult Detailへ遷移する
- 購入リンク、価格、在庫、真贋、プレ値は表示しない

## 9. Result Detail画面レイアウト

Result Detailの目的は、Core出力の判断理由をユーザーが理解できるようにすることである。finalDecision / finalScore / Demotionを最上部に置く。

主役の情報:

- finalDecision
- finalScore
- Demotion
- reasons
- cautions

補助情報:

- scoreBreakdown
- rule-based / Gemini provider
- snapshot summary
- 入力修正 / Homeへ戻る

### 9.1 スマホ

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

### 9.2 PC

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

PCでは2カラム化してよい。左に判断の要点、右に補助情報を置く。ただし、PCだけに新しい意味の情報を追加しない。

### 9.3 設計ルール

- finalDecisionを最上部に置く
- finalScoreはfinalDecisionの近くに置く
- Demotionは隠さない
- reasonsとcautionsは混ぜない
- scoreBreakdownは詳細で表示する
- overlapPenaltyは高いほど注意と分かるようにする
- Gemini説明は補助説明として扱う
- rule-based説明も補助情報として扱う
- AIが判定したように見せない
- 実在価格、在庫、真贋、プレ値、購入リンクは表示しない
- Core出力のキー名や意味をUI都合で変更しない

## 10. Result Guideの扱い

Result Guideの目的は、結果の見方を補助的に説明することである。Core v0.5時点では、必ず独立ページにするとは決めない。

扱い:

- 独立画面として扱ってよい
- Result Detail内の補助セクションとして扱ってよい
- HomeのSecondary Linkから遷移してよい
- Result Detailへ直接遷移させる導線ではなく、結果の読み方を説明する導線にする

低忠実度レイアウト:

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

- Core v0.5時点では、必ず独立ページにするとは決めない
- 独立画面またはResult Detail内の補助セクションとして扱う
- 技術用語を前面に出しすぎない
- ユーザー向けの日本語にする
- 説明目的に留める
- 実際の結果があるように見せない
- 保存履歴や前回結果への導線を置かない

## 11. スマホ優先レイアウト方針

スマホを基準画面として設計する。

- 1カラム
- CTAカード縦積み
- タグは折り返しチップ
- Result Detailは縦積み
- ScoreBreakdownは折りたたみ
- Snapshotは最下部
- 主要ボタンは親指で押しやすい位置に置く
- 情報密度を上げすぎない
- 1画面で主役の情報が迷子にならないようにする
- 補助情報は下部または折りたたみに逃がす

画面ごとのスマホ方針:

| 画面 | 方針 |
| --- | --- |
| Home | CTAカードを縦積みにする |
| Preference Diagnosis | 1質問に集中させる |
| Candidate Sneaker Check | ステップごとに入力範囲を絞る |
| Result List | カードを縦に並べて比較しやすくする |
| Result Detail | 判断、理由、詳細の順に縦積みする |
| Result Guide | 説明セクションを短く区切る |

## 12. PC表示方針

PC表示では中央幅を制限し、読みやすいカード型レイアウトを基本にする。

- 中央幅を制限する
- Homeは2カラムCTAも可
- Result Detailは2カラムも可
- Candidate Sneaker Checkは中央寄せフォームでよい
- Preference Diagnosisは左右分割カードでもよい
- ただしPCだけの情報を追加しない
- スマホとPCで情報の意味を変えない
- PCでは余白が広がっても主役の情報が散らばらないようにする

PC表示はスマホ版の派生である。PC先行で情報設計を変えない。

## 13. 画面間Wireflow

画面間のWireflowは以下とする。

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

Preference Diagnosis後は、複数候補の比較前一覧としてResult Listへ進み、Result Cardの詳細を見る操作からResult Detailへ進む。

Candidate Sneaker Check後は、単一候補の確認結果としてResult Detailへ進む。

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

HomeからResult Detailへ直接遷移させない。Result Detailは、Preference DiagnosisまたはCandidate Sneaker CheckによってCore出力が得られた後に表示される画面である。

## 14. コンポーネント境界の仮整理

以下は将来の画面整理のための仮ラベルであり、実装コンポーネントではない。

- Header
- HeroText
- PrimaryCtaCard
- SecondaryLink
- DiagnosisQuestionCard
- AnswerButtonGroup
- StepIndicator
- CandidateInputForm
- TagChipGroup
- CandidateConfirmCard
- ResultCard
- DecisionBadge
- DemotionAlert
- ScoreBreakdownPanel
- ExplanationPanel
- SnapshotSummaryPanel
- FooterNotice

注意:

- これは実装コンポーネントではない
- Reactコンポーネントを作らない
- ファイル名、props、実装責務までは定義しない
- 名前は将来の画面整理のための仮ラベルである
- 実装時に変更してよい
- Core境界は変えない

## 15. 情報優先順位

画面ごとの情報優先順位は以下とする。

### 15.1 Home

1. 何のアプリか
2. 好みを診断する
3. 気になる靴をチェックする
4. 結果の見方
5. 扱わない情報

### 15.2 Preference Diagnosis

1. 現在の質問
2. 回答ボタン
3. 進捗
4. 前へ / 次へ

### 15.3 Candidate Sneaker Check

1. 現在のステップ
2. 必須入力
3. 注意文
4. 次へ / 診断する

### 15.4 Result List

1. finalDecision
2. finalScore
3. スニーカー名
4. 短い理由
5. 注意ラベル
6. 詳細を見る

### 15.5 Result Detail

1. finalDecision
2. finalScore
3. Demotion
4. reasons
5. cautions
6. scoreBreakdown
7. explanation provider
8. snapshot summary

## 16. エラー・空状態の配置

エラーや空状態は、ユーザーが次に何をすればよいか分かる位置に置く。

共通方針:

- エラー文は入力欄の近くに置く
- 入力不足時は次へボタンをdisabledにする
- Resultがない場合はHomeではなく、目的に応じた入力画面へ誘導する
- Gemini説明がない場合でもResult Detail全体は表示する
- Snapshotがない場合はSnapshot欄に取得できない旨を表示する
- 空状態で購入リンクや価格情報へ誘導しない
- エラー文は短く、修正対象が分かる文言にする

画面ごとの配置:

| 画面 | 配置 |
| --- | --- |
| Preference Diagnosis | 未回答エラーは回答ボタン付近に置く |
| Candidate Step 1 | 入力欄ごとに近接してエラーを置く |
| Candidate Step 2 | タグ0個の場合はTag Chips付近に置く |
| Candidate Step 3 | 不足項目があればSummary Card内に示す |
| Result List | Resultがない理由と再入力導線を置く |
| Result Detail | 不足している補助情報の欄だけfallback表示にする |

空状態の文言例:

```txt
結果を表示するための情報がまだありません。
好みを診断するか、気になる靴をチェックしてください。
```

```txt
Snapshot情報を取得できませんでした。
判定結果と理由は表示できます。
```

## 17. アクセシビリティ方針

低忠実度段階でも、情報が色やアイコンだけに依存しないようにする。

- CTAは色だけで区別しない
- Decisionは色だけでなくラベルで示す
- Demotionはアイコンだけに頼らない
- タグ選択はキーボード操作でもできる前提にする
- 折りたたみは開閉状態が分かる文言にする
- スコアバーには数値ラベルを併記する
- 主要ボタンはスマホでも押しやすいサイズにする
- 質問文と補足文の関係が分かる配置にする
- エラー文は対象入力欄の近くに置く
- disabled状態の理由が分かるようにする

アクセシビリティ上の優先事項は、色や装飾の作り込みよりも、ラベル、順序、操作可能性、状態の分かりやすさである。

## 18. Figma / Pencil / 将来のUI実装Promptへ渡すときの注意

UI-05をFigma / Pencil / 将来のUI実装Promptへ渡す場合は、低忠実度のWireflow仕様として扱う。

渡すときの注意:

- 低忠実度として渡す
- 色指定を細かくしない
- アニメーションを要求しない
- DBやAPI前提の画面を作らせない
- 実在価格や在庫を出させない
- Gemini説明を判定主体に見せない
- HomeからResult Detailへ直接行かせない
- 保存済み履歴があるように見せない
- まずスマホ版を作らせる
- PC版はその後に派生させる
- v0などのコード生成AIに渡す場合も、React / Tailwind実装は別Promptで扱う
- Result Guideは独立ページ確定として扱わない
- Apple風の落ち着いた方向性は参照してよいが、高忠実度化しない

Figma / Pencilで作る場合:

- 箱、線、見出し、ボタンラベルを中心にする
- 色はモノクロまたは最小限にする
- 各画面の主役の情報を一番上に置く
- スマホ版を先に並べ、その後にPC版を派生させる

将来のUI実装Promptへ渡す場合:

- この仕様をレイアウト要件として渡す
- 実装Promptではコンポーネント、状態管理、ルーティングを別途定義する
- Coreの計算やDecision仕様はUI実装Promptで変更しない
- DB、認証、外部価格API、スクレイピングを前提にしない

## 19. Coreとの境界と実装禁止事項

### 19.1 UIが行ってよいこと

UIが行ってよいこと:

- 画面配置を定義する
- 画面遷移を定義する
- 低忠実度レイアウトを定義する
- Core出力をどこに表示するかを設計する
- Coreへ渡す前の入力画面を整理する
- ユーザー向けの表示ラベルを設計する
- エラーや空状態の配置を設計する

### 19.2 UIが行ってはいけないこと

UIが行ってはいけないこと:

- finalScoreを計算する
- rawDecisionを変更する
- finalDecisionを変更する
- Demotionを隠す
- ScoreBreakdownのキー名を変更する
- Gemini説明を理由に判定を変える
- 実在価格を表示する
- 在庫を表示する
- プレ値予測を表示する
- 真贋判定を表示する
- 購入リンクを表示する
- 保存済み履歴があるように見せる

### 19.3 実装禁止事項

今回のUI-05では、以下を実装しない。

- UI実装をしない
- Reactコンポーネントを作らない
- Next.js実装をしない
- DBを作らない
- API Routeを作らない
- Gemini APIを呼ばない
- OpenAI APIを入れない
- 外部価格APIを入れない
- スクレイピングを提案しない
- 実在価格を表示しない
- 在庫を表示しない
- プレ値予測を表示しない
- 真贋判定を表示しない
- 購入リンクを表示しない
- AIにスコアやDecisionを作らせない
- CoreのfinalScoreやDecision仕様をUI都合で変更しない
- `src/**` を変更しない
- `package.json` を変更しない
- `pnpm-lock.yaml` を変更しない
- `README.md` を変更しない
- `.github/**` を変更しない
- 既存fixture、既存test、既存Coreロジックを変更しない

## 20. 完了条件

UI-05の完了条件は以下である。

- `docs/ui/05_WIREFLOW_LOW_FIDELITY_LAYOUT_SPEC.md` が追加されている
- `docs/agent-prompts/ui/05-wireflow-low-fidelity-layout-design.md` が追加されている
- UI-05で必要な20項目が仕様書に含まれている
- Home、Preference Diagnosis、Candidate Sneaker Check、Result List、Result Detail、Result Guideの低忠実度レイアウトが含まれている
- スマホ優先レイアウト方針が明記されている
- PC表示方針が明記されている
- 画面間Wireflowが明記されている
- HomeからResult Detailへ直接遷移しないことが明記されている
- DB未実装のため保存履歴があるように見せないことが明記されている
- Coreとの境界が明記されている
- 実装禁止事項が明記されている
- `src/**` に変更がない
- `package.json` に変更がない
- `pnpm-lock.yaml` に変更がない
- `README.md` に変更がない
- `.github/**` に変更がない
- 既存fixtureに変更がない
- 既存testに変更がない
- 既存Coreロジックに変更がない
- `pnpm test` が成功する
- `pnpm typecheck` が成功する

