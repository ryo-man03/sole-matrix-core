# Authorized release provider readiness

Official-source review date: 2026-08-20.

## Decision

```text
AUTHORIZED AUTOMATED RELEASE PROVIDER: NOT YET AVAILABLE
MANUAL / REVIEW PIPELINE: READY
```

No reviewed source currently provides both automated release data and a public contract that authorizes this application's collection, normalized persistence, user-facing display, image use, and commercial production use. No scraping, private/mobile API, inferred feed, cookie, or marketplace-to-official promotion is authorized.

## Classification boundary

- `RELEASE_PRIMARY`: a brand-controlled release announcement/feed with explicit automated-use rights.
- `RELEASE_AUTHORIZED`: an approved retailer, affiliate, or licensed feed whose contract permits the exact operation.
- `RELEASE_EDITORIAL`: licensed editorial release data; it does not become brand-official evidence.
- `CATALOG_REFERENCE`: identity/catalog assistance only; a marketplace date is not an official announcement.
- `MARKET_RETAIL` / `MARKET_LISTING`: current purchase-support information only.
- `MANUAL_SOURCE`: a human records a bounded official reference for Data Steward review.
- `POLICY_BLOCKED`: public pages or API data whose terms do not authorize this use.
- `NOT_SUITABLE`: does not provide the required release role.

## Brand and retailer routes

Public affiliate availability is not production authorization. Feed schema, advertiser relationship, territory, cache, retention, image, redistribution, attribution, and commercial-use terms must all be recorded from the approved account before an adapter can move beyond `APPROVAL_PENDING`.

| Provider / route | Classification | Status | Access, cost, authentication | Publicly confirmed capability | Missing release contract / production decision |
| --- | --- | --- | --- | --- | --- |
| Nike / Jordan affiliate via CJ | `RELEASE_AUTHORIZED` candidate; otherwise `MANUAL_SOURCE` | `APPROVAL_PENDING` | Free application; CJ publisher account and Nike approval | Nike advertises an automated product feed, banners, and new-product notices | Public page does not publish feed schema or persistence/image/redistribution terms. Style Code, colorway, release date precision, region, rate limit, and cache rights remain unverified. No adapter or collection before approval. |
| Nike Partner Hub | `RELEASE_PRIMARY` candidate | `APPROVAL_PENDING` | Authenticated partner access; APIs are visible only after authorization | Official portal exposes documentation/API areas | No existing authenticated partner access was found. No login, application, or identity verification was attempted. |
| adidas affiliate via impact.com | `RELEASE_AUTHORIZED` candidate; otherwise `MANUAL_SOURCE` | `APPROVAL_PENDING` | Application and advertiser approval; impact.com account/token after approval | Official adidas page confirms affiliate creative assets and performance reporting | It does not publicly promise a product or release feed. Product identity, dates, region, price, image rights, cache, and persistence are unverified. |
| New Balance affiliate via impact.com | `RELEASE_AUTHORIZED` candidate; otherwise `MANUAL_SOURCE` | `APPROVAL_PENDING` | Free application; impact.com membership and program terms | Official page advertises a product data feed and promotional newsletters | Exact catalog fields and all storage/redistribution/image rights remain account-gated. No release-date authority is established. |
| ASICS affiliate | `RELEASE_AUTHORIZED` candidate; otherwise `MANUAL_SOURCE` | `APPROVAL_PENDING` | Application; network/credentials and detailed terms after acceptance | Official ASICS page advertises a product feed plus weekly product news | Public page does not establish release-date precision, Style Code coverage, cache, retention, redistribution, or production rights. |
| PUMA affiliate via CJ | `RELEASE_AUTHORIZED` candidate; otherwise `MANUAL_SOURCE` | `APPROVAL_PENDING` | CJ application; detailed terms at sign-up | Official page confirms an approval-based affiliate program and campaign assets | No public product-feed or release schema is promised. PUMA site terms prohibit automated extraction; public-page crawling is `POLICY_BLOCKED`. |
| Converse | `MANUAL_SOURCE` | `NOT_SUITABLE` for automation | No public official developer/feed route located in the reviewed official material | Official product/news pages can support a human-reviewed reference | No automated-use, persistence, image, redistribution, or commercial feed rights found. Do not infer Nike affiliate coverage. |
| Vans | `MANUAL_SOURCE` | `POLICY_BLOCKED` for automation | Newsletter/manual official pages only | Official FAQ points users to release/collaboration notifications | Site terms reserve content rights and do not grant automated commercial collection. No crawler or guessed feed. |
| Reebok affiliate | `RELEASE_AUTHORIZED` candidate; otherwise `MANUAL_SOURCE` | `APPROVAL_PENDING` | Official site links to an affiliate-partner application; terms/account access required | Official pages expose new/coming-soon products for human review | Public material does not disclose feed/API schema or storage, image, redistribution, cache, and release-date rights. |
| Approved sneaker retailer through CJ/impact.com | `RELEASE_AUTHORIZED` candidate; usually `MARKET_RETAIL` | `APPROVAL_PENDING` | Network account plus a joined advertiser relationship and account credentials | Both networks document product catalog APIs/feeds with identity, price, GTIN, availability, image/link, and update metadata depending on advertiser data | Each retailer contract controls access and rights. A product creation/update timestamp or preorder flag is not a brand release announcement. Enable only reviewed advertisers and fields. |

