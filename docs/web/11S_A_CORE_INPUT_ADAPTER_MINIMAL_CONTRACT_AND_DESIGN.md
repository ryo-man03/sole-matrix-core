# WEB-11S-A: Core Input Adapter Minimal Contract and Design

## 1. Purpose

MDR-001からMDR-004でAcceptedとなったProduction source方針を前提に、Core input adapter設計に必要な次の4 contractを1文書で整理する。

```txt
1. preferenceProfile mapper contract
2. local manual catalog contract
3. candidateVector contract
4. budgetFit contract
```

本工程はcontractとadapter boundaryの設計だけを行う。Core input adapter、Core input assembler、各mapper / evaluator、local catalog、`recommendSneakers`接続、Result UIは実装しない。

## 2. Current State

```txt
Reviewed commit: 895b05a docs: record remaining core source decisions
Branch: main
Working tree at review start: clean
WEB-11Q: Complete
WEB-11R-A: Complete
WEB-11R-B: Complete
WEB-11R-C: Complete
WEB-11M-A: Complete
WEB-11M-B: Complete
WEB-11M-C: Complete
```

MDR-001からMDR-004のProduction source方針はAcceptedである。一方、現行Core typeは次を要求する。

- `preferenceProfile`: `userId`、7次元の`vector`、`policy`、7次元の`axisImportance`、`sourceConfidence`、`profileVersion`、`updatedAt`を持つ完全な`PreferenceProfile`
- `sneakerId`: `SneakerCandidate.sneakerId`の必須string
- `candidateVector`: `culture`、`styleFit`、`simplicity`、`street`、`volume`、`comfort`、`durability`、`priceLevel`を持つ`SneakerVector`
- `budgetFit`: `SneakerCandidate.budgetFit`の必須number

このCore shapeと、今回提示されたtag-id dimension contractおよびbudget comparison contractの間には、後述する不整合が残る。

## 3. Scope

本工程の対象:

- validated candidate tag idsからpreference dimension候補を作るcontract
- local manual catalogでcandidate nameをcanonical `sneakerId`へ解決するcontract
- catalog itemの`featureValues`からcandidate feature dimension候補を作るcontract
- validated budgetとcatalog comparison priceからbudget comparison結果を作るcontract
- invalid、missing、unresolved時の停止条件
- Core input adapterが受け取るもの、受け取らないもの、出力可能条件

本工程の対象外:

- Core input adapter / assembler実装
- mapper / evaluator / catalog実装
- `recommendSneakers`のimportまたは実行
- Result UI、推薦結果画面、購入判断画面
- dummy、sample、placeholder、neutral、仮値による補完
- API、Backend、DB、外部データ、AI接続
- UIまたはCSS変更

## 4. Source Decisions Already Accepted

| Decision ID | Core field | Accepted Production source |
| --- | --- | --- |
| MDR-001 | `preferenceProfile` | validated candidate tag idsを入力sourceとし、専用mapperでnormalized `preferenceProfile`へ変換する |
| MDR-002 | `sneakerId` | local manual catalogで手動管理するcanonical ID |
| MDR-003 | `candidateVector` | `sneakerId`で解決したlocal manual catalog itemの手動管理`featureValues` |
| MDR-004 | `budgetFit` | validated user budget inputと、同じcatalog itemのvalidated comparison price |

Acceptedはsource方針の承認を意味する。現行Core typeへ適合する完全なoutput shape、adapter design、implementation、Core callの承認を意味しない。

## 5. Minimal Shared Dimension Set

Product Owner contractで指定されたshared dimension keyは、現行UIで定義済みのsupported candidate tag idsである。

```txt
classic
low_tech
street
minimal
chunky
running
basketball
comfortable
durable
retro
heritage
premium
```

このshared key setは、UI label自体をCore inputへ渡すことを意味しない。使用するのは検証済みIDであり、表示labelは使用しない。

役割は次のように分離する。

```txt
preferenceProfile:
validated candidate tag idsから、ユーザーの好みdimension候補を作る

candidateVector:
local catalog itemに手動登録されたfeatureValuesから、スニーカー側の特徴dimension候補を作る
```

同じdimension keyを使ってもsourceと意味は異なる。preference側の選択状態をcatalog featureへ流用せず、catalog featureをユーザー選択として扱わない。

ただし、現行Coreの`PreferenceProfile.vector`と`SneakerVector`はこの12 tag-id dimension setを採用していない。現行Coreの比較軸へ変換する承認済み規則もないため、このshared dimension setをそのままCore-compatible outputとみなしてはならない。

## 6. Contract 1: preferenceProfile Mapper

### Source and input

```txt
source: validated candidate tag ids
input: candidateTagIds
minimum count: 1
maximum count: 5
duplicates: not allowed
supported ids only: required
```

### Mapping

- supported candidate tag idsと同じdimension keyを使う。
- 選択されたtag dimensionを`1`とする。
- 選択されていないtag dimensionを`0`とする。
- `0`は「未選択」を表す明示値であり、missing valueのdummy、neutral、placeholder補完ではない。
- UI表示labelや自由記述メモはmapping sourceにしない。

### Output candidate

