# SOLE//MATRIX WEB-01: Web UI Implementation Plan

## 1. WEB-01の目的

WEB-01は、SOLE//MATRIXのWeb UI実装に入る前に、実装順序、変更範囲、画面単位の分割、状態管理方針、Core API連携方針、禁止事項を固定するための実装計画書である。

WEB-01ではコードを作らない。Reactコンポーネント、Next.jsアプリ、Tailwind設定、DB、API Route、外部API連携、package.json変更、pnpm-lock.yaml変更は行わない。

WEB-01で固定すること:

- どの順番でWeb UIを実装するか
- どのPromptでどのファイルを変更してよいか
- いつpackage.json / pnpm-lock.yamlの変更を許可するか
- Core API `recommendSneakers(input)` をどう扱うか
- DBなし、API Routeなし、外部APIなしでどこまで作るか
- Figma Mobile案をどうWeb UIへ落とし込むか
- Candidate CheckのStep分割をどう実装するか
- Result DetailでDemotionをどう優先表示するか

WEB-01は実装Promptではない。WEB-02以降のPromptを安全に分割するための計画書である。

## 2. 参照する既存ドキュメント

WEB-01では以下の既存ドキュメントを参照対象とする。

- `docs/ui/01_DIAGNOSIS_UI_SPEC.md`
- `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md`
- `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md`
- `docs/ui/04_HOME_NAVIGATION_FLOW_SPEC.md`
- `docs/ui/05_WIREFLOW_LOW_FIDELITY_LAYOUT_SPEC.md`
- `docs/ui/06_WEB_UI_IMPLEMENTATION_BOUNDARY_SPEC.md`
- `docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md`
- `docs/design/02_FIGMA_PENCIL_DESIGN_PROMPT_SPEC.md`
- `docs/design/03_FIGMA_MOBILE_WIREFRAME_REVIEW_SUMMARY.md`

扱い:

- WEB-01ではこれらの既存ファイルを編集しない
- 既存docsの内容を前提に、Web UI実装計画だけを作る
- 矛盾がある場合は推測で修正せず、WEB-01内に「要確認」として記録する

要確認:

- DESIGN-03内ではDESIGN-04に相当する「Figma Mobile minor fixes」の完了扱いが前提になっているが、現時点で独立した `docs/design/04_*` ファイルは参照対象に含まれていない。WEB-02以降では、必要に応じて現存ファイルのみを根拠に確認する。

## 3. Web UI実装の前提

初期Web UIは、Coreの推薦結果をWeb UIで確認できる最小構成を目的とする。

前提:

- DBなし
- 認証なし
- API Routeなし
- 外部価格APIなし
- スクレイピングなし
- 実在価格なし
- 在庫表示なし
- 真贋判定なし
- プレ値予測なし
- 購入リンクなし
- Gemini API呼び出しなし
- OpenAI API呼び出しなし
- 保存済み履歴なし
- マイページなし
- 決済なし
- 通知なし

初期Web UIは、ECサイトでも価格比較サイトでもない。ユーザーの好み、所有傾向、候補スニーカー情報をもとに、Coreの推薦結果を読みやすく確認するためのUIとして扱う。

## 4. WEB-02以降の実装分割

WEB-02以降は以下の順番で分割する。

### WEB-02: Repository Web Readiness Audit

目的:

- 既存リポジトリ構成を調査する
- 現在のpackage.jsonを確認する
- 既存のsrc構成を確認する
- 既にWeb UI環境があるか確認する
- Next.js / React / Tailwindが導入済みか確認する
- Vite等の既存Web環境があるか確認する
- `recommendSneakers(input)` のimport経路を確認する
- Coreがブラウザ実行可能か確認する
- Node専用API、環境変数、外部API、サーバー専用処理に依存していないか確認する
- WEB-03でWeb App Setupが必要か判断する