### Brand source references

- [Nike Affiliate Program](https://www.nike.com/us/help/a/nike-affiliate-program)
- [Nike Partner Hub](https://partners.nike.com/portal)
- [adidas Affiliate Program](https://www.adidas.com/us/help/us-company-information/what-is-our-affiliate-program)
- [New Balance Affiliate Program](https://www.newbalance.com/affiliate/)
- [ASICS Affiliate Program](https://www.asics.com/gb/en-gb/content-landing-pages/affiliate-program/)
- [PUMA Affiliate Program](https://help.us.puma.com/hc/en-us/articles/38827399780507-Affiliate-Program)
- [PUMA Terms of Use](https://sn.puma.com/sn/en/TERMS_OF_USE.html)
- [Vans release notification FAQ](https://www.vans.com/en-us/help/faq)
- [Vans Terms of Use](https://www.vans.com/en-us/help/legal/terms-of-use)
- [Reebok official site / affiliate entry](https://www.reebok.com/)

## Affiliate-network transport

Affiliate networks are transport and authorization brokers, not independent release authorities.

| Network | Classification | Status | Documented fields / mechanics | Enablement rule |
| --- | --- | --- | --- | --- |
| CJ Product Feed API | `RELEASE_AUTHORIZED` transport | `CREDENTIAL_MISSING` | GraphQL product search by price, currency, country/service area, and UPC; advertiser feeds and relationship lookup | Require an approved publisher account, joined advertiser relationship where required, API terms, and advertiser-specific rights. |
| impact.com Catalog API | `RELEASE_AUTHORIZED` transport | `CREDENTIAL_MISSING` | Catalog/advertiser/campaign identity, updated time, currency/service areas; items can include name, manufacturer, price, GTIN, color, size, availability, gender, image/link depending on feed | Require approved brand campaign access and record API version, fields, rate, cache, retention, deletion, image, attribution, and redistribution rights. |
| Rakuten Advertising catalog feed | `RELEASE_AUTHORIZED` transport | `TERMS_UNCLEAR` | Official publisher help describes advertiser product catalog feeds for publisher sites | Authentication, advertiser scope, fields, rate, persistence, redistribution, and sneaker-brand availability were not established in this run. |

References: [CJ Developer Portal](https://developers.cj.com/), [CJ Product Feeds](https://developers.cj.com/docs/data-imports/product-feeds), [impact.com Partner API](https://integrations.impact.com/impact-publisher), [impact.com catalog items](https://integrations.impact.com/impact-publisher/reference/list-all-items-for-a-catalog), and [Rakuten Advertising catalog feed help](https://pubhelp.rakutenadvertising.com/hc/en-us/article_attachments/22365119792013).

## Marketplace APIs are not Release Providers

| Provider | Classification | Status | Authentication / rate | Fields relevant to identity | Rights / production decision |
| --- | --- | --- | --- | --- | --- |
| StockX Public API v2 | `CATALOG_REFERENCE` | `POLICY_BLOCKED` | Developer approval, API key, application, OAuth; public docs state 25,000/day and 1 request/second | Catalog search by free text, GTIN, or `styleId`; product can include brand, title, audience, colorway, season, marketplace `releaseDate`, and retail price | License says internal use only and prohibits archiving/resale. Local credentials are missing. No user-facing automated Release Provider, persistence, Selling API, or Order API. A StockX date is never `brand_official`. |
| alias OpenAPI 1.1.0 | `CATALOG_REFERENCE` | `APPROVAL_PENDING` | Granted PAT bearer token; 429/rate limits documented | Catalog search/read exists; pricing insights are market data | No PAT or approved terms record is present. Listing/order/batch write endpoints are prohibited. Catalog access, if approved, remains reference-only until retention/display rights are reviewed. |
| Rakuten Ichiba | `MARKET_RETAIL` | `UNAUTHORIZED` | Application ID, Access Key, registered Allowed Website context | Current shop listings and prices | Never release evidence; no persistence. Registered origin must be verified first. |
| Yahoo! Shopping | `MARKET_RETAIL` | `LIVE_NORMALIZATION_VERIFIED` (historical bounded evidence) | App ID | Current retail listings | Never release evidence; request-time display only. |
| eBay Browse | `MARKET_LISTING` | `LIVE_NORMALIZATION_VERIFIED` (historical bounded evidence) | OAuth application token | Current marketplace listings | Never release evidence; persistent data 0, forecast 0, raw response 0, seller personal data 0. |

References: [StockX getting started](https://developer.stockx.com/portal/getting-started), [StockX API reference](https://developer.stockx.com/portal/api-reference), [StockX license](https://developer.stockx.com/portal/license-agreement), and [alias OpenAPI](https://docs.alias.org/).

## Licensed editorial review

No licensed editorial provider with a public contract for automated sneaker release ingestion, normalized persistence, redistribution, and production display was verified. Consumer calendars, blogs, third-party scraping services, unofficial aggregators, and undocumented RSS are not evidence of authorization. The correct current state is `RELEASE_EDITORIAL: NOT YET AVAILABLE`, not a forced integration.

## Approval handoff

For a brand or retailer route, obtain and record outside Git:

1. Provider/program name, approved account owner, territory, production permission, cost, and renewal/termination owner.
2. Authentication names and scopes; never record values in docs or logs.
3. Exact feed/API version, endpoint, rate limit, pagination/cursor, update cadence, and service-level expectations.
4. Available identity fields: brand, model, family, generation, Style Code, GTIN, colorway, audience, region, release/preorder date and precision, retail price, images, source URL, and updated time.
5. Collection, cache, normalized persistence, raw persistence, retention, deletion, image/excerpt use, redistribution, attribution, and commercial-use rights.
6. Written decision mapping to `brand_official`, `authorized_retailer`, or `editorial_authorized`; unknown fields remain unknown and marketplace data never promotes the state.
7. Legal/policy sign-off for the exact operation. Unknown terms keep the provider disabled.

After approval, add fixture-only normalization first, including generation/audience separation and full normalized Style Code exact matching. Then run one isolated, bounded, read-only non-production page, confirm raw persistence 0, login/`/today` provider calls 0, Core/Ryo mutation 0, and disable live access until review is complete.
