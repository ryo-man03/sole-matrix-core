# Release provider foundation

Checked on 2026-08-18. Release Intelligence is evidence-first and separate from Market Intelligence. Public HTML, hidden/mobile endpoints, browser automation, and marketplace listings are not release providers. No production scheduler is enabled.

## Provider research

| Provider or source | Provider state | Approved release role | Evidence |
| --- | --- | --- | --- |
| manual seed | `IMPLEMENTED_LIVE_UNVERIFIED` | signed internal import of reviewed references | local adapter and contract tests; production DB not exercised |
| fixture | `DISABLED` | test-only | production returns zero fixtures |
| Nike / Jordan | `APPROVAL_PENDING` | none until affiliate approval and feed field/retention review | Nike documents an application-reviewed automated product feed; it does not establish that the feed is a release calendar |
| New Balance | `APPROVAL_PENDING` | none until Impact approval and feed field/retention review | New Balance documents an approved-affiliate product data feed |
| ASICS | `APPROVAL_PENDING` | none until affiliate approval and regional rights review | ASICS UK documents an affiliate product feed |
| PUMA | `APPROVAL_PENDING` | none until CJ approval and regional rights review | PUMA UK documents an affiliate product feed |
| adidas | `TERMS_UNCLEAR` | none | no official release API/feed with explicit automated and persistence rights was confirmed |
| Converse | `TERMS_UNCLEAR` | none | no official release API/feed with explicit automated and persistence rights was confirmed |
| Vans | `TERMS_UNCLEAR` | none | no official release API/feed with explicit automated and persistence rights was confirmed |
| Reebok | `TERMS_UNCLEAR` | none | an affiliate entry exists, but no official release feed contract was confirmed |
| authorized retailers / licensed feeds | `APPROVAL_PENDING` | none until a named contract is approved | no provider was selected or enabled |
| StockX | developer access `CREDENTIAL_MISSING`; release role `NOT_SUITABLE` | catalog reference only after approval; never `brand_official` | official v2 Catalog Search exists, including styleId/GTIN and a marketplace releaseDate field; local API/OAuth credentials are absent; license restricts data to internal use and prohibits archiving/resale |
| alias | `APPROVAL_PENDING` | none | public OpenAPI reference exists, but local access token and proof of approval are absent |

Affiliate product data must not be promoted to release evidence until the exact feed contract confirms automated access, release-date semantics, persistence, display, commercial use, attribution, deletion, and regional scope. Product availability is not an official release announcement.

## Official references

- [Nike US Affiliate Program](https://www.nike.com/help/a/nike-affiliate-program)
- [New Balance Affiliate Program](https://www.newbalance.com/affiliate/)
- [ASICS UK Affiliate Program](https://www.asics.com/gb/en-gb/content-landing-pages/affiliate-program/)
- [PUMA UK Affiliate Program](https://uk.puma.com/uk/en/affiliate-program)
- [StockX Getting Started](https://developer.stockx.com/portal/getting-started)
- [StockX API Reference](https://developer.stockx.com/portal/api-reference)
- [StockX Authentication](https://developer.stockx.com/portal/authentication)
- [StockX API License Agreement](https://developer.stockx.com/portal/license-agreement)
- [alias OpenAPI](https://docs.alias.org/)

Terms and documentation can change. Re-check them before changing any provider state or enabling a credential.
