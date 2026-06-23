# WEB-11M-B: Product Owner Decisions for `preferenceProfile` and `sneakerId`

## 1. Purpose

WEB-11M-Aで`Blocked`とされた次の2件について、明示されたProduct Owner Decisionを正式なDecision Recordとして記録する。

```txt
MDR-001: preferenceProfile
MDR-002: sneakerId
```

本工程はProduct Owner decisionの文書化だけを行う。Core input adapter、Core input assembler、`recommendSneakers`接続、Result UI、購入判断画面は実装しない。また、dummy値、sample値、placeholder値、neutral値によるCore inputの補完は行わない。

## 2. Current State

```txt
Reviewed commit: 337511b docs: record blocked core source decisions
Branch: main
Working tree at review start: clean
WEB-11Q: Complete
WEB-11R-A: Complete
WEB-11R-B: Complete
WEB-11R-C: Complete
WEB-11M-A: Complete
```

WEB-11M-Aでは、`preferenceProfile`と`sneakerId`についてProduction source、validation、missing / invalid handlingのProduct Owner承認が不足していたため、両MDRを`Blocked`とした。

本工程では、Product Ownerから次のsource方針が明示された。

- `preferenceProfile`: validated candidate tag idsを入力sourceとし、専用mapperでnormalized `preferenceProfile`へ変換する。
- `sneakerId`: local manual catalog idを正式なスニーカー識別子とする。

ただし、具体的なmapper contractとlocal catalog contractは本工程では確定しない。

## 3. Scope

本工程で決定済みとして記録する対象は次の2 fieldだけである。

```txt
preferenceProfile
sneakerId
```

次の2 fieldは本工程では決定しない。

```txt
candidateVector
budgetFit
```

本工程では、source方針から直接導かれるvalidation、missing / invalid handling、却下案、影響、残存依存だけを記録する。追加のProduct方針、ID体系、catalog schema、mapperの具体的なmapping仕様は新規に作らない。

## 4. Product Owner Decision Summary

| Decision ID | Field | Decision | Accepted Production Source | Remaining contract |
| --- | --- | --- | --- | --- |
| MDR-001 | `preferenceProfile` | Accepted | validated candidate tag idsを入力sourceとし、専用mapperでnormalized `preferenceProfile`へ変換する | tag idsからnormalized profileへの具体的なmapping仕様 |
| MDR-002 | `sneakerId` | Accepted | local manual catalog id | ID形式、登録方法、候補名からcanonical IDへの照合方法 |

両Decisionの`Accepted`はProduction source方針の採用を意味する。完全なmapper contract、catalog contract、full Core input作成、adapter設計または実装が完了したことを意味しない。

## 5. MDR-001 `preferenceProfile` Decision

```txt
Decision ID: MDR-001
Field: preferenceProfile
Decision: Accepted
Production Source: validated candidate tag idsを入力sourceとし、専用mapperでnormalized preferenceProfileに変換する
Validation Rule: validated candidate tag idsが定義済みtag setに含まれ、mapperがnormalized preferenceProfileを生成できること
Missing / Invalid Handling: 未回答、不正、不足、mapperによる変換不可の場合はCore input生成を停止する
Rejected Alternatives:
- UIタグそのものをpreferenceProfileとして扱う
- 診断回答をpreferenceProfileとして無変換で扱う
- dummy / neutral / placeholderで補完する
Reason: UI入力をそのままCore inputにせず、検証済みtag idsから専用mapperで正規化することで、dummy補完や直接変換を避けるため
Impact: preferenceProfile生成には専用mapper設計が必要
Remaining Dependency: tag idsからnormalized preferenceProfileへの具体的なmapping仕様
```

このDecisionはProduction source方針の採用であり、tag idsからnormalized `preferenceProfile`への具体的なmapping仕様を確定するものではない。

mapper contractが定義されるまでは、Core input adapter design / implementationへ進まない。未回答、不正、不足、未定義tag、またはmapperが完全なnormalized profileを生成できない状態を、dummy値、neutral値、placeholder値で補完しない。

## 6. MDR-002 `sneakerId` Decision

```txt
Decision ID: MDR-002
Field: sneakerId
Decision: Accepted
Production Source: local manual catalog id
Validation Rule: local catalog上でcanonical sneaker idとして解決できること
Missing / Invalid Handling: 識別不能、未登録、不一致の場合はCore input生成を停止する
Rejected Alternatives:
- 候補名の生文字列をsneakerIdとして扱う
- slug / hash / UUIDをその場生成してsneakerIdにする
- 外部API / 外部DB / AI / 相場API由来IDを必須sourceにする
- dummy / placeholderで補完する
Reason: 候補名の直接ID化や外部source依存を避け、最小の手動catalogで識別可能なcanonical idに限定するため
Impact: sneakerId生成にはlocal manual catalogの最小設計が必要
Remaining Dependency: local catalog idの形式、登録方法、照合方法
```

