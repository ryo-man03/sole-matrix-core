# Market Intelligence data model

## Boundary

Market Intelligence is downstream of verified recommendation. It cannot change Core/Ryo scoring, candidate order, or Decision. A market record is accepted only after product identity, variant, price meaning, currency, source, and observation time are explicit.

## Canonical identity

`CanonicalSneakerIdentity` contains brand, formal model name, optional formal colorway, optional style code, and optional release year. `SneakerVariant` contains size system, size value, and condition.

Matching priority:

1. matching style codes with no contradictory brand/color/release year → `exact`;
2. matching formal model and verified color → `probable`;
3. model only → `model_only`;
4. contradictory style, color, release year, brand, size system, size, or condition → `rejected`.

Only `exact` is included in standard aggregation and forecasting. US M and US W, new and used, sizes, colors, and retro release years remain separate.

## Snapshot

`MarketSnapshot` stores normalized fields only:

- provider, canonical identity, and variant;
- one explicit `priceType`;
- positive finite amount and ISO 4217 currency;
- `observedAt` and source reference;
- sample count when known;
- exact/probable match and official/partner/manual source quality;
- fee, shipping, and tax inclusion as true/false/unknown.

Lowest ask, highest bid, listing, sold, recommended sell, and recommended buy are not interchangeable. No single synthetic “market price” is produced.

## Series

A series key contains provider, exact identity, size system/value, condition, price type, and currency. Statistics and forecasts reject mixed keys. Snapshot persistence deduplicates the series key plus `observedAt`; the collector additionally removes a series already observed on the same UTC day.

The raw observations remain available to the statistics layer. Outliers are not deleted. Missing values are absent, never normalized to zero.

## Persistence

There is no owned database migration system in the repository. Tests use memory, local development can use a workspace-scoped JSON file, and production persistence is disabled. See [persistence.md](persistence.md).

