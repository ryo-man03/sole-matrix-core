# SOLE//MATRIX DESIGN-03: Figma Mobile Wireframe Review Summary

## 1. DESIGN-03の目的

DESIGN-03は、Figmaで作成したMobile版画面案を実装前にレビューし、次に進んでよいかを判断するための記録である。

DESIGN-03で明確にすること:

- 採用する点
- 修正が必要な点
- 保留する点
- WEB-01へ進める条件
- 実装前に必ず直すべき点

DESIGN-03はWeb実装Promptではない。
DESIGN-03はFigma生成Promptではない。
DESIGN-03はレビュー記録である。

今回のレビューは、添付されたFigma canvas screenshotから確認できる範囲に基づく。Figma本体、Prototype接続、共有権限、Frame内の全テキスト、インタラクション、詳細なレイヤー状態は未確認である。

## 2. Figma Mobile Wireframeの位置づけ

今回のFigma Mobile Wireframeは、低〜中忠実度の画面案である。

目的:

- 画面構成を確認する
- 情報階層を確認する
- Homeから主要導線が分かるか確認する
- Candidate CheckがECや価格比較に見えないか確認する
- Result Detailで`finalDecision` / Demotion / `ScoreBreakdown`が読めるか確認する
- WEB-01へ進む前の判断材料にする

目的ではないもの:

- 本番UI
- 高忠実度デザイン
- React実装
- Next.js実装
- Tailwind実装
- Figma Makeによるアプリ生成
- v0への入力
- 外部API連携

このWireframeは採用確定ではなく、WEB-01へ進むためのレビュー対象として扱う。

## 3. 参照したFigma情報

```txt
Figma URL: TODO: Figma共有URLを追加する
Prototype URL: TODO: Prototype URLを追加する
Page Name: SOLE//MATRIX Mobile Wireframe
Created Date: TODO
Review Date: 2026-06-10
Reviewer: TODO: Reviewer名を追加する
Source Screenshot: Figma canvas screenshot
Share Permission: TODO: 共有権限を確認する
Prototype Connection: TODO: Prototype接続を確認する
```

確認できたこと:

- Figma canvas上にMobile版の主要Frameが横並びで配置されている
- Page Nameとして`SOLE//MATRIX Mobile Wireframe`が見える
- 左サイドバー上でFrameおよびLayerらしき構造が見える

未確認のこと:

- Figma共有URL
- Prototype URL
- 共有権限
- Prototype接続
- 全Frame内の詳細テキスト
- クリック遷移、状態遷移、スクロール範囲
- Figma Makeまたはコード生成の有無

## 4. 作成済みFrame一覧

スクショから確認できるFrame:

- `01_Home_Mobile`
- `02_PreferenceDiagnosis_Mobile`
- `03_CandidateCheck_Mobile`
- `04_ResultList_Mobile`
- `05_ResultDetail_Mobile`

未確認または未作成:

- `06_ResultGuide_Mobile`

| Frame | Status | Notes |
| --- | --- | --- |
| `01_Home_Mobile` | Confirmed | 主要CTAが2つ見える |
| `02_PreferenceDiagnosis_Mobile` | Confirmed | 1問形式の診断画面が見える |
| `03_CandidateCheck_Mobile` | Confirmed | 入力・タグ・確認の要素が見えるが、やや縦に詰まり気味 |
| `04_ResultList_Mobile` | Confirmed | 複数のResult Cardが見える |
| `05_ResultDetail_Mobile` | Confirmed | `finalDecision` / score / Demotion / `ScoreBreakdown`系の要素が見える |
| `06_ResultGuide_Mobile` | Not Created or Not Visible | 初回Mobile案では未作成でもよい |

## 5. DESIGN-01との一致確認

