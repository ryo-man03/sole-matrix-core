# Market price / beginner / verified colorway audit

## 実装判断

- 楽天・Yahooは現在の販売価格、eBayは現在の出品価格として共通`MarketListing`へ正規化した。
- 送料不明、状態不明、サイズ不明を欠損のまま保持し、0円や送料無料へ補完しない。
- `exact`、`high`、`related`を分離し、関連候補は折りたたみの比較用領域へ置いた。
- Providerの部分失敗でも成功したProviderと推薦結果を保持する。再検索失敗時は前回取得結果であることを表示する。
- 市場検索はボタンクリック時だけ行い、ページロードでは行わない。
- AI提案、カラー検証、Style Code検証、market listing matchを別契約にした。

## API response audit

監査値は`ProviderResponseAudit`へ正規化し、件数だけを返す。raw responseは保持しない。記録項目はnormalized/exact/high/related/rejected、不足Style Code・カラー・サイズ・状態・送料、世代・性別・サイズ競合、通貨、schema warning、安全でないURL、重複である。

## 決定論的評価

新規評価は合計300件。

| 分類 | 件数 |
| --- | ---: |
| Provider / Price | 100 |
| Beginner UX | 80 |
| Colorway Verification | 80 |
| Pairwise / Adversarial | 40 |

既存推薦回帰を含む全テストで、価格セマンティクス混同、推薦順位変更、初心者用語漏れ、未確認カラー表示、marketplace-only確認済み、Style Code部分一致、AI-onlyカラー表示、credential露出、raw response保存、eBay永続化／forecast、ページロード自動検索、重複リクエストの各metricを0とする。

## 既知の制限

StockXとaliasは承認待ち、SNKRDUNKとGrailedはdisabled、Mercari一般商品はmanual only。成約価格・過去販売価格・為替換算・関税計算・在庫保証・真贋保証は提供しない。marketplace listingだけでは公式カラーを確認できない。

## 2026-08-01 最終ローカル検証

- Typecheck: 成功
- Tests: 105 test files / 1,060 tests（300件の新規決定論的評価を含む）
- Production build: 成功 / 23 routes・pages
- Dependency audit: high以上0、low 1
- Browser widths: 320、360、390、430、600、768、1024、1280、1440、1920px
- Browser: horizontal overflow 0、console error 0、console warning 0、hydration error 0
- Accessibility: `main` 1、`h1` 1、画像alt欠損0、無名button 0、対象操作要素44px未満0。購入前チェックはnative `details/summary`でクリック展開を確認した。ブラウザ制御環境の合成Enter/Spaceでは展開イベントを再現できなかったため、実機キーボード確認を残す。
- Recommendation invariance: 価格確認前後でDecision、Core Score、Ryo Scoreの変更なし

## Live smoke

Providerごとに最大1検索という上限を守り、再試行していない。3 Providerは同時に起動したが、実行ラッパーが最初の非zero終了で集約結果を中断したため、監査可能な出力は楽天だけである。

- Rakuten: `temporarily_unavailable`、normalized/exact/high/related/rejectedはすべて0、credential exposure 0、10,670ms
- Yahoo: 起動済みだが結果未記録。成功扱いにしない
- eBay: 起動済みだが結果未記録。成功扱いにしない
- AI colorway: 未実行。成功扱いにしない

ローカル実装ゲートは合格しているが、live smoke成功とautomatic pull-request CI成功が未確認のため、この時点の総合判定は`NOT READY`である。
