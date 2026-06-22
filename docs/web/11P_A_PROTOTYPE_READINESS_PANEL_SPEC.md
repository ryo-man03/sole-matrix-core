# WEB-11P-A: Prototype Readiness Panel Spec

## 1. WEB-11P-Aの目的

Production Core Laneから明確に分離されたPrototype / UI Laneとして、入力内容の整理状態を確認するパネルの表示仕様を定める。

この工程では画面を実装しない。`recommendSneakers`へ接続せず、Core inputを作らず、推薦結果やResult UIにも見えない「推薦準備チェック」の画面名、注意文、カード構成、表示境界を確定する。

## 2. 前提となるWEB-11A結論

WEB-11Aの結論を次のとおり引き継ぐ。

```txt
Production Core input implementation:
No

Prototype UI implementation:
Yes, if clearly separated

Can call recommendSneakers:
No
```

Production Core Laneでは、次の4項目に必要なsource、変換、validation、owner decisionが未確定である。

```txt
preferenceProfile
sneakerId
candidateVector
budgetFit
```

したがって、Prototype表示からこれらを生成、推測、代用、計算してはならない。

## 3. Prototype / UI Laneの制約

Prototype / UI Laneでは、次の条件をすべて守る。

- `recommendSneakers`をimportまたは呼び出さない。
- Core inputを設計、生成、組み立て、変換しない。
- Result UIとして見せない。
- 推薦結果として見せない。
- おすすめ、順位、スコア、購入判断を表示しない。
- dummy値、sample値、仮値をProduction値として扱わない。
- Prototypeの表示データをProduction Core Laneへ渡さない。
- Production Coreの正式名をPrototypeの型名、関数名、ファイル名、内部データ名に使わない。

Prototype側で内部識別や表示状態が必要な場合は、Coreと分離した名前を使う。

```txt
prototypeCandidateKey
displayCandidateKey
prototypeBudgetNote
prototypePreferenceSummary
prototypeReadinessState
```

## 4. 画面名

```txt
推薦準備チェック
```

「推薦結果」「おすすめスニーカー」「PersonalFit Score」など、推薦処理が完了したように見える画面名や見出しへ変更してはならない。

## 5. 画面の注意文

画面上部のタイトル直下に、次の2文を常時表示する。

```txt
現在は推薦結果ではありません。
入力内容の整理状態を表示しています。
```

注意文はカードの開閉状態や入力有無にかかわらず表示し、推薦機能への接続前であることをユーザーが誤認しない位置に置く。

## 6. 表示カード構成

最低限、次の5カードで構成する。

| Card | Purpose | Allowed content | Forbidden content | Example copy |
| --- | --- | --- | --- | --- |
| 1. 推薦準備チェック | 画面の目的と現在の境界を最初に伝える | 画面名、必須注意文、`未接続`、`Prototype表示のみ` | 推薦可能、Core接続済み、推薦結果、おすすめ、スコア | `現在は推薦結果ではありません。入力内容の整理状態を表示しています。` |
| 2. 確認できた入力 | ユーザーが入力済みの内容を整理して示す | 入力された候補名、選択されたタグ、価格メモ・予算メモの入力有無、診断回答の有無 | Core inputのfield名、数値化した特徴、価格適合度、推薦順位 | `候補名と選択したタグを確認できました。` |
| 3. 確認が必要な項目 | 未入力または意味の確認が残る内容を示す | 未回答の有無、価格・予算メモの確認要否、Production判断が残る旨 | 未回答の仮補完、neutral扱い、通貨や金額の推測、購入判断 | `予算メモの内容は、今後の仕様決定で確認が必要です。` |
| 4. まだ未接続の項目 | PrototypeとProduction Coreが分離されていることを示す | Core接続が未完了であること、Production未承認、準備中 | 接続済み、計算済み、推薦可能、Coreで算出したように見える値 | `推薦機能には未接続です。Production側の判断が残っています。` |
| 5. 次に決めること | 次工程で必要な判断をユーザー向けに簡潔に示す | 入力の意味、候補の識別方針、特徴情報のsource、価格・予算の扱いを今後決める旨 | Production方式の仮決定、実装済みの表現、スコア計算方針の断定 | `候補の識別方法と、価格・予算情報の扱いを次に決めます。` |

表示順は原則として表の順序とする。カード2から4は、該当情報がない場合でも非表示にして境界を隠すのではなく、`確認が必要`、`未接続`、`準備中`などの状態を示す。

## 7. 表示してよい情報

Prototype表示として、次の情報を表示してよい。

- 入力された候補名。
- 選択されたタグの表示名。
- 価格メモが入力されているかどうか。
- 予算メモが入力されているかどうか。
- 診断回答があるかどうか。
- 未回答または確認が必要な入力があること。
- Core接続がまだ未完了であること。
- Production判断が残っていること。
- Prototype表示だけであり、推薦結果ではないこと。

表示時のルール:

- 候補名とタグは、ユーザーが入力または選択した内容の確認表示として扱う。
- 価格・予算はメモの内容または入力有無として扱い、数値へ変換しない。
- 診断回答は回答の有無または入力内容の要約として扱い、Production用のprofileへ変換しない。
- タグは非数値の参考表示に限定し、特徴軸やスコアへ変換しない。
- 一時的な表示識別子が必要な場合は、Core正式名ではないPrototype専用名を使う。

## 8. 表示してはいけない情報

次の情報は表示してはならない。

