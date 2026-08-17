# Release evidence model

The resolution flow is `evidence → verification/review → canonical identity → release item state`. A release item is a derived catalog record, not an unqualified provider assertion.

Migration `202608180001_release_intelligence_evolution.sql` evolves migration 004 without editing it. Evidence now records provider/source external IDs, a content fingerprint, source domain, canonical origin, independence key, model/style/colorway/date/region support flags, observed date/state, verification and review states, variant relation, supersession, ingestion run, first/last seen, last verified, and bounded provenance. Status changes have append-only history. Ingestion runs retain only counts, cursors, timing, idempotency, and safe error codes.

Allowed source kinds are:

- `brand_official`
- `authorized_retailer`
- `licensed_feed`
- `editorial_authorized`
- `manual_official_reference`
- `manual_retailer_reference`
- `manual_other`

There is deliberately no marketplace source kind. A marketplace catalog or listing cannot verify an official announcement, colorway, or release date.

Content fingerprints ignore fetch time, evidence UUID, review state, and supersession pointer, so a refetch of unchanged source content is idempotent. A changed assertion gets a new fingerprint and may supersede an older evidence row. Duplicate URLs that trace to the same primary origin share an independence key and count once.

Automatic merge requires either the same full normalized style code or exact brand/model-family/generation/audience plus verified colorway and matching region. GTIN alone, partial style code, substring similarity, unverified colorway, and cross-region similarity never auto-merge.
