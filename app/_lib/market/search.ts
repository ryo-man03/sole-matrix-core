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
import { planMarketQueries } from "./query-planner";
import {
  getMarketCache,
  isProviderCircuitOpen,
  providerSingleFlight,
  recordProviderMetric,
  recordProviderOutcome,
  setMarketCache,
} from "./reliability";
import { parseMarketProviderResult } from "./runtime-validation";

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
    const startedAt = performance.now();
    try {
      assertMarketProviderOperationAllowed(provider, "temporary_display");
      if (isProviderCircuitOpen(provider)) return unavailable(provider, "temporarily_unavailable", "provider_circuit_open");
      const queries = planMarketQueries(context);
      let finalResult: MarketProviderResult = unavailable(provider, "empty", "no_matching_listing");
      for (const query of queries) {
        const requestContext = { ...context, query: query.query };
        const key = searchKey(provider, requestContext, query.mode);
        const cached = getMarketCache<MarketProviderResult>(key);
        if (cached) {
          recordProviderMetric({ provider, status: "cache_hit", latencyMs: 0, responseBytes: normalizedBytes(cached), normalizedCount: cached.listings.length });
          return cached;
        }
        const result = await providerSingleFlight(key, () => search(requestContext));
        const parsed = parseMarketProviderResult(result, provider);
        finalResult = parsed;
        if (parsed.status === "success") {
          setMarketCache(key, parsed);
          break;
        }
        if (parsed.status !== "empty") break;
      }
      recordProviderOutcome(provider, finalResult.status);
      recordProviderMetric({
        provider,
        status: finalResult.status,
        latencyMs: Math.max(0, performance.now() - startedAt),
        responseBytes: normalizedBytes(finalResult),
        normalizedCount: finalResult.listings.length,
      });
      return finalResult;
    } catch {
      const result = schemaError(provider);
      recordProviderMetric({ provider, status: result.status, latencyMs: Math.max(0, performance.now() - startedAt), responseBytes: 0, normalizedCount: 0 });
      return result;
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
    fetchedAt: null,
    audit: emptyProviderAudit(provider),
    message: "価格情報を安全に表示できなかったため、この販売先だけ表示していません。",
  };
}

function normalizedBytes(value: MarketProviderResult): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function unavailable(
  provider: MarketProviderId,
  status: Exclude<MarketProviderResult["status"], "success">,
  safeCode: string,
): MarketProviderResult {
  return {
    provider,
    status,
    listings: [],
    fetchedAt: null,
    audit: emptyProviderAudit(provider),
    message: status === "empty" ? "一致する販売商品を確認できませんでした。" : "この販売先は一時的に利用できません。",
    safeCode,
  };
}

function searchKey(provider: MarketProviderId, context: MarketSearchContext, mode: string): string {
  const identity = context.identity;
  return [provider, identity.brand, identity.modelName, identity.styleCode, identity.colorwayName, context.condition, mode]
    .map((part) => part ?? "-").join("|").toLocaleLowerCase("en-US");
}
