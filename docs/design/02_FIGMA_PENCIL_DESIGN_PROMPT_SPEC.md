# SOLE//MATRIX DESIGN-02: Figma / Pencil Design Prompt Spec

## 1. DESIGN-02の目的

DESIGN-02は、SOLE//MATRIXの低〜中忠実度の画面デザイン案をFigma / Pencilで作るためのPromptを固定する設計書である。

この工程では、画面の見た目、情報階層、余白、カード構造、主要CTAの見え方を指定する。ただし、DESIGN-02では画面そのものは作らない。実際にFigma / Pencilへ投げる作業は、DESIGN-02完了後の別作業として行う。

DESIGN-02で行わないこと:

- Web UI実装
- Reactコンポーネント作成
- Next.jsアプリ作成
- Tailwind設定
- Figma画面そのものの作成
- Figma / Pencilへの直接投入
- Figma Makeを主対象にしたコード生成
- DB / API Route / 認証 / 外部価格API / スクレイピング

## 2. DESIGN-01との関係

DESIGN-02は、`docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md` で定義した `Quiet Sneaker Decision UI` を具体的な画面デザインPromptへ落とし込む工程である。

DESIGN-01で定義した以下の方針を必ず守る。

- 白基調
- off-white背景
- 黒・濃いグレー中心
- 余白多め
- カード型UI
- 薄いborder
- 弱いshadowまたはshadowなし
- 角丸は要素ごとに調整する
- ECサイトに見せない
- AIチャット画面に見せない
- スニーカーショップの価格比較画面に見せない
- 購入判断を煽らない
- `finalDecision` / Demotion / `ScoreBreakdown` を誤解なく読ませる
- 価格・在庫・真贋・購入リンクを出さない

DESIGN-02はDESIGN-01を置き換えない。DESIGN-01を視覚方針の上位仕様として扱い、Figma / Pencilへ渡す実用Promptへ変換する。

## 3. Figma / Pencilに渡す目的

Figma / Pencilへ渡す目的は、実装前に以下を確認することである。

- 画面構成が分かりやすいか
- 情報階層が整理されているか
- Homeから2つの入口が分かりやすいか
- Preference Diagnosisが軽い診断体験に見えるか
- Candidate Sneaker Checkが入力しやすいか
- Result List / Result DetailでCore出力を誤解なく読めるか
- ECサイトや価格比較アプリに見えないか
- スマホで読みやすいか
- Figmaから後続の実装計画へ渡せるか

## 4. 成果物の忠実度

成果物は低〜中忠実度の画面デザイン案とする。

目的:

- 画面構成を確認する
- 情報階層を確認する
- 余白の取り方を確認する
- カード構造を確認する
- 主要CTAの見え方を確認する
- Result画面で `finalDecision` / Demotion / `ScoreBreakdown` が読めるか確認する

求めないもの:

- 本番UIレベルの完成度
- 細かいアニメーション
- ブランドビジュアルの作り込み
- 写真素材の作り込み
- 実在スニーカー画像
- 実在価格
- 購入リンク
- コード生成
- React / Tailwind実装

## 5. 作成してほしい画面一覧

作成してほしい画面:

1. Home
2. Preference Diagnosis
3. Candidate Sneaker Check
4. Result List
5. Result Detail
6. Result Guide、またはResult Detail内の補助セクション

まずスマホ版を優先する。PC版はスマホ版の派生として作る。

## 6. Frame命名ルール

Figma / PencilでFrameを作る場合、以下の命名にする。

Mobile:

- `01_Home_Mobile`
- `02_PreferenceDiagnosis_Mobile`
- `03_CandidateCheck_Mobile`
- `04_ResultList_Mobile`
- `05_ResultDetail_Mobile`
- `06_ResultGuide_Mobile`

Desktop:

- `01_Home_Desktop`
- `02_PreferenceDiagnosis_Desktop`
- `03_CandidateCheck_Desktop`
- `04_ResultList_Desktop`
- `05_ResultDetail_Desktop`
- `06_ResultGuide_Desktop`

注意:

- Frame名に日本語を混ぜない
- 番号順に並べる
- Mobileを先に作る
- DesktopはMobileの派生として作る
- Result Guideを独立画面にしない場合は、`06_ResultGuide_*` を作らず、`05_ResultDetail_*` 内の補助セクションとして扱ってよい

## 7. Layer命名ルール