| DESIGN-01 Rule | Status | Notes |
| --- | --- | --- |
| Quiet Sneaker Decision UIになっている | TODO | スクショ上は落ち着いた診断UIに見えるが、全コピーと詳細導線の確認が必要 |
| 白基調 / off-white背景 | OK | スクショ上では白基調に見える |
| 黒〜濃いグレー中心 | OK | スクショ上では強い多色表現は見えない |
| 余白多め | TODO | Candidate CheckとResult Detailは情報量が多く、詳細確認が必要 |
| 薄いborder / 弱いshadow | TODO | スクショでは大きな崩れは見えないが、詳細確認が必要 |
| カードUI中心 | OK | 主要画面はカード型に見える |
| ECサイトに見えない | TODO | Candidate Check / Result Listを重点確認する |
| 購入を煽っていない | TODO | Result Detailの文言確認が必要 |
| 価格・在庫・購入リンクを出していない | TODO | 細部確認が必要 |

## 6. DESIGN-02との一致確認

| DESIGN-02 Rule | Status | Notes |
| --- | --- | --- |
| Mobile版を優先している | OK | Mobile frameが作成されている |
| 主要5画面がある | OK | スクショで5Frame確認 |
| Result Guideは任意扱い | OK | 未作成でも問題なし |
| Figma Make / コード生成に進んでいない | TODO | Figma内でコード生成していないか確認が必要 |
| React / Next.js / Tailwindコードを作っていない | TODO | リポジトリ側の変更なしを確認する |
| 価格・在庫・真贋・購入リンクを表示していない | TODO | 細部確認が必要 |
| Result Listがランキングに見えない | TODO | No.1 / ranking表現がないか確認する |
| タグ表示名が自然 | TODO | Candidate Checkのタグ文言を確認する |

## 7. 画面別レビュー

### 7.1 Home Mobile

確認すること:

- 「好みを診断する」と「気になる靴をチェックする」が同格に見えるか
- どちらを選べばよいかユーザーが理解できるか
- 商品一覧や価格比較に見えていないか
- HomeからResult Detailへ直接行けそうに見えないか
- 注意文が強すぎず、でも見落とされないか

初期所見:

- 2つの入口構造は採用候補として妥当
- 白基調・カード型の方向性はDESIGN-01に合っている
- 文言と注意文の強さは詳細確認が必要

```txt
採用する点:
- 2入口構造
- Mobile優先の縦積み構成
- 白基調のカード型UI

修正する点:
- TODO: 注意文の文言と視認性を確認する
- TODO: HomeからResult Detailへ直接遷移できる印象がないか確認する

保留する点:
- 注意文の見え方
- Result Guideへの導線をHomeに置くかどうか
```

### 7.2 Preference Diagnosis Mobile

確認すること:

- 1画面1質問になっているか
- Question 1 / 8 の進捗が分かるか
- 「好き / 普通 / 苦手」が押しやすいか
- B2Yの軽さはあるがコピーになっていないか
- 診断だけでBUY / WAIT / SKIPが確定するように見えないか

初期所見:

- 1画面1質問の方向性は採用候補として妥当
- 低〜中忠実度として妥当
- 回答ボタンの押しやすさは確認が必要

```txt
採用する点:
- 1画面1質問
- Question 1 / 8 の進捗表示
- 3択回答

修正する点:
- TODO: 回答ボタンのタップ領域を確認する
- TODO: 診断だけで購入判断が確定するように見えない文言にする

保留する点:
- 質問文と補足文の分かりやすさ
- 最終質問後のResult List遷移の見せ方
```

### 7.3 Candidate Sneaker Check Mobile

確認すること:

- 商品検索画面に見えていないか
- 価格比較画面に見えていないか
- 「ユーザー入力額」である注意が見えるか
- タグが自由入力ではなく選択式に見えるか
- Step 1 / Step 2 / Step 3の分割が分かるか
- 1画面に詰まりすぎていないか
- AIがタグを推定するように見えていないか

初期所見:

