# SOLE//MATRIX UI-06: Web UI Implementation Boundary Spec

## 1. Web UI Implementation Boundaryの目的

Web UI Implementation Boundaryは、SOLE//MATRIXのWeb UI実装に入る前に、後続のWeb UI実装Promptで実装してよい範囲と、実装してはいけない範囲を固定するための境界仕様である。

UI-06は実装Promptではない。Reactコンポーネント、Next.jsアプリ、Tailwind設定、DB、API Route、外部API連携は作らない。

この設計書で固定すること:

- 後続のWeb UI実装Promptで扱ってよい画面と表示範囲
- 後続のWeb UI実装Promptでも扱ってはいけない機能範囲
- Core API `recommendSneakers(input)` の扱い
- sample dataとmock dataの扱い
- DBなし、API Routeなしで成立する初期UI方針
- Gemini / AI説明を補助扱いに留める方針
- 価格、在庫、真贋、プレ値、購入リンクを禁止する方針
- package.json / pnpm-lock.yamlをUI-06では変更しないこと

この設計書で固定しないこと:

- Reactコンポーネント設計
- Next.js App Router / Pages Routerの選定
- Tailwind設定
- 状態管理ライブラリ
- UI実装コード
- DB設計
- API Route設計
- 認証設計
- 外部価格API連携
- Gemini API連携

## 2. 既存UI設計書との関係

UI-06は、UI-01からUI-05までで定義した画面、表示項目、画面遷移を、Web UI実装前の境界として固定する文書である。既存UI設計書を置き換えない。

| 設計書 | 対象 | UI-06での扱い |
| --- | --- | --- |
| `docs/ui/01_DIAGNOSIS_UI_SPEC.md` | Preference Diagnosis | 後続Promptで入力UIとして実装してよい範囲を固定する |
| `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` | Candidate Sneaker Check | 後続Promptで候補スニーカー入力UIとして実装してよい範囲を固定する |
| `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md` | Result / Detail Display | Core出力の表示境界と、AI説明の補助扱いを固定する |
| `docs/ui/04_HOME_NAVIGATION_FLOW_SPEC.md` | Home / Navigation Flow | Homeから始まる導線の実装境界を固定する |
| `docs/ui/05_WIREFLOW_LOW_FIDELITY_LAYOUT_SPEC.md` | Wireflow / Low-Fidelity Layout | 後続Promptで再現してよい画面遷移と低忠実度構成を固定する |

UI-06は、次のWEB-01実装計画Promptや、その後のWeb UI実装Promptへ渡すためのガードレールである。

## 3. 後続のWeb UI実装Promptで実装してよい範囲

以下は、後続のWeb UI実装Promptで実装してよい範囲である。これはUI-06で今回実装するという意味ではない。

- Home画面の静的UI
- Preference Diagnosisの入力UI
- Candidate Sneaker Checkの入力UI
- Result Listの表示UI
- Result Detailの表示UI
- Result Guideの補助表示
- UI-01からUI-05で定義した画面遷移
- sample dataを使ったmock表示
- `recommendSneakers(input)` を呼ぶ前提のUI構造
- Core出力を表示するUI構造
- 画面内またはセッション中の一時状態
- DBなしで成立する最小UI

後続Promptでは、UIがCore APIの入力を組み立て、Coreが返した結果を表示する構造までを扱ってよい。ただし、Coreロジック、スコア式、Decision生成、Demotion生成は変更しない。

## 4. 後続のWeb UI実装Promptでも実装してはいけない範囲

以下は、後続のWeb UI実装Promptでも実装してはいけない。

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

## 5. 使用してよいCore API

後続のWeb UI実装Promptで使用してよいCore APIは、以下のみである。

```ts
recommendSneakers(input)
```

UI側で行ってはいけないこと:

- UI側でfinalScoreを再計算する
- UI側でrawDecisionを変更する
- UI側でfinalDecisionを変更する
- UI側でDemotionを隠す
- UI都合でCoreの型やスコア式を変更する
- ScoreBreakdownのキー名を変更する
- AI説明を理由にCore出力を変更する

UIはCore出力を表示する責務に留める。表示名の日本語変換や、説明文の補助表示は許容するが、Core出力そのものは改変しない。

## 6. 使用してよいデータ

後続のWeb UI実装Promptで使用してよいデータは、以下に限定する。

- 既存のsampleSneakers
- 既存のsampleProfiles
- 既存のsampleOwnedSneakers
- UI入力から作る一時的なPreferenceProfile
- UI入力から作る一時的なSneakerCandidate
- Coreが返したRecommendation結果
- rule-based説明または固定サンプル説明

外部API、スクレイピング、実在販売サイト、価格DB、在庫DBから取得したデータは扱わない。

## 7. mock dataの扱い

mock dataはUI確認用として扱う。

