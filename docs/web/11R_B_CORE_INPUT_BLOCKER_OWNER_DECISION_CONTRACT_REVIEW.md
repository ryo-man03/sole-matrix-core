# WEB-11R-B: Core Input Blocker Owner Decision and Contract Review

## 1. Purpose

WEB-11R-Aでは、WEB-11QでUIが整ったこととProduction Core inputを作れることは別問題であり、次の4 blockerが未解決のためCore input実装へ戻れないと判断した。

```txt
preferenceProfile
sneakerId
candidateVector
budgetFit
```

WEB-11R-Bでは、既存文書で確認できる範囲に限定して、4 blockerのowner、source、validation、contractを整理する。

本工程はdocs-onlyである。新しい仕様や契約を作らず、決まっていることと決まっていないことを分離する。Core input assemblerを実装せず、dummy値、sample値、仮値で不足項目を補完しない。`recommendSneakers`へ直接接続せず、Result UIへ直接進まない。

## 2. Current State

確認した文書:

```txt
docs/web/10C_REMAINING_CORE_INPUT_FIELDS_READINESS_CHECK.md
docs/web/11A_CORE_INPUT_OWNER_DECISION_SHEET.md
docs/web/11Q_F_MOBILE_UI_ALIGNMENT_OVERALL_SUMMARY.md
docs/web/11R_A_CORE_INPUT_REENTRY_READINESS_REVIEW.md
```

現在のUI境界を確認するため、次のファイルも参照した。

```txt
app/_components/CandidateSneakerCheckFlow.tsx
app/_components/PrototypeReadinessPanel.tsx
```

確認結果:

- 4項目はすべてCore type上の必須項目であり、安全な省略経路は確認されていない。
- 現在のUIは候補名、ブランド、価格メモ、予算メモ、自由メモ、選択タグを保持する。
- 推薦準備チェックは入力あり／なし、選択あり／なしを表示するPrototype / UI Laneであり、Production値を生成しない。
- WEB-11QはUI境界を整理したが、4 blockerのsource、変換規則、validation、失敗時の扱いを確定していない。
- 現在のUI入力だけではProduction Core inputを完成させられない。
- Core型とruntime requirednessの追加調査は今回不要である。既存のWEB-10Cで確認済みであり、未解決なのはProduction sourceとvalidation contractである。

## 3. Decision Table

| Field | Current Status | Owner | Source | Validation | Contract | Resolved? | Required Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `preferenceProfile` | Blocking / Not resolved | Project owner / Core design owner。未回答処理はUI/UX ownerの判断も必要 | Production source: Not decided。現在は8問の診断回答があるが、完全なprofile sourceとして未承認 | Not decided。回答mapping、未回答、数値domain、完全性、metadata、invalid時の扱いが未定義 | Core必須shapeは確認済み。UI回答から完全な`PreferenceProfile`を作るcontractはNot decided | No | 全必須fieldのsource、mapping、validation、metadata policyを仕様化する |
| `sneakerId` | Blocking / Not resolved | Project owner。format、collision、実装境界にはimplementation ownerの判断も必要 | Production source: Not decided。候補名・ブランドは表示入力でありID sourceとして未承認 | Not decided。non-empty、uniqueness、stability、format、collision、失敗時の扱いが未定義 | 必須stringで結果へ伝播することは確認済み。Production identity contractはNot decided | No | identity sourceと適用範囲、validation、失敗時の扱いを仕様化する |
| `candidateVector` | Blocking / Not resolved | Project owner / Data sourcing owner / Core design owner | Production source: Not decided。タグ、候補名、メモは8次元数値sourceとして未承認 | Not decided。各次元のdomain、normalization、完全性、欠損・invalid時の扱いが未定義 | 8次元の必須shapeとruntime利用は確認済み。Production vector contractはNot decided | No | 全8次元のtrusted source、domain、normalization、validationを仕様化する |
| `budgetFit` | Blocking / Not resolved | Project owner / Core design owner | Production source: Not decided。価格メモ・予算メモは自由入力文字列であり数値sourceとして未承認 | Not decided。通貨、金額semantics、parse、計算式、domain、欠損・invalid時の扱いが未定義 | 必須numberで価格scoreに使われることは確認済み。Production value contractはNot decided | No | 値の意味、source、通貨、計算式、domain、validationを仕様化する |

4項目とも、現在のUIに関連する入力欄が存在することは、Production Core inputとして使用できることを意味しない。

## 4. `preferenceProfile` Review

### Current status

```txt
Blocking / Not resolved
```

`PreferenceProfile`の必須shapeと、scoringがprofile vector、policy、axis importanceを利用することは確認済みである。一方、現在の診断回答だけでは完全なProduction profileを生成できない。

### Owner

既存文書から確認できるownerは次のとおりである。

- Project owner: 診断回答の対応先、複数fieldへの影響、値の意味、metadata policyを決める。
- Core design owner: 数値domain、完全なcontract、validationを承認する。
- UI/UX owner: 未回答時のUI上の扱いに関する判断が必要である。