Layer名は、UI-05で定義した仮コンポーネント名に合わせる。これは実装コンポーネント名ではなく、将来のハンドオフで画面構造を分かりやすくするための整理名である。

使用してよいLayer名の例:

- `Header`
- `Main`
- `FooterNotice`
- `HeroText`
- `PrimaryCtaCard`
- `SecondaryLink`
- `DiagnosisQuestionCard`
- `AnswerButtonGroup`
- `StepIndicator`
- `CandidateInputForm`
- `TagChipGroup`
- `CandidateConfirmCard`
- `ResultCard`
- `DecisionSummary`
- `DecisionBadge`
- `DemotionAlert`
- `ReasonsCard`
- `CautionsCard`
- `ScoreBreakdown`
- `ExplanationPanel`
- `SnapshotSummary`
- `Footer`

注意:

- Layer名は実装コンポーネント名ではない
- propsやファイル名を定義しない
- Reactコンポーネントを作らない
- 将来のハンドオフで分かりやすくするための整理名として扱う

## 8. 画面ごとのデザイン指示

全画面で `Quiet Sneaker Decision UI` を反映する。Figma / Pencilでは、色・装飾を作り込みすぎず、余白、カード、ラベル、CTA、情報の優先順位を確認できる状態にする。

タグ表示の文言は、初見ユーザーにも意味が伝わる日本語にする。

| 内部タグ | UI表示名 |
| --- | --- |
| `classic` | クラシック |
| `low_tech` | シンプルな作り |
| `street` | ストリート感 |
| `minimal` | 合わせやすい |
| `chunky` | ボリューム感 |
| `running` | ランニング系 |
| `basketball` | バスケット系 |
| `comfortable` | 履きやすい |
| `durable` | 長く履けそう |
| `retro` | 昔っぽい雰囲気 |
| `heritage` | 定番・歴史がある |
| `premium` | 上質・高級感 |

避ける表現:

- 文化背景あり
- レトロ
- ノームコア
- ヘリテージ
- ヴィンテージ感

理由:

- 意味が抽象的で、初見ユーザーに伝わりにくい
- 人によって解釈が分かれやすい
- スニーカーに詳しい人向けの言葉に寄りすぎる

補足文を入れる場合の例:

- 定番・歴史がある: 長く愛されているモデルや、背景を知ると楽しい靴
- 昔っぽい雰囲気: どこか懐かしい形や色使いの靴
- シンプルな作り: 低めで飾りすぎない、昔ながらの作り
- 合わせやすい: 服を選ばず、普段のコーデに入れやすい靴
- ストリート感: パーカーや太めパンツに合わせやすい雰囲気

参照する雰囲気:

- B2Yの診断体験に見られる、短時間で答えられる軽い質問体験
- Apple製品に見られるような、余白・情報階層・静けさを参考にした落ち着いた雰囲気
- Claude Code生成UIに見られる、実装しやすいカード・フォーム・ラベル構造

コピーしないもの:

- B2Yの商品一覧、価格帯、購入リンク、文言、イラスト、質問内容、画面構成、ブランド表現
- Apple公式UI、iOS標準アプリ、Appleの配色、アイコン、レイアウト、アニメーション、製品ページの見せ方
- Claude Code生成UIをそのまま使ったような無個性なSaaSテンプレート
- shadcn/uiそのままに見える構成
- B2B SaaSダッシュボード風に寄りすぎる見た目

## 9. 共通ビジュアルルール

背景:

- white / off-white

カード:

- white
- thin border
- weak shadowまたはshadowなし
- 角丸は要素ごとに変える

角丸:

- Small UI: 8〜12px
- Standard Card: 12〜16px
- Hero / Large CTA Card: 16〜24px
- 全要素を同じ角丸にしない

文字:

- 黒〜濃いグレー
- 日本語優先
- 英語装飾は控えめ
- 見出しは太め
- 本文は読みやすく

アクセント:

- 1色だけ
- indigo / graphite blue / muted greenのいずれかに近い落ち着いた色
- 赤・緑でBUY / SKIPを強調しない

ボタン:

- Primary = 黒背景 + 白文字
- Secondary = 白背景 + 黒枠
- disabled = 薄いグレー
- 購入ボタン風にしない

Decision:

- `finalDecision` を主役にする
- `finalScore` は補助にする
- Demotionは必ず表示する
- `rawDecision` は目立たせない

ScoreBreakdown:

- 横バーまたは表
- 数値を併記
- 詳細画面中心
- 一覧画面では要約に留める

