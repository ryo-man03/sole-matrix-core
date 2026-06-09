# UI Prompt 03: Result / Detail Display Design

あなたは、TypeScript個人開発プロジェクトのプロダクト設計者兼UI設計者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core推薦ロジックは実装済み
* 公開API `recommendSneakers(input)` は実装済み
* サンプルデータは実装済み
* CLI demoは実装済み
* Preference Diagnosis UI設計書は `docs/ui/01_DIAGNOSIS_UI_SPEC.md` に追加済み
* Candidate Sneaker Check UI設計書は `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` に追加済み
* 現時点ではWeb UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

今回の目的:

`Result / Detail Display` のUI設計書を作成してください。

これは、Coreが返した `finalScore`、`rawDecision`、`finalDecision`、`demotions`、`scoreBreakdown`、説明文、理由、注意点を、ユーザーが誤解しない形で表示するための画面設計です。

今回は実装しません。
今回は設計書だけを追加してください。

重要:

UI-03では、Coreが出した結果を表示する設計だけを行います。
UIが `finalScore`、`Decision`、`Demotion` を作ったり、変更したりしてはいけません。

Gemini説明機能が存在する場合でも、UI-03では補助説明として扱ってください。
Gemini説明は `finalScore`、`Decision`、`Demotion` を変更しません。
Gemini説明がない場合は、rule-based説明、または短いfallback文を表示する前提にしてください。

Gemini説明を「AIが購入判断した結果」のように表示してはいけません。

作成してよいファイル:

* `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md`
* `docs/agent-prompts/ui/03-result-detail-display-design.md`

編集してはいけないファイル:

* `src/**`
* `package.json`
* `pnpm-lock.yaml`
* `README.md`
* `.github/**`
* 既存fixture
* 既存test
* 既存Coreロジック

`docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md` に含める内容:

1. Result / Detail Displayの目的
2. Preference Diagnosis / Candidate Sneaker Checkとの関係
3. 画面一覧
4. 結果一覧画面の表示方針
5. 推薦カードの表示項目
6. 詳細画面の表示方針
7. finalScoreの表示ルール
8. rawDecision / finalDecisionの表示ルール
9. Demotionの表示ルール
10. scoreBreakdownの表示ルール
11. reasons / cautionsの表示ルール
12. rule-based説明文の表示ルール
13. Gemini説明とfallback providerの表示ルール
14. Snapshot情報の表示ルール
15. エラー・空状態
16. スマホ表示方針
17. アクセシビリティ方針
18. Coreとの境界
19. 実装禁止事項
20. 完了条件

設計方針:

* ユーザーに最初に見せるのは `finalDecision`
* 次に `finalScore`
* Demotionがある場合は必ず目立つ位置に表示する
* `rawDecision` は補助情報として扱う
* `rawDecision` と `finalDecision` が異なる場合だけ、差分説明を表示する
* `scoreBreakdown` は詳細画面で表示する
* 一覧画面ではscoreBreakdownを全部出さず、要約に留める
* 理由と注意点を分けて表示する
* BUY / STRONG_BUYでも購入を煽らない
* WAIT / WATCH / SKIPでも否定的に見せすぎない
* Gemini説明はCore判定の補助説明として表示する
* Gemini説明がない場合はrule-based説明または短いfallback文を表示する
* providerを表示して、どの説明ソースか分かるようにする
* AIが判定したように見せない

優先表示順:

1. finalDecision
2. finalScore
3. demotions
4. reasons
5. cautions
6. scoreBreakdown
7. rawDecisionとの差分
8. explanation provider
9. snapshot summary

画面一覧:

* Result List
  * 複数候補の推薦結果一覧
* Result Detail
  * 1候補の詳細結果
* Score Breakdown Panel
  * 各スコア軸の詳細
* Demotion Explanation Panel
  * 判定が下がった理由の説明
