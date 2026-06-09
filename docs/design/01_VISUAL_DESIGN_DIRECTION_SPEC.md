# SOLE//MATRIX DESIGN-01: Visual Design Direction Spec

## 1. Visual Design Directionの目的

Visual Design Directionは、SOLE//MATRIXのWeb UIやFigma画面を作る前に、見た目の方向性を固定するための設計書である。

DESIGN-01は画面デザイン生成Promptではない。Figma / Pencil / Figma Makeへ渡すPromptは次のDESIGN-02で作成する。v0 / React / Tailwind / Next.jsへの実装Promptは、さらに後続のWEB系Promptで扱う。

この設計書で固定すること:

- SOLE//MATRIXらしい視覚トーン
- 色、余白、角丸、カード、ボタン、フォーム、タグの方向性
- `finalDecision`、Demotion、ScoreBreakdownの見せ方
- スマホ優先で読みやすい視覚ルール
- Figma / Pencil / Figma Makeへ渡す前提の注意
- まだ実装や画面生成を行わないこと

この設計書で固定しないこと:

- 実際のFigma画面
- Reactコンポーネント
- Next.jsアプリ
- Tailwind設定
- DB / API Route / 認証 / 外部API連携
- Core推薦ロジック

## 2. 既存UI設計書との関係

DESIGN-01は、既存のUI設計書を置き換えない。UI-01からUI-06で固定された画面構成、入力項目、表示項目、遷移、実装境界を前提に、見た目の方向性だけを定義する。

| 設計書 | 対象 | DESIGN-01での扱い |
| --- | --- | --- |
| `docs/ui/01_DIAGNOSIS_UI_SPEC.md` | Preference Diagnosis | 1画面1質問の診断体験に、静かで読みやすい見た目を与える |
| `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` | Candidate Sneaker Check | 入力フォームとタグ選択を、EC入力ではなく判断材料入力として見せる |
| `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md` | Result / Detail Display | `finalDecision`、Demotion、ScoreBreakdownを誤解なく読ませる視覚ルールを与える |
| `docs/ui/04_HOME_NAVIGATION_FLOW_SPEC.md` | Home / Navigation Flow | 主要CTAを2つに絞った落ち着いた入口として見せる |
| `docs/ui/05_WIREFLOW_LOW_FIDELITY_LAYOUT_SPEC.md` | Wireflow / Low-Fidelity Layout | 低忠実度レイアウトに対し、色、余白、カード、階層の方向性を与える |
| `docs/ui/06_WEB_UI_IMPLEMENTATION_BOUNDARY_SPEC.md` | Web UI Implementation Boundary | UI実装前に守るべき視覚面の境界として接続する |

DESIGN-01では `docs/ui/**` の既存ファイルを編集しない。既存UI設計書は固定済みの仕様として扱う。

## 3. デザインコンセプト

SOLE//MATRIXの見た目は、スニーカーECサイトではなく、購入判断を整理するための落ち着いた診断・分析UIにする。

この方向性を `Quiet Sneaker Decision UI`、日本語では「静かなスニーカー購入判断UI」と定義する。

目的は、ユーザーに「買え」と煽ることではない。ユーザーが自分の好み、所有靴との被り、履きやすさ、耐久性、価格との相性を落ち着いて確認できるUIにする。

スニーカーの楽しさは残すが、主役は商品販売ではなく判断整理である。価格、在庫、購入リンク、セール訴求、ブランド公式サイト風の演出は主役にしない。

## 4. 参照する雰囲気

SOLE//MATRIXは、B2Y、Apple、Claude Code生成UIの3方向を参考にする。ただし、いずれもコピーしない。参照するのは雰囲気、体験の軽さ、情報整理、実装しやすい構造であり、画面、配色、文言、レイアウト、ブランド表現を模倣する意味ではない。

### B2Yから参考にする点

- 1画面1質問
- 8問程度の軽さ
- YES / SOSO / NOに近い3択感
- スニーカー診断らしい親しみやすさ
- 短時間で答えられるテンポ

