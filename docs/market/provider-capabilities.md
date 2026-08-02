# Authorized market data provider audit

Audit date: 2026-07-30  
Scope: sneaker catalog identity, current market observations, historical series, and automated collection  
Policy: only official documentation and written authorization may enable a provider. Absence of a public document is not treated as permission.

## Decision summary

| Provider | Access | Catalog search | Current ask | Current bid | Sold price | Listing search | Historical series | Size-specific | Automated collection | Credentials available |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| StockX | `approved_account` | Yes | Yes | Yes | No | No | No | Yes | Yes, only after approval | No |
| SNKRDUNK | `unavailable` | No | No | No | No | No | No | No | No | No |
| Mercari | `manual_only` | No | No | No | Manual import only | No | Manual import only | Manual import only | No | No |
| Manual import | `manual_only` | No | When explicitly typed | When explicitly typed | When explicitly typed | No | Yes | Yes | No | Not applicable |

`credentialsAvailable` describes this repository's current environment, not whether credentials could exist in another deployment. No StockX credential variable is configured in the repository's local environment as of the audit date.

## StockX

### Official evidence

- [Getting Started](https://developer.stockx.com/portal/getting-started) states that developer access is reviewed and that an API key is issued only after approval.
- [Authentication](https://developer.stockx.com/portal/authentication) specifies OAuth 2.0 Authorization Code flow. Requests require both an access token and API key.
- [API Introduction](https://developer.stockx.com/portal/api-introduction) documents a 25,000-request daily quota, a one-request-per-second limit, and HTTP 429 on rate limiting.
- [API Reference](https://developer.stockx.com/portal/api-reference) documents catalog search, product and variant identifiers, GTIN/style ID search, and variant market data containing the lowest ask and highest bid in a supported currency.
- [License Agreement](https://developer.stockx.com/portal/license-agreement) limits use to the licensed integration and must be reviewed for the approved account and intended deployment.

### Capability decision

The provider may implement catalog search and size/variant-specific current lowest ask and highest bid. It must remain `not_configured` until approved credentials and OAuth tokens are supplied. Public marketplace listing search, market-wide sold-price history, and market-wide historical series are not enabled: the official material reviewed here does not establish those capabilities. A user's own listing/order endpoints must not be re-labelled as general market history.

Automated collection is permitted by this application only after approval and only through documented endpoints, within the documented quotas and the applicable license. The collector must stop on 429, remain bounded, and never use page HTML.

## SNKRDUNK

### Official evidence

- [SNKRDUNK Terms of Use](https://snkrdunk.com/terms/) prohibit crawling, scraping, or similar methods to access the service or obtain service information (Article 7).

### Capability decision

No official public or partner market-data API authorization was found in the reviewed official material. Therefore every network capability is disabled and the provider is `unavailable`. HTML parsing, private endpoints, browser automation for extraction, and reverse engineering are prohibited. A future adapter may be enabled only after an official API contract or written partnership authorization has been reviewed and recorded.

## Mercari

### Official evidence

- [Mercari Shops API integration guide](https://support.mercari-shops.com/hc/ja/categories/15261095776281-API%E9%80%A3%E6%90%BA%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6) describes shop-owner workflows such as product registration, order handling, and access-token issuance.
- [Mercari Shops product and inventory guide](https://support.mercari-shops.com/hc/ja/articles/60017473575833-%E7%A8%AE%E9%A1%9E%E3%81%A8%E5%9C%A8%E5%BA%AB%E3%81%A8%E3%81%AF) describes a shop's own variants, inventory, JAN codes, and management codes.

### Capability decision

The reviewed official API is for operating a participating seller's own Mercari Shop. It is not evidence of authorization to search general Mercari listings or collect marketplace prices. The application must not repurpose Mercari Shops inventory/order APIs as a resale-market feed. Network collection is disabled; only provenance-bearing manual import is allowed.

## Manual import

Manual import is not a provider network integration. It accepts only CSV or JSON that the user is entitled to use and that contains:

- source/provider and source reference;
- observation time;
- product identifier sufficient for canonical matching;
- variant/size and condition;
- ISO 4217 currency;
- an explicit price type (`ask`, `bid`, `listing`, `sold`, or `recommended`);
- a finite, non-negative price.

Missing provenance, ambiguous product identity, unsupported currency, invalid price type, or absent observation time causes rejection. Imported price types stay separate. The application does not infer that a listing is a sale and does not turn an ask, bid, listing, or recommended price into a sold price.

## Re-audit triggers

Re-run this audit before enabling a provider when any of the following changes:

- provider terms, API version, endpoints, fields, authentication, or rate limits;
- the repository receives new credentials or written authorization;
- the intended use changes from internal testing to another deployment or data-retention purpose;
- a new price type or marketplace is introduced.

Every capability defaults to disabled until the revised evidence is committed. Secrets, raw provider responses, and authorization tokens must never be committed or persisted as normalized market history.
# Current-price provider capabilities (2026-08-01)

| Provider | 状態 | 自動検索 | 価格の意味 | 保存 |
| --- | --- | --- | --- | --- |
| 楽天市場 | implemented_unverified | 明示クリック時のみ | 現在の販売価格 | しない |
| Yahoo!ショッピング | implemented_unverified | 明示クリック時のみ | 現在の販売価格 | しない |
| eBay Production Browse API | implemented_unverified | 明示クリック時のみ | 現在の出品価格 | しない |
| StockX | developer access承認待ち | しない | lowest ask / highest bid contractのみ | しない |
| alias | API承認待ち | しない | 未確定 | しない |
| SNKRDUNK | disabled | しない | なし | しない |
| Mercari一般商品 | manual only | しない | なし | しない |
| Grailed | disabled | しない | なし | しない |

この表のcurrent-price検索は既存の履歴／forecast subsystemと分離する。eBayの現在出品価格を履歴やforecastへ渡さない。

`implemented_unverified`は実装済みだがliveレスポンスの正規化成功を未確認という意味である。個別検索の`success`は、その1リクエストの結果状態であり、Provider実装全体の`live_verified`とは分けて扱う。