- 実在価格として表示しない
- 実在在庫として表示しない
- 実在販売情報として表示しない
- sample dataであることが分かるようにする
- mock dataを外部APIの代わりに見せない
- mock dataを市場情報のように見せない
- mock dataから購入リンクを作らない

mock dataは、入力、画面遷移、結果表示、空状態の確認に使うためのものであり、市場情報や販売情報ではない。

## 8. DBなしの状態管理方針

Core v0.5時点では永続保存しない。

- 入力内容は画面内またはセッション中の一時状態として扱う
- ページ更新後に保存されることを保証しない
- 「保存済み」「履歴」「前回の結果」といった永続保存に見える表現を避ける
- localStorageやsessionStorageを使う場合も、別Promptで明示的に設計する
- UI-06では具体実装しない
- 状態管理ライブラリを追加しない
- 既存依存関係を増やさない

複数画面で状態を共有する場合は、共通の親、画面フロー上の一時状態、または後続Promptで明示された最小構成で扱う。

## 9. API Routeを作らない方針

Web UI初期実装ではAPI Routeを作らない。

- Coreロジックはフロント側から直接呼ぶ前提にする
- サーバー処理や外部API連携はCore v1.0以降で扱う
- Geminiや外部価格APIの呼び出し口を作らない
- APIキーやSecretsを要求しない
- `.env` を追加しない
- CoreをClient Componentから直接importできるかは、WEB-02以降で確認する
- CoreがNode専用API、環境変数、外部API、サーバー専用処理に依存している場合は、直接Client Componentからimportしない
- その場合は作業を止め、別PromptでAdapter方針を設計する

Next.js導入が必要な場合でも、API Routeは初期Web UI実装の対象外とする。

## 10. Gemini / AI説明の扱い

Gemini説明はUI-03で表示方針だけ定義済みである。

- v0.5初期実装ではGemini APIを呼ばない
- Gemini説明パネルを実装するかどうかは、後続Promptで明示された場合のみ扱う
- 初期実装ではrule-based説明または固定サンプル説明を優先する
- Gemini説明が存在する場合でも補助説明として扱う
- Gemini説明はfinalScore / Decision / Demotionを変更しない
- AIが購入判断をしたように見せない
- Gemini APIキーを要求しない
- `.env` やSecretsを追加しない
- Gemini説明をUIの主役にしない
- Gemini説明がなくてもResult Detail画面が成立するようにする

AI説明は、Core出力を読みやすくする補助文であり、判定ロジックではない。

## 11. 価格・在庫・真贋・プレ値・購入リンクの禁止

後続のWeb UI実装Promptでは、以下を禁止する。

- 実在価格を表示しない
- 現在価格と書かない
- 相場価格と書かない
- 最安値と書かない
- 在庫あり / 在庫なしと書かない
- プレ値予測を表示しない
- 真贋判定を表示しない
- 購入リンクを表示しない
- 外部販売サイトへ誘導しない
- セール情報を表示しない
- クーポン情報を表示しない
- ECサイト的な商品カードを作らない

SOLE//MATRIXの初期Web UIは、購入場所を探すためのEC UIではなく、好みと候補情報をもとにCore推薦結果を整理するUIである。

## 12. 画面ごとの実装境界

### Home

後続Promptで実装してよい:

- 2つの主要CTA
- 結果の見方
- アプリで扱わないことの注意

後続Promptでも実装してはいけない:

- 保存済み履歴
- 商品一覧
- 購入リンク
- AIチャット
- Result Detailへの直接リンク
- ログイン必須導線
- マイページ

### Preference Diagnosis

後続Promptで実装してよい:

- 8問の入力
- 好き / 普通 / 苦手
- 回答保持
- PreferenceProfile初期値の生成前提

後続Promptでも実装してはいけない:

- 診断だけでBUY / WAIT / SKIPを確定
- AIによる判定
- 価格や在庫の表示
- Gemini API呼び出し

### Candidate Sneaker Check

後続Promptで実装してよい:

- スニーカー名
- ブランド
- 入力金額
- 予算
- タグ選択
- 確認画面

後続Promptでも実装してはいけない:

- 外部価格取得
- 在庫取得
- AIタグ推定
- 購入リンク
- 真贋判定
- スクレイピング

### Result List

後続Promptで実装してよい:

- finalDecision
- finalScore
- 短い理由
- 注意ラベル
- 詳細を見る

後続Promptでも実装してはいけない:

- rawDecisionの強調表示
- Gemini説明全文
- 実在価格
- 在庫
- 購入リンク
- 外部販売サイト誘導

### Result Detail

後続Promptで実装してよい:

- finalDecision
- finalScore
- demotions
- scoreBreakdown
- reasons
- cautions
- provider表示
- snapshot summary

後続Promptでも実装してはいけない:

- finalScore再計算
- Decision変更
- Demotion非表示
- AIによる購入判断表示
- 価格・在庫・真贋・購入リンク表示
- Gemini API呼び出し