B2Yから採用するのは、1画面1質問、3択回答、短時間で答えられる軽さまでとする。

コピーしないもの:

- 商品一覧
- 価格帯
- 購入リンク
- 文言
- イラスト
- 質問内容
- 画面構成
- ブランド表現

### Appleから参考にする点

- 余白
- 静かな階層
- 文字の読みやすさ
- 要素を増やしすぎない姿勢
- 強い装飾に頼らない整理感
- 主役の情報を明確にする構成

Appleという言葉は、余白、情報整理、静けさ、読みやすさの方向性を表すだけであり、Appleのデザインを模倣する意味ではない。

コピーしないもの:

- Apple公式UI
- iOS標準アプリ
- Appleの配色
- Appleのアイコン
- Appleのレイアウト
- Appleのアニメーション
- Apple製品ページの見せ方

### Claude Code生成UIから参考にする点

- 実装しやすいカードUI
- 薄いborder
- 角丸
- 1カラム / 2カラムに展開しやすい構造
- Tailwindで再現しやすいコンポーネント単位
- 入力フォーム、カード、ラベル、ボタンを整理しやすい構造

Claude Code生成UIから採用するのは、実装しやすい構造の考え方までとする。

避けるもの:

- 無個性なSaaSテンプレート感
- shadcn/uiそのままに見える構成
- 汎用管理画面のような見た目
- B2B SaaSダッシュボード風に寄りすぎる見た目

## 5. Quiet Sneaker Decision UIの定義

`Quiet Sneaker Decision UI` とは、以下を満たすUIである。

- スニーカーの楽しさは残す
- しかし、購入を煽らない
- ECサイトに見せない
- 価格や在庫を主役にしない
- `finalDecision`、Demotion、ScoreBreakdownを誤解なく読ませる
- 白基調で余白を多めにする
- 黒・グレー中心で落ち着かせる
- カードUIで情報を整理する
- スマホでも1画面の負担を軽くする
- Gemini説明やAI表現を主役にしない
- 「なぜそう判断されたか」を静かに見せる

このUIは「購入命令」ではなく「判断材料の整理」を提供する。`STRONG_BUY` や `BUY` は購入ボタンではなく候補度を示すラベルであり、`SKIP` は失敗ではなく今回は見送る判断である。

## 6. 採用する見た目の方向性

採用する方向性:

- 白基調
- off-white背景
- 余白多め
- 黒・濃いグレー中心
- カード型UI
- 薄いborder
- 角丸
- 弱いshadow、またはshadowなし
- 情報の階層が明確
- Apple製品に見られるような、余白・情報階層・静けさを参考にした落ち着いた雰囲気
- B2Yの診断体験に見られる、短時間で答えられる軽い質問体験
- Claude Code生成UIに見られる、実装しやすいカード・フォーム・ラベル構造
- スニーカー文化の雰囲気は控えめに入れる
- 派手なストリート感より、整理された判断支援UIを優先する
- スマホで読みやすい縦積み構成
- Resultでは`finalDecision`を主役にする
- `finalScore`は補助にする
- Demotionは必ず表示する
- Gemini説明は下位表示にする

これらは雰囲気や構造の参考であり、画面、配色、文言、レイアウトをコピーする意味ではない。

## 7. 採用しない見た目の方向性

採用しない方向性:

- ECサイトの商品一覧風
- セールページ風
- 派手なグラデーション
- 過度なアニメーション
- ネオンカラー多用
- スニーカーショップ風の価格強調
- 購入ボタン風UI
- AIチャット風UI
- 金融スコアアプリのような圧迫感
- BUYを強く煽るデザイン
- SKIPを失敗のように見せるデザイン
- 実在価格を主役にしたカード
- 在庫や購入リンクがあるように見えるカード
- 保存済み履歴があるように見えるUI
- ログイン前提のマイページ風UI
- ブランド公式サイト風のコピー
- Nike / adidas / New Balanceなど特定ブランドを想起させる配色や表現
- すべてのカードが同じ角丸で並ぶ、AI生成テンプレート感の強いUI
- shadcn/uiやSaaSテンプレートをそのまま使ったように見えるUI

