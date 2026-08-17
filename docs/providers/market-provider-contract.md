# Market provider contract

The canonical contract lives in `app/_lib/market/contracts.ts` and is validated at both the provider boundary and the client response boundary.

## Pipeline

Recommendation identity → query planner → provider orchestrator → Rakuten / Yahoo / eBay → runtime validation → normalization → deterministic identity matching → condition and currency groups → price summary → purchase confidence → UI.

Required guarantees:

- A listing carries provider, external identity, title, canonical identity evidence, price and original currency, shipping knowledge, condition, size, stock, safe HTTPS links, match classification, warnings, and fetch time.
- Style codes are normalized with NFKC, uppercase, and separator removal. Only full equality is accepted.
- Different generations, derivatives, adult/kids audiences, and known men/women conflicts are rejected.
- Only exact and probable matches enter price summaries. Related listings remain visible only in a separate comparison area.
- New, used, unknown condition and every currency are summarized separately. No inferred FX conversion is performed.
- Rakuten and Yahoo values are current shop prices. eBay values are current listing prices. None is a completed-sale price.
- A provider error produces a provider-specific safe status and an empty listing set; it does not throw through the whole search.
- Market values cannot mutate recommendation, Core, Ryo, release evidence, or verified colorway state.

External requests are server-only, manually initiated, bounded to eight seconds and 1.5 MB, and may retry once only for a timeout, connection reset, or HTTP 502/503/504.