- 手入力 + タグ選択 + 確認という構成は採用候補として妥当
- スクショ上では1画面に要素が多く、やや詰まり気味に見える
- Step 1 / Step 2 / Step 3を別Frameまたは状態として分けるか検討が必要

```txt
採用する点:
- 手入力ベース
- タグチップ選択
- 価格がユーザー入力である注意

修正する点:
- Step 1 / Step 2 / Step 3の分割を明確にする
- 1画面に積みすぎない
- 実装時はステップごとに表示切り替えする可能性を検討する
- AIがタグを推定するように見えない表現にする

保留する点:
- Step分割を別Frameにするか、同一Frame内の状態として扱うか
- 入力金額のラベルと注意文の強さ
```

### 7.4 Result List Mobile

確認すること:

- Result ListがランキングやNo.1表示に見えていないか
- `finalDecision`が主役になっているか
- `finalScore`が補助になっているか
- Demotionや注意ラベルが見えるか
- 実在価格・在庫・購入リンクが表示されていないか
- 詳細を見る導線が分かるか

初期所見:

- 複数Result Cardの一覧構成は採用候補として妥当
- ランキング表現やNo.1表現がないか詳細確認が必要
- `finalDecision`と注意ラベルの視認性を確認する必要がある

```txt
採用する点:
- Result Cardによる候補一覧
- 詳細を見る導線

修正する点:
- ランキングや順位に見えない表現にする
- finalDecisionと注意ラベルの階層を確認する
- finalScoreを主役にしすぎない

保留する点:
- Result Card内の情報量
- 注意ラベルを一覧でどこまで表示するか
```

### 7.5 Result Detail Mobile

確認すること:

- `finalDecision`が最上部で理解できるか
- `finalScore`が近くにあるが主役になりすぎていないか
- Demotion Alertが隠れていないか
- reasonsとcautionsが分かれているか
- `ScoreBreakdown`が読みやすいか
- `overlapPenalty`が「高いほど注意」と分かるか
- Gemini説明やproviderが判定主体に見えていないか
- BUYが購入命令に見えていないか
- SKIPが失敗扱いに見えていないか

初期所見:

- Core出力を詳細に見せる方向性は採用候補として妥当
- スクショ上では情報量が多く、分析ダッシュボード寄りに見えるリスクがある
- Demotion Alertの視認性を最優先で確認する必要がある
- `ScoreBreakdown`は補助扱いにし、`finalDecision` / Demotionを主役にする必要がある

```txt
採用する点:
- finalDecisionを詳細画面で見せる
- reasons / cautions / ScoreBreakdownを分ける
- Core出力を可視化する方向性

修正する点:
- Demotion Alertをより見つけやすくする
- ScoreBreakdownが主役になりすぎないようにする
- 分析ダッシュボードに見えないようにする
- BUYが購入命令に見えない文言にする
- SKIPが失敗扱いに見えない文言にする

保留する点:
- ScoreBreakdownを常時表示にするか、折りたたみにするか
- Gemini説明をどこまで表示するか
- provider表示をどの階層に置くか
```

### 7.6 Result Guide Mobile

扱い:

- 初回Mobile案では未作成でもよい
- 作成済みの場合は補助画面として扱う
- 必須画面ではなく、Result Detail内の補助セクションに統合する可能性もある

初期所見:

- スクショでは確認できない
- 未作成なら問題なし
- WEB-01前に必須ではない

```txt
採用する点:
- TODO: 作成済みの場合は補助画面としてレビューする

修正する点:
- TODO: 作成する場合は購入判断やAI判定を強調しない説明画面にする

保留する点:
- Result Guideを独立画面にするか、Result Detail内の補助セクションにするか
```

## 8. 採用する点

以下を採用候補として記録する。

- Mobile版から作ったこと
- 主要5画面に絞ったこと
- Homeで2入口を分けたこと
- Preference Diagnosisを1画面1質問にしたこと
- Candidate Checkを手入力ベースにしたこと
- Candidate Checkにタグ選択を入れたこと
- Result Listを候補一覧として作ったこと
- Result DetailでCore出力を表示する方向にしたこと
- 価格・在庫・購入リンクを出していない方針

