# Daily picks

Daily picks are generated ahead of the read path from the internal release catalog. Login and `/today` only read persisted batches and never call release, market, or AI providers. `daily-picks-v1.0.0` is separate from Core scoring. It combines taste, explicit preferences, novelty, release urgency, availability, and evidence; market live price never mutates Core or taste affinity.

Batches are idempotent by user, target date, and algorithm version. The UI can display an older batch with a stale label, but never calls it current. Fixture records are test-only and return an empty set in production.
