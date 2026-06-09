# DESIGN Prompt 02: Figma / Pencil Design Prompt

あなたは、TypeScript個人開発プロジェクトのプロダクトデザイナー兼UI/UXデザイナーです。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

## 今回の目的

`Figma / Pencil Design Prompt Spec` を作成してください。

これは、Figma / Pencilに渡して、SOLE//MATRIXの低〜中忠実度の画面デザイン案を作るためのPromptを固定する設計書です。

今回はWeb UI実装をしません。
今回はReactコンポーネントを作りません。
今回はNext.jsアプリを作りません。
今回はTailwind設定をしません。
今回はFigma画面そのものを作りません。
今回はFigma / Pencilに直接投げません。
今回はFigma Makeを主対象にしません。
今回は設計書だけを追加してください。

## 重要

DESIGN-02は、Figma / Pencilへ渡すためのPromptをdocsで固定する工程です。

Figma / Pencilで実際に画面を生成する作業は、DESIGN-02完了後に別作業として行います。

Figma Makeはコード生成やアプリ化に寄る可能性があるため、DESIGN-02では主対象にしません。Figma Makeを使う場合でも、画面案生成のみに限定し、コード生成、アプリ化、API接続、DB、ログイン、購入導線を作らないでください。

v0 / React / Tailwind / Next.jsの実装Promptではありません。コード生成Promptではありません。

成果物は低〜中忠実度の画面デザイン案とします。完成度の高いビジュアルや本番UIではなく、画面構成・情報階層・余白・カード構造・主要CTAの見え方を確認するためのものにしてください。

## 作成してよいファイル

- `docs/design/02_FIGMA_PENCIL_DESIGN_PROMPT_SPEC.md`
- `docs/agent-prompts/design/02-figma-pencil-design-prompt.md`

## 編集してはいけないファイル

- `src/**`
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `.github/**`
- 既存fixture
- 既存test
- 既存Coreロジック
- `docs/ui/**` の既存ファイル
- `docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md`

## Figma / Pencilへ渡すPrompt本文

以下をFigma / Pencilへ渡す画面デザインPromptとして固定してください。