個人名または単一の最終承認者は既存文書から確認できないため、Not decidedである。

### Source

現在は8問の診断と`like`、`neutral`、`dislike`の回答が存在する。ただし、回答は未入力を許容し、各回答からprofile各fieldへの承認済みmappingはない。

```txt
Production source: Not decided
Current UI evidence: 8問のcategorical answer
Safe Production conversion: No
```

### Validation

次が未決定である。

- 各回答の対応先と数値化
- 1回答が複数fieldへ影響する場合の規則
- 未回答を許容するか、blockするか
- `neutral`と未回答の区別
- vector、policy、axis importanceのdomain
- source confidence、`userId`、`profileVersion`、`updatedAt`の生成・検証
- partial profile、invalid value、欠損時の失敗方法

したがって、Production validationはNot decidedである。

### Contract

Core側の必須shapeは確認済みである。しかし、診断回答を完全な`PreferenceProfile`へ変換するapp側のsource / transformation / validation contractはNot decidedである。

### Resolution judgment

```txt
Can be resolved from current UI input: No
Can be resolved without dummy / sample / placeholder values: No
Resolved: No
```

診断回答をそのままprofileとして確定扱いせず、未回答をneutralとして補完せず、仮数値やdummy metadataを作らない。

### Required next action

全必須profile fieldについて、source、回答mapping、未回答処理、numeric domain、metadata policy、validation、失敗時の扱いを文書化する。

## 5. `sneakerId` Review

### Current status

```txt
Blocking / Not resolved
```

`sneakerId`は必須stringであり、推薦結果のidentityとして伝播する。現在のCandidate Flowは候補名とブランドを受け取るが、Production IDを生成しない。

### Owner

既存文書から確認できるownerは次のとおりである。

- Project owner: identity source、安定性の範囲、Production方式を選ぶ。
- Implementation owner: format、collision、失敗時の実装境界に関する判断が必要である。

個人名または単一の最終承認者は既存文書から確認できないため、Not decidedである。

### Source

caller-provided、external、deterministic local、temporaryなどは将来の選択肢として挙げられているだけで、採用方式ではない。

```txt
Production source: Not decided
Current UI evidence: 候補名・ブランド
Safe Production conversion: No
```

候補名の文字列、候補名slug、`brand + name`のhash、random ID、UUID、array index、空文字、placeholderは承認済みsourceではない。

### Validation

次が未決定である。

- non-empty要件
- uniquenessの範囲
- sessionを越えたstability
- formatと長さ
- collision detectionとcollision時の処理
- external IDがない候補の扱い
- 同じ候補名または名称変更時のidentity
- invalidまたは欠損時の失敗方法

したがって、Production validationはNot decidedである。

### Contract

Core側で必須stringであり結果へ伝播することは確認済みである。しかし、Production identityのsource、format、stability、uniqueness、collisionを定めるcontractはNot decidedである。

### Resolution judgment

```txt
Can be resolved from current UI input: No
Can be resolved without dummy / sample / placeholder values: No
Resolved: No
```

UI表示用の候補名や一時keyが存在しても、Production `sneakerId`として扱わない。

### Required next action

Production identity source、適用範囲、stability、uniqueness、format、collision、欠損・invalid時の扱いを文書化する。

## 6. `candidateVector` Review

### Current status

```txt
Blocking / Not resolved
```

`candidateVector`は`culture`、`styleFit`、`simplicity`、`street`、`volume`、`comfort`、`durability`、`priceLevel`の8次元を必要とする。現在のUIは選択タグ等を保持するが、8次元のProduction数値を生成しない。

### Owner

既存文書から確認できるownerは次のとおりである。

- Project owner: curated data、manual input、approved sourceなどからProduction方針を選ぶ。
- Data sourcing owner: trusted sourceを定義する。
- Core design owner: 各次元のdomain、normalization、validationを承認する。

個人名、具体的なdata provider、最終承認フローは既存文書から確認できないため、Not decidedである。

### Source

```txt
Production source: Not decided
Current UI evidence: 選択タグ、候補名、ブランド、価格メモ、予算メモ、自由メモ
Safe Production conversion: No
```

候補タグは安全な`SneakerTag[]` mappingに利用できるが、数値vectorのsourceではない。タグ、候補名、メモ、sample candidateを8次元へ直接変換してはならない。

### Validation

次が全8次元で未決定である。

- trusted source
- accepted numeric domain
- normalization
- finite number確認
- 欠損次元の扱い
- source confidenceまたは更新方針
- invalid、範囲外、`NaN`、infinity時の失敗方法

runtimeのscore clampは出力処理であり、raw input validationではない。したがって、Production validationはNot decidedである。

### Contract

8次元の必須shapeとruntimeでの利用は確認済みである。しかし、各次元のProduction source、値の意味、domain、normalization、validationを定めるcontractはNot decidedである。

### Resolution judgment

```txt
Can be resolved from current UI input: No
Can be resolved without dummy / sample / placeholder values: No
Resolved: No
```

タグ選択を`candidateVector`へ直接変換せず、sample値や仮の中立値で8次元を補完しない。

