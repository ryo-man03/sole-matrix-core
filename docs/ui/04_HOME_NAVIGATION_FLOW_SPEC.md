# SOLE//MATRIX UI-04: Home / Navigation Flow Spec

## 1. Home / Navigation Flowの目的

Home / Navigation Flowは、SOLE//MATRIXを開いたユーザーが最初にどの目的から入るかを選び、既存のUI設計で定義された画面へ迷わず進むための入口設計である。

UI-04の目的は、Home画面そのものと画面遷移の設計を固定することにある。Homeは推薦結果を作る場所ではなく、ユーザーの目的を以下の2つに分ける場所として扱う。

- 好みを診断する
- 気になる靴をチェックする

補助導線として「結果の見方」を用意するが、Result Detailへ直接遷移させる導線にはしない。Homeは商品検索、EC、AIチャット、履歴閲覧、価格確認の画面ではない。

## 2. 既存UI設計書との関係

UI-04は、既存のUI設計書をつなぐ上位の導線設計である。

| 設計書 | 役割 | Homeからの関係 |
| --- | --- | --- |
| `docs/ui/01_DIAGNOSIS_UI_SPEC.md` | Preference Diagnosis | 「好みを診断する」から遷移する |
| `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` | Candidate Sneaker Check | 「気になる靴をチェックする」から遷移する |
| `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md` | Result / Detail Display | 診断または候補チェック後の結果表示として合流する |

HomeはUI-01、UI-02、UI-03を内包しない。Homeで質問、候補入力、Core結果表示、Gemini説明表示を行わず、入口と導線だけを定義する。

## 3. Home画面の役割

Home画面の役割は、ユーザーの現在の目的を整理し、次に進む画面を選ばせることである。

Homeで行うこと:

- SOLE//MATRIXの入口としてブランド名を示す
- 主要CTAを2つに絞る
- ユーザーの目的に応じた遷移先を明確にする
- 結果表示の読み方へ進む補助導線を用意する
- このアプリで扱わない範囲を簡潔に示す

Homeで行わないこと:

- Coreのスコア計算
- 推薦結果の生成
- Result Detailへの直接遷移
- 商品一覧や購入リンクの表示
- 保存済み履歴があるような表示

## 4. Homeで表示する入口

Home初期表示では、以下の2つの主要CTAを主役にする。2つは同じ重要度で見えるようにし、どちらか一方だけが強く見えすぎないようにする。

### 4.1 好みを診断する

| 項目 | 内容 |
| --- | --- |
| CTA文言 | 好みを診断する |
| 説明文 | 8問でスニーカーの好みを整理します |
| 遷移先 | Preference Diagnosis |
| 関連設計書 | `docs/ui/01_DIAGNOSIS_UI_SPEC.md` |

この入口は、まだ好みが明確でないユーザー、またはおすすめ候補を複数見たいユーザーに向ける。

### 4.2 気になる靴をチェックする

| 項目 | 内容 |
| --- | --- |
| CTA文言 | 気になる靴をチェックする |
| 説明文 | スニーカー名・タグ・予算から購入判断の材料を作ります |
| 遷移先 | Candidate Sneaker Check |
| 関連設計書 | `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` |

この入口は、すでに検討中の1足があり、その靴が自分の好みや条件に合うか確認したいユーザーに向ける。

### 4.3 結果の見方

| 項目 | 内容 |
| --- | --- |
| 導線文言 | 結果の見方 |
| 目的 | finalDecision、finalScore、Demotionの意味を簡単に説明する |
| 関連設計書 | `docs/ui/03_RESULT_DETAIL_DISPLAY_SPEC.md` |

「結果の見方」は補助導線として扱う。Result Detailへ直接遷移させず、結果表示の読み方を説明する画面またはセクションへ遷移する。

## 5. Homeで表示しないもの

Homeでは以下を表示しない。

- スニーカー一覧
- 実在価格
- 在庫
- プレ値予測
- 真贋判定
- 購入リンク
- 外部サイト価格
- AI自由推薦
- Gemini説明全文
- ログイン必須の導線
- DB保存済みのように見える履歴
- Result Detailへの直接リンク
- 保存済み一覧
- マイページ
- ECサイト的な商品カード
- ランキング
- セール情報
- クーポン情報

また、Home初期表示では以下を主導線にしない。

- 前回の結果を見る
- 最初からやり直す
- Result Detailへ直接移動する
- ログイン
- 保存履歴
- AIチャット
- 商品検索
- 購入リンク

DB未実装のため、「前回の結果を見る」は主導線にしない。永続保存された履歴があるように見せてはいけない。一時保存や履歴機能はCore v1.0以降の別設計で扱う。

