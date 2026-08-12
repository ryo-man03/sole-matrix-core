# Market provider policy registry

Last verified: 2026-08-12

This registry is the deny-by-default boundary for market data. Market data supports a purchase decision after recommendation; it never changes the Core score, Ryo ordering, recommendation decision, release verification, or colorway verification.

| Provider | Role | Verification status | Temporary display | Persistent storage | Forecast | Ranking influence |
| --- | --- | --- | --- | --- | --- | --- |
| Rakuten Ichiba | Current shop listings | terms reviewed / implementation pending live verification | allowed | unknown; disabled until separately approved | prohibited | prohibited |
| Yahoo! Shopping | Current shop listings | terms reviewed / implementation pending live verification | allowed | unknown; disabled until separately approved | prohibited | prohibited |
| eBay Browse | Current marketplace listings | terms reviewed / implementation pending live verification | allowed | prohibited by project policy | prohibited | prohibited |
| StockX | Marketplace catalog / seller platform | policy blocked for the current user-facing use | prohibited | prohibited | prohibited | prohibited |
| alias | Marketplace integration | approval pending | prohibited | prohibited | prohibited | prohibited |

Unknown operations are prohibited. Provider failures are isolated and must not fail recommendation rendering.

## Official sources

- [Rakuten Ichiba Item Search API 2026-07-01](https://webservice.rakuten.co.jp/documentation/ichiba-item-search)
- [Yahoo! Shopping item search v3](https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html)
- [Yahoo! Shopping v3 API usage rules](https://developer.yahoo.co.jp/webapi/shopping/v3/)
- [eBay Browse API](https://developer.ebay.com/develop/api/buy/browse_api)
- [StockX developer access](https://developer.stockx.com/portal/getting-started)
- [StockX API license agreement](https://developer.stockx.com/portal/license-agreement)

Provider terms and documentation can change. Re-verify before enabling new storage, commercial use, or a new provider capability.
