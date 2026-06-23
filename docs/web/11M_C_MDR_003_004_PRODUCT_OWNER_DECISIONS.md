# WEB-11M-C: Product Owner Decisions for `candidateVector` and `budgetFit`

## 1. Purpose

WEB-11M-B で `preferenceProfile` と `sneakerId` の Production source 方針が `Accepted` となったため、残る次の2件について、提示された Product Owner Decision を正式な Decision Record として記録する。

```txt
MDR-003: candidateVector
MDR-004: budgetFit
```

本工程は Product Owner decision の文書化のみを行う。Core input adapter、Core input assembler、`recommendSneakers` 接続、Result UI、購入判断画面は実装しない。また、dummy、sample、placeholder、neutral などの仮値で Core input を補完しない。

## 2. Current State

```txt
Reviewed commit: b2f1197 docs: record product owner core source decisions
Branch: main
Working tree at review start: clean
WEB-11Q: Complete
WEB-11R-A: Complete
WEB-11R-B: Complete
WEB-11R-C: Complete
WEB-11M-A: Complete
WEB-11M-B: Complete
```

WEB-11M-B までに、次の source 方針が `Accepted` として記録されている。

- `preferenceProfile`: validated candidate tag ids を入力 source とし、専用 mapper で normalized `preferenceProfile` へ変換する。
- `sneakerId`: local manual catalog id を canonical identity source とする。

ただし、`preferenceProfile` mapper contract と local catalog contract は未確定である。また、`candidateVector` と `budgetFit` は本工程開始時点では未決定である。

## 3. Scope

本工程で決定済みとして記録する対象は次の2 field のみである。

```txt
candidateVector
budgetFit
```

MDR-001 `preferenceProfile` と MDR-002 `sneakerId` は再決定しない。本工程では依存関係と影響のみを参照する。

本工程では feature schema、vector 形式、数値 domain、正規化ルール、価格種別、比較ルール、通貨、税・送料、割引時の扱い、catalog schema、mapper または evaluator の具体 contract を新規に決定しない。これらは次工程で整理する remaining dependency とする。

## 4. Product Owner Decision Summary

| Decision ID | Field | Decision | Accepted Production Source | Remaining contract |
| --- | --- | --- | --- | --- |
| MDR-003 | `candidateVector` | Accepted | `sneakerId` で解決された local manual catalog item に紐づく手動管理 feature source | feature schema、vector 形式、必須特徴量、正規化ルール、専用 mapper contract |
| MDR-004 | `budgetFit` | Accepted | validated user budget input と、local manual catalog item に紐づく validated comparison price | 価格種別、比較ルール、許容範囲、通貨、税込・送料・割引の扱い、専用 evaluator contract |

両 Decision の `Accepted` は Production source 方針の採用を意味する。完全な field contract、full Core input 作成、adapter design または implementation の完了を意味しない。

## 5. MDR-003 `candidateVector` Decision

```txt
Decision ID: MDR-003
Field: candidateVector
Decision: Accepted
Production Source: sneakerId で解決された local manual catalog item に紐づく手動管理 feature source
Validation Rule: catalog item に必要な特徴情報が存在し、専用 mapper で Core 向け candidateVector へ正規化できること
Missing / Invalid Handling: 特徴情報が未登録・不正・不足、または mapper 不可の場合は Core input 生成を停止する
Rejected Alternatives:
- UI タグや好みタグを candidateVector として直接扱う
- preferenceProfile 用 tag ids を candidateVector として流用する
- AI や外部 API で特徴量を必須生成する
- dummy / neutral / placeholder で補完する
Reason: ユーザーの好み入力とスニーカー側の特徴量を混同せず、catalog item 側の特徴情報から candidateVector を作るため
Impact: candidateVector 生成には catalog feature source と専用 mapper 設計が必要
Remaining Dependency: feature schema、vector 形式、必須特徴量、正規化ルール
```

この Decision は `candidateVector` の Production source 方針の採用であり、feature schema、vector 形式、必須特徴量、数値 domain、正規化ルールを確定するものではない。

`candidateVector` contract が定義されるまで、Core input adapter design / implementation には進まない。

## 6. MDR-004 `budgetFit` Decision

```txt
Decision ID: MDR-004
Field: budgetFit
Decision: Accepted
Production Source: validated user budget input と、local manual catalog item に紐づく validated comparison price
Validation Rule: budget input と comparison price が検証済みであり、専用 budgetFit evaluator で Core 向け budgetFit を生成できること
Missing / Invalid Handling: 予算または比較対象価格が未入力・不正・不足、または evaluator 不可の場合は Core input 生成を停止する
Rejected Alternatives:
- 価格メモや予算メモの生文字列を budgetFit として直接扱う
- price memo のみで budgetFit を確定する
- 外部相場 API や AI 推定価格を必須 source にする
- dummy / neutral / placeholder で補完する
Reason: 表示用メモと Production budgetFit を分離し、検証済み予算と比較対象価格から評価するため
Impact: budgetFit 生成には budget validation、comparison price contract、専用 evaluator 設計が必要
Remaining Dependency: 価格種別、比較ルール、許容範囲、通貨、税込・送料・割引時の扱い
```

