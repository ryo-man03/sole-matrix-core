# WEB-11M-A: Minimal Decision Record for `preferenceProfile` and `sneakerId` Source / Validation

## 1. Purpose

WEB-11R-Cで未解決とされたCore inputのうち、次の2 fieldについて、既存docsで確定している内容だけを根拠に、Production sourceとvalidationのMinimal Decision Recordを作成する。

```txt
MDR-001: preferenceProfile source / validation decision
MDR-002: sneakerId source / validation decision
```

本記録はProduct方針を新規に決めるものではない。既存docsからProduction採用を確定できない場合は、候補方式を補完せず`Decision: Blocked`とし、必要なHuman decisionを明記する。

## 2. Current State

```txt
Reviewed commit: 5bc64aa docs: specify core input source validation gate
Branch: main
Working tree at review start: clean
WEB-11Q: Complete
WEB-11R-A: Complete
WEB-11R-B: Complete
WEB-11R-C: Complete
```

既存docsから確認できる状態:

- `preferenceProfile`と`sneakerId`はCore type上の必須fieldであり、安全な省略経路やruntime defaultは確認されていない。
- 現行UIは完全なProduction `preferenceProfile`を生成しない。
- 現行Candidate Flowは候補名とブランドを保持するが、Production `sneakerId`を生成しない。
- 両fieldともProduction source、validation rule、missing / invalid時の失敗方法が`Not decided`である。
- 現行UI入力だけでは、dummy値・sample値・placeholder値なしに完全なCore inputを作れない。

## 3. Scope

本工程で判断対象とするのは次の2 fieldだけである。

```txt
preferenceProfile
sneakerId
```

`candidateVector`と`budgetFit`は本工程では決定しない。依存関係と残存blockerだけを記録する。

本工程では、Core input adapter、Core input assembler、`recommendSneakers`接続、Result UI、購入判断画面、API、Backend、DB、外部データ取得、AI接続を実装しない。

## 4. Decision Authority

本記録が採用できるDecisionは、既存docsで確定している内容、または本工程の指示で明示された内容に限定する。

既存docsは候補方式と必要な承認事項を示しているが、`preferenceProfile`または`sneakerId`のProduction方式を採用済みとはしていない。Codexは次の事項を代理決定しない。

- 診断回答から完全な`preferenceProfile`を生成する方式
- callerが完全な`preferenceProfile`を渡す方式
- profileのnumeric domain、未回答処理、policy、confidence、metadata
- caller-provided、external、catalog、deterministic local、temporaryのいずれかを`sneakerId` sourceとする方式
- IDのscope、stability、uniqueness、format、collision policy

したがって、両MDRはHuman/Product ownerの承認が不足している場合に`Blocked`とする。

## 5. MDR-001 `preferenceProfile` Decision

```txt
Decision ID: MDR-001
Field: preferenceProfile
Decision: Blocked
Production Source: Not decided
Validation Rule: Not decided
Missing / Invalid Handling: Not decided
Rejected Alternatives: 診断回答またはUIタグの直接採用、like / neutral / dislikeへの仮数値割当、未回答のneutral・0扱い、partial profile、dummy・sample・placeholderによる不足fieldまたはmetadataの補完
Reason: 既存docsは完全なPreferenceProfileが必須であることを確認しているが、authoritative source、全必須field mapping、未回答処理、numeric domain、policy、source confidence、metadata、validation、failure policyを採用決定していない。
Required Human Decision: Project owner / Core design ownerが、(1) Production sourceをどの正規化済み入力または完全profileにするか、(2) UIタグ / 診断回答からpreferenceProfileへ変換するか、(3) 変換する場合は全field mapping、複数fieldへの影響、変換・validation責務をどの境界に置くか、(4) 未回答・不足・invalid時にCore input生成を停止するか、(5) accepted numeric domain、policy値、source confidence、userId、profileVersion、updatedAt、failure policy、最終承認者を決める。
Impact: preferenceProfileを安全に構築できないため、Core input adapter design、adapter implementation、完全なCore input生成、recommendSneakers接続へ進めない。
Remaining Dependency: MDR-001のHuman/Product owner承認に加え、本工程で決定しないcandidateVectorとbudgetFitのsource / validation decisionが必要。
```

`preferenceProfile`として有効であることを既存docsから確認できる最小条件は、完全な必須shapeに対してauthoritative sourceと検証規則があり、未回答・欠損・invalid値を自動補完せず決定的に失敗させられることである。しかし、その具体的なsource、domain、mapping、metadata policyは未決定である。

## 6. MDR-002 `sneakerId` Decision

