# Daily picks

Daily picks are generated ahead of the read path from the internal release catalog. Login and `/today` only read persisted batches and never call release, market, or AI providers. The API response explicitly reports `externalRequests: 0`. `daily-picks-v1.0.0` is separate from Core scoring. It combines taste, explicit preferences, novelty, release urgency, availability, and accepted independent evidence; market live price and listing count never mutate Core, Ryo, or taste affinity.

Batches are idempotent by user, target date, and algorithm version. The UI displays release state, date, region, source confidence, verification, and staleness. Technical evidence stays collapsed. A date conflict has no resolved date and shows `発売日は情報源によって異なります`. The UI can display an older batch with a stale label, but never calls it current. Fixture records are test-only and return an empty set in production.