## 8. カラーパレット方針

### 基本色

基本色は白、off-white、黒、グレーを中心にする。

| 用途 | 方針 |
| --- | --- |
| Background | white / off-white |
| Surface | white |
| Subtle Surface | light gray |
| Text Primary | near black |
| Text Secondary | dark gray |
| Border | light gray |
| Muted Border | very light gray |

### アクセントカラー

アクセントカラーは1色だけに絞る。

候補:

- indigo
- graphite blue
- muted green

方針:

- アクセントはCTA、選択状態、重要な補助表示に限定する
- 強い赤・強い緑の多用は避ける
- BUY / SKIPのような判定を色だけで判断させない
- Decisionは色だけでなく、必ずラベルと説明を併記する
- Demotionは注意として見せるが、強い赤で脅さない

禁止:

- 実在ブランドの配色を真似しない
- Nike / adidas / New Balanceなどを想起させる配色に寄せすぎない
- セールを連想させる赤や黄色を多用しない
- BUYを強い緑だけで表現しない
- SKIPを強い赤だけで表現しない

## 9. タイポグラフィ方針

タイポグラフィは、日本語で読みやすいことを優先する。英語の装飾より、日本語の理解を優先する。

方針:

- 見出しは太め
- 本文は読みやすさ優先
- 小さすぎる文字を避ける
- スコアやDecisionは数字とラベルを見やすくする
- 専門用語には補足文を添える

文字サイズ目安:

| 用途 | 目安 |
| --- | --- |
| Page Title | 24-32px |
| Section Title | 18-24px |
| Card Title | 16-20px |
| Body | 14-16px |
| Caption | 12-14px |
| Button | 14-16px |

注意:

- 数値だけを大きくしすぎない
- `finalScore` より `finalDecision` と理由を理解させる
- `rawDecision` は目立たせない
- `ScoreBreakdown` の内部キー名をそのまま主表示にしない
- UI表示名は日本語にする

## 10. 余白・レイアウト方針

基本方針:

- 余白多め
- 画面端に詰めない
- スマホでは16px前後の左右余白を基準にする
- PCでは中央幅を制限する
- カード間の余白を広めにする
- 1画面で主役を1つに絞る

画面別方針:

- Homeでは主要CTAを2つだけ主役にする
- Preference Diagnosisでは1画面1質問を守る
- Candidate Sneaker Checkでは入力ステップを分ける
- Result Detailでは情報が多いため、カード分割と折りたたみを使う

情報量が多い場合でも、横幅に詰め込まず、カードやセクションで意味を分ける。

## 11. カードUI方針

基本:

- white background
- thin border
- subtle radius
- 余白多め
- shadowは弱くする、または使わない
- カード内に情報を詰め込みすぎない

カード種類:

- Primary CTA Card
- Diagnosis Question Card
- Candidate Input Card
- Result Card
- Decision Summary Card
- Demotion Alert Card
- Score Breakdown Card
- Explanation Card
- Snapshot Summary Card

注意:

- カードを増やしすぎない
- カード内の主情報と補助情報を分ける
- Result CardはEC商品カードに見せない
- 画像や価格を主役にしない
- 購入リンクがあるように見せない

## 12. 角丸ルール

角丸はすべて同じにしない。

目安:

| 対象 | 目安 |
| --- | --- |
| Small UI | 8-12px |
| Standard Card | 12-16px |
| Hero / Large CTA Card | 16-24px |

方針:

- 入力欄や小さいチップは丸すぎない
- 標準カードは12-16pxを基準にする
- Homeの大きなCTAカードやHero Cardのみ16-24pxを許可する
- すべてのカードを同じ角丸にしない
- AI生成UIにありがちな、全要素が同じ`rounded-2xl`の見た目を避ける

## 13. ボタンUI方針

