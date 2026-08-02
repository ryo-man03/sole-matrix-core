import { loadEnvFile } from "node:process";

import type { MarketProviderId, MarketSearchContext } from "../app/_lib/market/contracts";
import { searchEbayListings, searchRakutenListings, searchYahooListings } from "../app/_lib/market/providers";

try { loadEnvFile(".env.local"); } catch { /* Environment variables may already be injected. */ }

const provider = readProvider(process.argv.slice(2));
if (!provider) {
  console.error("Usage: pnpm market:smoke --provider rakuten|yahoo|ebay");
  process.exitCode = 1;
} else {
  const startedAt = performance.now();
  const result = await ({
    rakuten: searchRakutenListings,
    yahoo: searchYahooListings,
    ebay: searchEbayListings,
  } satisfies Record<MarketProviderId, (context: MarketSearchContext) => Promise<unknown>>)[provider](context());
  if (!isProviderResult(result)) {
    console.error(JSON.stringify({ provider, status: "schema_error", credentialExposureCount: 0 }));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({
      provider,
      status: result.status,
      normalizedCount: result.audit.normalizedCount,
      exactCount: result.audit.exactCount,
      highCount: result.audit.highCount,
      relatedCount: result.audit.relatedCount,
      rejectedCount: result.audit.rejectedCount,
      currencies: result.audit.currencyCount,
      missingSizeCount: result.audit.missingSizeCount,
      missingConditionCount: result.audit.missingConditionCount,
      missingShippingCount: result.audit.missingShippingCount,
      elapsedMs: Math.round(performance.now() - startedAt),
      credentialExposureCount: 0,
    }, null, 2));
    if (result.status !== "success" && result.status !== "empty") process.exitCode = 1;
  }
}

function context(): MarketSearchContext {
  return {
    query: "Nike Air Force 1 Low HF2893-100",
    identity: {
      brand: "Nike",
      modelName: "Nike Air Force 1 Low",
      colorwayName: "White / Black",
      styleCode: "HF2893-100",
      verificationState: "model_color_style_verified",
    },
    gender: "unknown",
    sizeSystem: "UNKNOWN",
    size: null,
    condition: "unknown",
  };
}

function readProvider(args: readonly string[]): MarketProviderId | null {
  const value = args.find((item, index) => args[index - 1] === "--provider")
    ?? args.find((item) => item.startsWith("--provider="))?.slice("--provider=".length);
  return value === "rakuten" || value === "yahoo" || value === "ebay" ? value : null;
}

function isProviderResult(value: unknown): value is Awaited<ReturnType<typeof searchRakutenListings>> {
  return typeof value === "object" && value !== null && "status" in value && "audit" in value;
}
