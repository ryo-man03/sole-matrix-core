# Market Intelligence V2 audit

## Baseline

Measured on 2026-08-12 from `main` at `ddce9814a181b432f2942fd28f98bd17a44e94a1`.

| Gate | Baseline |
| --- | --- |
| Node | 22.21.0 |
| pnpm | 11.16.0 |
| Next.js | 16.2.11 |
| Test files | 126 passed |
| Tests | 1,541 passed |
| Migrations | 4 verified |
| RLS | 117 passed |
| Security | 26 passed |
| Production build | passed; 45 generated pages and 51 listed routes/pages |
| Dependency audit | Critical 0, High 0, Moderate 1, Low 1 |

The build emitted one pre-existing Turbopack trace warning from the file-backed global recommendation feedback corpus.

## Initial implementation audit

| Area | Decision | Finding |
| --- | --- | --- |
| Recommendation Core and Ryo | keep | Market data is already separated from ranking and must remain so. |
| Shared market contracts | replace/extend | Existing names and status variants differ from the V2 contract and lack a complete runtime provider-boundary validator. |
| Rakuten adapter | extend | Existing implementation is reusable but targets an older endpoint and must adopt the 2026-07-01 access-key contract. |
| Yahoo adapter | extend | Existing v3 adapter is reusable; schema normalization and condition/brand evidence need strengthening. |
| eBay adapter | replace/extend | Browse search is reusable; application-token caching, single-flight refresh, and 401 invalidation are missing. |
| Matching | replace/extend | Deterministic matching exists, but brand, derivative, generation, and probable/exact semantics need stricter canonical rules. |
| Request helper | extend | Timeout, size limit, and retry policy exist; circuit state, observability, and search-level single flight are missing. |
| Market UI | replace | Manual load behavior is correct, but copy is corrupted and purchase/fit confidence and grouped summaries are absent. |
| Legacy Rakuten UI names | consolidate | Keep route compatibility while presenting a provider-neutral component and copy. |
| StockX automated adapter | disable | Current user-facing usage is incompatible with the official internal-use-only license language without written approval. |
| alias | keep gated | Approval is pending; no private endpoint discovery or integration is allowed. |

This document is updated again in the final readiness branch with post-change counts and live-provider evidence.