## 10. Home画面のデザインPrompt

目的:

ユーザーに2つの入口を選ばせる。

表示するもの:

- SOLE//MATRIXのタイトル
- 短い説明文
- 主要CTAカード1: 好みを診断する
- 主要CTAカード2: 気になる靴をチェックする
- 補助リンク: 結果の見方
- 注意文: 価格・在庫・真贋・プレ値は扱いません

見た目:

- 白基調
- off-white背景
- 大きめの余白
- CTAカード2つ
- スマホでは縦積み
- PCでは2カラムも可
- 主要CTAは同じ重要度に見せる
- カードは薄いborder
- shadowは弱くするか使わない
- 購入リンクや商品一覧に見せない

禁止:

- スニーカー一覧を出さない
- 実在価格を出さない
- 在庫を出さない
- 購入ボタンを出さない
- ログイン導線を主役にしない
- AIチャットを主役にしない
- HomeからResult Detailへ直接遷移させない
- 保存済み履歴を出さない

## 11. Preference Diagnosis画面のデザインPrompt

目的:

8問程度の軽い質問で、PreferenceProfile初期値を作る入口にする。

表示するもの:

- Question 1 / 8
- イラストまたはプレースホルダー
- 質問文
- 補足文
- 回答ボタン: 好き / 普通 / 苦手
- 前へ / 次へ
- 最終質問のみ: 診断結果を見る

見た目:

- 1画面1質問
- 中央カード型
- 余白多め
- 回答ボタンを押しやすくする
- 選択状態は色だけでなく枠や文字でも分かるようにする
- B2Yの軽さは参考にするが、見た目や文言はコピーしない
- スマホでは縦積み
- PCではイラスト枠と質問エリアを横並びにしてもよい

禁止:

- YES / SOSO / NOをそのまま主表示にしない
- B2Yの質問内容をコピーしない
- 性別固定に見える質問を作らない
- 診断だけでBUY / WAIT / SKIPを確定したように見せない
- AIが診断しているように見せない

## 12. Candidate Sneaker Check画面のデザインPrompt

目的:

ユーザーが気になるスニーカー情報を手入力し、SneakerCandidateを作る入口にする。

表示するステップ:

Step 1: 基本情報

- スニーカー名
- ブランド
- 入力金額
- 予算
- メモ
- 注意文: この金額はユーザー入力です。市場価格や在庫を保証するものではありません。

Step 2: 特徴タグ

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
- 選択数表示: 3 / 5 選択中

Step 3: 確認

- 入力内容の確認
- 選択タグの確認
- 価格・予算の確認
- 所有靴との被り確認
- 診断するボタン

見た目:

- 3ステップ入力
- タグはチップ形式
- 入力欄は大きめ
- 注意文は見落とさないが、強く脅しすぎない
- スマホでは縦積み
- PCでも入力欄を横に広げすぎない

禁止:

- 自由入力タグを主役にしない
- AIがタグを推定したように見せない
- 入力金額を市場価格に見せない
- 価格比較画面に見せない
- 購入リンクを出さない
- 真贋判定を出さない
- 「文化背景あり」「レトロ」のような抽象的なタグ表示名を使わない

## 13. Result List画面のデザインPrompt

目的:

複数候補の結果を一覧で見せる。

表示するもの:

- Result Summary
- Result Card
- `finalDecision`
- `finalScore`
- スニーカー名
- 短い理由
- 注意ラベル
- 詳細を見るボタン
- 判定はCoreロジックに基づいている旨の短い注記

見た目:

- `finalDecision` を主役にする
- `finalScore` は補助
- Demotionがある場合は注意ラベルを表示
- カード型で縦積み
- PCではグリッドも可
- EC商品カードに見せない
- 商品写真や価格ではなく、判断結果と理由を主役にする

禁止:

- 実在価格を出さない
- 在庫を出さない
- 購入リンクを出さない
- 商品写真を主役にしない
- `rawDecision` を一覧で強調しない
- Gemini説明全文を一覧で出さない
- セールやランキングのように見せない

## 14. Result Detail画面のデザインPrompt

目的:

Core出力の判断理由を誤解なく見せる。

表示するもの:

- `finalDecision`
- `finalScore`
- スニーカー名
- Demotion Alert
- 合っている理由
- 注意すべき理由
- `ScoreBreakdown`
- Explanation Panel
- provider表示
- Snapshot Summary
- 入力を修正する
- Homeへ戻る