この Decision は `budgetFit` の Production source 方針の採用であり、価格種別、比較ルール、許容範囲、通貨、税込・送料・割引時の扱いを確定するものではない。

`budgetFit` contract が定義されるまで、Core input adapter design / implementation には進まない。

## 7. Rejected Alternatives

次の代替案は Production 方針として明確に棄却する。

| Field | Rejected alternative | Reason |
| --- | --- | --- |
| `candidateVector` | UI タグや好みタグを `candidateVector` として直接採用する | categorical input と catalog feature vector の責務を混同する |
| `candidateVector` | `preferenceProfile` 用 tag ids を `candidateVector` として流用する | user preference source と sneaker feature source を分離できない |
| `candidateVector` | AI / 外部 API / 外部 DB による特徴量生成を必須 source にする | 採用された source は local manual catalog item に紐づく手動管理 feature source である |
| `budgetFit` | 価格メモや予算メモの生文字列を `budgetFit` として直接採用する | validated amount と評価 contract を経由しない |
| `budgetFit` | price memo のみで `budgetFit` を確定する | validated user budget input との比較が欠ける |
| `budgetFit` | 外部相場 API や AI 推定価格を必須 source にする | 採用された source は local catalog の validated comparison price である |
| 両 field | dummy / sample / placeholder / neutral 値で不足を補完する | Production source と validation を満たさない値が Core input に混入する |

## 8. Impact on Existing MDR-001 / MDR-002

MDR-001 と MDR-002 の source 方針は再決定せず、WEB-11M-B の `Accepted` を維持する。

```txt
MDR-001 preferenceProfile source direction changed: No
MDR-002 sneakerId source direction changed: No
```

本工程による依存関係への影響は次のとおりである。

- MDR-003 は MDR-002 の local manual catalog id によって解決された catalog item を前提とする。
- MDR-004 は同じ catalog item に紐づく validated comparison price を前提とする。
- MDR-001 の normalized `preferenceProfile` と MDR-003 の `candidateVector` は、比較可能な numeric contract として整合させる必要がある。
- MDR-003 の `priceLevel` と MDR-004 の `budgetFit` は価格評価に影響するため、source、scale、責務を別々の仮定で補完してはならない。
- MDR-001 の mapper contract と MDR-002 の local catalog contract は、引き続き未確定である。

したがって、MDR-001 から MDR-004 の source 方針がすべて `Accepted` になっても、それだけでは dummy 値なしの full Core input は作成できない。

## 9. Adapter Readiness After These Decisions

MDR-003 と MDR-004 は `Accepted` である。ただし、これは Production source 方針の採用であり、full Core input 作成または adapter 実装が可能になったことを意味しない。

次の contract が未確定であるため、Core input adapter design は保留する。

```txt
preferenceProfile mapper contract: Not decided
local catalog contract: Not decided
candidateVector contract: Not decided
budgetFit contract: Not decided
```

readiness 判定:

```txt
Can proceed to Core input adapter design after MDR-001/002/003/004 only: No
Can proceed to Core input adapter implementation: No
Can create full Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
```

WEB-11S-A は Core input adapter 実装へ進む工程ではなく、adapter design に必要な最小 contract を整理する工程とする。MDR-001 から MDR-004 の source 方針が `Accepted` であることだけを根拠に、Core input adapter design / implementation へ直接進んではならない。

## 10. Final Judgment

```txt
MDR-003 candidateVector decided: Yes
MDR-004 budgetFit decided: Yes
MDR-001 preferenceProfile previously decided as source direction: Yes
MDR-002 sneakerId previously decided as source direction: Yes
Can proceed to Core input adapter design after MDR-001/002/003/004 only: No
Can proceed to Core input adapter implementation: No
Can create full Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
Recommended next: WEB-11S-A Core Input Adapter Minimal Contract and Design
```

Final Judgment:

`candidateVector` は、`sneakerId` で解決された local manual catalog item に紐づく手動管理 feature source から、専用 mapper で生成する方針を `Accepted` とする。

`budgetFit` は、validated user budget input と local manual catalog item に紐づく validated comparison price を、専用 evaluator で評価して生成する方針を `Accepted` とする。

一方で、`preferenceProfile` mapper、local catalog、`candidateVector`、`budgetFit` の各 contract は未確定である。したがって、Core input adapter design、adapter implementation、dummy 値なしの full Core input 作成、`recommendSneakers` 接続、Result UI 作成には進まない。
