# WEB-11Q-A: Figma Mobile Home and Candidate Flow Alignment Spec

## 1. Purpose

FigmaのモバイルUI案を参考に、SOLE//MATRIXのHome画面とCandidate Flow入口を、現在のPrototype方針と矛盾しない範囲で整えるための実装境界を定める。

WEB-11Q-Aでは実装を行わない。Figma案のうち採用する範囲、採用しない範囲、HomeとCandidate Flowを分けた次工程だけを決定する。

このSpecはCore input実装、`recommendSneakers`接続、Result UI、推薦結果画面、購入判断画面を対象としない。

## 2. Current State

現在のPrototypeでは、Candidate Flowで候補情報を入力し、その後に入力内容の整理状態を示す`PrototypeReadinessPanel`を表示している。

`PrototypeReadinessPanel`は次の3カード構成に整理済みである。

1. 推薦準備チェック
2. 受け取った入力
3. 次に確認すること

現在の境界は次のとおりである。

- 入力内容と準備状態だけを表示する。
- 推薦結果、順位、スコア、おすすめ、購入判断を表示しない。
- 価格メモと予算メモは金額として評価せず、入力の有無だけを扱う。
- `recommendSneakers`へ接続していない。
- Core inputを作成していない。
- `preferenceProfile`、`sneakerId`、`candidateVector`、`budgetFit`のProduction方針は未確定である。

したがって、Home画面とCandidate Flow入口を調整する場合も、このPrototype / UI Laneの境界を維持する。

## 3. Figma Reference Summary

主な参照対象は次のモバイル案である。

```txt
Home / Mobile
Candidate Sneaker Check / Mobile
Preparation Check / Mobile
```

Figmaからは、次の視覚的・構造的な考え方を参考にする。

- 主要メッセージを画面上部で短く伝える構成。
- 目的ごとに情報を分けるカード構成。
- カード間とセクション間に明確な余白を設ける構成。
- モバイル幅で読み進めやすい情報密度。
- Primary CTAと補助説明の優先順位が分かる導線。
- Candidate入力からPreparation Checkへ段階的に進む流れ。

Figmaは完成したProduction画面やResult UIの仕様として扱わない。既存Web実装へ反映する際のレイアウト、密度、情報階層の参考資料として扱う。

## 4. Adopted Direction

次の方向性を採用する。

- Home画面は「買う前に、気持ちと理由を整える。」を主軸にする。
- Candidate導線は「気になる一足を整理する」に寄せる。
- 価格比較や購入判断ではなく、現段階では情報整理の入口として見せる。
- Figmaのカード構成、余白、モバイル密度を参考にする。
- Homeでは、サービスの目的と開始できる行動を短く伝える。
- Candidate Flow入口では、入力後に推薦結果が得られるような期待を作らず、気になる一足の情報を順に整理する体験として案内する。
- Preparation Checkは、既存の`PrototypeReadinessPanel`と同じく、入力内容の整理状態を確認する段階として扱う。

## 5. Non-Adopted Direction

次の方向性は採用しない。

- Figmaの完全再現。
- Result UIの作成。
- 推薦結果画面の作成。
- 購入判断画面の作成。
- `recommendSneakers`への接続。
- Core inputの作成。
- Home画面でのスコア、順位、おすすめの表示。
- Candidate Flow入口で推薦や購入判断の完了を期待させる表現。
- Figma上の要素を根拠に、価格、在庫、真贋、プレ値の取得・評価機能を追加すること。

価格、在庫、真贋、プレ値をアプリ全体で永久に扱わないとは定義しない。今回のPrototypeと次のUI調整工程で扱わない範囲として限定する。

## 6. Home Copy Policy

Home画面のメインコピー候補は次とする。

```txt
買う前に、気持ちと理由を整える。
```

このコピーは、SOLE//MATRIXを価格比較、ランキング、即時推薦、購入判定のサービスとして見せるのではなく、ユーザーが気になる一足と向き合うための整理体験として伝える。

Homeの補助文は、次の方針で作成する。

- 気持ち、理由、候補情報を整理できることを伝える。
- 推薦結果がすぐに表示されるとは伝えない。
- 購入の正解や買うべき一足を断定しない。
- Core、Production、内部データなどの開発者向け用語を使わない。
- モバイル画面で説明量が過剰にならないよう、短い本文と明確なCTAに分ける。

HomeのCTAはCandidate Flowへの入口として扱い、結果画面や購入判断への直接導線として扱わない。

## 7. Candidate Flow Entry Policy

Candidate Flowの入口では、次の文言を主候補とする。

```txt
気になる一足を整理する
```

補足文の主候補は次とする。

```txt
今は購入判断ではなく、気になる一足の情報整理に集中します。
```

Candidate Flow入口は、次の方針で構成する。

- 入力対象が「気になる一足」であることを明確にする。
- 一度にすべての判断材料を求めず、現在の入力項目を段階的に整理する。
- 入力後に表示されるPreparation Checkは推薦結果ではなく、整理状態の確認であることを導線全体で一貫させる。
- CTAに「おすすめを見る」「購入判定する」「スコアを確認する」などの結果を約束する表現を使わない。
- Candidate Flowのシェル、カード、進行表示、余白はFigmaのモバイル密度を参考にできる。
- 入力項目の意味、Core変換、Production値生成はこの導線調整に含めない。

