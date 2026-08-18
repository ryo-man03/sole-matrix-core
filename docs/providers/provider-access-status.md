# Provider access status

Checked on 2026-08-18. Secret values are intentionally not recorded.

| Provider | Required local configuration | Repository implementation | Live status |
| --- | --- | --- | --- |
| Rakuten | `RAKUTEN_APPLICATION_ID`, `RAKUTEN_ACCESS_KEY`, and `RAKUTEN_REQUEST_ORIGIN` when the app is website-allowlisted | 2026-07-01 adapter; access key header; Origin/Referer request context; no-store; required credit | `UNAUTHORIZED`; HTTP 403 referrer context missing; not live verified |
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

## 2026-08-18 Rakuten recovery evidence

- Configuration presence: Application ID `present`; Access Key `present`; request origin `missing`. Values were not printed or persisted.
- Current 2026-07-01 adapter smoke: `unauthorized`, 217 ms, zero normalized items, zero credential exposure, zero raw persistence.
- One bounded safe diagnostic: HTTP 403, code `REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING`, 170 ms, zero credential exposure, zero raw persistence.
- Root cause: the registered Rakuten application requires an HTTP referrer context, while the local `RAKUTEN_REQUEST_ORIGIN` configuration is absent. This is not a missing Application ID or missing Access Key result.
- Code correction: the existing origin setting now produces both `Origin` and root `Referer`; the legacy candidate and isolated-smoke endpoints were advanced from 2026-04-01 to 2026-07-01. Recommendation defaults to `manual_only` and performs no Rakuten request.
- Remaining provider-local action: set `RAKUTEN_REQUEST_ORIGIN` to the exact origin registered in Rakuten Allowed Websites, then run one bounded smoke. Until that succeeds, the literal status remains `UNAUTHORIZED`, not live verified.
