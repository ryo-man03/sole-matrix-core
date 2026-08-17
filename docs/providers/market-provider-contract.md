# Market provider contract

The canonical contract lives in `app/_lib/market/contracts.ts` and is validated at both the provider boundary and the client response boundary.

## Pipeline

Recommendation identity → query planner → provider orchestrator → Rakuten / Yahoo / eBay → runtime validation → normalization → deterministic identity matching → condition and currency groups → price summary → purchase confidence → UI.

Required guarantees:

- A listing carries provider, external identity, title, canonical identity evidence, price and original currency, shipping knowledge, condition, size, stock, safe HTTPS links, match classification, warnings, and fetch time.
- Style codes are normalized with NFKC, uppercase, and separator removal. Only full equality is accepted.
- Different generations, derivatives, adult/kids audiences, and known men/women conflicts are rejected.
- Only exact and probable matches enter price summaries. Related listings remain visible only in a separate comparison area.
- New, used, unknown condition and every currency are summarized separately. No inferred FX conversion is performed.
- Rakuten and Yahoo values are current shop prices. eBay values are current listing prices. None is a completed-sale price.
- A provider error produces a provider-specific safe status and an empty listing set; it does not throw through the whole search.
- Market values cannot mutate recommendation, Core, Ryo, release evidence, or verified colorway state.

External requests are server-only, manually initiated, bounded to eight seconds and 1.5 MB, and may retry once only for a timeout, connection reset, or HTTP 502/503/504.

## Rakuten request contract

Checked on 2026-08-18 against the official Rakuten Ichiba Item Search API and Web Service terms.

- API version and endpoint: `2026-07-01`, `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701`.
- `applicationId` is a required query parameter. `accessKey` is required and may be sent as a header or query parameter; SOLE//MATRIX uses the header so it never enters request URLs.
- `keyword` and `sort` are UTF-8 URL encoded by `URLSearchParams`. The adapter requests JSON with `formatVersion=2` and an explicit `elements` allowlist.
- `availability=1` limits results to items reported available by Rakuten. It is still not an inventory guarantee.
- If the Rakuten application has an Allowed Website restriction, `RAKUTEN_REQUEST_ORIGIN` must be the exact registered HTTP(S) origin. The server sends it as both `Origin` and a root `Referer`; client-controlled credentials and headers are never accepted.
- HTTP 429 is not retried. Timeout/reset and 502/503 may be retried once. Identical-URL bursts are prohibited by the provider guidance.
- Responses are request-scoped and use `cache: no-store`; raw and normalized listings are not persisted. Images and item URLs are displayed only as temporary product references.
- The required “Supported by Rakuten Developers” credit is rendered with Rakuten results. When an affiliate ID is configured, the returned Rakuten affiliate item URL is preserved.
- Error responses expose only a bounded, credential-redacted status/code. Authorization headers, credentials, request URLs, and raw bodies are never logged or returned.

Official references: [Item Search API](https://webservice.rakuten.co.jp/documentation/ichiba-item-search), [terms](https://webservice.rakuten.co.jp/guide/rule), and [credit requirements](https://webservice.rakuten.co.jp/guide/credit).