### Required next action

全8次元についてtrusted source、値の意味、domain、normalization、完全性、validation、欠損・invalid時の扱いを文書化する。

## 7. `budgetFit` Review

### Current status

```txt
Blocking / Not resolved
```

`budgetFit`は必須numberであり、価格scoreの計算に直接利用される。現在のUIには価格メモと予算メモがあるが、いずれも自由入力文字列であり、Production `budgetFit`ではない。

### Owner

既存文書から確認できるownerは次のとおりである。

- Project owner: `budgetFit`の意味、明示入力か計算値か、sourceを決める。
- Core design owner: domain、計算式、validationを承認する。

個人名または単一の最終承認者は既存文書から確認できないため、Not decidedである。

### Source

```txt
Production source: Not decided
Current UI evidence: seenPriceText / budgetText
Safe Production conversion: No
```

価格メモと予算メモは入力有無と原文の確認には利用できるが、金額の意味、通貨、単一値・範囲・上限の区別が確定していない。表示用入力の整理とProduction値は別問題である。

### Validation

次が未決定である。

- `budgetFit`が明示的normalized scoreか計算値か
- 対象通貨
- 小数、区切り文字、通貨記号、自由文のparse
- 税、送料、値引き、地域価格の扱い
- `seenPriceText`が何の価格を表すか
- `budgetText`が予算額、範囲、上限、メモのどれか
- 計算式とaccepted domain
- blank、unparsable、範囲外、`NaN`、infinity時の失敗方法

したがって、Production validationはNot decidedである。

### Contract

Core側で必須numberであり価格scoreへ使われることは確認済みである。しかし、Production値の意味、source、計算式、domain、validationを定めるcontractはNot decidedである。

### Resolution judgment

```txt
Can be resolved from current UI input: No
Can be resolved without dummy / sample / placeholder values: No
Resolved: No
```

価格メモや予算メモを直接変換せず、汎用number parse、通貨の仮定、欠損時の0、1、100、暫定ratioを使用しない。

### Required next action

`budgetFit`の意味、source、通貨・金額semantics、計算式、domain、validation、欠損・invalid時の扱いを文書化する。

## 8. Cross-field Risks

- UIに入力欄があることを、Core inputとして使えることと誤認するリスクがある。
- 表示用の入力整理状態をProduction値として再利用すると、Prototype / UI LaneとProduction Core Laneの境界が崩れる。
- 診断回答から仮profile、候補名から仮ID、タグから仮vector、価格・予算文字列から仮budget scoreを作ると、未承認の推測が推薦scoreとidentityへ混入する。
- `preferenceProfile`と`candidateVector`のnumeric domainが別々に未定義のため、片方だけを仮決定しても意味のある比較を保証できない。
- `candidateVector.priceLevel`と`budgetFit`の両方が価格scoreに影響するため、sourceとscaleを個別に仮定すると二重に歪む可能性がある。
- `sneakerId`が不安定な場合、結果の参照、再表示、将来の保存境界が不明確になる。
- Core runtimeの出力clampを入力validationと誤認すると、`NaN`、infinity、欠損、意味の異なるscaleを防げない。
- 4項目のうち1項目でも未解決なら、dummy値なしの完全なCore inputは作れない。
- 未解決のまま`recommendSneakers`へ接続すると、形式上の出力が得られてもProduction推薦として意味と安全性を説明できない。
- 推薦準備チェックをResult UIへ流用すると、入力整理状態を推薦結果または購入判断に見せる危険がある。

## 9. Required Next Actions

次工程では実装へ進まず、4 blockerのProduction sourceとvalidation specificationを確定する。

1. `preferenceProfile`: 全必須fieldのsource、診断回答mapping、未回答処理、domain、metadata、validationを定義する。
2. `sneakerId`: identity source、stability、uniqueness、format、collision、失敗時の扱いを定義する。
3. `candidateVector`: 全8次元のtrusted source、domain、normalization、完全性、validationを定義する。
4. `budgetFit`: 値の意味、source、通貨・金額semantics、計算式、domain、validationを定義する。
5. owner roleだけでなく、最終承認者と承認記録の置き場所を確定する。
6. 4項目のcontractが承認されるまで、Core input assembler、`recommendSneakers`接続、Result UIを開始しない。

```txt
Recommended next: WEB-11R-C Core Input Source and Validation Specification
```

## 10. Final Judgment

```txt
preferenceProfile resolved: No
sneakerId resolved: No
candidateVector resolved: No
budgetFit resolved: No
Can proceed to Core input assembler implementation: No
Can create Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
Recommended next: WEB-11R-C Core Input Source and Validation Specification
```

WEB-11R-AではCore input実装へ戻れないと判断した。WEB-11R-Bでは4 blockerのowner / source / validation / contractを整理したが、既存文書だけでProduction sourceとvalidation contractを確定できる項目はなかった。

したがって、現在のUI入力だけではProduction Core inputを完成させられない。dummy値、sample値、仮値でCore inputを補完せず、`recommendSneakers`へ直接接続せず、Result UIへ直接進まない。