## 6. ユーザー目的別の導線

### 6.1 まだ好みが決まっていないユーザー

```txt
Home
└─ 好みを診断する
   └─ Preference Diagnosis
      └─ PreferenceProfile Initial Build
         └─ Result List
            └─ Result Detail
```

この導線では、UI-01で好みを整理し、複数候補の結果一覧へ進む。Result DetailはResult List上の候補を選んだ後に表示する。

### 6.2 買うか迷っている靴があるユーザー

```txt
Home
└─ 気になる靴をチェックする
   └─ Candidate Sneaker Check
      └─ Result Detail
```

この導線では、UI-02で1足の候補情報を入力し、単一候補の結果としてResult Detailへ進む。

### 6.3 結果の意味を確認したいユーザー

```txt
Home
└─ 結果の見方
   └─ Result / Detail Displayの説明
      └─ Homeへ戻る
```

この導線は、実際の推薦結果ではなく、結果表示の読み方を確認するための補助導線である。

### 6.4 やり直したいユーザー

Home初期表示から直接「最初からやり直す」へ進めない。やり直し導線は、Preference Diagnosis中、Candidate Sneaker Check中、Result画面など、やり直す対象が明確な文脈でのみ表示する。

入力が消える場合は確認を出す。DB未実装のため、保存や履歴が残るような表現は避ける。

## 7. 画面遷移図

```txt
Home
├─ Preference Diagnosis
│  ├─ Question Flow
│  ├─ PreferenceProfile Initial Build
│  └─ Result List
│     └─ Result Detail
│
├─ Candidate Sneaker Check
│  ├─ Step 1 Basic Info
│  ├─ Step 2 Feature Tags
│  ├─ Step 3 Confirm
│  └─ Result Detail
│
└─ Result Guide
   └─ Result / Detail Display Explanation
```

HomeからResult Detailへ直接遷移させない。Result Detailは、Preference DiagnosisまたはCandidate Sneaker Checkの結果がある前提の画面である。

## 8. Navigation構造

### 8.1 Header

Headerは最小限にする。

- `SOLE//MATRIX`
- Homeへ戻る

初期段階ではグローバルナビを増やさない。ログイン、マイページ、保存済み一覧は現段階では出さない。スマホではブランド名とHome導線が分かる程度の簡潔なHeaderにする。

### 8.2 Main

Mainには以下を配置する。

- 主要CTAカード2つ
- 補助導線「結果の見方」

Homeは白基調、カード型、余白多めの落ち着いたUIを想定する。CTAは2つまでを主役にし、内部名をそのままユーザーに見せすぎない。

### 8.3 Footer

Footerには以下を簡潔に表示する。

- このアプリで扱わないこと
- 価格・在庫・真贋は扱わない注意

Footerは購入や検索へ誘導する場所ではない。

## 9. 初回ユーザー導線

初回ユーザーには、2つの主要CTAを同じ重要度で提示する。

- 好みがまだ決まっていない場合: 「好みを診断する」
- 気になる靴がすでにある場合: 「気になる靴をチェックする」

初回アクセス時に履歴がない場合、「前回の結果を見る」は表示しない。DB未実装のため、保存済み結果やアカウント機能を前提にした表現は使わない。

## 10. 2回目以降ユーザー導線

Core v0.5時点では、2回目以降のユーザーにもHome初期表示の主導線は変えない。

- 「好みを診断する」
- 「気になる靴をチェックする」
- 補助導線「結果の見方」

「前回の結果を見る」は主導線にしない。将来、一時保存、session、local storage、DB保存を扱う場合は、Core v1.0以降の別設計で扱う。

2回目以降であっても、永続保存された履歴が存在するように見せない。

## 11. Result List / Result Detailへの合流方針

Preference Diagnosis後は複数候補が出るためResult Listへ進む。Candidate Sneaker Check後は単一候補のためResult Detailへ進む。

どちらも最終的にはResult / Detail Display設計に従う。

- Preference Diagnosis後: `Result List -> Result Detail`
- Candidate Sneaker Check後: `Result Detail`

Result画面ではCore出力を表示するだけにする。Result画面でHomeの導線を再表示しすぎない。

HomeからResult Detailへ直接行かせない。Result Detailへ行くには、必ず診断結果または候補チェック結果がある前提にする。

## 12. 戻る・やり直す導線

戻る導線:

- Preference Diagnosis中は前の質問へ戻れる
- Candidate Sneaker Check中は前のステップへ戻れる
- Result画面からHomeへ戻れる
- Result画面から同じ入力を修正する導線を用意する

