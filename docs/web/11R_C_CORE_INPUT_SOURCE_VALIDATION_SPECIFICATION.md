# WEB-11R-C: Core Input Source and Validation Specification

## 1. Purpose

WEB-11R-Bで未解決と判定された次の4 fieldについて、既存docsと現行UIから確認できるProduction source、validation、危険な直接変換、次に必要な最小decisionを整理する。

```txt
preferenceProfile
sneakerId
candidateVector
budgetFit
```

本工程は、Core接続前の最後のreview-only specification gateである。

本工程では、新しいProduction仕様を推測で確定しない。Core input adapter、Core input assembler、`recommendSneakers`接続、Result UI、dummy値・sample値・placeholder値による補完は行わない。

Production sourceまたはvalidationを既存docsから確定できない場合は`Not decided`とし、比較対象となる候補と、`Resolved: Yes`にするための最小decisionを示す。

## 2. Current State

```txt
Reviewed commit: d049808 docs: review core input blocker contracts
Branch: main
Working tree at review start: clean
WEB-11Q: Complete
WEB-11R-A: Complete
WEB-11R-B: Complete
```

確認した文書:

```txt
docs/web/10C_REMAINING_CORE_INPUT_FIELDS_READINESS_CHECK.md
docs/web/11A_CORE_INPUT_OWNER_DECISION_SHEET.md
docs/web/11Q_F_MOBILE_UI_ALIGNMENT_OVERALL_SUMMARY.md
docs/web/11R_A_CORE_INPUT_REENTRY_READINESS_REVIEW.md
docs/web/11R_B_CORE_INPUT_BLOCKER_OWNER_DECISION_CONTRACT_REVIEW.md
```

現行UI境界の確認:

```txt
app/_components/CandidateSneakerCheckFlow.tsx
app/_components/PrototypeReadinessPanel.tsx
```

確認済みの事実:

- 4 fieldはすべてCore type上で必須であり、安全な省略経路は確認されていない。
- 現在のUIは候補名、ブランド、価格メモ、予算メモ、自由メモ、選択タグを保持するが、Production Core値を生成しない。
- 推薦準備チェックは入力あり／なし等の状態表示であり、Result UIではない。
- Core必須shapeとruntime利用はWEB-10Cで確認済みである。
- 未解決なのは、Production source、変換規則、validation、missing / invalid時の失敗方法である。
- 現在のUI入力だけでは、dummy値・sample値・placeholder値なしに完全なCore inputを作れない。

## 3. Source / Validation Decision Table

| Field | Production Source | Validation Rule | Candidate Options | Rejected Conversion | Contract Ready? | Resolved? | Required Minimum Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `preferenceProfile` | Not decided | Not decided | 承認済み診断mappingから完全profileを生成する方式／callerが検証済み完全profileを渡す方式／その他の承認済みprofile source | 診断回答をそのままprofile扱い、未回答をneutral扱い、仮数値・dummy metadataによる補完 | No | No | 完全profileのsource、全field mapping、未回答処理、numeric domain、metadata、invalid時の扱いを承認する |
| `sneakerId` | Not decided | Not decided | caller-provided ID／external・catalog ID／承認済みdeterministic local ID／適用範囲を限定したtemporary policy | 候補名、slug、`brand + name` hash、random、UUID、array index、空文字、placeholderの無承認採用 | No | No | identity source、scope、stability、uniqueness、format、collision、欠損・invalid時の扱いを承認する |
| `candidateVector` | Not decided | Not decided | trusted curated data／明示的なmanual numeric input／承認済みexternal・catalog source／その他の承認済み8次元source | タグ・候補名・ブランド・メモからの直接数値化、1タグの複数axis展開、sample・dummy・中立値による補完 | No | No | 全8次元のsource、意味、domain、normalization、完全性、欠損・invalid時の扱いを承認する |
| `budgetFit` | Not decided | Not decided | 明示的なnormalized score／承認済みstructured price・budget dataからの決定的計算 | 価格・予算メモの汎用parse、通貨仮定、欠損を0・1・100扱い、暫定ratio、自由文の直接変換 | No | No | 値の意味、source、通貨・金額semantics、計算式、domain、欠損・invalid時の扱いを承認する |

4 fieldすべてで、候補は比較・decisionのための選択肢であり、Production採用を意味しない。

## 4. `preferenceProfile` Source and Validation

### 4.1 Current blocker

現在の8問の診断回答だけでは、必須profile全体のfield対応、複数fieldへの影響、未回答処理、numeric domain、policy、confidence、metadataを確定できない。

### 4.2 Existing confirmed facts

- Coreは完全な`PreferenceProfile`を要求する。
- runtimeはprofileのvector、policy、axis importanceを利用する。
- 現在の診断は`like`、`neutral`、`dislike`のcategorical answerを保持し、未回答を許容する。
- 現在のUIは完全なProduction profileを生成しない。
- `neutral`と未回答を同一扱いするcontractはない。

