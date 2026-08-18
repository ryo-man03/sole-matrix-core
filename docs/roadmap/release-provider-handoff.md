# Release provider handoff

Market Intelligence V2 does not make marketplace listings into release evidence. A future Release Provider must remain a separate capability and preserve official, retailer, editorial, and rumor states without promotion between them.

## Preferred route

1. Use an official brand, retailer, or licensed release-calendar API with explicit automated-access terms.
2. Record the terms URL and review date, approved use, persistence/deletion rules, image and excerpt rights, rate limits, pagination, and credential placeholders.
3. Add a fixture-only contract adapter first. Require canonical brand/model/family/generation, regional date precision, evidence URL, information state, and fetched time.
4. Add bounded timeout/retry, rate-limit handling, circuit breaker, single-flight, incremental cursor, idempotent normalization, and raw-response non-persistence.
5. Run one local non-production smoke, confirm no login or `/today` traffic, document the safe status, then disable live access until review is complete.

## Denied without new approval

Do not crawl brands or retailers, scrape articles, guess RSS feeds, use cookies/private endpoints, or reinterpret a marketplace listing as official release evidence. SNKRDUNK, Mercari general listings, Grailed, and any provider whose permission is unknown remain disabled until the registry records explicit authorization for the exact operation. StockX has an official API but remains credential-missing and catalog-reference-only; its marketplace date cannot become brand-official evidence.

The implementation handoff starts only after product owner and legal/policy approval. Raw responses remain ephemeral; only contract-approved normalized metadata may be persisted. Release data never changes Core/Ryo scoring merely because a provider is available.
