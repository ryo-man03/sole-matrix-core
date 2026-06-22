# WEB-11Q-B: Home Screen Mobile Alignment Summary

## 1. 実装目的

WEB-11Q-A の方針に基づき、Home 画面のコピー、CTA、カード構成、余白、モバイル密度を調整した。
モバイルの一画面目で、SOLE//MATRIX の目的と Candidate Flow への入口が伝わることを優先している。

## 2. 変更ファイル

```txt
app/page.tsx
app/_components/HomeEntryCard.tsx
app/globals.css
docs/web/11Q_B_HOME_SCREEN_MOBILE_ALIGNMENT_SUMMARY.md
```

## 3. 採用した Home コピー

```txt
買う前に、気持ちと理由を整える。
```

補足文は次を採用した。

```txt
今は購入判断ではなく、気になる一足の情報整理に集中します。
```

## 4. 採用した CTA

```txt
気になる一足を整理する
```

CTA はページ内の既存 Candidate Flow へ移動する。Candidate Flow 本体には変更を加えていない。

## 5. Figma から参考にした点

- モバイルの上部で目的と CTA が伝わる情報順序
- 白基調と落ち着いた色調
- カード単位で情報を分ける構成
- カード間とセクション間の明確な余白
- 説明量を抑えたモバイル向けの情報密度
- Primary CTA の視認性

## 6. 意図的に採用しなかった点

- Figma の完全再現
- Result UI
- 推薦結果、スコア、ランキング、おすすめの表示
- 購入判断画面
- PersonalFit Score、価格比較、在庫確認、真贋判定、プレ値評価
- 外部データ、API、Backend、DB、AI 接続

## 7. 実装境界

- `recommendSneakers` には接続していない。
- Core input は作成していない。
- Result UI は作成していない。
- Candidate Flow 本体は変更していない。
- `PrototypeReadinessPanel` の役割は変更していない。
- package は追加していない。

## 8. 次工程

次工程は `WEB-11Q-C: Candidate Flow Shell Alignment` とする。