全supported dimensionを持つ、欠損のないtag-keyed normalized preference dimension objectをoutput候補にできる。

ただし、これは現行Coreの完全な`PreferenceProfile`ではない。次の必須要素への承認済みmappingが存在しない。

```txt
userId
vector.culture
vector.styleFit
vector.simplicity
vector.street
vector.volume
vector.comfort
vector.durability
policy
axisImportance
sourceConfidence
profileVersion
updatedAt
```

したがって、このcontractだけではCore-compatible `preferenceProfile`を出力できない。

### Invalid handling

未回答、空配列、unsupported tag id、重複、5件超過、mapper不可、または完全なCore `PreferenceProfile`へ変換できない場合はCore input生成を停止する。

## 7. Contract 2: Local Manual Catalog

### Source

```txt
source: local manual catalog
```

### Minimal catalog item

```txt
id
displayName
aliases
brand
modelName
colorway
comparisonPriceYen
featureValues
```

### Canonical ID

- `id`はlocal manual catalog内で手動管理するcanonical IDとする。
- `smx-snk-0001`のような安定した手動採番形式とする。
- 候補名、生文字列、slug、hash、UUID、その場生成IDを`sneakerId`にしない。
- `id`はcatalog内で存在し、一意でなければならない。

### Name resolution

- candidate nameは検索、表示、照合補助にだけ使う。
- candidate nameを正規化し、`displayName`または`aliases`と照合する。
- 完全一致またはcatalogに明示登録されたalias一致だけを許可する。
- 1件だけ一致した場合、そのitemのcanonical `id`を`sneakerId`候補にできる。
- 0件一致または複数一致ではCore input生成を停止する。
- fuzzy match、AI推定、外部API解決を必須sourceにしない。

### Validation

catalog未登録、canonical `id`不在または重複、alias衝突、複数一致、必須field不足、invalid `comparisonPriceYen`、invalidまたは不完全な`featureValues`ではCore input生成を停止する。

このcontractはcatalog itemとcanonical `sneakerId`の解決境界を定義できる。ただし、catalog実体とresolverは本工程で作成しない。

## 8. Contract 3: candidateVector

### Source

```txt
source:
sneakerIdで一意に解決されたlocal manual catalog itemのfeatureValues
```

### Feature dimensions and values

- Product Owner contract上はsupported candidate tag idsと同じdimension keyを使う。
- 各dimensionは`0`以上`1`以下のfinite numberとする。
- 全dimensionを必須とし、欠損を許可しない。
- `0`は「その特徴がない」としてcatalogへ手動登録された明示値であり、missing valueのdummy補完ではない。
- UIタグ、ユーザー選択、preference用tag idsをfeature value sourceとして流用しない。

### Output candidate

全supported tag-id dimensionを持つ、欠損のないcatalog feature objectをoutput候補にできる。

ただし、現行Coreの`SneakerVector`が要求するdimensionは次の8軸である。

```txt
culture
styleFit
simplicity
street
volume
comfort
durability
priceLevel
```

12 tag-id dimensionsからこの8軸へ変換する承認済みmappingはない。また、提示contractの`0..1` domainを、現行Coreの100-based scoringで使用される値へ変換する承認済みnormalizationもない。よって、このcontractだけではCore-compatible `candidateVector`を出力できない。

### Invalid handling

`featureValues`未登録、dimension欠損、unsupported dimension、範囲外、number以外、`NaN`、infinity、mapper不可、または現行Core `SneakerVector`へ変換できない場合はCore input生成を停止する。

## 9. Contract 4: budgetFit

### Source and input

```txt
userBudgetYen:
- JPY only
- integer
- greater than 0
- validated purchase ceiling entered by the user

comparisonPriceYen:
- JPY only
- integer
- greater than 0
- validated comparison reference price manually stored on the catalog item
```

価格メモ、予算メモ、自由入力文字列を直接sourceにしない。

### Comparison rule

```txt
comparisonPriceYen <= userBudgetYen: withinBudget
comparisonPriceYen > userBudgetYen: overBudget
differenceYen = userBudgetYen - comparisonPriceYen
ratio = comparisonPriceYen / userBudgetYen
```

`differenceYen`はwithin-budget時に0以上、over-budget時に負数になる。`ratio`は正のfinite numberでなければならない。

### Price scope

- `comparisonPriceYen`はlocal catalog上の比較用参考価格として扱う。
- 税込、送料、手数料、割引、地域差を含む厳密な購入総額は保証しない。
- Result UIまたは購入判断に使用する確定価格ではない。

### Output candidate

`withinBudget` / `overBudget`、`differenceYen`、`ratio`を含む決定的なbudget comparison結果をoutput候補にできる。

ただし、現行Coreの`SneakerCandidate.budgetFit`は単一の`number`であり、`calculatePriceScore`で100-based scoreとして直接減算に使用される。今回のcomparison結果をそのnumberへ変換するformula、domain、rounding、境界値は指定されていない。`ratio`またはstatusをそのままCore `budgetFit`にすることも承認されていない。

したがって、このcontractだけではCore-compatible `budgetFit`を出力できない。

### Invalid handling