WEB-02では調査・確認だけを行う。package.json、pnpm-lock.yaml、src/**、tsconfig、test設定は変更しない。Next.js導入が必要だと判断した場合でもWEB-02では導入しない。

WEB-02で変更してよい範囲:

- `docs/web/02_REPOSITORY_WEB_READINESS_AUDIT.md`
- `docs/agent-prompts/web/02-repository-web-readiness-audit.md`

WEB-02で変更してはいけない範囲:

- `src/**`
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- test設定
- Coreロジック
- README
- `.github/**`

### WEB-03: Web App Setup

目的:

- WEB-02の調査結果をもとに、必要な場合のみWeb UI環境を追加する
- Next.js / React / Tailwindを導入するか判断する
- package.json / pnpm-lock.yaml変更が必要な場合は、このPromptで初めて明示的に許可する
- 既存Core、既存src、既存test、既存設定を破壊しない最小構成を検討する

WEB-03で許可する可能性がある変更:

- package.json
- pnpm-lock.yaml
- Web UI用の最小ディレクトリ
- 設定ファイル

ただし、変更範囲はWEB-03 Prompt内で明示する。

禁止:

- create-next-app相当の初期化で既存ファイルを上書きすること
- Coreロジック変更
- 既存test破壊
- 既存fixture変更
- README変更
- `.github/**` 変更
- DB追加
- API Route追加
- 外部API追加

### WEB-04: Static UI Shell / Home

目的:

- Web UIの最小レイアウトを作る
- Home画面を実装する
- 2つの入口を表示する
- 価格・在庫・真贋を扱わない注意文を表示する

実装対象:

- App shell
- Home
- Navigation state
- Visual style foundation

禁止:

- Recommendation実行
- DB
- API Route
- 外部API
- 購入リンク

### WEB-05: Preference Diagnosis Flow

目的:

- 1画面1質問の診断UIを実装する
- 8問程度の回答を一時状態で保持する
- PreferenceProfile初期値を作る

実装対象:

- Question card
- Answer buttons
- Progress indicator
- Next / Back
- Temporary state

禁止:

- 診断だけでBUY / WAIT / SKIPを確定する
- AI判定
- 外部API
- DB保存

### WEB-06: Candidate Sneaker Check Flow

目的:

- Candidate CheckをStep 1 / Step 2 / Step 3に分けて実装する
- スニーカー情報を手入力する
- タグを選択する
- 入力確認を表示する

実装対象:

- Step indicator
- Step 1: 基本情報
- Step 2: 特徴タグ
- Step 3: 確認
- Temporary candidate state
- Validation

禁止:

- 価格比較画面化
- EC商品入力フォーム化
- 購入導線
- 外部価格取得
- AIタグ推定

### WEB-07: Core Recommendation Integration

目的:

- UI入力から `recommendSneakers(input)` を呼ぶ
- Core出力をUI表示用に受け取る
- UI側ではfinalScoreやDecisionを再計算しない

実装対象:

- Input mapping
- Sample data mapping
- Core API call
- Result state

禁止:

- Coreロジック変更
- Score再計算
- Decision変更
- Demotion非表示
- AIによる判定

### WEB-08: Result List / Result Detail

目的:

- Result Listを候補一覧として表示する
- Result DetailでfinalDecision / Demotion / reasons / cautions / ScoreBreakdownを表示する

実装対象:

- Result List
- Result Card
- Result Detail
- Decision Summary
- Demotion Alert
- Reasons Card
- Cautions Card
- ScoreBreakdown
- Explanation Panel
- Snapshot Summary

禁止:

- ランキング表示
- No.1表現
- 購入リンク
- 実在価格
- 在庫
- 真贋
- プレ値

### WEB-09: Responsive / Accessibility Polish

目的:

- Mobile優先の見た目を整える
- PC表示を破綻しない範囲で整える
- アクセシビリティ最低条件を確認する

実装対象:

- Mobile layout polish
- Desktop responsive layout
- Focus state
- Button size
- Error messages
- Score label readability

禁止:

- 新機能追加
- DB
- API Route
- 外部API
- Figmaからのデザイン逸脱

### WEB-10: Final Verification / Documentation Notes

目的:

- テスト
- typecheck
- CI確認
- 変更範囲確認
- 実装禁止事項を破っていないか確認

実装対象:

- 必要なテスト追加
- 必要な軽微なdocs note

注意:

- README変更は必要性が明確な場合のみ別Promptで扱う
- WEB-10で無断にREADMEを編集しない

## 5. 実装してよい範囲

WEB-02以降で実装してよい範囲は以下とする。

- Home
- Preference Diagnosis
- Candidate Sneaker Check
- Result List
- Result Detail
- Result GuideまたはResult Detail内の補助セクション
- 一時状態
- sample dataを使った表示
- `recommendSneakers(input)` の利用
- Core出力の表示
- rule-based説明または固定サンプル説明
- Mobile優先のUI
- 必要最小限のPC対応

## 6. 実装してはいけない範囲

以下はWEB-02以降でも明示的に禁止する。

- DB保存
- 認証
- ログイン
- API Route
- Gemini API呼び出し
- OpenAI API呼び出し
- 外部価格API
- スクレイピング
- 実在価格表示
- 在庫表示
- プレ値予測
- 真贋判定
- 購入リンク
- ECサイト的な商品一覧
- 保存済み履歴
- マイページ
- 決済
- 通知
- AIチャット
- AIによるスコア生成
- AIによるDecision生成
- AIによるDemotion生成
- Coreロジックの変更
- ScoreBreakdownキー名の変更

## 7. 技術スタック確認方針

WEB-01では技術スタックを確定しすぎない。以下はWEB-02で確認する。

- 現在のpackage.jsonにWeb UI用の依存関係があるか
- Next.jsが導入済みか
- Reactが導入済みか
- Tailwindが導入済みか
- Vite等の既存Web環境があるか
- `src/**` の構成
- `recommendSneakers(input)` のimport経路
- Coreがブラウザ実行可能か
- Node専用APIに依存していないか
- 環境変数や外部APIを必要としていないか

WEB-02では確認だけを行い、導入や変更はしない。

## 8. Next.js / React / Tailwind導入判断の扱い

WEB-01ではNext.js / React / Tailwindを導入しない。

方針:

- Next.js導入判断はWEB-02で調査する
- React導入判断はWEB-02で調査する
- Tailwind導入判断はWEB-02で調査する
- 実際の導入作業はWEB-03で扱う
- package.json変更はWEB-03以降で明示的に扱う
- pnpm-lock.yaml変更はWEB-03以降で明示的に扱う
- WEB-01では依存関係を追加しない

## 9. Core API連携方針

使用してよいCore API:

```ts
recommendSneakers(input)
```

方針:

- UI入力をCore inputへ変換する
- Core出力をそのまま表示する
- UI側でfinalScoreを再計算しない
- UI側でrawDecisionを変更しない
- UI側でfinalDecisionを変更しない
- UI側でDemotionを隠さない
- UI都合でCore型やスコア式を変更しない

UIはCore出力の意味を変えない。表示名の日本語化やレイアウト上の整理は許容するが、Coreが返した判定、スコア、Demotion、ScoreBreakdownの構造は変更しない。

## 10. CoreのClient import安全性確認

WEB-02で必ず確認すること:

- `recommendSneakers(input)` をClient Componentから直接importできるか
- CoreがNode専用APIに依存していないか
- Coreが環境変数に依存していないか
- Coreが外部APIに依存していないか
- Coreがサーバー専用処理に依存していないか

判断:

- ブラウザ安全なら、初期Web UIでは直接importを許可する方針とする
- ブラウザ安全でないなら、直接importしない
- その場合は実装を止め、Adapter方針を別Promptで設計する

## 11. Adapter方針の扱い

CoreがClient import不可の場合でも、WEB-02 / WEB-03でAPI Routeを作らない。

その場合は実装を止め、Adapter方針をdocsで検討する。

重要:

- Adapter方針 = API Route作成、とは決めない
- API Routeを使うかどうかはCore v1.0以降の別判断とする
- v0.5初期Web UIではAPI Routeなしを維持する
- Adapterが必要な場合は、WEB系実装を止めて別Promptで設計する

## 12. create-next-app相当の初期化禁止方針

WEB-03でWeb App Setupを行う場合でも、以下を守る。

- create-next-app相当の初期化で既存ファイルを上書きしない
- 既存Coreを壊さない
- 既存srcを壊さない
- 既存testを壊さない
- 既存tsconfigや設定を壊さない
- 既存package scriptsを無断で置き換えない
- 既存リポジトリへ手動で最小構成を追加する方針を優先する
- 破壊的変更が必要になりそうな場合は作業を止める

## 13. 画面構成計画

初期Web UIでは以下の画面を計画する。

- Home
- Preference Diagnosis
- Candidate Sneaker Check
- Result List
- Result Detail
- Result Guideまたは補助セクション

Result Guideは必須独立画面にしない。Result Detail内の補助セクションとして扱う可能性も残す。

## 14. ルート / ページ構成案

ルートは実装前の案として記録する。WEB-01では実装しない。

候補:

- `/`
- `/diagnosis`
- `/candidate`
- `/results`
- `/results/:id`
- `/guide`

注意:

- 実際のルーティング方式はWEB-02で技術構成を確認してから決める
- Next.js導入前提で固定しすぎない
- HomeからResult Detailへ直接遷移しない
- 保存済み履歴前提のルートを作らない

## 15. コンポーネント分割案

以下はコンポーネント分割案である。WEB-01では作成しない。実際のファイル構成はWEB-02以降で決める。

Layout:

- AppShell
- Header
- MainContainer
- FooterNotice

Home:

- HomePage
- HeroText
- PrimaryCtaCard
- SecondaryLink

Diagnosis:

- DiagnosisPage
- DiagnosisQuestionCard
- AnswerButtonGroup
- ProgressIndicator

Candidate Check:

- CandidateCheckPage
- CandidateStepIndicator
- CandidateBasicInfoStep
- CandidateTagStep
- CandidateConfirmStep
- TagChipGroup
- PriceInputNotice

Result:

- ResultListPage
- ResultCard
- ResultDetailPage
- DecisionSummary
- DecisionBadge
- DemotionAlert
- ReasonsCard
- CautionsCard
- ScoreBreakdownCard
- ExplanationPanel
- SnapshotSummary

Guide:

- ResultGuideSection
- ResultGuidePage

## 16. 状態管理方針

初期Web UIではDB保存しない。

状態は以下の一時状態として扱う。

- Diagnosis answers
- PreferenceProfile
- Candidate input
- Selected tags
- Recommendation result
- Selected result detail

方針:

- ページ更新後の永続保存を保証しない
- 保存済み履歴を作らない
- localStorage / sessionStorageは初期実装では使わない
- 使う場合は別Promptで明示的に扱う
- 状態管理ライブラリを追加しない
- 複数画面で状態を共有する場合は、共通の親または画面フロー上の一時状態として扱う

## 17. Candidate CheckのStep分割方針

Candidate Checkは以下の3ステップで扱う。

- Step 1: 基本情報
- Step 2: 特徴タグ
- Step 3: 確認

WEB実装では以下を検討する。

- 1画面内に3ステップを縦に積みすぎない
- 基本は現在Stepだけを主表示する
- Step indicatorを上部に置く
- Back / Nextで移動する
- Step 3で入力内容を確認する
- 価格注意文はStep 1または確認画面で見えるようにする
- タグは押しやすいチップにする
- Candidate CheckをECフォームや価格比較画面に見せない

## 18. Result Detailの表示優先順位

Result Detailでは以下の順番を優先する。

1. finalDecision
2. finalScore
3. Demotion Alert
4. reasons
5. cautions
6. ScoreBreakdown
7. Explanation Panel
8. Snapshot Summary

方針:

- finalDecisionを最上部の主役にする
- finalScoreは補助にする
- Demotion Alertは上部に置く
- Demotionは必ず表示する
- reasonsとcautionsは別カードにする
- ScoreBreakdownは補助セクションにする
- Gemini説明 / providerは下位表示にする
- AIが購入判断したように見せない

## 19. ScoreBreakdownの扱い

ScoreBreakdownはResult Detailの補助情報である。

方針:

- Result Listでは全項目を出さない
- Result Detailの下部に置く
- 見出しは「詳細スコア」などにする
- 分析ダッシュボードの主役にしない
- 数値を併記する
- overlapPenaltyは「高いほど注意」と分かる表示にする
- 初期実装では折りたたみ風の静的表現でもよい
- 実際のアコーディオン動作は必要に応じて後続Promptで扱う

## 20. タグ表示名と内部タグの対応

UI表示名と内部タグの対応は以下とする。

| 内部タグ | UI表示名 |
| --- | --- |
| classic | クラシック |
| low_tech | シンプルな作り |
| street | ストリート感 |
| minimal | 合わせやすい |
| chunky | ボリューム感 |
| running | ランニング系 |
| basketball | バスケット系 |
| comfortable | 履きやすい |
| durable | 長く履けそう |
| retro | 昔っぽい雰囲気 |
| heritage | 定番・歴史がある |
| premium | 上質・高級感 |

禁止するUI表示名:

- 文化背景あり
- レトロ
- ヘリテージ
- ヴィンテージ感

注意:

- 内部タグ名は画面に出さない
- UI表示名はユーザー向けにする
- 実装時にCore内部タグへ戻せるようにする

## 21. データ利用方針

使用してよいデータ:

- 既存のsampleSneakers
- 既存のsampleProfiles
- 既存のsampleOwnedSneakers
- UI入力から作る一時的なPreferenceProfile
- UI入力から作る一時的なSneakerCandidate
- Coreが返したRecommendation結果
- rule-based説明または固定サンプル説明

禁止:

- 実在価格
- 在庫
- 購入リンク
- 外部販売サイト情報
- スクレイピング結果
- AI生成Decision
- AI生成Score

## 22. テスト方針

WEB-02以降では、各Promptごとに以下を確認する。

必須:

- `pnpm test`
- `pnpm typecheck`
- `git status --short --untracked-files=all`
- `git diff --stat`
- `git diff --name-status`

実装フェーズで追加検討:

- UI入力の変換テスト
- タグ表示名と内部タグの対応テスト
- recommendSneakers呼び出しテスト
- finalDecision / Demotion表示テスト
- Candidate Step validationテスト

## 23. WEB-02へ進む条件

WEB-01完了後、以下を満たしたらWEB-02へ進んでよい。

- Web UI実装順序が明確
- WEB-02が調査専用Promptとして分離されている
- WEB-02でpackage.json / pnpm-lock.yaml / src/**を変更しない方針が明確
- Web App SetupをWEB-03へ分離している
- package.json変更をWEB-03以降に限定している
- CoreのClient import安全性確認がWEB-02に組み込まれている
- Client import不可の場合もAPI Routeを作らず、Adapter方針をdocsで検討する方針が明確
- Candidate CheckのStep分割方針が明確
- Result Detailの表示優先順位が明確
- ScoreBreakdownが補助扱いとして定義されている
- 禁止事項が明確
- 既存Coreや既存docsを変更していない

## 24. WEB実装Promptでの禁止事項

WEB-02以降の各Promptには、以下を必ず入れる。

- 指定された範囲以外を変更しない
- 実装対象ファイルを明記する
- package.json / pnpm-lock.yamlを変更する場合は、そのPromptで明示する
- Coreロジックを変更しない
- 既存fixtureを変更しない
- UI側でScoreやDecisionを再計算しない
- Demotionを隠さない
- 価格・在庫・購入リンクを出さない
- 外部APIを追加しない
- DBを作らない
- API Routeを作らない
- Gemini APIを呼ばない
- OpenAI APIを呼ばない
- 実装後にtest / typecheck / diff確認をする

## 25. 完了条件

WEB-01の完了条件は以下である。

- Web UI実装計画が作成されている
- WEB-02〜WEB-10の分割が明確
- WEB-02が調査専用に分離されている
- WEB-03で初めてWeb App Setupを扱う方針になっている
- 実装してよい範囲が明確
- 実装してはいけない範囲が明確
- Next.js / React / Tailwind導入判断をWEB-02で調査し、導入作業をWEB-03へ分離している
- package.json / pnpm-lock.yamlをWEB-01では変更しないことが明記されている
- Core API連携方針が明確
- CoreのClient import安全性確認が明記されている
- Client import不可時もAPI Routeを即作成しない方針が明記されている
- create-next-app相当の初期化で既存ファイルを上書きしない方針が明記されている
- Candidate CheckのStep分割方針が明記されている
- Result DetailのDemotion優先表示が明記されている
- ScoreBreakdownが補助扱いになっている
- タグ表示名と内部タグの対応が明記されている
- WEB-02へ進む条件が明記されている
- 実装に入らず、docsだけで計画を固定している