```txt
SOLE//MATRIXの低〜中忠実度の画面デザイン案を作成してください。

目的は、本番UIではなく、画面構成・情報階層・余白・カード構造・主要CTAの見え方を確認することです。React / Next.js / Tailwind / v0向けのコード生成はしないでください。Figma Makeを使う場合でも画面案生成だけに限定し、コード生成、アプリ化、API接続、DB、ログイン、購入導線を作らないでください。

Design Direction:
- Quiet Sneaker Decision UI
- 白基調
- off-white背景
- 黒・濃いグレー中心
- 余白多め
- カード型UI
- 薄いborder
- 弱いshadowまたはshadowなし
- 角丸は要素ごとに調整
- ECサイト、価格比較サイト、AIチャット画面、スニーカーショップ風に見せない
- 購入判断を煽らない
- 価格・在庫・真贋・購入リンクを出さない
- finalDecision / Demotion / ScoreBreakdownを誤解なく読ませる

Fidelity:
- Low to mid fidelity
- 完成ビジュアルではなく、構造確認用
- 実在スニーカー画像、実在価格、購入リンクは不要
- 写真素材やブランドビジュアルを作り込まない

Frames:
Mobileを先に作り、DesktopはMobileの派生として作ってください。

Mobile:
- 01_Home_Mobile
- 02_PreferenceDiagnosis_Mobile
- 03_CandidateCheck_Mobile
- 04_ResultList_Mobile
- 05_ResultDetail_Mobile
- 06_ResultGuide_Mobile

Desktop:
- 01_Home_Desktop
- 02_PreferenceDiagnosis_Desktop
- 03_CandidateCheck_Desktop
- 04_ResultList_Desktop
- 05_ResultDetail_Desktop
- 06_ResultGuide_Desktop

Result Guideを独立画面にしない場合は、06_ResultGuide_* を作らず、05_ResultDetail_* 内の補助セクションとして扱ってよいです。

Layer naming:
以下のような整理名を使ってください。これは実装コンポーネント名ではありません。
- Header
- Main
- FooterNotice
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
- DecisionSummary
- DecisionBadge
- DemotionAlert
- ReasonsCard
- CautionsCard
- ScoreBreakdown
- ExplanationPanel
- SnapshotSummary
- Footer

Common visual rules:
- Background: white / off-white
- Card: white, thin border, weak shadow or no shadow
- Radius: Small UI 8〜12px, Standard Card 12〜16px, Hero / Large CTA Card 16〜24px
- Text: 日本語優先、黒〜濃いグレー、見出しは太め、本文は読みやすく
- Accent: indigo / graphite blue / muted greenのいずれかに近い落ち着いた1色だけ
- Primary Button: 黒背景 + 白文字
- Secondary Button: 白背景 + 黒枠
- BUY / SKIPを赤・緑だけで強調しない
- 購入ボタン風にしない

Tag labels:
- classic: クラシック
- low_tech: シンプルな作り
- street: ストリート感
- minimal: 合わせやすい
- chunky: ボリューム感
- running: ランニング系
- basketball: バスケット系
- comfortable: 履きやすい
- durable: 長く履けそう
- retro: 昔っぽい雰囲気
- heritage: 定番・歴史がある
- premium: 上質・高級感

Avoid these tag labels:
- 文化背景あり
- レトロ
- ノームコア
- ヘリテージ
- ヴィンテージ感

Home:
Purpose:
ユーザーに2つの入口を選ばせる。

Show:
- SOLE//MATRIX title
- 短い説明文
- CTA card: 好みを診断する
- CTA card: 気になる靴をチェックする
- Secondary link: 結果の見方
- Notice: 価格・在庫・真贋・プレ値は扱いません

Design:
- CTAカード2つを同じ重要度で見せる
- Mobileは縦積み
- Desktopは2カラム可
- 商品一覧や購入導線に見せない

Do not show:
- スニーカー一覧
- 実在価格
- 在庫
- 購入ボタン
- ログイン導線
- AIチャット
- 保存済み履歴
- HomeからResult Detailへの直接導線

Preference Diagnosis:
Purpose:
8問程度の軽い質問でPreferenceProfile初期値を作る入口にする。

Show:
- Question 1 / 8
- イラストまたはプレースホルダー
- 質問文
- 補足文
- Answer buttons: 好き / 普通 / 苦手
- 前へ / 次へ
- 最終質問のみ: 診断結果を見る

Design:
- 1画面1質問
- 中央カード型
- 余白多め
- 回答ボタンを押しやすく
- 選択状態は色だけでなく枠や文字でも分かるようにする
- B2Yの軽さは参考にするが、見た目や文言はコピーしない
- Desktopではイラスト枠と質問エリアを横並びにしてもよい

Do not:
- YES / SOSO / NOをそのまま主表示にしない
- B2Yの質問内容をコピーしない
- 性別固定に見える質問を作らない
- 診断だけでBUY / WAIT / SKIPを確定したように見せない
- AIが診断しているように見せない

Candidate Sneaker Check:
Purpose:
ユーザーが気になるスニーカー情報を手入力し、SneakerCandidateを作る入口にする。

Step 1 Basic Info:
- スニーカー名
- ブランド
- 入力金額
- 予算
- メモ
- Notice: この金額はユーザー入力です。市場価格や在庫を保証するものではありません。

Step 2 Feature Tags:
- クラシック
- シンプルな作り
- ストリート感
- 合わせやすい
- ボリューム感
- ランニング系
- バスケット系
- 履きやすい
- 長く履けそう
- 昔っぽい雰囲気
- 定番・歴史がある
- 上質・高級感
- Selected count: 3 / 5 選択中

Step 3 Confirm:
- 入力内容の確認
- 選択タグの確認
- 価格・予算の確認
- 所有靴との被り確認
- 診断するボタン

Design:
- 3ステップ入力
- タグはチップ形式
- 入力欄は大きめ
- 注意文は見落とさないが、強く脅しすぎない
- PCでも入力欄を横に広げすぎない

Do not:
- 自由入力タグを主役にしない
- AIがタグを推定したように見せない
- 入力金額を市場価格に見せない
- 価格比較画面に見せない
- 購入リンクを出さない
- 真贋判定を出さない

Result List:
Purpose:
複数候補の結果を一覧で見せる。

Show:
- Result Summary
- Result Card
- finalDecision
- finalScore
- スニーカー名
- 短い理由
- 注意ラベル
- 詳細を見るボタン
- 判定はCoreロジックに基づいている旨の短い注記

Design:
- finalDecisionを主役にする
- finalScoreは補助
- Demotionがある場合は注意ラベルを表示
- カード型で縦積み
- PCではグリッドも可
- EC商品カードに見せない
- 商品写真や価格ではなく、判断結果と理由を主役にする

Do not:
- 実在価格
- 在庫
- 購入リンク
- 商品写真を主役にする
- rawDecisionを一覧で強調する
- Gemini説明全文を一覧で出す
- セールやランキングのように見せる

Result Detail:
Purpose:
Core出力の判断理由を誤解なく見せる。

Show:
- finalDecision
- finalScore
- スニーカー名
- Demotion Alert
- 合っている理由
- 注意すべき理由
- ScoreBreakdown
- Explanation Panel
- provider表示
- Snapshot Summary
- 入力を修正する
- Homeへ戻る

Design:
- finalDecisionを最上部に置く
- finalScoreはfinalDecisionの近くに置く
- Demotionは必ず見せる
- reasonsとcautionsは別カードにする
- ScoreBreakdownは横バーまたは表
- overlapPenaltyは高いほど注意と分かるようにする
- Gemini説明は下位表示
- AIが判定したように見せない
- Mobileは縦積み
- Desktopは2カラムも可

Do not:
- AIが買うべきと判断しました、と書かない
- BUYを購入命令のように見せない
- SKIPを失敗のように見せない
- 実在価格・在庫・真贋・プレ値・購入リンクを出さない
- ScoreBreakdownのCoreキー名を変更しない
- Demotionを隠さない

Result Guide:
- 独立画面、またはResult Detail内の補助セクションとして扱う
- finalDecision、finalScore、Demotion、ScoreBreakdownの意味を簡単に説明する
- 技術用語を前面に出しすぎない
- 購入判断やAI判断を強調しない
- Homeへ戻る導線を置く

Mobile:
- 1カラム
- CTAカード縦積み
- 入力欄は大きく
- タグは折り返し
- Result Detailは縦積み
- ScoreBreakdownは折りたたみでもよい
- Snapshotは最下部
- 情報を詰め込みすぎない
- ボタンは押しやすくする
- 画面上部に主役の情報を置く

Desktop:
- 中央幅を制限
- Homeは2カラムCTA可
- Result Detailは2カラム可
- PCだけ情報を増やさない
- スマホ版と意味を変えない
- 横幅を広げすぎない
- 余白を保つ

Prototype connections:
- Home → Preference Diagnosis
- Home → Candidate Sneaker Check
- Home → Result Guide
- Preference Diagnosis → Result List
- Result List → Result Detail
- Candidate Sneaker Check → Result Detail
- Result Detail → Home
- Result Detail → 入力修正
- Result Guide → Home

Forbidden prototype connections:
- Home → Result Detail
- Home → Previous Result
- Home → Login
- Home → Saved History
- Home → External Price
- Home → Purchase Link
- Home → AI Chat

Do not create:
- Reactコード
- Next.jsコード
- Tailwindコード
- DB
- API Route
- Gemini API呼び出し
- OpenAI API呼び出し
- 外部価格API
- スクレイピング
- 実在価格
- 在庫
- プレ値予測
- 真贋判定
- 購入リンク
- AIチャット
- 保存済み履歴
- ログイン画面
- マイページ
- EC商品一覧
- セール表示
- クーポン表示
- 外部販売サイト誘導
```

