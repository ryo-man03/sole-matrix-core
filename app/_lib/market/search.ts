import type { MarketProviderResult, MarketSearchContext, MarketSearchResponse } from "./contracts";
import { searchEbayListings, searchRakutenListings, searchYahooListings } from "./providers";

export async function searchCurrentMarketPrices(
  context: MarketSearchContext,
  providers: readonly ((context: MarketSearchContext) => Promise<MarketProviderResult>)[] = [
    searchRakutenListings,
    searchYahooListings,
    searchEbayListings,
  ],
): Promise<MarketSearchResponse> {
  const results = await Promise.all(providers.map((provider) => provider(context)));
  return {
    query: context.query,
    searchedAt: new Date().toISOString(),
    recommendationRankingChanged: false,
    providers: results,
  };
}
