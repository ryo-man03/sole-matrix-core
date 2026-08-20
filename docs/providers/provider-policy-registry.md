# Market provider policy registry

Last verified: 2026-08-20

This registry is the deny-by-default boundary for market data. Market data supports a purchase decision after recommendation; it never changes the Core score, Ryo ordering, recommendation decision, release verification, or colorway verification.

| Provider | Role | Verification status | Temporary display | Persistent storage | Forecast | Ranking influence |
| --- | --- | --- | --- | --- | --- | --- |
| Rakuten Ichiba | Current shop listings | implemented / live unauthorized | allowed | prohibited by project policy | prohibited | prohibited |
| Yahoo! Shopping | Current shop listings | live verified | allowed | prohibited by project policy | prohibited | prohibited |
| eBay Browse | Current marketplace listings | live verified | allowed | prohibited by project policy | prohibited | prohibited |
| StockX | Marketplace catalog reference | policy blocked for user-facing display/persistence; credentials missing | prohibited | prohibited | prohibited | prohibited |
| alias | Marketplace catalog reference | approval pending; PAT missing | prohibited | prohibited | prohibited | prohibited |

Unknown operations are prohibited. Provider failures are isolated and must not fail recommendation rendering.

## Official sources

- [Rakuten Ichiba Item Search API 2026-07-01](https://webservice.rakuten.co.jp/documentation/ichiba-item-search)
- [Rakuten Web Service terms](https://webservice.rakuten.co.jp/guide/rule)
- [Rakuten credit requirements](https://webservice.rakuten.co.jp/guide/credit)
- [Yahoo! Shopping item search v3](https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html)
- [Yahoo! Shopping v3 API usage rules](https://developer.yahoo.co.jp/webapi/shopping/v3/)
- [eBay Browse API](https://developer.ebay.com/develop/api/buy/browse_api)
- [StockX developer access](https://developer.stockx.com/portal/getting-started)
- [StockX API license agreement](https://developer.stockx.com/portal/license-agreement)
- [alias OpenAPI](https://docs.alias.org/)

Provider terms and documentation can change. Re-verify before enabling new storage, commercial use, or a new provider capability.

Rakuten contract record: `providerId=rakuten`, role `current_shop_listing`, verification `UNAUTHORIZED`, endpoint/version `IchibaItem/Search/20260701`, credentials `applicationId query parameter + accessKey header + registered request origin when allowlisted`, format `JSON formatVersion=2`, automatic collection `manual market action only`, persistence/raw persistence `prohibited`, image display `temporary`, attribution `required badge/credit`, rate limit `provider-managed; 429 on excess; identical URL bursts may be temporarily blocked`, cache `no-store by project policy`, commercial use `terms-restricted; non-affiliate monetization requires explicit permission`, `termsCheckedAt=2026-08-20`.

The public Rakuten guide requires registered application information including application URL and Allowed Websites. It does not expose the already-registered Allowed Website for this credential. The local request origin remains missing, so no request was sent during the 2026-08-20 review and the status remains `UNAUTHORIZED`.

StockX reassessment: the official v2 API documents OAuth, API-key-gated Catalog Search by free text/GTIN/styleId, product fields including marketplace `releaseDate`, and separate market/selling/order operations. Local StockX credentials are all missing. The license limits data to internal use and prohibits archiving/resale, so user-facing display and persistence remain prohibited. Even if approved later, catalog data defaults to `catalog_reference`; it is never `brand_official` evidence. Selling and order operations remain out of scope.