基本:

- 角丸
- 十分な高さ
- 押しやすい幅
- Primary = 黒背景 + 白文字
- Secondary = 白背景 + 黒枠
- disabled = 薄いグレー + グレー文字

ボタン種類:

- Primary Button
- Secondary Button
- Text Link
- Back Button
- Next Button
- Detail Button

注意:

- 「購入する」ボタンを作らない
- 「今すぐ買う」と書かない
- BUY判定でも購入ボタン風にしない
- Danger表現は使いすぎない
- 詳細を見る、診断する、チェックする、戻る、修正する、のような行動に限定する

## 14. フォームUI方針

方針:

- 入力欄は大きめ
- ラベルを必ず表示する
- placeholderだけに依存しない
- エラー文は入力欄の近くに置く
- 必須項目を明確にする
- 金額入力には「ユーザー入力値」である注意を表示する
- 入力金額を市場価格のように見せない
- AIが入力内容を自動判定したように見せない

フォームは「購入フォーム」ではなく「判断材料を入力するフォーム」として見せる。

## 15. タグ・チップUI方針

方針:

- タグはチップ形式
- 選択状態は色だけでなく、枠・チェック・文字で示す
- 最大選択数を表示する
- 押しやすいサイズにする
- 英語の内部タグを直接表示しない
- 日本語ラベルを使う
- AIが推定したように見せない
- ブランド名やスニーカー名から自動付与されたように見せない

タグ・チップは、ユーザーが自分で選んだ条件として見える必要がある。

## 16. Decisionラベルの見せ方

Decisionは購入命令ではなく、判断材料として表示する。

表示ラベル:

| Core値 | UI表示 |
| --- | --- |
| `STRONG_BUY` | 強く候補 |
| `BUY` | 買う候補 |
| `WAIT` | 一旦待つ |
| `WATCH` | 気になる候補 |
| `SKIP` | 今回は見送り |

方針:

- `finalDecision` を主表示にする
- 色だけでDecisionを判断させない
- ラベルと短い説明を併記する
- `STRONG_BUY` / `BUY`でも購入を煽らない
- `SKIP`でも否定しすぎない
- `rawDecision`は目立たせない
- `finalScore`は補助として近くに表示する

## 17. Demotion注意表示の見せ方

Demotionは必ず見せる。

方針:

- Decision Summaryの近くに表示する
- 注意カードとして表示する
- アイコンだけに頼らない
- 日本語の説明文を出す
- 複数ある場合はリスト表示する
- `finalDecision`が下がった理由として説明する
- 赤で強く脅しすぎない
- 薄い注意色または境界線で表現する

表示例:

- 所有靴と役割が近いため、判定を慎重にしています
- 予算との相性が低いため、購入判断を慎重にしています
- 履きやすさに不安があるため、購入判断を慎重にしています
- 耐久性に不安があるため、長期使用には注意が必要です

## 18. ScoreBreakdownの見せ方

表示項目:

- `cultureScore`
- `styleScore`
- `simplicityScore`
- `streetScore`
- `volumeScore`
- `comfortScore`
- `durabilityScore`
- `priceScore`
- `overlapPenalty`

UI表示名:

| Coreキー | UI表示名 |
| --- | --- |
| `cultureScore` | 文化・背景 |
| `styleScore` | 合わせやすさ |
| `simplicityScore` | シンプルさ |
| `streetScore` | ストリート感 |
| `volumeScore` | ボリューム感 |
| `comfortScore` | 履きやすさ |
| `durabilityScore` | 耐久性 |
| `priceScore` | 価格との相性 |
| `overlapPenalty` | 所有靴との被り |

方針:

- 詳細画面で表示する
- 一覧画面では要約に留める
- 棒グラフまたは横バーで表示する
- 数値を併記する
- `overlapPenalty`は高いほど注意と分かる表現にする
- スコアが低い項目も否定的に見せすぎない
- Coreキー名は変更しない
- ScoreBreakdownを購入命令のように見せない

