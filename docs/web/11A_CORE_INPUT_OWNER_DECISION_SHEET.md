# WEB-11A: Core Input Owner Decision Sheet Lite

## 1. Purpose

WEB-10Cで `Blocking / Unresolved` と判定された4項目について、Production Core LaneとPrototype / UI Laneを分離し、Project ownerが次の判断を行うためのDecision Sheetに整理する。

対象:

```txt
preferenceProfile
sneakerId
candidateVector
budgetFit
```

前提:

- WEB-10Cの結論を採用し、同じEvidenceの再調査は行わない。
- 4項目はすべてProduction Core inputの必須項目であり、安全な省略経路は確認されていない。
- 未承認値、dummy値、仮値からCore inputを組み立てない。

## 2. Lane Separation

### Production Core Lane

`recommendSneakers`へ渡す本物のCore inputに関係する。未承認値、dummy値、仮値を渡さない。4項目のProduction方針が承認されるまで、Core inputの設計・実装・組み立て・呼び出しを行わない。

### Prototype / UI Lane

画面検証や説明表示だけに使う。`recommendSneakers`へ渡さない。Core inputとは呼ばない。推薦結果とは表示しない。

ユーザー向けには、必要に応じて次の表現を使う。

```txt
推薦準備チェック
現在は推薦結果ではありません
入力内容の整理状態を表示しています
未接続
準備中
参考表示
予算
価格メモ
候補
入力内容
整理状態
準備状況
```

Prototype / UI Laneでは、次のCore正式名を型名・関数名・ファイル名・内部データ名として使用しない。

```txt
RecommendSneakersInput
CoreInput
SneakerCandidate
PreferenceProfile
SneakerVector
budgetFit
sneakerId
```

内部識別が必要な場合は、`prototypeCandidateKey`、`displayCandidateKey`、`prototypeBudgetNote`、`prototypePreferenceSummary`、`prototypeReadinessState`のようにCoreと分離した名前を使う。

## 3. Owner Decision Table

| Field | WEB-10C status | Production recommendation | Prototype recommendation | Adopt for Production now? | Prototype allowed? | Owner decision needed? | Reason | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `preferenceProfile` | Blocking / Unresolved | No. WEB-05回答から直ちに生成しない | Yes. 診断内容の整理状態だけを表示する | No | Yes, if clearly separated | Yes | 8問回答とCore各fieldの対応、未回答処理、数値化、metadataが未確定 | Project ownerとCore design ownerが完全なmapping方針を決める |
| `sneakerId` | Blocking / Unresolved | Owner decision required. 承認前にID方式を実装しない | Yes. UI表示・リスト管理用の一時keyは使用可能 | No, pending owner approval | Yes, if renamed | Yes | identityのsource、安定性、uniqueness、format、collision方針が未確定 | Project ownerがProduction identity policyを選ぶ |
| `candidateVector` | Blocking / Unresolved | No. タグや入力文から数値vectorを生成しない | Yes. タグや入力内容から特徴傾向を参考表示する | No | Yes, if non-numeric and clearly separated | Yes | 8次元のtrusted source、range、normalization、validationが未確定 | curated data、manual input、approved sourceのどれを使うか決める |
| `budgetFit` | Blocking / Unresolved | No. 価格・予算文字列から直ちに計算しない | Yes. 予算情報の確認状態や価格メモを表示する | No | Yes, if clearly separated | Yes | 価格文字列の意味、通貨、税込、送料、予算判定式が未確定 | Project ownerとCore design ownerが意味、source、計算式を決める |

## 4. Field Detail

### `preferenceProfile`

```txt
Current blocker:
WEB-05の8問回答だけでは、必須profile全体のfield対応、未回答処理、数値domain、policy、confidence、metadataを確定できない。

Production decision:
現時点では採用しない。回答からProduction値を推測しない。

Prototype allowed:
「診断結果を整理中」「推薦準備中」など、入力内容の整理状態だけを表示してよい。

Forbidden shortcut:
like / neutral / dislikeへの仮数値割り当て、未回答をneutral扱い、部分profileやdummy profileの作成。

Owner decision:
8問回答のfield対応、複数fieldへの影響、未回答処理、数値化、必須metadataを決める。

Next action:
Productionを進める場合は、完全なprofile contractとvalidation方針を承認する。
```

### `sneakerId`

```txt
Current blocker:
Production identityのsource、安定性、uniqueness、format、collision behaviorが未確定。

Production decision:
Project owner承認まで実装しない。

Prototype allowed:
UI表示やリスト管理専用の一時keyを、Core名ではない別名で使用してよい。

Forbidden shortcut:
slug、hash、random、uuid、array index、空文字、placeholderをProduction方式として勝手に採用する。

Owner decision:
caller-provided、external、deterministic local、temporary、その他のidentity policyから選び、適用範囲を決める。

Next action:
Production identity policyと失敗時の扱いを承認する。
```