- 推薦順位。
- 推薦スコア。
- PersonalFit Score。
- おすすめスニーカー。
- 購入すべき、買わないべきなどの購入判断。
- Coreで計算したように見える値。
- `candidateVector`風の数値または軸別数値。
- `budgetFit`風の数値、割合、適合判定。
- Production `sneakerId`。
- Production `preferenceProfile`。
- 仮値、dummy値、sample値を使った計算結果。
- 「推薦可能」「購入推奨」「スコア算出済み」「Core接続済み」などの完了断定。

入力された価格や予算が数値に見える場合でも、PrototypeではCore用の値、推薦スコア、購入判断へ変換しない。

## 9. 文言案

### 9.1 基本文言

| Use | Copy |
| --- | --- |
| 画面タイトル | `推薦準備チェック` |
| 必須注意文1 | `現在は推薦結果ではありません。` |
| 必須注意文2 | `入力内容の整理状態を表示しています。` |
| 入力確認 | `入力された候補名とタグを確認できました。` |
| 診断回答あり | `診断回答が入力されています。` |
| 価格メモあり | `価格メモが入力されています。` |
| 予算メモあり | `予算メモが入力されています。` |
| 要確認 | `入力内容に確認が必要な項目があります。` |
| 未接続 | `推薦機能にはまだ接続されていません。` |
| Production判断待ち | `Production側で決める必要がある項目が残っています。` |
| 次工程 | `表示内容を確認したうえで、次の実装範囲を決めます。` |

### 9.2 使用可能な短い見出し

```txt
確認できた入力
確認が必要な項目
まだ未接続の項目
次に決めること
候補
入力内容
整理状態
準備状況
参考表示
価格メモ
予算
```

### 9.3 使用禁止の断定表現

```txt
推薦可能
購入推奨
スコア算出済み
Core接続済み
あなたへのおすすめ
おすすめ順位
購入判定
```

## 10. 状態ラベル案

| Label | Meaning | Usage rule |
| --- | --- | --- |
| `確認済み` | 入力または選択内容を表示上確認できた | 入力の存在確認に限って使い、Production妥当性の承認を意味させない |
| `確認が必要` | 未入力、意味、扱いのいずれかに確認が残る | 仮値で補完せず、そのまま確認待ちとして示す |
| `未接続` | 推薦機能へ接続していない | Core呼び出しがないことを示す |
| `準備中` | 表示または方針の整理途中である | 推薦計算中という意味では使わない |
| `Production未承認` | Production側の正式な方針決定が残る | Prototype入力の誤用防止に使う |
| `Prototype表示のみ` | 表示検証専用である | Productionデータや推薦結果ではないことを示す |

状態ラベルは、入力の存在、整理状態、接続境界だけを表す。推薦可否、購入可否、計算完了を表してはならない。

## 11. WEB-11P-B実装時の候補ファイル

次のパスは、WEB-10Cまでに確認済みの構成と既存docsに基づく候補であり、正確な変更対象ではない。WEB-11P-B開始時に許可された範囲で構成を確認し、対象を確定する。

| Candidate | Expected role | Status |
| --- | --- | --- |
| `app/_components/CandidateSneakerCheckFlow.tsx` | 既存の候補入力フローからパネルを表示する場合の組み込み候補 | 候補。変更要否はWEB-11P-Bで確認 |
| `app/_components/PrototypeReadinessPanel.tsx` | 5カードと注意文を持つPrototype専用表示コンポーネントの新規候補 | 候補。ファイル名と配置はWEB-11P-Bで確定 |
| `app/_lib/prototype-readiness/types.ts` | Prototype専用の表示状態が必要な場合の型配置候補 | 候補。不要なら作成しない |
| `app/_lib/prototype-readiness/buildPrototypeReadinessState.ts` | 入力済み・要確認・未接続の表示状態だけを整理する処理の候補 | 候補。Core inputへの変換処理にはしない |

既存route、page、親componentの追加調査が必要な場合は、WEB-11P-Bで行う。この仕様工程では`app/**`または`src/**`を調査せず、候補を確定扱いしない。

Prototype実装の型名、関数名、ファイル名、内部データ名には、次のProduction Core正式名を使用しない。

```txt
RecommendSneakersInput
CoreInput
SneakerCandidate
PreferenceProfile
SneakerVector
budgetFit
sneakerId
```

## 12. WEB-11P-B実装時の禁止事項

WEB-11P-Bでは、次の事項を禁止する。

- `recommendSneakers`へ接続する。
- Core inputを作る。
- Core input assemblerを作る。
- Production用の未確定値を生成する。
- Result UIとして見せる。
- 「推薦結果」と表示する。
- おすすめ、順位、スコア、購入判断を表示する。
- タグから数値特徴を生成する。
- 価格・予算メモから数値適合度を生成する。
- 診断回答からProduction用のprofileを生成する。
- Prototype専用データをProduction Core Laneへ渡す。

WEB-11P-Bでも表示名は「推薦準備チェック」とし、次の注意文を維持する。

```txt
現在は推薦結果ではありません。
入力内容の整理状態を表示しています。
```

## 13. Recommended Next

```txt
Recommended next:
WEB-11P-B: Implement Prototype Readiness Panel
```

WEB-11P-Bは、次の条件を維持する場合に限って進める。

```txt
recommendSneakersへ接続しない
Core inputを作らない
Result UIとして見せない
「推薦結果」ではなく「推薦準備チェック」と表示する
```

## 14. 最終判断

```txt
Can proceed to Production Core input implementation:
No

Can proceed to Prototype Readiness Panel implementation:
Yes, if this spec is reviewed and kept separate

Can call recommendSneakers:
No
```

## 15. Commit / Push

WEB-11P-Aでは通常の`git add`、commit、pushを行わない。仕様書の作成と差分確認までで停止する。