このDecisionはlocal manual catalog idをProduction source方針として採用するものであり、catalog schema、ID形式、登録方法、候補名からIDへの照合規則を確定するものではない。

local catalog contractが定義されるまでは、Core input adapter design / implementationへ進まない。候補名は検索、表示、照合補助に使用してよいが、候補名そのものを`sneakerId`として使用しない。

## 7. Rejected Alternatives

次の代替案はProduction方式として明示的に却下する。

| Field | Rejected alternative | Reason |
| --- | --- | --- |
| `sneakerId` | 候補名の生文字列を`sneakerId`として採用する | 表示名とcanonical identityを分離できず、名称変更や表記差を安全に扱えない |
| `sneakerId` | slug / hash / UUIDをその場生成して`sneakerId`として採用する | local catalogのcanonical IDではなく、未承認の生成規則になる |
| `sneakerId` | 外部API / 外部DB / AI / 相場API由来IDを必須sourceとして採用する | 本段階のProduct Owner Decisionはlocal manual catalogをsourceとしている |
| `preferenceProfile` | UIタグそのものを`preferenceProfile`として採用する | Coreが必要とするnormalized profileではなく、専用mapper境界を迂回する |
| `preferenceProfile` | 診断回答を`preferenceProfile`として無変換で採用する | categorical inputとnormalized profileのcontractが異なる |
| 両field | dummy / sample / placeholder / neutral値で不足を補完する | Production sourceとvalidationを満たさない値がCore inputへ混入する |

## 8. Impact on Remaining Fields

MDR-001とMDR-002のsource方針はAcceptedとなったが、`candidateVector`と`budgetFit`は本工程では決定していない。

```txt
candidateVector decision in this step: No
budgetFit decision in this step: No
```

残る影響と依存は次のとおりである。

- `candidateVector`のsource / validationが未決定であるため、全8次元を含む完全なcandidateを作れない。
- `budgetFit`のsource / validationが未決定であるため、価格scoreへ渡すProduction値を作れない。
- `preferenceProfile`と`candidateVector`のnumeric domainは、具体的なcontract確定時に比較可能な形で整合させる必要がある。
- `candidateVector.priceLevel`と`budgetFit`は両方が価格scoreへ影響するため、source、scale、validationを個別の仮値で補完してはならない。
- MDR-001には専用mapperの具体的なmapping仕様が残る。
- MDR-002にはlocal manual catalog idの形式、登録方法、照合方法が残る。

したがって、MDR-001とMDR-002のAcceptedだけでは、dummy値なしのfull Core inputを作成できない。

## 9. Adapter Readiness After These Decisions

MDR-001とMDR-002はAcceptedである。ただし、これはProduction source方針のAcceptedであり、full Core input作成やadapter実装可能を意味しない。

次の依存が残っているため、Core input adapter designは保留する。

```txt
candidateVectorのsource / validationが未決定
budgetFitのsource / validationが未決定
preferenceProfile mapperの具体的なmapping仕様が未決定
local manual catalog idの形式・登録方法・照合方法が未決定
```

readiness判断:

```txt
Can proceed to Core input adapter design after MDR-001/002 only: No
Can proceed to Core input adapter implementation: No
Can create full Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
```

本工程ではCore型またはCore実装ファイルを変更していない。将来のadapter design工程では、残る4 dependencyをDecision Recordまたはcontractとして確定してから、必要なCore型と実装境界を確認する。

## 10. Final Judgment

```txt
MDR-001 preferenceProfile decided: Yes
MDR-002 sneakerId decided: Yes
candidateVector decided in this step: No
budgetFit decided in this step: No
Can proceed to Core input adapter design after MDR-001/002 only: No
Can proceed to Core input adapter implementation: No
Can create full Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
Recommended next: WEB-11M-C Minimal Decision Record for candidateVector and budgetFit
```

Final Judgment:

`preferenceProfile`はvalidated candidate tag idsを入力sourceとし、専用mapperでnormalized profileへ変換する方針をAcceptedとする。`sneakerId`はlocal manual catalog idをProduction sourceとする方針をAcceptedとする。

一方、両方針の具体的なmapper / catalog contractと、`candidateVector` / `budgetFit`のsource / validationは未決定である。したがって、Core input adapter design、adapter implementation、dummy値なしのfull Core input作成、`recommendSneakers`接続、Result UI作成へは進まない。