やり直す導線:

- Home初期表示では「最初からやり直す」を主導線にしない
- Preference Diagnosis中、Candidate Sneaker Check中、Result画面など文脈がある場合のみ表示する
- 入力が消える場合は確認を表示する
- DB未実装のため、保存されるような表現は避ける

確認文の例:

```txt
入力内容が消えます。最初からやり直しますか？
```

## 13. エラー・空状態

エラー文は短く、次に進む行動を明確にする。

| 状態 | 方針 |
| --- | --- |
| 初回アクセスで履歴がない | 「前回の結果を見る」を表示しない |
| 途中入力がない | Homeから再開ではなく最初から開始にする |
| Resultがない | Preference DiagnosisまたはCandidate Sneaker Checkへ誘導する |
| Result Detailに必要な結果データがない | Homeへ戻すだけでなく、目的に応じた入力画面へ誘導する |
| 将来機能の履歴が未実装 | 永続保存があるように見せない |

表示文例:

- `結果がまだありません。好みを診断するか、気になる靴をチェックしてください。`
- `この結果を表示するための情報が足りません。もう一度入力内容を確認してください。`
- `保存済み履歴は現在未対応です。`

## 14. スマホ表示方針

スマホでは、主要CTAの見つけやすさと押しやすさを優先する。

- HomeのCTAカードは縦積みにする
- 主要CTAは画面上部に配置する
- 補助導線は下部にまとめる
- Headerは最小限にする
- CTAボタンは押しやすい高さにする
- 情報を詰め込みすぎない
- 2つの主要CTAが同じ重要度で見えるようにする
- 「結果の見方」は主要CTAより弱く表示する

スマホでもHomeは商品一覧のように見せない。カードは入口を示すために使い、ECサイト的な商品カードにはしない。

## 15. アクセシビリティ方針

- CTAは色だけで区別しない
- CTAカード全体を押せる設計にする場合も、ボタン文言を明確にする
- キーボード操作で主要CTAに移動できる設計にする
- 現在の画面位置が分かる見出しを用意する
- アイコンだけに頼らず、テキストラベルを併記する
- ボタンやカードはスマホでも押しやすいサイズにする
- 主要CTAの目的がスクリーンリーダーでも分かる文言にする

推奨する見出し例:

```txt
何から始めますか？
```

CTAのラベルは、内部名ではなくユーザーの目的が分かる日本語にする。

## 16. Coreとの境界

### 16.1 UIが行ってよいこと

- 画面入口を整理する
- 画面遷移を定義する
- ユーザー目的別の導線を定義する
- Coreへ渡す前の画面構成を整理する
- Core出力画面への合流方針を整理する
- Home上の文言とCTAの優先順位を設計する

### 16.2 UIが行ってはいけないこと

- HomeでfinalScoreを計算する
- HomeでDecisionを作る
- HomeでDemotionを作る
- HomeでGemini説明を生成する
- Homeで市場価格を取得する
- Homeで在庫や真贋を表示する
- Homeで購入リンクを表示する
- Homeで保存済み履歴があるように見せる
- HomeからResult Detailへ直接遷移させる
- Homeを商品検索ページにする
- HomeをECページにする
- HomeをAIチャット画面にする

## 17. 実装禁止事項

UI-04では以下を実装しない。

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
- `src/**`を変更しない
- `package.json`を変更しない
- `pnpm-lock.yaml`を変更しない
- `README.md`を変更しない
- `.github/**`を変更しない
- 既存fixture、既存test、既存Coreロジックを変更しない

## 18. 完了条件

- [ ] Home / Navigation Flowの目的が定義されている
- [ ] 既存UI設計書との関係が明記されている
- [ ] Home画面の役割が明記されている
- [ ] Homeで表示する入口が定義されている
- [ ] Homeで表示しないものが明記されている
- [ ] ユーザー目的別の導線が定義されている
- [ ] 画面遷移図が含まれている
- [ ] Navigation構造が定義されている
- [ ] 初回ユーザー導線が定義されている
- [ ] 2回目以降ユーザー導線が定義されている
- [ ] Result List / Result Detailへの合流方針が明記されている
- [ ] HomeからResult Detailへ直接遷移させない方針が明記されている
- [ ] 戻る・やり直す導線が文脈付きで定義されている
- [ ] エラー・空状態が定義されている
- [ ] スマホ表示方針が定義されている
- [ ] アクセシビリティ方針が定義されている
- [ ] Coreとの境界が明記されている
- [ ] 実装禁止事項が明記されている
- [ ] 変更範囲がdocs配下の新規設計書に限定されている
