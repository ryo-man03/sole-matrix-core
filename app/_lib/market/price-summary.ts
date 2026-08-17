import type { MarketListing, MarketPriceSummary } from "./contracts";

export function summarizeMarketPrices(listings: readonly MarketListing[]): MarketPriceSummary[] {
  const groups = new Map<string, MarketListing[]>();
  for (const listing of listings) {
    if (listing.matchLevel === "related" || listing.matchLevel === "rejected") continue;
    const key = `${listing.provider}\u0000${listing.condition}\u0000${listing.currency}`;
    const group = groups.get(key) ?? [];
    group.push(listing);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const sorted = group.map(({ price }) => price).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
    const [first] = group;
    return {
      provider: first!.provider,
      condition: first!.condition,
      currency: first!.currency,
      listingCount: sorted.length,
      minimum: sorted[0] ?? null,
      median,
      maximum: sorted.at(-1) ?? null,
      fetchedAt: latest(group.map(({ fetchedAt }) => fetchedAt)),
    };
  }).sort((left, right) => `${left.provider}:${left.condition}:${left.currency}`.localeCompare(`${right.provider}:${right.condition}:${right.currency}`));
}

function latest(values: readonly string[]): string | null {
  const times = values.map((value) => Date.parse(value)).filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}
