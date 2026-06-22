# WEB-11P-D: UI Copy and Layout Adjustment Summary

## 1. 目的

WEB-11P-Cの実画面レビュー結果を受けて、
`PrototypeReadinessPanel`が推薦結果に見えない状態を維持しながら、
文言と表示量を調整した。

Figmaの`06_PreparationCheck_Mobile`で示された情報密度を参考に、
入力の再掲を減らし、縦に長すぎない構成へ整理した。

## 2. 変更ファイル

```txt
app/_components/PrototypeReadinessPanel.tsx
docs/web/11P_D_UI_COPY_LAYOUT_ADJUSTMENT_SUMMARY.md
```

## 3. WEB-11P-Cで見つかった問題

- 5カード構成で表示が重かった。
- `CandidateCheckSummary`と候補名・タグなどの表示が重複していた。
- 「確認済み」が、推薦に必要な確認まで終わったように見えた。
- `Prototype`、`Production`、`Core`に関する表現がユーザー向けではなかった。

## 4. Figmaを参考にした点

- 「推薦準備チェック」を先頭に置いた。
- 5カードを3カードへ圧縮した。
- 入力一覧の重複を減らし、入力の有無や選択状態だけを表示した。
- 未入力、未接続、今後整理する内容を最後のカードへまとめた。
- 「現在は推薦結果ではありません。」を維持した。

Figmaの完全再現ではなく、既存Web実装の文言と表示量だけを調整している。

## 5. 実施した文言変更

- 「Prototype表示のみ」を「準備状態の確認」へ変更した。
- 「確認できた入力」を「受け取った入力」へ変更した。
- 「確認済み」を使わず、「入力あり」「選択あり」などの状態表示へ変更した。
- `Production`や`Core`に関する画面文言を、正式な推薦情報を整理中であることと、
  推薦機能へ未接続であることを伝える文言へ変更した。
- 診断回答をこの画面で確定したように見せず、「参考表示」とした。

## 6. カード構成の変更

変更前の5カードを、次の3カードへ整理した。

1. 推薦準備チェック
2. 受け取った入力
3. 次に確認すること

「まだ未接続の項目」と「次に決めること」は3枚目へ統合した。

## 7. 表示していない情報

- 候補名の文字列
- 選択したタグの一覧
- 価格メモ・予算メモの文字列
- 推薦結果
- おすすめスニーカー
- ランキング
- スコア
- PersonalFit Score
- 購入判断
- 推薦用の内部値

価格メモと予算メモは、金額文字列を表示せず、
「入力あり」「入力なし」の有無だけを表示している。

## 8. 実装境界

- `recommendSneakers`へ接続していない。
- Core inputを作っていない。
- Core input assemblerを作っていない。
- Result UIとして見せていない。
- 推薦結果、順位、スコア、購入判断を表示していない。
- packageを追加していない。

## 9. 検証結果

以下を実行し、すべて成功した。

```powershell
pnpm test      # 14 files / 90 tests passed
pnpm typecheck # passed
pnpm web:build # passed
git status --short --untracked-files=all
git diff --stat
git diff --name-status
git diff --check # passed
```

追加検索は該当なしだった。対象UIに、禁止された機能接続を示す識別子や、
強すぎる文言、開発者向け文言が残っていないことを確認した。

最終差分は、この文書を含む指定2ファイルだけである。

## 10. Commit / Push

この工程ではcommit / pushを行っていない。
