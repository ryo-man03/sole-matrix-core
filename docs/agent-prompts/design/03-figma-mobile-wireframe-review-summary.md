# DESIGN-03: Figma Mobile Wireframe Review Summary Prompt

## Role

あなたは、TypeScript個人開発プロジェクトのプロダクトデザイナー兼UI/UXレビュアーです。

対象リポジトリは`SOLE//MATRIX Core v0.1`です。

## Current State

- Core推薦ロジックは実装済み
- 公開API`recommendSneakers(input)`は実装済み
- Preference Diagnosis UI設計書は`docs/ui/01_DIAGNOSIS_UI_SPEC.md`に追加済み
- Candidate Sneaker Check UI設計書は`docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md`に追加済み
- Result / Detail Display UI設計書は`docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md`に追加済み
- Home / Navigation Flow UI設計書は`docs/ui/04_HOME_NAVIGATION_FLOW_SPEC.md`に追加済み
- Wireflow / Low-Fidelity Layout UI設計書は`docs/ui/05_WIREFLOW_LOW_FIDELITY_LAYOUT_SPEC.md`に追加済み
- Web UI Implementation Boundary Specは`docs/ui/06_WEB_UI_IMPLEMENTATION_BOUNDARY_SPEC.md`に追加済み
- Visual Design Direction Specは`docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md`に追加済み
- Figma / Pencil Design Prompt Specは`docs/design/02_FIGMA_PENCIL_DESIGN_PROMPT_SPEC.md`に追加済み
- FigmaでMobile版の低〜中忠実度画面案を作成済み
- 現時点ではWeb UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

## Objective

`DESIGN-03: Figma Mobile Wireframe Review Summary`を作成する。

これは、Figmaで作成したMobile版画面案をレビューし、採用する点・修正する点・保留する点・次に進んでよいかをdocsに記録するための設計レビュー文書である。

今回は実装しない。
今回はFigma画面を編集しない。
今回はReactコンポーネントを作らない。
今回はNext.jsアプリを作らない。
今回は設計レビュー文書だけを追加する。

## Files To Create

- `docs/design/03_FIGMA_MOBILE_WIREFRAME_REVIEW_SUMMARY.md`
- `docs/agent-prompts/design/03-figma-mobile-wireframe-review-summary.md`

## Files Not To Edit

- `src/**`
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `.github/**`
- 既存fixture
- 既存test
- 既存Coreロジック
- `docs/ui/**`の既存ファイル
- `docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md`
- `docs/design/02_FIGMA_PENCIL_DESIGN_PROMPT_SPEC.md`

## Important Notes

- Figma画面案を「採用確定」と断定しない
- スクショから確認できる範囲と、未確認の範囲を分けて記録する
- Figma URL、共有権限、Prototype接続が未確認の場合は推測せず`TODO`として残す
- DESIGN-03はWeb実装Promptではない
- DESIGN-03はFigma生成Promptではない
- DESIGN-03はレビュー記録である

## Required Sections

`docs/design/03_FIGMA_MOBILE_WIREFRAME_REVIEW_SUMMARY.md`に以下を含める。

1. DESIGN-03の目的
2. Figma Mobile Wireframeの位置づけ
3. 参照したFigma情報
4. 作成済みFrame一覧
5. DESIGN-01との一致確認
6. DESIGN-02との一致確認
7. 画面別レビュー
8. 採用する点
9. 修正が必要な点
10. 保留する点
11. 実装前に直すべき点
12. WEB-01へ進んでよいかの判断
13. 次にやるべき作業
14. 実装禁止事項
15. 完了条件

## Figma Reference Info

以下を記録する。

```txt
Figma URL: TODO: Figma共有URLを追加する
Prototype URL: TODO: Prototype URLを追加する
Page Name: SOLE//MATRIX Mobile Wireframe
Created Date: TODO
Review Date: TODO
Reviewer: TODO
Source Screenshot: Figma canvas screenshot
Share Permission: TODO: 共有権限を確認する
Prototype Connection: TODO: Prototype接続を確認する
```

## Created Frames

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

## DESIGN-01 Check

Statusは`OK / Needs Fix / Hold / TODO`で記録する。

| DESIGN-01 Rule | Status | Notes |
| --- | --- | --- |
| Quiet Sneaker Decision UIになっている | TODO | TODO |
| 白基調 / off-white背景 | OK | スクショ上では白基調に見える |
| 黒〜濃いグレー中心 | OK | スクショ上では強い多色表現は見えない |
| 余白多め | TODO | Candidate CheckとResult Detailは要確認 |
| 薄いborder / 弱いshadow | TODO | スクショでは大きな崩れは見えないが詳細確認が必要 |
| カードUI中心 | OK | 主要画面はカード型に見える |
| ECサイトに見えない | TODO | Candidate Check / Result Listを重点確認 |
| 購入を煽っていない | TODO | Result Detailの文言確認が必要 |
| 価格・在庫・購入リンクを出していない | TODO | 細部確認が必要 |

## DESIGN-02 Check

Statusは`OK / Needs Fix / Hold / TODO`で記録する。

| DESIGN-02 Rule | Status | Notes |
| --- | --- | --- |
| Mobile版を優先している | OK | Mobile frameが作成されている |
| 主要5画面がある | OK | スクショで5Frame確認 |
| Result Guideは任意扱い | OK | 未作成でも問題なし |
| Figma Make / コード生成に進んでいない | TODO | Figma内でコード生成していないか確認 |
| React / Next.js / Tailwindコードを作っていない | TODO | リポジトリ側の変更なしを確認 |
| 価格・在庫・真贋・購入リンクを表示していない | TODO | 細部確認が必要 |
| Result Listがランキングに見えない | TODO | No.1 / ranking表現がないか確認 |
| タグ表示名が自然 | TODO | Candidate Checkのタグ文言を確認 |