注意:

- 上記は採用確定ではなく、現時点の採用候補である
- 実装前にCandidate CheckとResult Detailの情報量を再確認する

## 9. 修正が必要な点

以下を修正候補として記録する。

- Candidate Checkが1画面に詰まりすぎていないか確認する
- Step 1 / Step 2 / Step 3を別Frameまたは明確な状態として整理する
- Result DetailでDemotionが十分に目立つか確認する
- Result Detailが分析ダッシュボードに見えすぎないようにする
- Result Listがランキングに見えないようにする
- Result Guideを独立画面にするか、Result Detail内の補助セクションにするか保留する
- タグ表示名がCore内部タグへ戻せるか確認する

## 10. 保留する点

以下を保留事項として記録する。

- Desktop版
- 高忠実度デザイン
- 実画像の使用
- アニメーション
- Figma Make
- v0
- React / Next.js実装
- DB保存
- API Route
- Gemini API呼び出し
- 外部価格API
- 購入リンク
- Result Guideの独立画面化
- `ScoreBreakdown`の常時表示 / 折りたたみ

## 11. 実装前に直すべき点

WEB-01へ進む前に、最低限以下を整理する。

- Candidate CheckのStep 1 / Step 2 / Step 3の扱いを決める
- Candidate Checkを1画面に詰め込みすぎない方針を決める
- 入力金額がユーザー入力値であり、市場価格や在庫保証ではないことを明示する
- Result DetailのDemotion Alertを見落としにくい位置と階層にする
- `ScoreBreakdown`を補助情報として扱い、`finalDecision`より強く見せない
- Result Listをランキングや順位表示に見せない
- タグ表示名がCore内部タグへ戻せる対応関係を確認する
- BUY / SKIPの表示が購入命令や失敗扱いに見えない文言にする

## 12. WEB-01へ進んでよいかの判断

```txt
Decision:
- Proceed after minor Figma fixes
```

理由:

- 主要5画面は作成されている
- Home / Diagnosis / Candidate / Resultの基本構成は成立している
- ただし、Candidate Checkのステップ分割とResult Detailの情報量は実装前に整理した方がよい
- Result Guideは未作成でも問題ないが、扱いを保留として記録する必要がある

WEB-01へ進める条件:

- Candidate CheckのStep分割方針を決める
- Result DetailのDemotion表示を強める
- Result Listがランキングに見えないことを確認する
- 価格・在庫・購入リンク・真贋判定・外部価格APIの要素を入れない方針を維持する
- Figma URL、Prototype URL、共有権限はTODOとして残すか、確認できた場合は追記する

## 13. 次にやるべき作業

```txt
Next:
- DESIGN-03をcommitする
- 必要ならFigma Mobile案を小修正する
- Candidate Checkのステップ分割方針を決める
- Result DetailのDemotion表示を強める
- 問題がなければWEB-01: Web UI Implementation Planへ進む
```

## 14. 実装禁止事項

DESIGN-03では以下を行わない。

- UI実装をしない
- Reactコンポーネントを作らない
- Next.js実装をしない
- Tailwind設定をしない
- Figma画面を直接編集しない
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
- Coreの`finalScore`やDecision仕様をUI都合で変更しない

## 15. 完了条件

- Figma Mobile案のレビュー結果が記録されている
- 作成Frame一覧が記録されている
- DESIGN-01 / DESIGN-02との一致確認が記録されている
- 採用する点が記録されている
- 修正が必要な点が記録されている
- 保留する点が記録されている
- WEB-01へ進んでよい条件が記録されている
- 現時点の推奨判断が`Proceed after minor Figma fixes`として記録されている
- 実装に入らず、docsだけでレビュー記録を残している

