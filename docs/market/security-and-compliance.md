# Market data security and compliance

## Authorized access only

- StockX uses documented v2 endpoints only after developer approval, API key issuance, and OAuth authorization.
- SNKRDUNK network access is disabled. Its official terms prohibit crawling/scraping.
- Mercari Shops APIs are not repurposed as a general Mercari market feed.
- No HTML parser, DOM selector, private endpoint, Cookie extraction, reverse engineering, or unauthenticated endpoint guessing exists.

## OAuth and secrets

StockX authorization uses a strong, single-use, ten-minute CSRF state and an exact HTTPS redirect URI (localhost HTTP is allowed for development). API keys, client secrets, access tokens, and refresh tokens remain server-side. They are not sent to client code, localStorage, normalized history, logs, fixtures, or CI artifacts.

Expired tokens are refreshed once through the documented token endpoint. Refresh failure is `not_authorized`; missing configuration is `not_configured`. HTTP 429 stops collection. Requests have timeouts, bounded retry, short cache, and in-flight deduplication.

## Storage and collection

Only validated normalized snapshots are stored. Raw provider responses and request headers are discarded after normalization. Local files are workspace-scoped, atomically replaced, and created with owner-only permissions where supported. Production persistence remains disabled because the repository has no owned migration/RLS process.

The collector is manual, limited to 100 targets, exact-identity only, and does not run from a live scheduled GitHub Action. CI uses fixtures, schema contracts, mocks, and deterministic datasets.

## Product claims

Market information does not establish authenticity, inventory, size availability, purchase availability, future performance, or profit. AI recommendation does not decide forecasts, and forecasts do not change recommendation decisions.

