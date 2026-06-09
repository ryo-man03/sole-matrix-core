# SOLE//MATRIX UI-03: Result / Detail Display Spec

## 1. Result / Detail Displayの目的

Result / Detail Displayは、Coreが返した推薦結果を、ユーザーが誤解しない形で表示するための画面設計である。

表示対象は、`finalScore`、`rawDecision`、`finalDecision`、`demotions`、`scoreBreakdown`、説明文、理由、注意点である。UIはこれらを作成、再計算、変更しない。UIの責務は、Core出力と説明providerを整理し、購入命令ではなく判断材料として見せることである。

BUY / STRONG_BUYでも購入を煽らない。WAIT / WATCH / SKIPでも候補やユーザーの好みを否定しすぎない。価格、在庫、プレ値、真贋、購入リンクは扱わない。

## 2. Preference Diagnosis / Candidate Sneaker Checkとの関係

Preference Diagnosisは、ユーザーの好みを作る入口である。Candidate Sneaker Checkは、ユーザーが気になる1足を手入力してCoreへ渡す入口である。

Result / Detail Displayは、これらの入力体験の後に表示される結果表示レイヤーである。UI-03では入力フォームや診断質問は扱わない。Coreから返された推薦結果を一覧、詳細、内訳、説明、Snapshot要約として表示する方針だけを定義する。

Gemini説明機能が存在する場合でも、UI-03では補助説明として扱う。Gemini説明は`finalScore`、`rawDecision`、`finalDecision`、`demotions`を変更しない。Gemini説明を「AIが購入判断した結果」のように表示してはいけない。

## 3. 画面一覧

- Result List: 複数候補の推薦結果一覧
- Result Detail: 1候補の詳細結果
- Score Breakdown Panel: 各スコア軸の詳細
- Demotion Explanation Panel: 判定が下がった理由の説明
- Explanation Panel: rule-based / Gemini説明の表示
- Snapshot Summary: 入力条件と結果の要約

優先表示順:

1. `finalDecision`
2. `finalScore`
3. `demotions`
4. `reasons`
5. `cautions`
6. `scoreBreakdown`
7. `rawDecision`との差分
8. explanation provider
9. snapshot summary

## 4. 結果一覧画面の表示方針

Result Listは、複数候補から気になる詳細へ進むための一覧である。一覧ではCore結果の要点だけを表示し、詳細スコアや説明全文は出しすぎない。

表示項目:

- 順位
- スニーカー名
- `finalDecision`
- `finalScore`
- 短い理由
- 注意点の有無
- Demotionの有無
- 詳細を見るボタン

一覧画面で表示しないもの:

- `scoreBreakdown`の全項目
- `rawDecision`
- Snapshot全体
- Gemini説明全文
- 実在価格
- 在庫
- プレ値予測
- 真贋判定
- 購入リンク

## 5. 推薦カードの表示項目

推薦カードでは`finalDecision`を最も目立たせ、`finalScore`は補助的に表示する。

表示方針:

- `finalDecision`をカード上部に表示する。
- `finalScore`を`100点満点中の参考スコア`として表示する。
- Demotionがある場合は注意ラベルを出す。
- 理由は1文に絞る。
- 注意点は1文に絞る。
- 詳細を見る導線を用意する。
- BUYでも「今すぐ買う」とは書かない。
- SKIPでも「ダメな靴」とは書かない。

カード文言例:

- `買う候補`
- `一旦待つ`
- `注意点あり`
- `詳細を見る`

## 6. 詳細画面の表示方針

Result Detailは、1候補のCore結果を理解するための画面である。画面上部に`finalDecision`と`finalScore`を表示し、続けてDemotion、理由、注意点、scoreBreakdown、説明provider、Snapshot要約を表示する。

詳細画面で表示するもの:

- スニーカー名
- `finalDecision`
- `finalScore`
- `demotions`
- reasons
- cautions
- `scoreBreakdown`
- `rawDecision`と`finalDecision`の差分
- explanation provider
- Snapshot Summary

詳細画面でも表示しないもの:

- 実在価格
- 在庫
- プレ値予測
- 真贋判定
- 外部サイト価格
- 購入リンク
- AI自由推薦

## 7. finalScoreの表示ルール

- `finalScore`はCoreの`scoreBreakdown.finalScore`をそのまま表示する。
- UIは`finalScore`を再計算しない。
- 小数がある場合は、表示だけの丸めを行ってよい。ただし元値を変更したように扱わない。
- `finalScore`を購入命令として見せない。
- スコアの近くに`Coreロジックによる総合スコア`と分かる説明を置く。
- `finalScore`は`finalDecision`の次に表示する。

表示文言例:

- `総合スコア: 78.5 / 100`
- `Coreロジックに基づく参考スコアです。`

## 8. rawDecision / finalDecisionの表示ルール

通常は`finalDecision`を主表示にする。`rawDecision`は詳細画面で補助情報として扱う。

Decision表示ルール:

| Decision | UIラベル | 表示方針 |
| --- | --- | --- |
| `STRONG_BUY` | 強く候補 | 強調するが購入を煽らない |
| `BUY` | 買う候補 | 前向きな候補として表示 |
| `WAIT` | 一旦待つ | 待つ理由を必ず表示 |
| `WATCH` | 気になる候補 | 発見枠として表示 |
| `SKIP` | 今回は見送り | 否定しすぎず表示 |

rawDecision / finalDecisionの扱い:

- 通常は`finalDecision`を主表示にする。
- `rawDecision`は詳細画面で補助表示にする。
- `rawDecision`と`finalDecision`が異なる場合は、`判定調整あり`と表示する。
- 判定調整の理由はDemotionと紐づけて説明する。
- `rawDecision`を`finalDecision`より目立たせない。

表示文言例:

- `最終判定: 一旦待つ`
- `元の判定: 買う候補`
- `判定調整あり: 注意点を反映して最終判定が調整されています。`

## 9. Demotionの表示ルール

Demotionがある場合は必ず表示する。UIはDemotionを隠さず、ユーザーに分かる日本語へ変換して表示する。

表示ルール:

- Demotionがある場合は、一覧カードと詳細画面の両方で注意表示する。
- 複数ある場合はリスト表示する。
- `finalDecision`が下がった場合は、どのDemotionが影響したか分かるようにする。
- Demotionはcautionsにも反映する。
- Demotionがない場合は、`判定調整なし`のように必要最小限で表示する。

Demotion表示文言例:

| Demotion | UI文言 |
| --- | --- |
| `HIGH_CLOSET_OVERLAP` | 所有靴と役割が近いため、判定を慎重にしています |
| `LOW_PRICE_FIT` | 予算との相性が低いため、購入判断を慎重にしています |
| `LOW_COMFORT` | 履きやすさに不安があるため、購入判断を慎重にしています |
| `LOW_DURABILITY` | 耐久性に不安があるため、長期使用には注意が必要です |

## 10. scoreBreakdownの表示ルール

`scoreBreakdown`は詳細画面でのみ表示する。一覧画面では要約に留める。

主要表示項目:

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

現行Coreに存在する追加キー:

| Coreキー | UI表示名 |
| --- | --- |
| `tagBonus` | 好みタグ加点 |
| `featureFitScore` | 特徴の相性 |
| `nonOverlapScore` | 所有靴との被りにくさ |
| `finalScore` | 総合スコア |
| `axisWeightsApplied` | 適用された重み |

表示方針:

- 棒グラフまたは表で表示する想定にする。
- `overlapPenalty`は「高いほど注意」と分かるように表現する。
- `nonOverlapScore`は「高いほど被りにくい」と分かるように表現する。
- 各スコアは購入命令ではなく判断材料として表示する。
- スコアが低い項目も否定的に見せすぎない。
- UIは`ScoreBreakdown`のプロパティ名を変更しない。
- UI表示名として日本語ラベルへ変換してよいが、Core出力のキー名はCore定義に従う。
- `axisWeightsApplied`は一般ユーザーには折りたたみ内の補足として扱う。

## 11. reasons / cautionsの表示ルール

