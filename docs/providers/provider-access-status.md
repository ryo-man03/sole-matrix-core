# Provider access status

Checked on 2026-08-12. Secret values are intentionally not recorded.

| Provider | Required local configuration | Repository implementation | Live status |
| --- | --- | --- | --- |
| Rakuten | `RAKUTEN_APPLICATION_ID`, `RAKUTEN_ACCESS_KEY` | existing adapter requires migration to the 2026-07-01 endpoint | implemented / live unverified |
| Yahoo! Shopping | `YAHOO_SHOPPING_APP_ID` | v3 item search adapter exists | implemented / live unverified |
| eBay | `EBAY_PRODUCTION_CLIENT_ID`, `EBAY_PRODUCTION_CLIENT_SECRET`, optional marketplace ID | Browse adapter exists; token manager hardening required | implemented / live unverified |
| StockX | approved developer access and an application | not enabled for user-facing market search | policy blocked |
| alias | approved OpenAPI access | no integration | approval pending |

`EXTERNAL_PROVIDERS_DISABLED=true` disables every external market request. Login, `/today`, and recommendation result rendering do not initiate market requests. Live smoke tests are local-only, opt-in, read-only, and limited to three requests per provider.