### `candidateVector`

```txt
Current blocker:
8次元の数値source、domain、normalization、validation、欠損時の扱いが未確定。

Production decision:
タグや自由入力からProduction数値vectorを生成しない。

Prototype allowed:
タグや入力内容をもとに「特徴傾向」を非数値の参考情報として表示してよい。

Forbidden shortcut:
タグを数値へ変換する、1つのタグを複数axisへ展開する、sample値やdummy値を流用する。

Owner decision:
curated data、manual input、approved sourceのいずれを採用するか決める。

Next action:
全8次元についてsource、range、normalization、validationを承認する。
```

### `budgetFit`

```txt
Current blocker:
seenPriceText / budgetTextの意味、通貨、税込・送料、金額形式、数値化、判定式が未確定。

Production decision:
現在の文字列からProduction値を計算しない。

Prototype allowed:
「予算情報は確認中」「価格・予算メモあり」などの状態表示を行ってよい。

Forbidden shortcut:
汎用number parse、通貨の仮定、欠損を0扱い、1や100などのdefault、暫定ratioの計算。

Owner decision:
明示的なnormalized scoreを入力するか、価格・予算から計算するかを決め、意味と式を定義する。

Next action:
source、通貨・金額semantics、計算式、domain、invalid時の扱いを承認する。
```

## 5. Implementation Boundary

| Item | Production Core Lane | Prototype / UI Lane | Notes |
| --- | --- | --- | --- |
| `preferenceProfile` | Not allowed | 状態・要約表示のみ可 | PrototypeではCore正式名を使わない |
| `sneakerId` | Not allowed pending owner decision | 表示・リスト管理用の一時keyのみ可 | `prototypeCandidateKey`などを使う |
| `candidateVector` | Not allowed | 非数値の特徴傾向表示のみ可 | タグからCore数値を作らない |
| `budgetFit` | Not allowed | 予算確認状態・価格メモ表示のみ可 | Core正式名を使わず計算しない |
| Readiness Panel | Production Core機能としては作らない | Allowed | 「推薦準備チェック」と表示する |
| `recommendSneakers` call | Not allowed | Not allowed | Prototypeからも接続しない |
| Result UI | Not allowed | Not allowed | Readiness Panelを推薦結果として見せない |
| Core input assembler | Not allowed | Not allowed | Prototype dataをCore inputへ変換しない |

## 6. What May Proceed

### Production Core Lane

実装として進めてよいものはない。Project ownerによる4項目の方針確定と、その後のcontract・source・validationの文書化だけを進めてよい。

### Prototype / UI Lane

次の条件をすべて守る場合に限り、Readiness Panelの実装を進めてよい。

- 表示名は「推薦準備チェック」とする。
- 「現在は推薦結果ではありません」と明示する。
- 入力内容の整理状態・準備状況だけを表示する。
- Core正式名を内部名に使わない。
- `recommendSneakers`へ接続しない。
- Core inputを作らない。
- Result UIとして見せない。

## 7. Still Forbidden

- Production用の4項目の生成・推測・仮決定
- Core input assemblerの設計・実装
- `recommendSneakers`のimportまたは呼び出し
- Result UIまたは推薦結果を装う表示
- Prototype値のProduction利用
- dummy、sample、slug、hash、random、uuid、placeholderの無承認採用

## 8. Project Owner Decisions Required

1. `preferenceProfile`: 8問回答の対応先、未回答処理、数値化、完全なprofile metadata。
2. `sneakerId`: identity source、安定性、uniqueness、format、collision policy。
3. `candidateVector`: 8次元のtrusted source、domain、normalization、validation。
4. `budgetFit`: 値の意味、source、通貨・金額semantics、計算式、invalid時の扱い。

## 9. Recommended Next

選択肢:

```txt
Option A:
WEB-11B: Production Decisions Finalization
Project ownerが4項目のProduction方針をYes/Noで確定する。

Option B:
WEB-11P: Prototype Readiness Panel
Core未接続のまま、画面に「推薦準備チェック」を出す。
```

速度優先の推奨:

```txt
Recommended next:
WEB-11P: Prototype Readiness Panel
```

実施条件:

```txt
recommendSneakersへ接続しない
Core inputを作らない
Result UIとして見せない
「推薦結果」ではなく「推薦準備チェック」と表示する
```

## 10. Final Decision

```txt
Can proceed to Production Core input implementation:
No

Can proceed to Prototype UI implementation:
Yes, if clearly separated

Can call recommendSneakers:
No
```
