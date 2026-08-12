# Authorized release provider handoff

Next branch: `feat/authorized-release-providers-v1`.

Implement the existing `ReleaseProviderCapability` and a `ReleaseFeedProvider` adapter with normalized required fields: provider record ID, canonical brand/model, model family, generation, information state, date/precision, region, variants, evidence, fetched time, and source confidence. Preserve rumor, editorial, retailer, and official states; a marketplace listing is never official evidence.

Before enabling a provider, record terms/version, legal approval, automated-collection permission, persistent-metadata permission, image reuse, excerpt permission, credential names (placeholders only), minimum interval, pagination/cursor semantics, incremental `since`, and deletion requirements. Runtime design must include bounded retries with jitter, circuit breaker, single-flight per cursor, rate limiting, request timeout, and idempotent normalization.

Raw responses remain ephemeral and must not enter recommendation history. Persist only allowed normalized metadata. Images and article text are denied unless the provider contract explicitly permits them. Fixture contract tests must cover every information state, missing fields, changed dates, duplicates, cursor replay, retry, and terms-disabled behavior.

Live smoke procedure: obtain approved credentials outside Git, enable one provider in an isolated non-production environment, run a single bounded page, inspect normalization and policy logs without bodies/secrets, verify no login or `/today` traffic, then disable it. Do not implement Sneaker Wars, SNKRDUNK, Mercari general listings, Grailed, brand crawling, article scraping, or guessed RSS without explicit authorization.
