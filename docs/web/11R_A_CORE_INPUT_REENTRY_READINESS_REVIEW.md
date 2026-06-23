# WEB-11R-A: Core Input Re-entry Readiness Review

## 1. Purpose

WEB-11Q完了後、UIが整ったこととCore inputが作れることを分けて確認し、Production Core Laneへ戻れる状態かを判定する。

本工程はReview / Readiness確認のみであり、Core input assembler、`recommendSneakers`接続、Result UI、推薦結果画面、購入判断画面を実装しない。

## 2. Current State

```txt
Reviewed commit: 9d897cc docs: summarize mobile ui alignment
Branch: main
Working tree at review start: clean
WEB-11Q: Complete
```

WEB-10Cで残った次の4項目は、いずれもCore inputに必須で、安全な省略経路がなく、WEB-11AでもProduction利用不可のままである。

```txt
preferenceProfile
sneakerId
candidateVector
budgetFit
```

WEB-11QはUI境界を整理した工程であり、Core input不足値を解決した工程ではない。UIが整ったこととCore inputが作れることは別問題である。

## 3. UI changes from WEB-11Q

WEB-11Qでは、HomeからCandidate Flow、入力確認、推薦準備チェックまでのモバイル向け導線、コピー、情報階層、進行表示を整理した。

現在のCandidate Flowが受け取る主な情報は、候補名、ブランド、価格メモ、予算メモ、自由メモ、選択タグである。推薦準備チェックは、それらの内容をCore値へ変換せず、入力あり／なし、選択あり／なしとして表示する。

推薦準備チェックはResult UIではなく、Prototype / UI Laneの入力整理状態表示である。WEB-11Qでは入力項目の意味、Core変換規則、Production値生成、推薦ロジックを変更していない。

## 4. Remaining Core input blockers

| Field | Current blocker | Status |
| --- | --- | --- |
| `preferenceProfile` | 診断回答と必須profile fieldの対応、未回答処理、数値domain、policy、confidence、metadata、validationが未確定 | Blocking / Unresolved |
| `sneakerId` | Production identityのsource、安定性、uniqueness、format、collision、失敗時の扱いが未確定 | Blocking / Unresolved |
| `candidateVector` | 8次元のtrusted source、range、normalization、validation、欠損時の扱いが未確定 | Blocking / Unresolved |
| `budgetFit` | 価格・予算文字列の意味、通貨、税込・送料、金額形式、計算式、domain、invalid時の扱いが未確定 | Blocking / Unresolved |

4項目とも、WEB-10CおよびWEB-11Aから解決状況は変わっていない。Core型やCore実装の追加確認が必要になるのは、owner decision後にcontractとadapter設計を確定する工程であり、今回のReviewでは実装へ進まない。

## 5. Can UI data resolve them?

| UI data | 解決できること | 解決できないこと |
| --- | --- | --- |
| 候補名・ブランド | 候補の表示と入力確認 | 承認済みProduction `sneakerId`の生成 |
| 選択タグ | 候補タグの整理、既存の安全なタグmapping | 8次元`candidateVector`の数値生成 |
| 価格メモ・予算メモ | 入力有無と原文の確認 | 数値`budgetFit`、`priceLevel`、通貨・金額評価 |
| 自由メモ | ユーザー入力の保持と確認 | Core fieldへの無承認変換 |
| 診断回答の状態表示 | 診断入力の有無または別画面での整理予定の表示 | 完全な`preferenceProfile`の生成 |

したがって、WEB-11QのUI入力で4 blockerを解決できるものはない。UI情報は将来のsource候補や表示情報にはなり得るが、Production変換規則の承認なしにCore値として使用できない。

dummy値、sample値、仮値でCore inputを補完してはいけない。候補名からのslug／hash、random ID、タグからの数値vector、価格文字列の暫定parse、未回答のneutral扱いも行ってはいけない。

## 6. Risk if connecting now

現時点でCore inputを組み立てると、必須値を欠落させるか、未承認の推測値で補完する必要がある。これは候補identityの不安定化、`NaN`や不正なscore、意味のない比較、推薦結果に見える誤表示につながる。

そのため、`recommendSneakers`へ直接接続してはいけない。Result UIへ直接進んではいけない。推薦準備チェックを推薦結果として扱うこともできない。

## 7. Final Judgment

WEB-11Q完了によりPrototype / UI Laneの境界は明確になったが、Production Core Laneへ戻るための4項目のowner decision、source、contract、変換規則、validationは未確定である。Core input実装の再開条件は満たされていない。

Recommended nextは、Project owner / Core design ownerが4 blockerのProduction方針を確定し、各項目のsource、完全なcontract、変換規則、validation、失敗時の扱いを文書化する`WEB-11R-B Core Input Blocker Owner Decision and Contract Review`である。

```txt
Can proceed to Core input implementation: No
Can create Core input without dummy values: No
Can call recommendSneakers: No
Can create Result UI: No
Recommended next: WEB-11R-B Core Input Blocker Owner Decision and Contract Review
```