```txt
Decision ID: MDR-002
Field: sneakerId
Decision: Blocked
Production Source: Not decided
Validation Rule: Not decided
Missing / Invalid Handling: Not decided
Rejected Alternatives: 候補名の文字列、候補名slug、brand + nameのhash、random値、UUID、array index、時刻、空文字、placeholder、UI表示用keyまたはReact list keyのProduction ID利用
Reason: 既存docsはsneakerIdが必須stringで推薦結果へ伝播することを確認しているが、authoritative identity source、scope、stability、uniqueness、format、collision、missing / invalid時の扱いを採用決定していない。
Required Human Decision: Project owner / implementation ownerが、(1) 正式なスニーカー識別子とauthoritative identity sourceを何にするか、(2) 候補名文字列からcanonical IDへ解決する仕組みを持つか、(3) 適用scope、stability、uniqueness、format、namespace、collision behaviorをどう定義するか、(4) 識別不能・欠損・invalid時にCore input生成を停止するか、(5) temporary candidateの可否とlifetime、failure policy、最終承認者を決める。
Impact: Production identityを安全に構築できないため、SneakerCandidate assembly、Core input adapter design、adapter implementation、完全なCore input生成、recommendSneakers接続へ進めない。
Remaining Dependency: MDR-002のHuman/Product owner承認に加え、本工程で決定しないcandidateVectorとbudgetFitのsource / validation decisionが必要。
```

`sneakerId`として有効であることを既存docsから確認できる最小条件は、承認済みsourceから取得したnon-empty IDであり、定義済みscope、stability、uniqueness、format、collision policyを満たし、欠損・invalid時にCore call前で失敗できることである。しかし、その具体的なidentity policyは未決定である。

## 7. Rejected Alternatives

| Field | Rejected alternative | Reason |
| --- | --- | --- |
| `preferenceProfile` | 診断回答やUIタグをそのままprofileとして扱う | 完全profile mapping、numeric domain、policy、confidence、metadataが未決定 |
| `preferenceProfile` | `like`、`neutral`、`dislike`へ仮数値を割り当てる | 承認済みmappingと値の意味がない |
| `preferenceProfile` | 未回答を`neutral`または0として補完する | 未回答とneutralを同一扱いするcontractがない |
| `preferenceProfile` | partial profile、dummy profile、sample metadataを利用する | Coreの完全な必須shapeとProduction sourceを満たさない |
| `sneakerId` | 候補名、slug、SKU、表示名、内部candidate keyを無承認で採用する | authoritative identity source、scope、stability、uniquenessが未決定 |
| `sneakerId` | `brand + name` hash、random、UUID、array index、時刻を採用する | ID生成方式、collision、lifetime、再現性が承認されていない |
| `sneakerId` | 空文字、placeholder、UI / React用一時keyを再利用する | Production identity contractを満たさない |
| 両field | 外部API、外部DB、AI、catalogを必須sourceとして仮定する | 採用前提とprovider contractが既存docsにない |

## 8. Impact on Remaining Fields

`candidateVector`と`budgetFit`は本工程では決定しない。

```txt
candidateVector decision in this step: No
budgetFit decision in this step: No
```

MDR-001とMDR-002が将来承認されても、完全なCore inputには次の依存が残る。

- `candidateVector`: 全8次元のauthoritative source、意味、domain、normalization、完全性、version / freshness、missing / invalid時の失敗方法
- `budgetFit`: 値の意味、authoritative source、明示scoreまたは計算値の選択、currency / amount semantics、formula、domain、rounding、missing / invalid時の失敗方法

また、`preferenceProfile`と`candidateVector`のnumeric domainは比較可能なcontractとして整合させる必要がある。`candidateVector.priceLevel`と`budgetFit`は両方が価格scoreへ影響するため、片方だけを仮決定してはならない。

## 9. Adapter Readiness After These Decisions

両MDRは`Blocked`であり、Production sourceとvalidationが確定していない。さらに、`candidateVector`と`budgetFit`も未決定のままである。

```txt
Can proceed to Core input adapter design after MDR-001/002 only: No
Can proceed to Core input adapter implementation: No
Can create full Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
```

Core typeとCore実装の追加確認が必要になる場合は、Human/Product decision後のadapter design工程で確認する。本工程ではCore実装ファイルを変更しない。

## 10. Final Judgment

```txt
MDR-001 preferenceProfile decided: Blocked
MDR-002 sneakerId decided: Blocked
candidateVector decided in this step: No
budgetFit decided in this step: No
Can proceed to Core input adapter design after MDR-001/002 only: No
Can proceed to Core input adapter implementation: No
Can create full Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
Recommended next: Human/Product Owner Decision for preferenceProfile and sneakerId
```

Final Judgment:

既存docsは、両fieldが必須であること、現行UIから安全に生成できないこと、危険な代替変換、承認に必要な最小項目までは確定している。一方、Production source、validation、missing / invalid handling、最終承認者は確定していない。

したがって、MDR-001とMDR-002をCodexが補完して`Accepted`にすることはできない。Human/Product ownerが必要事項を決定するまでCore input adapter設計を保留し、dummy値・sample値・placeholder値を使わず、`recommendSneakers`およびResult UIへ進まない。
