# Provider access status

Checked on 2026-08-17. Secret values are intentionally not recorded.

| Provider | Required local configuration | Repository implementation | Live status |
| --- | --- | --- | --- |
| Rakuten | `RAKUTEN_APPLICATION_ID`, `RAKUTEN_ACCESS_KEY` | 2026-07-01 Item Search endpoint adapter exists | unauthorized; not live verified |
| Yahoo! Shopping | `YAHOO_SHOPPING_APP_ID` | v3 item search adapter exists | live verified: success, 4 normalized |
| eBay | `EBAY_PRODUCTION_CLIENT_ID`, `EBAY_PRODUCTION_CLIENT_SECRET`, optional marketplace ID | Browse adapter and in-memory token manager exist | live verified: success, 10 normalized |
| StockX | approved developer access and an application | not enabled for user-facing market search | policy blocked |
| alias | approved OpenAPI access | no integration | approval pending |

`EXTERNAL_PROVIDERS_DISABLED=true` disables every external market request. Login, `/today`, and recommendation result rendering do not initiate market requests. Live smoke tests are local-only, opt-in, read-only, and limited to three requests per provider.

## 2026-08-17 bounded smoke evidence

| Provider | Safe status | Example normalized evidence | Credential/raw exposure |
| --- | --- | --- | --- |
| Rakuten | `unauthorized`, 438 ms | no normalized item; Allowed websites / credential authorization must be rechecked | 0 |
| Yahoo! Shopping | `success`, 4 items, 491 ms | “NIKE Air Force 1 Low '07 LX 3X Celebration…”; JPY 9,339; used; related | 0 |
| eBay | `success`, 10 items, 1,494 ms | “Nike Air Force 1 Low Prm 3X Celebration - HF2893-100…”; USD 161; new; exact | 0 |

These are current retail/listing observations, not completed-sale evidence. The smoke made one provider invocation per provider and persisted no response data.