### 4.3 Production source decision

```txt
Production source: Not decided
Resolved: No
```

### 4.4 If Not decided, candidate source options

1. 診断回答から完全なprofileを生成する、承認済みPreference Diagnosis contract。
2. callerが、別境界で作成・検証済みの完全なprofileを渡す方式。
3. manual、persisted profile、external source等を含む、ownerが明示承認した完全profile source。

いずれも現時点では採用決定ではない。

### 4.5 Validation rule decision

```txt
Validation rule: Not decided
Resolved: No
```

### 4.6 If Not decided, candidate validation options

- 全必須fieldが存在することをadapter境界で検証する。
- 診断回答のdestination、数値化、複数fieldへの影響を明示的なmapping tableで検証する。
- 未回答を許容するかblockするかを決め、`neutral`と区別する。
- vector、policy、axis importance、confidenceのaccepted domainとfinite number要件を定義する。
- `userId`、`profileVersion`、`updatedAt`等のmetadata sourceとformatを検証する。
- partial、unknown answer、out-of-range、`NaN`、infinity、invalid metadataは明示的に失敗させる。

これらはvalidation設計候補であり、accepted domainやfailure policyは未承認である。

### 4.7 Rejected unsafe conversions

- 診断回答をそのまま`preferenceProfile`として扱う。
- `like`、`neutral`、`dislike`へ仮数値を割り当てる。
- 未回答を`neutral`または0として補完する。
- 一部の回答だけでpartial profileを作る。
- sample profile、dummy vector、仮policy、仮confidence、仮metadataで不足fieldを埋める。

### 4.8 Missing state handling

現在の確定済み安全策は、完全なsource / mapping / validationがない場合にCore input作成をblockすることである。未回答、欠損field、invalid number、metadata不足を自動補完する方針はない。

### 4.9 Contract readiness

```txt
Core required shape confirmed: Yes
Production source contract ready: No
Production validation contract ready: No
Contract Ready?: No
Resolved?: No
```

### 4.10 Required minimum decision

最小Decision Recordで、完全profileのauthoritative source、全必須fieldへのmapping、未回答処理、accepted domain、metadata policy、invalid時の失敗方法、最終承認者を決める。

## 5. `sneakerId` Source and Validation

### 5.1 Current blocker

Production identityのsource、適用scope、sessionを越えるstability、uniqueness、format、collision、欠損時の扱いが未確定である。

### 5.2 Existing confirmed facts

- `sneakerId`はCore inputの必須stringである。
- runtimeは`sneakerId`を推薦結果へ伝播する。
- 現在のCandidate Flowは候補名とブランドを保持するが、Production IDを生成しない。
- Core runtimeにnon-empty、uniqueness、format、stabilityの入力validationは確認されていない。

### 5.3 Production source decision

```txt
Production source: Not decided
Resolved: No
```

### 5.4 If Not decided, candidate source options

1. caller-provided stable ID。
2. external serviceまたはcatalogが提供するID。
3. ownerが規則と適用範囲を承認したdeterministic local ID。
4. one-off candidateに限定し、scopeとlifetimeを承認したtemporary identity policy。

候補名やブランドがあることだけでは、いずれの方式も採用済みにならない。

### 5.5 Validation rule decision

```txt
Validation rule: Not decided
Resolved: No
```

### 5.6 If Not decided, candidate validation options

- non-empty、trim、長さ、character set、prefix等のformat contractを定義する。
- uniquenessのscopeをrequest内、session内、account内、catalog内等から決める。
- required stability期間とID変更条件を定義する。
- external IDの場合はprovider / namespaceを検証する。
- deterministic IDの場合は入力、version、collision detectionを検証する。
- duplicate、collision、missing、invalid format時はCore call前に明示的に失敗させる。

### 5.7 Rejected unsafe conversions

- 候補名の文字列をそのままIDとして扱う。
- 候補名slugをProduction IDとして採用する。
- `brand + name`のhashを無承認で採用する。
- random、UUID、array index、時刻、空文字、placeholderを無承認で採用する。
- UI表示用またはReact list用の一時keyをProduction `sneakerId`として再利用する。

### 5.8 Missing state handling

承認済みidentity sourceからIDを取得できない場合は、candidate assemblyとCore callをblockする。候補名、index、random valueによるfallbackは行わない。

### 5.9 Contract readiness

```txt
Core required shape confirmed: Yes
Production source contract ready: No
Production validation contract ready: No
Contract Ready?: No
Resolved?: No
```

### 5.10 Required minimum decision

最小Decision Recordで、authoritative identity source、適用scope、stability、uniqueness、format、collision policy、missing / invalid時の失敗方法、最終承認者を決める。