## 19. Result Cardの見せ方

一覧カードで表示するもの:

- `finalDecision`
- `finalScore`
- スニーカー名
- 短い理由
- 注意ラベル
- 詳細を見る

一覧カードで表示しないもの:

- 実在価格
- 在庫
- 購入リンク
- Gemini説明全文
- `rawDecision`
- ScoreBreakdown全項目
- 真贋
- プレ値予測

方針:

- EC商品カードに見せない
- 写真や価格を主役にしない
- 判断結果と理由を主役にする
- 詳細を見る導線を明確にする
- BUYでも購入ボタンを出さない
- SKIPでも失敗扱いにしない

## 20. スマホ優先の視覚ルール

スマホ表示を基準に視覚設計する。

方針:

- 1カラム
- CTAカード縦積み
- ボタンは大きめ
- タグは折り返し
- Result Detailは縦積み
- ScoreBreakdownは折りたたみ
- Snapshotは最下部
- 1画面の情報量を減らす
- タップ対象を小さくしない
- 余白を確保する
- 主要CTAを画面上部で見つけやすくする

## 21. PC表示の視覚ルール

PC表示はスマホ表示の意味を変えず、読みやすさのために余白とカラムを使う。

方針:

- 中央幅を制限する
- Homeは2カラムCTAを許可
- Result Detailは2カラムを許可
- ただしPCだけ情報を増やさない
- スマホとPCで意味を変えない
- 横幅が広い場合でも情報を横に広げすぎない
- PCでも余白と読みやすさを優先する

## 22. アクセシビリティ方針

方針:

- 色だけで意味を伝えない
- Decisionはラベルで示す
- Demotionは文言で示す
- ボタンやタグは押しやすいサイズにする
- スコアバーには数値を併記する
- フォーカス状態を想定する
- エラー文は対象入力の近くに置く
- 小さすぎる文字を避ける
- キーボード操作を妨げない
- disabled状態を見た目だけでなく意味として分かるようにする

Decision、Demotion、ScoreBreakdownは、色、アイコン、数値だけに依存せず、日本語ラベルと説明で理解できるようにする。

## 23. Figma / Pencil / Figma Makeへ渡すときの注意

DESIGN-01は見た目のルールであり、画面生成Promptではない。Figma / Pencil / Figma Makeへ渡すPromptはDESIGN-02で作成する。

DESIGN-02以降で守ること:

- Figmaに渡すときは、ECサイト化させない
- 購入リンクを作らせない
- 価格や在庫を出させない
- AIチャット画面にしない
- 保存済み履歴を出させない
- HomeからResult Detailへ直接遷移させない
- Appleと書いてもApple UIをコピーしない
- B2Yと書いてもB2Yの画面をコピーしない
- Claude Code生成UIと書いても汎用SaaSテンプレートにしない
- 白基調、余白、カード、情報階層を重視する

Figma / Pencil / Figma Makeには、`Quiet Sneaker Decision UI` の定義を必ず渡す。

## 24. 実装禁止事項

DESIGN-01では、以下を行わない。

- UI実装をしない
- Reactコンポーネントを作らない
- Next.js実装をしない
- Tailwind設定をしない
- Figma画面を作らない
- Figma Makeに投げない
- v0に投げない
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

## 25. 完了条件

DESIGN-01の完了条件:

- 視覚デザインの方向性が明確になっている
- `Quiet Sneaker Decision UI` が定義されている
- B2Y / Apple / Claude Code生成UIの参考点とコピーしない点が明確になっている
- 色の方針が明確になっている
- 余白・角丸・カードの方針が明確になっている
- ボタン・フォーム・タグの見た目方針が明確になっている
- Decision / Demotion / ScoreBreakdownの見せ方が明確になっている
- スマホ優先の視覚ルールが明確になっている
- Figma / Pencil / Figma Makeに渡す前提の注意が明確になっている
- 実装やFigma生成をまだ行わないことが明記されている
- 次のDESIGN-02へ渡せる内容になっている