budget未入力、不正、0以下、非整数、JPY以外、comparison price未登録、不正、0以下、非整数、JPY以外、計算結果が非finite、evaluator不可、またはCore-compatible numberを生成できない場合はCore input生成を停止する。

## 10. Stop Conditions

次のいずれかが成立した場合、adapterはCore input生成を停止する。

```txt
unsupported tag id
empty preference tags
candidate tag上限超過
duplicate preference tag
catalog unresolved
catalog duplicate match
catalog required field missing
catalog canonical id missing or duplicate
feature dimension missing
feature value out of range
feature value is not a finite number
budget missing
budget invalid
comparison price missing
comparison price invalid
mapper / evaluator cannot produce Core-compatible output
```

さらに、現行Coreとの不整合が解消されるまで、次を停止条件とする。

- tag-id dimensionsから完全なCore `PreferenceProfile`を作れない。
- tag-id feature dimensionsから8軸のCore `SneakerVector`を作れない。
- comparison結果からCoreの数値`budgetFit`を作れない。
- 4 contractのうち1つでも失敗または未解決である。

停止時は不足値をdummy、sample、placeholder、neutral、0、平均値、仮値で補完しない。

## 11. Rejected Shortcuts

次のshortcutは明確に却下する。

- UIタグを`preferenceProfile`として直接渡す。
- UIタグを`candidateVector`として直接渡す。
- 候補名の生文字列を`sneakerId`として渡す。
- slug / hash / UUIDをその場生成して`sneakerId`にする。
- 価格メモ / 予算メモの生文字列を`budgetFit`として渡す。
- 不足値をdummy / sample / placeholder / neutralで補完する。
- 外部API / AI / 相場APIを必須sourceにする。
- Result UIや購入判断のために価格を都合よく解釈する。
- selected tagの`1` / `0` objectを、完全なCore `PreferenceProfile`だとみなす。
- catalogのtag-id feature objectを、8軸のCore `SneakerVector`だとみなす。
- `ratio`、`differenceYen`、`withinBudget` / `overBudget`を、承認済みformulaなしでCore `budgetFit` numberにする。
- Coreのoutput clampがinput validationを代替するとみなす。

## 12. Adapter Boundary

```txt
adapter receives:
- safe candidate draft / validated candidate input
- local manual catalog lookup result
- validated budget input

adapter does not receive:
- raw UI labels as Core fields
- unresolved candidate name as sneakerId
- raw price memo as budgetFit
- dummy fallback values

adapter may produce Core input only when:
- preferenceProfile mapper succeeds
- local catalog resolution succeeds
- candidateVector mapper succeeds
- budgetFit evaluator succeeds
```

境界上の責務:

- input sourceの種類とrequirednessを検証する。
- name resolutionが一意であることを検証する。
- tag set、件数、重複、feature completeness、数値domain、budget amountを検証する。
- 4 contractの結果が現行Core typeとruntime semanticsに適合することを検証する。
- 1つでも失敗した場合は、partial Core inputを返さず停止結果を返す設計対象とする。

境界外:

- raw UI stringの意味推定
- fuzzy catalog resolution
- external sourceによる補完
- Core-compatible値を作るための未承認mapping創作
- `recommendSneakers`のimport、call、result formatting
- Result UIまたは購入判断

## 13. Minimum Remaining Blockers

```txt
Minimum Remaining Blockers:
- The tag-id preference dimensions do not define the complete existing Core PreferenceProfile shape or its required metadata and policy fields.
- The tag-id feature dimensions do not match the existing eight-field Core SneakerVector, and no approved mapping or normalization exists.
- The budget comparison result does not define the single numeric Core budgetFit value required by calculatePriceScore.
- Core input adapter implementation is not started in this step.
- recommendSneakers connection is not allowed in this step.
- Result UI is not allowed in this step.
```

これらはProduction source方針を再決定するMDRではない。現行Core-compatible output contractを完成させるための最小不整合であり、追加MDRを作らず、本セクションのblockerとして保持する。

この不整合が解消されるまで、WEB-11S-B Core Input Adapter Minimal Design and Test Planへ進めない。

## 14. Final Judgment

```txt
preferenceProfile mapper contract defined: No
local catalog contract defined: Yes
candidateVector contract defined: No
budgetFit contract defined: No
Can proceed to WEB-11S-B Core Input Adapter Minimal Design and Test Plan: No
Can proceed to Core input adapter implementation: No
Can create full Core input without implementation: No
Can call recommendSneakers: No
Can create Result UI: No
Additional MDR needed: No
Recommended next: Resolve listed Minimum Remaining Blockers before WEB-11S-B
```

Final Judgment:

local manual catalogのcanonical identityと一意照合contractは、次のdesign / test planへ渡せる粒度で定義できた。

一方、`preferenceProfile`、`candidateVector`、`budgetFit`はsource、入力検証、停止条件までは定義できるが、現行Core-compatible outputへの最小変換contractが不足している。Product方針を推測してmappingやscore formulaを追加することはできないため、WEB-11S-B、adapter implementation、完全なCore input生成、`recommendSneakers`接続、Result UIへは進まない。