### Result Guide

後続Promptで実装してよい:

- finalDecisionの説明
- finalScoreの説明
- Demotionの説明
- ScoreBreakdownの説明
- このアプリで扱わないことの説明

後続Promptでも実装してはいけない:

- Result Detailへの直接遷移
- 技術用語だらけの説明
- AI判断の強調
- 購入誘導

## 13. Client state / temporary stateの扱い

後続のWeb UI実装Promptでは、状態を一時状態として扱う。

- Preference Diagnosisの回答は一時状態として保持する
- Candidate Sneaker Checkの入力は一時状態として保持する
- Result dataはCore出力として一時的に保持する
- DB保存があるように見せない
- 永続化は実装しない
- 状態管理ライブラリを追加しない
- 既存依存関係を増やさない
- 複数画面で状態を共有する場合は、共通の親または画面フロー上の一時状態として扱う
- localStorage / sessionStorageを使う場合は別Promptで明示的に扱う

## 14. Result dataの扱い

Result dataはCore出力として扱う。

- UI側で改変しない
- 表示名の日本語変換はしてよい
- Coreキー名は変更しない
- scoreBreakdownのキー名はCore定義に従う
- Demotionは必ず表示する
- rawDecisionとfinalDecisionの差分は詳細画面で補助表示する
- finalDecisionを主表示にする
- rawDecisionを主表示にしない

Result dataの主役は、Coreが返したfinalDecisionとfinalScoreである。UIはそれを読みやすく配置するが、意味を変えない。

## 15. package.json / pnpm-lock.yamlの扱い

- UI-06ではpackage.jsonとpnpm-lock.yamlを変更しない
- UI-06では依存関係やscriptsを追加しない
- 後続のWeb UI実装PromptでNext.js導入が必要な場合は、別Promptで明示的に扱う
- Next.js導入、React設定、Tailwind設定、scripts追加はWEB系Promptで扱う
- このUI-06では依存関係の追加可否を決めるだけに留める
- UI-06の変更範囲はdocsのみとする

Next.js導入が必要な場合は、WEB-02以降の別Promptで明示的に扱う。UI-06では、後続Promptに渡す禁止事項として記録するだけにする。

## 16. エラー・空状態の扱い

後続のWeb UI実装Promptでは、エラーと空状態を最小限かつ明確に扱う。

- 入力不足時は次へ進めない
- Core出力がない場合は、目的に応じた入力画面へ戻す
- Result Detailに必要なデータがない場合は、HomeではなくPreference DiagnosisまたはCandidate Sneaker Checkへ誘導する
- Gemini説明がない場合でも画面全体を壊さない
- Snapshotがない場合は取得できない旨を表示する
- 価格・購入リンク・外部サイトへ誘導しない
- エラー文は短く、次に何をすればよいか分かる表現にする

## 17. アクセシビリティ最低条件

後続のWeb UI実装Promptでは、少なくとも以下を満たす。

- 主要ボタンは押しやすいサイズにする
- 選択状態は色だけで区別しない
- Decisionはラベルで表示する
- Demotionはアイコンだけで表示しない
- スコアバーには数値を併記する
- キーボード操作を妨げない
- エラー文は対象入力の近くに表示する
- CTAやフォーム操作はスマホでも押しやすくする

## 18. 実装Promptへ渡すときの禁止事項

後続のWeb UI実装Promptへは、以下の禁止事項を必ず渡す。

- DBを追加しない
- API Routeを追加しない
- 外部APIを追加しない
- Gemini APIを呼ばない
- OpenAI APIを呼ばない
- package.jsonに依存関係を追加しない
- pnpm-lock.yamlを変更しない
- README.mdを変更しない
- Coreロジックを変更しない
- テストfixtureを変更しない
- GitHub Actionsを変更しない
- 価格・在庫・真贋・購入リンクを出さない
- AIにスコアやDecisionを作らせない
- 保存済み履歴を作らない

## 19. 実装禁止事項

UI-06では以下を行わない。

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

## 20. 完了条件

UI-06の完了条件は以下である。

- Web UI実装前の境界が明確になっている
- 後続のWeb UI実装Promptで実装してよい範囲が明確になっている
- 後続のWeb UI実装Promptでも実装してはいけない範囲が明確になっている
- Core APIの扱いが明確になっている
- mock dataの扱いが明確になっている
- DBなしの状態管理方針が明確になっている
- Gemini / AI説明の扱いが補助扱いとして明確になっている
- 価格・在庫・真贋・購入リンクを禁止している
- package.json / pnpm-lock.yamlをUI-06では変更しないことが明確になっている
- Next.js導入は後続Promptで明示的に扱うことが明確になっている
- CoreをClient Componentから直接importしてよいかはWEB-02以降で確認する方針が明確になっている
- 次のWEB-01実装計画Promptへ渡せる内容になっている