## `docs/design/02_FIGMA_PENCIL_DESIGN_PROMPT_SPEC.md` に含める内容

1. DESIGN-02の目的
2. DESIGN-01との関係
3. Figma / Pencilに渡す目的
4. 成果物の忠実度
5. 作成してほしい画面一覧
6. Frame命名ルール
7. Layer命名ルール
8. 画面ごとのデザイン指示
9. 共通ビジュアルルール
10. Home画面のデザインPrompt
11. Preference Diagnosis画面のデザインPrompt
12. Candidate Sneaker Check画面のデザインPrompt
13. Result List画面のデザインPrompt
14. Result Detail画面のデザインPrompt
15. Result Guideの扱い
16. スマホ版デザイン指示
17. PC版デザイン指示
18. プロトタイプ接続方針
19. Figma / Pencilで作ってはいけないもの
20. Figma Makeを使う場合の注意
21. Pencilで作る場合の注意
22. v0へ渡さない理由
23. 完了条件

## 完成条件

- Figma / Pencilに渡せるPromptがある
- Home / Diagnosis / Candidate Check / Result List / Result Detailの見た目指示がある
- Frame命名ルールがある
- Layer命名ルールがある
- タグ表示名が初見ユーザーにも伝わる日本語になっている
- 「文化背景あり」「レトロ」のような抽象的なUI文言を避けている
- 成果物の忠実度が低〜中忠実度として明確になっている
- DESIGN-01のVisual Directionが反映されている
- UI-01〜UI-06の禁止事項が守られている
- ECサイト化を防いでいる
- 価格・在庫・購入リンクを禁止している
- GeminiやAI説明を判定主体にしていない
- Figma Makeを主対象にしていない
- React / Next.js / Tailwind実装へ進まないことが明記されている

## 実行すべきコマンド

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

## 期待する結果

- 既存テストがすべて成功する
- typecheckが成功する
- 変更範囲が `docs/design/**` と `docs/agent-prompts/design/**` のみ
- `src/**` に変更がない
- `package.json` に変更がない
- `pnpm-lock.yaml` に変更がない
- `README.md` に変更がない
- `.github/**` に変更がない
- `docs/ui/**` の既存ファイルに変更がない
- `docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md` に変更がない

## commit message案

```txt
docs: add Figma Pencil design prompt spec
```

## 完了後に報告すること

- 追加したファイル一覧
- 変更していないことを確認した範囲
- `pnpm test` の結果
- `pnpm typecheck` の結果
- `git diff --stat` の結果
- `git status --short --untracked-files=all` の結果
- 次に進むべきPrompt番号

