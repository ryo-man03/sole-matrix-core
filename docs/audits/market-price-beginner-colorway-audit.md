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

2026-08-02にYahooとeBayを新しい独立sessionとして各1回だけ実行した。失敗後の再実行、paging、raw payload・token・credential・商品URL一覧の出力、結果の永続化は行っていない。Rakutenは2026-08-01の記録を維持した。

- Rakuten: `temporarily_unavailable`、10,670ms。normalized/exact/high/related/rejectedはすべて0、currenciesは空、credential exposure 0。実レスポンス正規化は未確認
- Yahoo: `timeout`、16,007ms。normalized/exact/high/related/rejectedはすべて0、currenciesは空、新品・中古・不明はいずれも0、不足size・condition・shippingはいずれも0、credential exposure 0、raw payload persistence 0
- eBay: `timeout`、16,022ms。normalized/exact/high/related/rejectedはすべて0、currenciesは空、新品・中古・不明およびauction・fixed・unknownはいずれも0、不足size・condition・shippingはいずれも0、credential exposure 0、persistent write 0、forecast use 0
- AI colorway: credentialをプロセス内だけへ渡して既存の安全なsmokeを1回実行し、`fallback / api_error`。verification stateとevidenceは生成されず、成功扱いにしない。credential exposure 0、raw response persistence 0

fixture・schema contract・決定論的colorway評価は成功しているが、これはlive成功を意味しない。価格意味はRakuten/Yahoo=`current_retail_price`、eBay=`current_listing_price`のまま分離し、marketplace-only evidenceはverified colorwayに昇格させない。AI提案、colorway verification、Style Code verification、market listing matchは引き続き別契約である。

ローカル実装ゲートは合格している。live failureは安全に処理されたAccepted Limitationとして記録する。Draft PRとautomatic pull-request CIの最新状態はGitHubを正とし、両方が完了するまでは総合判定を`NOT READY`とする。

## 2026-08-02 PR #28 最終diffレビュー対応

- `MarketListing`の全フィールドをクライアント境界で実行時検証し、不正listingは該当Providerだけ`schema_error`へ分離する。欠損・不正な配列、送料、総額、状態、サイズ、販売形式のfixtureを追加した。
- 楽天・Yahoo・eBayの実装状態を`implemented_unverified`へ変更し、1回の検索結果`success`とProvider全体の`live_verified`を分離した。
- Provider・request・search境界へ`server-only`ガードを追加した。
- eBayの`persist`、`forecast`、`recommendation_score`を拒否し、`temporary_display`だけを許可するpolicy gateを追加した。推薦順位変更、credential露出、raw response保存、eBay永続化、eBay forecastの各metricは安全fixtureで0、意図的に壊したfixtureで非0になることを確認した。
- 初心者向け初期表示からCore/Ryo ScoreとStyle Codeを外し、商品確認内容と既存Market Intelligenceを折りたたみへ移動した。
- live smokeは再実行していない。上記のAccepted Limitationは変更しない。

ローカル再検証はTypecheck成功、108 test files / 1,072 tests成功、Production build成功（23 routes・pages）。PR CIは新しいheadをpushした後に確認する。