* Explanation Panel
  * rule-based / Gemini説明の表示
* Snapshot Summary
  * 入力条件と結果の要約

結果一覧画面の表示項目:

* 順位
* スニーカー名
* finalDecision
* finalScore
* 短い理由
* 注意点の有無
* Demotionの有無
* 詳細を見るボタン

一覧画面で表示しないもの:

* scoreBreakdownの全項目
* rawDecision
* Snapshot全体
* Gemini説明全文
* 実在価格
* 在庫
* プレ値予測
* 真贋判定
* 購入リンク

推薦カードの表示方針:

* finalDecisionを最も目立たせる
* finalScoreは補助的に表示する
* Demotionがある場合は注意ラベルを出す
* 理由は1文に絞る
* 注意点は1文に絞る
* 詳細を見る導線を用意する
* BUYでも「今すぐ買う」とは書かない
* SKIPでも「ダメな靴」とは書かない

Decision表示ルール:

| Decision | UIラベル | 表示方針 |
| --- | --- | --- |
| STRONG_BUY | 強く候補 | 強調するが購入を煽らない |
| BUY | 買う候補 | 前向きな候補として表示 |
| WAIT | 一旦待つ | 待つ理由を必ず表示 |
| WATCH | 気になる候補 | 発見枠として表示 |
| SKIP | 今回は見送り | 否定しすぎず表示 |

rawDecision / finalDecisionの扱い:

* 通常はfinalDecisionを主表示にする
* rawDecisionは詳細画面で補助表示にする
* rawDecisionとfinalDecisionが異なる場合は、「判定調整あり」と表示する
* 判定調整の理由はDemotionと紐づけて説明する
* rawDecisionをfinalDecisionより目立たせない

Demotion表示ルール:

* Demotionがある場合は必ず表示する
* Demotionを隠さない
* Demotionはユーザーに分かる日本語に変換する
* 複数ある場合はリスト表示する
* finalDecisionが下がった場合は、どのDemotionが影響したか分かるようにする

Demotion表示文言例:

| Demotion | UI文言 |
| --- | --- |
| HIGH_CLOSET_OVERLAP | 所有靴と役割が近いため、判定を慎重にしています |
| LOW_PRICE_FIT | 予算との相性が低いため、購入判断を慎重にしています |
| LOW_COMFORT | 履きやすさに不安があるため、購入判断を慎重にしています |
| LOW_DURABILITY | 耐久性に不安があるため、長期使用には注意が必要です |

scoreBreakdown表示ルール:

表示項目:

* cultureScore
* styleScore
* simplicityScore
* streetScore
* volumeScore
* comfortScore
* durabilityScore
* priceScore
* overlapPenalty

UI表示名:

| Coreキー | UI表示名 |
| --- | --- |
| cultureScore | 文化・背景 |
| styleScore | 合わせやすさ |
| simplicityScore | シンプルさ |
| streetScore | ストリート感 |
| volumeScore | ボリューム感 |
| comfortScore | 履きやすさ |
| durabilityScore | 耐久性 |
| priceScore | 価格との相性 |
| overlapPenalty | 所有靴との被り |

表示方針:

* 詳細画面でのみ表示する
* 一覧画面では要約のみ表示する
* 棒グラフまたは表で表示する想定にする
* overlapPenaltyは「高いほど注意」と分かるように表現する
* 各スコアは購入命令ではなく判断材料として表示する
* スコアが低い項目も否定的に見せすぎない
* UIはScoreBreakdownのプロパティ名を変更しない
* UI表示名として日本語ラベルへ変換してよいが、Core出力のキー名はCore定義に従う

reasons / cautions表示ルール:

* reasonsは「合っている理由」
* cautionsは「注意すべき理由」
* reasonsとcautionsは同じ枠に混ぜない
* reasonsは最大3件まで
* cautionsは最大3件まで
* Demotionがある場合はcautionsに必ず反映する
* 理由文は短く、ユーザーが理解しやすい日本語にする