- reasonsは「合っている理由」として表示する。
- cautionsは「注意すべき理由」として表示する。
- reasonsとcautionsは同じ枠に混ぜない。
- reasonsは最大3件まで。
- cautionsは最大3件まで。
- Demotionがある場合はcautionsに必ず反映する。
- 理由文は短く、ユーザーが理解しやすい日本語にする。
- reasons / cautionsが空の場合も画面を壊さず、短いfallback文を表示する。

表示文言例:

- `合っている理由`
- `注意すべき理由`
- `この候補は一部の評価軸で相性が出ています。`
- `注意点があるため、購入前に条件を見直してください。`

## 12. rule-based説明文の表示ルール

rule-based説明は安定した基本説明として扱う。Gemini説明がない場合、Gemini取得に失敗した場合、Gemini説明が空または不適切な場合のfallbackとして表示できる。

表示ルール:

- providerに`rule-based`と表示する。
- rule-based説明も判定を変更しない。
- summary、reasons、cautionsを分けて表示する。
- rule-based説明はCore結果から生成された補助説明であり、購入保証ではないと分かるようにする。

表示文言例:

- `説明ソース: rule-based`
- `判定はCoreロジックに基づいています。`

## 13. Gemini説明とfallback providerの表示ルール

Gemini説明はCore判定の補助説明として表示する。Gemini説明がある場合でも、`finalDecision`はCore由来であることを明記する。

表示ルール:

- providerに`gemini`または`rule-based`を表示する。
- Gemini失敗時はrule-based説明へfallbackする前提にする。
- Gemini説明が空の場合でも画面が壊れないようにする。
- Gemini説明を購入判断の主体として見せない。
- `AIが買うべきと判断しました`と書かない。
- `AIが説明文を補助生成しています`程度に留める。
- Gemini説明がCore出力と矛盾する場合は表示しない、またはrule-basedへfallbackする前提にする。

表示文言例:

- `判定はCoreロジックに基づいています。`
- `説明文は補助的に生成されています。`
- `AI説明は購入判断そのものではありません。`
- `価格・在庫・真贋・プレ値は判定対象外です。`
- `説明ソース: gemini`
- `説明ソース: rule-based`

## 14. Snapshot情報の表示ルール

Snapshot Summaryは、再現性と検証のための情報として扱う。一般ユーザー向けには簡潔にし、JSONそのものを直接見せない。

表示する項目:

- `snapshotVersion`
- `createdAt`
- profile summary
- candidate summary
- ownedSneakers count
- preferredTags
- `finalScore`
- `finalDecision`
- demotions count

表示方針:

- 詳細画面の下部に折りたたみで表示する。
- 開発・検証用の情報として扱う。
- 一般ユーザー向けには簡潔にする。
- JSONそのものを直接見せない。
- Snapshotは再現性のための情報であり、購入保証ではない。

## 15. エラー・空状態

- 結果が0件の場合は、入力条件を見直す導線を表示する。
- Core出力が不足している場合は、どの情報が不足しているか表示する。
- Gemini説明が取得できない場合でも画面全体は表示する。
- 説明文がない場合はrule-based説明または短いfallback文を表示する。
- `scoreBreakdown`がない場合は詳細スコア欄を非表示にするのではなく、取得できない旨を表示する。
- エラー文は短く、次に何をすればよいか分かる表現にする。

表示文言例:

- `結果がありません。入力条件を見直してください。`
- `詳細スコアを取得できませんでした。`
- `説明文を取得できませんでした。Core判定のみ表示しています。`
- `必要な結果情報が不足しています。もう一度お試しください。`

## 16. スマホ表示方針

- 一覧カードは縦積みにする。
- `finalDecision`と`finalScore`を上部に表示する。
- Demotion注意はカード上部に出す。
- `scoreBreakdown`は折りたたみにする。
- reasons / cautionsはカード内で読みやすく分ける。
- Snapshot情報は最下部の折りたたみにする。
- 詳細画面の主要ボタンは押しやすい高さにする。
- 長い説明文は折り返し、横スクロール前提にしない。
- Score Breakdownの棒グラフは小画面でも数値が読めるようにする。