## 6. `candidateVector` Source and Validation

### 6.1 Current blocker

`culture`、`styleFit`、`simplicity`、`street`、`volume`、`comfort`、`durability`、`priceLevel`の8次元について、trusted source、値の意味、domain、normalization、完全性、validationが未確定である。

### 6.2 Existing confirmed facts

- 8次元すべてがCore type上で必須である。
- runtimeは全次元をscoringに利用する。
- 現在のUIは選択タグ、候補名、ブランド、価格メモ、予算メモ、自由メモを保持する。
- 選択タグは`SneakerTag[]`へ安全にmappingできるが、数値vectorのsourceではない。
- runtimeのscore clampは出力処理であり、raw input validationではない。
- sample値は例示であり、Production sourceやaccepted domainを確定しない。

### 6.3 Production source decision

```txt
Production source: Not decided
Resolved: No
```

### 6.4 If Not decided, candidate source options

1. ownerが信頼境界と更新方針を承認したcurated candidate data。
2. domain、入力責任、検証方法を承認したmanual numeric input。
3. provider、version、coverageを承認したexternal serviceまたはcatalog source。
4. 全8次元を同じcontractで提供できるその他のapproved source。

### 6.5 Validation rule decision

```txt
Validation rule: Not decided
Resolved: No
```

### 6.6 If Not decided, candidate validation options

- 8次元すべてが存在するcomplete objectのみ受け付ける。
- 各次元の値の意味、accepted domain、normalization、unitまたはscaleを定義する。
- 全値についてnumber、finite、`NaN` / infinity拒否を検証する。
- source provider、schema version、更新日時、coverage等のtrust boundaryを検証する。
- missing dimension、out-of-range、unknown version、stale data時のblock / refresh方針を定義する。
- `priceLevel`は価格source、通貨basis、normalizationを他の7次元と分けて明示する。

### 6.7 Rejected unsafe conversions

- 選択タグを数値axisへ直接変換する。
- 1つのタグを複数axisへ展開する。
- 候補名、ブランド、自由メモから数値を推測する。
- `seenPriceText`を直接`priceLevel`へ変換する。
- sample vector、fixture、dummy値、仮の中立値で欠損次元を補完する。
- output clampがあることを理由にraw inputを無検証で通す。

### 6.8 Missing state handling

8次元のうち1つでもauthoritative valueがない場合はcandidate assemblyとCore callをblockする。中立値、平均値、sample値、0、50、100等によるfallbackは行わない。

### 6.9 Contract readiness

```txt
Core required shape confirmed: Yes
Production source contract ready: No
Production validation contract ready: No
Contract Ready?: No
Resolved?: No
```

### 6.10 Required minimum decision

最小Decision Recordで、全8次元のauthoritative source、値の意味、domain、normalization、完全性、version / freshness、missing / invalid時の失敗方法、最終承認者を決める。

## 7. `budgetFit` Source and Validation

### 7.1 Current blocker

`budgetFit`が明示的normalized scoreか、価格と予算から計算する値か未決定である。現在の`seenPriceText`と`budgetText`は自由入力文字列であり、通貨、金額semantics、税、送料、範囲、上限、計算式が未確定である。

### 7.2 Existing confirmed facts

- `budgetFit`はCore inputの必須numberである。
- runtimeは`budgetFit`を価格score計算に直接利用する。
- 現在の価格メモと予算メモは表示と入力有無の確認にだけ使われる。
- safe mapperは現在の価格・予算文字列を数値へ変換しない。
- runtimeのoutput clampはraw `budgetFit`のvalidationではない。

### 7.3 Production source decision

```txt
Production source: Not decided
Resolved: No
```

### 7.4 If Not decided, candidate source options

1. callerまたは別の承認済み境界が明示的なnormalized scoreを渡す方式。
2. structured observed priceとstructured budgetから、承認済みformulaで計算する方式。
3. currency、tax、shipping、region、price typeを含む承認済みexternal・catalog dataから計算する方式。

現在の自由入力メモは、いずれのsourceとしても承認されていない。

### 7.5 Validation rule decision

```txt
Validation rule: Not decided
Resolved: No
```

### 7.6 If Not decided, candidate validation options

- 明示score方式では、値の意味、accepted domain、number / finite要件、producer contractを検証する。
- 計算方式では、価格と予算をstructured amountとして検証し、currency、tax、shipping、discount、regionを定義する。
- 単一額、範囲、上限、自由文を区別し、許可する形式を限定する。
- normalization formula、rounding、境界値、zero / negative amountの扱いを定義する。
- blank、unparsable、currency mismatch、out-of-range、`NaN`、infinity時はCore call前に明示的に失敗させる。

### 7.7 Rejected unsafe conversions