## Screen Review Requirements

### Home Mobile

確認すること:

- 「好みを診断する」と「気になる靴をチェックする」が同格に見えるか
- どちらを選べばよいかユーザーが理解できるか
- 商品一覧や価格比較に見えていないか
- HomeからResult Detailへ直接行けそうに見えないか
- 注意文が強すぎず、でも見落とされないか

記録する初期所見:

- 2つの入口構造は採用してよい
- 白基調・カード型の方向性は合っている
- 文言と注意文の強さは詳細確認が必要

### Preference Diagnosis Mobile

確認すること:

- 1画面1質問になっているか
- Question 1 / 8 の進捗が分かるか
- 「好き / 普通 / 苦手」が押しやすいか
- B2Yの軽さはあるがコピーになっていないか
- 診断だけでBUY / WAIT / SKIPが確定するように見えないか

記録する初期所見:

- 1画面1質問の方向性は採用してよい
- 低〜中忠実度として妥当
- 回答ボタンの押しやすさは確認が必要

### Candidate Sneaker Check Mobile

確認すること:

- 商品検索画面に見えていないか
- 価格比較画面に見えていないか
- 「ユーザー入力額」である注意が見えるか
- タグが自由入力ではなく選択式に見えるか
- Step 1 / Step 2 / Step 3の分割が分かるか
- 1画面に詰まりすぎていないか
- AIがタグを推定するように見えていないか

記録する初期所見:

- 手入力 + タグ選択 + 確認という構成は採用してよい
- スクショ上では1画面に要素が多く、やや詰まり気味に見える
- Step 1 / Step 2 / Step 3を別Frameまたは状態として分けるか検討が必要

### Result List Mobile

確認すること:

- Result ListがランキングやNo.1表示に見えていないか
- `finalDecision`が主役になっているか
- `finalScore`が補助になっているか
- Demotionや注意ラベルが見えるか
- 実在価格・在庫・購入リンクが表示されていないか
- 詳細を見る導線が分かるか

記録する初期所見:

- 複数Result Cardの一覧構成は採用してよい
- ランキング表現やNo.1表現がないか詳細確認が必要
- `finalDecision`と注意ラベルの視認性を確認する必要がある

### Result Detail Mobile

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

記録する初期所見:

- Core出力を詳細に見せる方向性は採用してよい
- スクショ上では情報量が多く、分析ダッシュボード寄りに見えるリスクがある
- Demotion Alertの視認性を最優先で確認する必要がある
- `ScoreBreakdown`は補助扱いにし、`finalDecision` / Demotionを主役にする必要がある

### Result Guide Mobile

扱い:

- 初回Mobile案では未作成でもよい
- 作成済みの場合は補助画面として扱う
- 必須画面ではなく、Result Detail内の補助セクションに統合する可能性もある

記録する初期所見:

- スクショでは確認できない
- 未作成なら問題なし
- WEB-01前に必須ではない

## Adoption Candidates

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

## Fix Candidates

以下を修正候補として記録する。

- Candidate Checkが1画面に詰まりすぎていないか確認する
- Step 1 / Step 2 / Step 3を別Frameまたは明確な状態として整理する
- Result DetailでDemotionが十分に目立つか確認する
- Result Detailが分析ダッシュボードに見えすぎないようにする
- Result Listがランキングに見えないようにする
- Result Guideを独立画面にするか、Result Detail内の補助セクションにするか保留する
- タグ表示名がCore内部タグへ戻せるか確認する

## Hold Items

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

## WEB-01 Decision

以下を推奨判断として記録する。

```txt
Decision:
- Proceed after minor Figma fixes
```

理由:

- 主要5画面は作成されている
- Home / Diagnosis / Candidate / Resultの基本構成は成立している
- ただし、Candidate Checkのステップ分割とResult Detailの情報量は実装前に整理した方がよい
- Result Guideは未作成でも問題ないが、扱いを保留として記録する必要がある

## Next Work

```txt
Next:
- DESIGN-03をcommitする
- 必要ならFigma Mobile案を小修正する
- Candidate Checkのステップ分割方針を決める
- Result DetailのDemotion表示を強める
- 問題がなければWEB-01: Web UI Implementation Planへ進む
```

## Implementation Prohibitions

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

## Commands To Run

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

## Expected Results

- 既存テストがすべて成功する
- typecheckが成功する
- 変更範囲が`docs/design/**`と`docs/agent-prompts/design/**`のみ
- `src/**`に変更がない
- `package.json`に変更がない
- `pnpm-lock.yaml`に変更がない
- `README.md`に変更がない
- `.github/**`に変更がない
- `docs/ui/**`の既存ファイルに変更がない
- `docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md`に変更がない
- `docs/design/02_FIGMA_PENCIL_DESIGN_PROMPT_SPEC.md`に変更がない

## Commit Message Candidate

```txt
docs: add Figma mobile wireframe review summary
```

## Completion Conditions

- Figma Mobile案のレビュー結果が記録されている
- 作成Frame一覧が記録されている
- DESIGN-01 / DESIGN-02との一致確認が記録されている
- 採用する点が記録されている
- 修正が必要な点が記録されている
- 保留する点が記録されている
- WEB-01へ進んでよい条件が記録されている
- 現時点の推奨判断が`Proceed after minor Figma fixes`として記録されている
- 実装に入らず、docsだけでレビュー記録を残している