## 8. Price / Stock / Authenticity / Resale Wording Policy

価格、在庫、真贋、プレ値について、次の絶対表現は使用しない。

```txt
価格・在庫・真贋・プレ値は扱いません
```

この表現はアプリ全体の将来スコープまで否定するため、今回のPrototype境界を説明する文言として強すぎる。

範囲を明示する必要がある場合は、次のように限定する。

```txt
このプロトタイプでは、価格・在庫・真贋・プレ値は扱いません。
```

ただし、ユーザー向けには機能不足を列挙するより、現在の目的を伝える次の表現を優先する。

```txt
今は購入判断ではなく、気になる一足の情報整理に集中します。
```

次工程でも、価格や予算の入力を価格比較、相場評価、予算適合、購入可否へ変換しない。在庫確認、真贋判定、プレ値評価を新たに追加しない。

## 9. Relationship With Prototype Readiness Panel

`PrototypeReadinessPanel`はCandidate Flowの後段にあるPreparation Checkとして維持する。

HomeとCandidate Flow入口は、ユーザーを次の順序で案内する。

```txt
Home
  -> 気になる一足を整理する
  -> Candidate Flowで情報を入力する
  -> 推薦準備チェックで整理状態を確認する
```

HomeやCandidate Flow入口を調整しても、`PrototypeReadinessPanel`の役割を推薦結果へ変更しない。

次の既存境界を維持する。

- 「現在は推薦結果ではありません。」という位置づけ。
- 入力内容の再掲を抑えた3カード構成。
- 価格メモと予算メモを入力有無として扱う方針。
- 診断回答を確定済みのProduction情報として扱わない方針。
- 推薦機能への未接続と、今後確認する内容を示す方針。

HomeのメインコピーとCandidate導線は、パネルの「入力内容の整理状態を表示する」という役割へ自然につながる必要がある。

## 10. Allowed Future Implementation Scope

このSpecのレビュー後、次工程で実装してよい範囲は次のとおりである。

### Home

- メインコピーと補助文の調整。
- Candidate Flowへ進むCTAのラベルと配置の調整。
- Figmaを参考にしたカード構成、余白、タイポグラフィ、モバイル密度の調整。
- 現在のPrototype範囲を短く説明する表示。
- 既存の画面遷移や表示状態を壊さない範囲のシェル調整。

### Candidate Flow

- 「気になる一足を整理する」を主軸にした入口コピーの調整。
- Candidate Flow全体のシェル、ヘッダー、カード、進行表示、CTA配置、余白の調整。
- Preparation Checkへ自然につなぐ説明の調整。
- 既存入力内容と既存Prototype状態だけを利用する表示調整。

どちらの工程でも、`recommendSneakers`には接続しない。Core inputやProduction値を作らず、結果表示へ拡張しない。

## 11. Forbidden Future Implementation Scope

WEB-11Q-BおよびWEB-11Q-Cでは、次を禁止する。

- `recommendSneakers`のimportまたは実行。
- Core inputまたはCore input assemblerの作成。
- `preferenceProfile`、`sneakerId`、`candidateVector`、`budgetFit`の生成。
- dummy値、sample値、仮値による不足項目の補完。
- Result UI、推薦結果画面、購入判断画面の作成。
- おすすめスニーカー、ランキング、スコア、PersonalFit Score、購入判断の表示。
- 価格比較、価格適合、在庫確認、真贋判定、プレ値評価の実装。
- API、Backend、DB、外部データ取得、AI接続の追加。
- HomeまたはCandidate Flowを、入力整理ではなく推薦完了体験として見せること。

Figmaに同様の表示がある場合でも、現在のPrototype境界を越える要素は採用しない。

## 12. Recommended Next Steps

次工程を次の2つに分ける。

```txt
WEB-11Q-B: Implement Home Screen Mobile Alignment
WEB-11Q-C: Candidate Flow Shell Alignment
```

### WEB-11Q-B

Home画面のコピー、カード構成、余白、CTA、モバイル密度を調整する。主軸は「買う前に、気持ちと理由を整える。」とし、Candidate Flowへの入口を「気になる一足を整理する」に寄せる。

この工程では`recommendSneakers`へ接続せず、Core input、Result UI、購入判断を作らない。

### WEB-11Q-C

Candidate Flowの入口コピー、シェル、カード、進行表示、CTA配置、Preparation Checkへの接続感を調整する。既存の入力内容とPrototype表示の境界を維持する。

Home調整後に続けて実施しても、独立した工程として実施してもよい。この工程でも`recommendSneakers`へ接続せず、Core input、Result UI、購入判断を作らない。

推奨順序はWEB-11Q-Bの後にWEB-11Q-Cとする。先にHomeでサービスの主軸と入口表現を確定すると、Candidate Flow側のコピーと情報階層を合わせやすいためである。

## 13. Final Judgment

```txt
Can proceed to Figma-aligned Home implementation: Yes, after this Spec is reviewed
Can proceed to Candidate Flow shell alignment: Yes, after Home alignment or as a separate step
Can proceed to Core input implementation: No
Can call recommendSneakers: No
Can create Result UI: No
Recommended next: WEB-11Q-B
```
