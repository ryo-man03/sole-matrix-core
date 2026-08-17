# Provider live smoke

Live smoke is a local, read-only verification step. It is never run in CI, login, `/today`, or page rendering. Run it only after checking the current provider terms and placing approved credentials in `.env.local`.

```powershell
pnpm market:smoke --provider rakuten --live
pnpm market:smoke --provider yahoo --live
pnpm market:smoke --provider ebay --live
```

Each command performs one provider invocation. The shared request layer limits each HTTP attempt to eight seconds and 1.5 MB, retries once only for timeout/reset/502/503/504, and does not retry 429. eBay keeps its application token in memory only and may refresh once after a 401.

The output is a bounded JSON summary: provider status, normalized/match counts, currencies, missing fields, elapsed time, and one normalized sample containing title, price, currency, condition, and match level. It does not include credentials, authorization headers, raw responses, URLs, or tokens.

Interpret status literally. `success` and `empty` prove that a live response passed the current schema boundary. `not_configured`, `unauthorized`, `rate_limited`, `timeout`, `schema_error`, and `temporarily_unavailable` are not live verification success. Record the date and safe status in `provider-access-status.md`; never paste raw provider bodies into the repository.
