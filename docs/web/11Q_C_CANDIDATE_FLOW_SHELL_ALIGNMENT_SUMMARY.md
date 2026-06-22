# WEB-11Q-C: Candidate Flow Shell Alignment Summary

## 1. 実装目的

WEB-11Q-A の方針と WEB-11Q-B で整えた Home 画面に合わせて、Candidate Flow の見出し、説明文、進行表示、モバイル密度、推薦準備チェックへの接続を調整した。

今回の対象は Candidate Flow のシェル部分だけであり、入力項目の意味や推薦ロジックは変更していない。

## 2. 変更ファイル

```txt
app/_components/CandidateSneakerCheckFlow.tsx
app/globals.css
docs/web/11Q_C_CANDIDATE_FLOW_SHELL_ALIGNMENT_SUMMARY.md
```

## 3. 採用した Candidate Flow 見出し

```txt
気になる一足を整理する
```

## 4. 採用した説明文

```txt
気になる一足について、名前・理由・メモを順番に整理します。
今は購入判断や推薦結果ではなく、入力内容の整理に集中します。
```

Home の「買う前に、気持ちと理由を整える。」から、Candidate Flow の具体的な整理作業へ自然につながる文脈にした。

## 5. Candidate Flow の変更内容

- Flow Header をカード化し、目的と現在の境界を上部で短く伝える構成にした。
- 現在の Step 番号、Step 名、進捗バーを追加した。
- モバイルでは3つの Step 表示を横並びにし、縦方向の表示量を抑えた。
- Step 3 の入力確認が完了するまでは、推薦準備チェックを表示しない構成にした。
- 入力確認後に短い接続文を置き、推薦結果ではなく準備状態の確認へ進むことを伝えた。

## 6. Figma から参考にした点

- モバイル上部で現在の目的が分かる情報順序
- カード型の入力導線
- 現在地が分かる進行表示
- 余白を保ちながら縦に重くしすぎない情報密度
- 入力、確認、Preparation Check を段階的につなぐ構成
- 白基調と落ち着いた色調

Figma の完全再現ではなく、既存 Web 実装のシェル、余白、情報階層だけへ反映した。

## 7. 意図的に採用しなかった点

- Figma の完全再現
- Result UI
- 推薦結果画面
- 購入判断画面
- スコア、順位、ランキング、おすすめ表示
- PersonalFit Score
- 価格比較、在庫確認、真贋判定、プレ値評価
- API、Backend、DB、外部データ、AI 接続

## 8. 実装境界

- `PrototypeReadinessPanel` の文言、カード構成、責務は変更していない。
- `recommendSneakers` には接続していない。
- Core input と Core input assembler は作成していない。
- Result UI は作成していない。
- 購入判断、スコア、順位、ランキング、おすすめスニーカーは表示していない。
- package は追加していない。

## 9. 検証結果

```txt
pnpm test      # 14 files / 90 tests passed
pnpm typecheck # passed
pnpm web:build # passed
```

追加検索では、禁止された機能接続を示す識別子や、購入判断・スコア・順位・おすすめ表示に該当する文言は検出されなかった。

## 10. 次工程候補

Candidate Flow で受け取る入力項目と、将来の Core input との境界を別工程で仕様化する。
この工程では Core input の実装や `recommendSneakers` 接続へは進まない。
