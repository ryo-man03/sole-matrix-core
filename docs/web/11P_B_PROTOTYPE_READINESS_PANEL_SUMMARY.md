# WEB-11P-B: Prototype Readiness Panel Summary

## 1. 目的

既存の候補入力フローに、入力内容の整理状態だけを示す
「推薦準備チェック」を追加した。

この表示は推薦結果ではなく、推薦機能やProduction Coreには接続して
いない。

## 2. 変更ファイル

```txt
app/_components/PrototypeReadinessPanel.tsx
app/_components/CandidateSneakerCheckFlow.tsx
app/_components/CandidateCheckSummary.tsx
docs/web/11P_B_PROTOTYPE_READINESS_PANEL_SUMMARY.md
```

## 3. 表示位置

`CandidateSneakerCheckFlow`のStep 3で、既存の入力確認カード直後、
戻るCTAの前に表示する。

## 4. 表示カード構成

次の5カードを仕様順に表示する。

1. 推薦準備チェック
2. 確認できた入力
3. 確認が必要な項目
4. まだ未接続の項目
5. 次に決めること

タイトル直下には、次の注意文を常時表示する。

```txt
現在は推薦結果ではありません。
入力内容の整理状態を表示しています。
```

## 5. 表示している情報

- 入力された候補名
- 選択されたタグの表示名
- 価格メモの入力有無
- 予算メモの入力有無
- 診断回答の確認状態
- 推薦機能が未接続であること
- Production側の判断が残っていること

診断回答は`CandidateSneakerCheckFlow`から安全に取得できないため、
別フローへ接続せず「この画面では未確認」と表示する。

## 6. 表示していない情報

- 推薦結果
- おすすめスニーカー
- 順位
- スコア
- PersonalFit Score
- 購入判断
- 数値化した特徴
- 価格・予算の適合判定
- Production用の候補識別子や診断情報

## 7. 実装境界

- `recommendSneakers`をimportまたは呼び出していない。
- Core inputを作成していない。
- Core input assemblerを作成していない。
- Result UIとして見せていない。
- タグ、価格メモ、予算メモ、診断回答を数値へ変換していない。
- 価格メモと予算メモは入力有無だけを表示し、文字列そのものは
  パネルへ渡していない。
- 既存の確認サマリーでも、価格メモ・予算メモは金額文字列を表示せず、
  入力有無だけを表示する。
- packageを追加していない。

## 8. 検証結果

次を実行し、すべて成功した。

```powershell
pnpm test      # 14 files / 90 tests passed
pnpm typecheck # passed
pnpm web:build # passed
git status --short --untracked-files=all
git diff --stat
git diff --name-status
git diff --check # passed
```

差分は、この文書を含む指定4ファイルだけである。

## 9. Commit / Push

この工程ではcommit / pushを行わない。