- `seenPriceText`または`budgetText`への汎用`Number` / `parseInt` / `parseFloat`適用。
- 通貨、税込・税抜、送料、値引き、地域価格を仮定する。
- 自由文から最初の数値だけを抽出する。
- 欠損を0、1、50、100等で補完する。
- 暫定的なprice / budget ratioをProduction formulaとして採用する。
- sample candidateの`budgetFit`を流用する。

### 7.8 Missing state handling

authoritative score、またはformulaに必要なstructured price / budget dataが欠ける場合はcandidate assemblyとCore callをblockする。自由入力メモの自動parseやdefault scoreへのfallbackは行わない。

### 7.9 Contract readiness

```txt
Core required shape confirmed: Yes
Production source contract ready: No
Production validation contract ready: No
Contract Ready?: No
Resolved?: No
```

### 7.10 Required minimum decision

最小Decision Recordで、`budgetFit`の意味、authoritative source、明示scoreか計算値か、currency / amount semantics、formula、domain、rounding、missing / invalid時の失敗方法、最終承認者を決める。

## 8. Rejected Unsafe Conversions

次の変換は、4 fieldのProduction source / validationが承認されるまで使用しない。

| UI / Prototype input | Rejected Production conversion | Reason |
| --- | --- | --- |
| 診断回答 | 回答を直接`preferenceProfile`へ変換する | 完全profile mapping、未回答処理、domain、metadataが未決定 |
| 候補名・ブランド | `sneakerId`として使用、slug / hash / random IDを生成する | identity source、stability、uniqueness、collisionが未決定 |
| 選択タグ | `candidateVector`の数値へ変換する | タグと8次元axisのnumeric contractがない |
| 価格メモ・予算メモ | `budgetFit`または`priceLevel`へ直接変換する | 通貨、金額semantics、formula、domainが未決定 |
| sample / fixture | Production値として再利用する | 例示値でありauthoritative sourceではない |
| dummy / placeholder / 仮値 | 欠損必須fieldを補完する | 推薦scoreとidentityへ未承認値が混入する |

現在のUI入力は、入力内容の表示・整理状態の確認には使用できるが、Production Core inputと混同しない。

## 9. Minimum Decisions Needed

4 fieldを`Resolved: Yes`へ変更するには、追加の一般レビューではなく、次の最小Decision Recordが必要である。

| Decision ID | Field | Minimum decision |
| --- | --- | --- |
| MDR-001 | `preferenceProfile` | authoritative source、全必須field mapping、未回答処理、domain、metadata、validation、failure policy、最終承認者 |
| MDR-002 | `sneakerId` | authoritative identity source、scope、stability、uniqueness、format、collision、failure policy、最終承認者 |
| MDR-003 | `candidateVector` | 全8次元のauthoritative source、意味、domain、normalization、完全性、version / freshness、failure policy、最終承認者 |
| MDR-004 | `budgetFit` | 値の意味、authoritative source、明示scoreまたはformula、currency / amount semantics、domain、failure policy、最終承認者 |

Decision Recordには、候補の列挙だけでなく、採用する1案、却下する案、適用範囲、validation、missing / invalid時の停止条件を記録する。

4つのDecision Recordを1文書にまとめてもよい。ただし、1 fieldでも未決定ならCore input adapter designへ進まない。

## 10. Exit Decision

```txt
B. Hold Core adapter work and create Minimal Decision Record for unresolved source / validation choices
```

理由:

- 4 fieldすべてでProduction sourceが`Not decided`である。
- 4 fieldすべてでProduction validationが`Not decided`である。
- 現在のUI入力だけでは完全なCore inputを作れない。
- dummy値、sample値、placeholder値、仮値を使わずに不足fieldを補完できない。
- adapter designを始めると、sourceまたはvalidationを設計側で推測する必要が生じる。

WEB-11R-C後は追加のreview-only docsを増やさず、MDR-001〜MDR-004を満たす最小Decision Recordへ進む。

## 11. Final Judgment

```txt
preferenceProfile source/validation resolved: No
sneakerId source/validation resolved: No
candidateVector source/validation resolved: No
budgetFit source/validation resolved: No
Can proceed to Core input adapter design: No
Can proceed to Core input adapter implementation: No
Can create Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
Exit decision: Hold Core adapter work and create Minimal Decision Record for unresolved source / validation choices
Recommended next: Minimal Decision Record for Core Source and Validation Choices
```

WEB-11R-CはCore接続前の最後のreview-only specification gateである。WEB-11R-Bの`Not decided`を繰り返すだけでなく、各fieldで比較すべきsource候補、validation候補、拒否する直接変換、次に必要な最小decisionを特定した。

Production source / validationが承認されるまでは、Core input adapter、Core input assembler、`recommendSneakers`接続、Result UIへ進まない。