rule-based説明文表示ルール:

* rule-based説明は安定した基本説明として扱う
* Gemini説明がない場合のfallbackとして表示できる
* providerに `rule-based` と表示する
* rule-based説明も判定を変更しない

Gemini説明とprovider表示ルール:

* Gemini説明は補助説明として表示する
* Gemini説明がある場合でもfinalDecisionはCore由来であることを明記する
* providerに `gemini` または `rule-based` を表示する
* Gemini失敗時はrule-based説明へfallbackする前提を明記する
* Gemini説明が空の場合でも画面が壊れないようにする
* Gemini説明を購入判断の主体として見せない
* 「AIが買うべきと判断しました」と書かない
* 「AIが説明文を補助生成しています」程度に留める

表示文言例:

* 判定はCoreロジックに基づいています
* 説明文は補助的に生成されています
* AI説明は購入判断そのものではありません
* 価格・在庫・真贋・プレ値は判定対象外です

Snapshot情報の表示ルール:

表示する項目:

* snapshotVersion
* createdAt
* profile summary
* candidate summary
* ownedSneakers count
* preferredTags
* finalScore
* finalDecision
* demotions count

表示方針:

* 詳細画面の下部に折りたたみで表示する
* 開発・検証用の情報として扱う
* 一般ユーザー向けには簡潔にする
* JSONそのものを直接見せない
* Snapshotは再現性のための情報であり、購入保証ではない

エラー・空状態:

* 結果が0件の場合は、入力条件を見直す導線を表示する
* Core出力が不足している場合は、どの情報が不足しているか表示する
* Gemini説明が取得できない場合でも画面全体は表示する
* 説明文がない場合はrule-based説明または短いfallback文を表示する
* scoreBreakdownがない場合は詳細スコア欄を非表示にするのではなく、取得できない旨を表示する
* エラー文は短く、次に何をすればよいか分かる表現にする

スマホ表示方針:

* 一覧カードは縦積みにする
* finalDecisionとfinalScoreを上部に表示する
* Demotion注意はカード上部に出す
* scoreBreakdownは折りたたみにする
* reasons / cautionsはカード内で読みやすく分ける
* Snapshot情報は最下部の折りたたみにする
* 詳細画面の主要ボタンは押しやすい高さにする

アクセシビリティ方針:

* Decisionラベルは色だけで区別しない
* Demotion注意はアイコンだけに頼らない
* スコアバーは数値ラベルも併記する
* 折りたたみパネルは開閉状態が分かる文言にする
* キーボード操作で詳細表示や折りたたみを操作できる設計にする
* エラー文は対象項目の近くに表示する
* ボタンや展開操作はスマホでも押しやすいサイズにする

Coreとの境界:

UIが行ってよいこと:

* Core出力を表示する
* finalDecisionを日本語ラベルに変換する
* Demotionを日本語文言に変換する
* reasons / cautionsを表示する
* providerを表示する
* Snapshot要約を表示する
* ScoreBreakdownを視覚化するための設計を行う

UIが行ってはいけないこと:

* finalScoreを再計算する
* rawDecisionを変更する
* finalDecisionを変更する
* Demotionを隠す
* Gemini説明を理由に判定を変える
* AI説明を購入判断の主体として表示する
* ScoreBreakdownのプロパティ名を変更する
* 実在価格を表示する
* 在庫を表示する
* プレ値予測を表示する
* 真贋判定を表示する
* 購入リンクを表示する
* 外部サイト価格を表示する

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

`docs/agent-prompts/ui/03-result-detail-display-design.md` には、このPromptの内容を保存してください。

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
docs: add result detail display UI design spec
```

完了後に報告すること:

* 追加したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、Core出力をユーザーが誤解しない形で表示するResult / Detail画面を設計することです。
実装はまだ行わず、docsだけで設計を固定してください。
