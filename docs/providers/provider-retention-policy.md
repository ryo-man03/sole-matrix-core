# Market provider retention policy

Market search is a request-time display feature.

- Raw provider responses are never written to the database, files, browser storage, logs, analytics, or recommendation history.
- Access tokens, client secrets, application IDs used as credentials, and authorization headers are never returned to the client or logged.
- eBay access tokens may exist only in server memory, with an expiry safety margin and single-flight refresh. Normalized eBay listings may use only a short-lived, non-persistent memory cache.
- Rakuten and Yahoo normalized listings are not persisted. Any future cache requires an explicit provider-policy review; default behavior is no persistent storage.
- Seller personal information is not retained. A shop display name may be rendered for the current response only.
- Market listings do not feed price history, forecasting, rankings, recommendations, release evidence, or colorway verification.
- Cache keys use only canonical product/search attributes and never user identifiers or secrets.

The current eBay design therefore does not persist eBay data. Account-deletion notification requirements must be re-evaluated if any eBay user or listing data is persisted in the future.

## Release evidence

Release evidence is a separate, contract-approved normalized dataset. Raw responses, page HTML, images, article excerpts, credentials, and authorization headers are never persisted. Manual references may persist normalized identity, source URL/title/domain, assertions, fingerprint, review state, timestamps, and provenance needed for audit. Ingestion runs persist only cursors, counts, timing, idempotency, and safe error codes. A superseded assertion remains as evidence history rather than being overwritten. Provider-specific deletion or shorter retention overrides this default; unknown retention rights deny provider enablement.