## 17. アクセシビリティ方針

- Decisionラベルは色だけで区別しない。
- Demotion注意はアイコンだけに頼らない。
- スコアバーは数値ラベルも併記する。
- 折りたたみパネルは開閉状態が分かる文言にする。
- キーボード操作で詳細表示や折りたたみを操作できる設計にする。
- エラー文は対象項目の近くに表示する。
- ボタンや展開操作はスマホでも押しやすいサイズにする。
- `finalDecision`、`finalScore`、注意点の順序がスクリーンリーダーでも自然に読まれるようにする。
- provider表示は小さな装飾だけにせず、テキストとして読めるようにする。

## 18. Coreとの境界

### UIが行ってよいこと

- Core出力を表示する。
- `finalDecision`を日本語ラベルに変換する。
- Demotionを日本語文言に変換する。
- reasons / cautionsを表示する。
- providerを表示する。
- Snapshot要約を表示する。
- `ScoreBreakdown`を視覚化するための設計を行う。
- 表示上の丸めやラベル変換を行う。

### UIが行ってはいけないこと

- `finalScore`を再計算する。
- `rawDecision`を変更する。
- `finalDecision`を変更する。
- Demotionを隠す。
- Gemini説明を理由に判定を変える。
- AI説明を購入判断の主体として表示する。
- `ScoreBreakdown`のプロパティ名を変更する。
- 実在価格を表示する。
- 在庫を表示する。
- プレ値予測を表示する。
- 真贋判定を表示する。
- 購入リンクを表示する。
- 外部サイト価格を表示する。

## 19. 実装禁止事項

UI-03では以下を実装しない。

- UI実装をしない。
- Reactコンポーネントを作らない。
- Next.js実装をしない。
- DBを作らない。
- API Routeを作らない。
- Gemini APIを呼ばない。
- OpenAI APIを入れない。
- 外部価格APIを入れない。
- スクレイピングを提案しない。
- 実在価格を表示しない。
- 在庫を表示しない。
- プレ値予測を表示しない。
- 真贋判定を表示しない。
- 購入リンクを表示しない。
- AIにスコアやDecisionを作らせない。
- Coreの`finalScore`やDecision仕様をUI都合で変更しない。
- `src/**`を変更しない。
- `package.json`を変更しない。
- `pnpm-lock.yaml`を変更しない。
- `README.md`を変更しない。
- `.github/**`を変更しない。
- 既存fixture、既存test、既存Coreロジックを変更しない。

## 20. 完了条件

- [ ] Result / Detail DisplayがCore出力の表示画面として定義されている。
- [ ] Preference Diagnosis / Candidate Sneaker Checkとの関係が明確である。
- [ ] Result List、Result Detail、Score Breakdown Panel、Demotion Explanation Panel、Explanation Panel、Snapshot Summaryが定義されている。
- [ ] 最初に`finalDecision`、次に`finalScore`を見せる方針になっている。
- [ ] Demotionがある場合に必ず目立つ位置へ表示する方針になっている。
- [ ] `rawDecision`は補助情報として扱われている。
- [ ] `rawDecision`と`finalDecision`が異なる場合だけ差分説明を表示する方針になっている。
- [ ] `scoreBreakdown`は詳細画面で表示し、一覧では要約に留める方針になっている。
- [ ] reasonsとcautionsを分けて表示する方針になっている。
- [ ] BUY / STRONG_BUYでも購入を煽らない方針になっている。
- [ ] WAIT / WATCH / SKIPでも否定的に見せすぎない方針になっている。
- [ ] rule-based説明の表示ルールが定義されている。
- [ ] Gemini説明は補助説明として扱われ、AIが判定したように見せない方針になっている。
- [ ] provider表示ルールが定義されている。
- [ ] Gemini説明がない場合のfallback方針が定義されている。
- [ ] Snapshot情報の表示ルールが定義されている。
- [ ] エラー・空状態、スマホ表示、アクセシビリティ方針が定義されている。
- [ ] Coreとの境界が明確になっている。
- [ ] 実装禁止事項が明記されている。
- [ ] 変更対象がdocs配下のみになっている。
