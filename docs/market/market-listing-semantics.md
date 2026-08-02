# Market listing semantics

## 価格の意味

| Provider | 表示する意味 | 表示文言 | 表示しない意味 |
| --- | --- | --- | --- |
| 楽天市場 | `current_retail_price` | 現在の販売価格 | 成約価格、相場、最安保証 |
| Yahoo!ショッピング | `current_retail_price` | 現在の販売価格 | 成約価格、相場、最安保証 |
| eBay | `current_listing_price` | 現在の出品価格 | 落札価格、成約価格、平均価格 |
| StockX（承認後） | `lowest_ask` / `highest_bid` | 最低出品価格 / 最高入札額 | 成約価格 |

`current_retail_price`、`current_listing_price`、`lowest_ask`、`highest_bid`、`sold_price`は集約しない。通貨、状態、サイズ基準、サイズ、モデル世代、一致度、eBayのauction/fixed priceも混ぜない。

## 表示契約

各カードはProvider、価格の意味、商品価格、通貨、送料、支払総額、状態、サイズ、販売形式、一致度、取得時刻を示す。送料不明を0円として扱わず、総額不明は「税・関税込み総額は未確認」と表示する。USDはUSDのまま表示し、為替換算しない。

`exact`はStyle Code完全一致、`high`はモデルと確認済みカラーの高一致、`related`は比較用である。関連候補を本命や最安候補として表示しない。
