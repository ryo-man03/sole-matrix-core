# Manual market data import

Manual import is for CSV or JSON that the user is entitled to use. It is not a workaround for provider authorization.

## Required fields

`provider`, `sourceReference`, `observedAt`, `brand`, `modelName`, `styleCode`, `sizeSystem`, `sizeValue`, `condition`, `currency`, `priceType`, `amount`, and `identityMatch`.

Manual import accepts `identityMatch: exact` only. `probable` and model-only rows are rejected even if they contain a plausible model name. The supported currencies match the provider boundary (`AUD`, `CAD`, `CHF`, `EUR`, `GBP`, `HKD`, `JPY`, `KRW`, `MXN`, `NZD`, `SGD`, `USD`); no currency conversion is performed.

Optional normalized fields include colorway, release year, sample count, and true/false/blank fee, shipping, and tax flags.

Allowed price types are `lowest_ask`, `highest_bid`, `listing_price`, `sold_price`, `recommended_sell`, and `recommended_buy`. A listing must not be relabelled as a sale.

## Validation

- maximum 1,000 rows and 2,000,000 UTF-8 bytes in both the parser and browser UI;
- `.csv` / `.json` filename and compatible MIME checks in the browser UI;
- formula-like text beginning with `=`, `+`, `-`, or `@` is rejected;
- duplicate series/timestamp rows inside one import are rejected;
- positive finite amount and uppercase-normalized three-letter currency;
- valid ISO timestamp and non-empty source reference;
- known size system and condition;
- exact identity requires a style code;
- recommendation UI additionally requires exact style-code matching to a verified candidate;
- invalid rows are rejected with row-level reasons.

Accepted values remain in browser state for inspection. The UI does not scrape, upload the source file to a marketplace, or automatically make a provider request.

## CSV header

```csv
provider,sourceReference,observedAt,brand,modelName,colorwayName,styleCode,releaseYear,sizeSystem,sizeValue,condition,currency,priceType,amount,sampleCount,identityMatch,includesFees,includesShipping,includesTax
```

Example data must use a source reference meaningful to the user. Do not put API keys, tokens, cookies, personal buyer/seller information, or raw provider responses in an import file.
