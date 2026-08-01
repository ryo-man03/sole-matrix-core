# Market history persistence

Audit date: 2026-07-30

The repository contains Supabase authentication helpers, but no owned database schema, migration directory, service-role configuration, or established market-data persistence layer. No database or migration was added.

## Implemented modes

- Tests use an in-memory repository.
- Local development may use `.data/market-history.json` or a workspace-relative path configured with `MARKET_HISTORY_FILE`.
- Production returns an explicit disabled repository until an owned database, migration process, access policy, and operational owner exist.

The local file contains only validated `MarketSnapshot` fields. Raw provider responses, OAuth tokens, API keys, refresh tokens, request headers, and user secrets are outside this repository contract.

## Uniqueness and retention

A snapshot is unique by provider, canonical identity, variant, condition, price type, currency series, and `observedAt`. The required dedupe identity is represented by the series key plus `observedAt`; a second value at the same provider/identity/variant/price-type/time is treated as a duplicate rather than silently overwriting the first observation.

The default local retention period is 730 days and can be reduced by repository construction. Entries outside retention are rejected or removed. Deletion is explicit through:

- `deleteBefore(cutoff)` for time-based deletion;
- `deleteSeries(seriesKey)` for a complete normalized series.

## Rollback

There is no database migration to roll back. To stop local persistence, remove `MARKET_HISTORY_FILE` usage and use the disabled repository. The local file is independent of authentication data and can be deleted without affecting users, recommendations, or provider credentials. A future database implementation must add an additive migration, rollback SQL, RLS where user ownership exists, and a separate secret/token store before production can be enabled.