見た目:

- `finalDecision` を最上部に置く
- `finalScore` は `finalDecision` の近くに置く
- Demotionは必ず見せる
- reasonsとcautionsは別カードにする
- `ScoreBreakdown` は横バーまたは表
- `overlapPenalty` は高いほど注意と分かるようにする
- Gemini説明は下位表示
- AIが判定したように見せない
- スマホでは縦積み
- PCでは2カラムも可

禁止:

- AIが買うべきと判断しました、と書かない
- BUYを購入命令のように見せない
- SKIPを失敗のように見せない
- 実在価格・在庫・真贋・プレ値・購入リンクを出さない
- `ScoreBreakdown` のCoreキー名を変更しない
- Demotionを隠さない

## 15. Result Guideの扱い

Result Guideは、独立画面またはResult Detail内の補助セクションとして扱う。

方針:

- Core v0.5時点では必ず独立ページにするとは決めない
- `finalDecision`、`finalScore`、Demotion、`ScoreBreakdown` の意味を簡単に説明する
- 技術用語を前面に出しすぎない
- 購入判断やAI判断を強調しない
- Homeへ戻る導線を置く

説明する項目:

- `finalDecision`: 購入命令ではなく、判断材料としてのラベル
- `finalScore`: Coreロジック上の補助スコア
- Demotion: 判定を慎重にした理由
- `ScoreBreakdown`: どの観点が合っているか、注意が必要かを分けて見るための内訳
- 扱わない情報: 価格、在庫、真贋、プレ値、購入リンク

## 16. スマホ版デザイン指示

- 1カラム
- CTAカード縦積み
- 入力欄は大きく
- タグは折り返し
- Result Detailは縦積み
- `ScoreBreakdown` は折りたたみでもよい
- Snapshotは最下部
- 情報を詰め込みすぎない
- ボタンは押しやすくする
- 画面上部に主役の情報を置く

## 17. PC版デザイン指示

- 中央幅を制限
- Homeは2カラムCTA可
- Result Detailは2カラム可
- ただしPCだけ情報を増やさない
- スマホ版と意味を変えない
- 横幅を広げすぎない
- 余白を保つ

## 18. プロトタイプ接続方針

Figmaでプロトタイプ接続を作る場合は、以下だけにする。

- Home → Preference Diagnosis
- Home → Candidate Sneaker Check
- Home → Result Guide
- Preference Diagnosis → Result List
- Result List → Result Detail
- Candidate Sneaker Check → Result Detail
- Result Detail → Home
- Result Detail → 入力修正
- Result Guide → Home

禁止する遷移:

- Home → Result Detail
- Home → Previous Result
- Home → Login
- Home → Saved History
- Home → External Price
- Home → Purchase Link
- Home → AI Chat

## 19. Figma / Pencilで作ってはいけないもの

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

## 20. Figma Makeを使う場合の注意

Figma MakeはDESIGN-02の主対象ではない。

使う場合でも、以下を守る。

- 画面案生成のみに限定する
- コード生成まで進めない
- 動くアプリ化しない
- API接続しない
- DBを作らない
- ログインを作らない
- 購入リンクを作らない
- 外部価格APIをつながない
- AI説明を判定主体にしない
- 画面デザインができたら、一度止めてレビューする

## 21. Pencilで作る場合の注意

- 低〜中忠実度でよい
- 細かいアニメーションは作らない
- 配色はDESIGN-01のルールに従う
- 画面間の流れを優先する
- ECサイト風にしない
- コード生成を目的にしない

## 22. v0へ渡さない理由

- DESIGN-02は画面デザインPromptであり、実装Promptではない
- v0はReact / Tailwindコード生成に寄りやすい
- まだNext.js導入や `package.json` 変更を扱わない
- v0へ渡すのはWEB系Promptで扱う
- 今回はFigma / Pencil用の見た目生成Promptを固定する

## 23. 完了条件

DESIGN-02の完了条件:

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
- `docs/design/02_FIGMA_PENCIL_DESIGN_PROMPT_SPEC.md` が追加されている
- `docs/agent-prompts/design/02-figma-pencil-design-prompt.md` が追加されている
- `src/**`、`package.json`、`pnpm-lock.yaml`、`README.md`、`.github/**`、`docs/ui/**`、`docs/design/01_VISUAL_DESIGN_DIRECTION_SPEC.md` に変更がない

