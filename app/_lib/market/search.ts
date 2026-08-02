import "server-only";

import type {
  MarketProviderId,
  MarketProviderResult,
  MarketSearchContext,
  MarketSearchResponse,
} from "./contracts";
import { emptyProviderAudit } from "./contracts";
import { assertMarketProviderOperationAllowed } from "./provider-policy";
import { searchEbayListings, searchRakutenListings, searchYahooListings } from "./providers";

export type MarketProviderSearch = Readonly<{
  provider: MarketProviderId;
  search: (context: MarketSearchContext) => Promise<MarketProviderResult>;
}>;

const DEFAULT_PROVIDER_SEARCHES: readonly MarketProviderSearch[] = [
  { provider: "rakuten", search: searchRakutenListings },
  { provider: "yahoo", search: searchYahooListings },
  { provider: "ebay", search: searchEbayListings },
];

export async function searchCurrentMarketPrices(
  context: MarketSearchContext,
  providers: readonly MarketProviderSearch[] = DEFAULT_PROVIDER_SEARCHES,
): Promise<MarketSearchResponse> {
  const results = await Promise.all(providers.map(async ({ provider, search }) => {
    try {
      const result = await search(context);
      if (result.provider !== provider) return schemaError(provider);
      assertMarketProviderOperationAllowed(provider, "temporary_display");
      return result;
    } catch {
      return schemaError(provider);
    }
  }));
  return {
    query: context.query,
    searchedAt: new Date().toISOString(),
    recommendationRankingChanged: false,
    providers: results,
  };
}

function schemaError(provider: MarketProviderId): MarketProviderResult {
  return {
    provider,
    status: "schema_error",
    listings: [],
    audit: emptyProviderAudit(provider),
    message: "価格情報を安全に表示できなかったため、この販売先だけ表示していません。",
  };
}
