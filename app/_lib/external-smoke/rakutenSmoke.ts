import { classifyExternalSmokeReadiness } from "./readiness";
import { isRakutenItemSearchResponse } from "./responseValidators";
import type {
  ExternalSmokeEnvironment,
  ExternalSmokeResult,
} from "./types";

const rakutenEndpointContractAvailable = true;
const rakutenItemSearchEndpoint =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";

export async function runRakutenIsolatedSmoke(
  options: {
    env?: ExternalSmokeEnvironment;
    fetcher?: typeof fetch;
    endpointContractAvailable?: boolean;
  } = {}
): Promise<ExternalSmokeResult> {
  const env = options.env ?? process.env;
  const readiness = classifyExternalSmokeReadiness({
    provider: "rakuten",
    env,
    requiredEnvVars: ["RAKUTEN_APPLICATION_ID", "RAKUTEN_ACCESS_KEY"],
    endpointContractAvailable:
      options.endpointContractAvailable ?? rakutenEndpointContractAvailable,
  });

  if (readiness !== null) {
    return readiness;
  }

  const applicationId = env.RAKUTEN_APPLICATION_ID?.trim();
  const accessKey = env.RAKUTEN_ACCESS_KEY?.trim();
  const fetcher = options.fetcher ?? globalThis.fetch;

  if (!applicationId || !accessKey || typeof fetcher !== "function") {
    return { provider: "rakuten", status: "network_error" };
  }

  const url = new URL(rakutenItemSearchEndpoint);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", "スニーカー");
  url.searchParams.set("hits", "1");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("elements", "itemName,itemPrice,itemUrl");

  try {
    const response = await fetcher(url, {
      headers: { accessKey },
    });

    if (!response.ok) {
      return { provider: "rakuten", status: "network_error" };
    }

    const responseBody = (await response.json()) as unknown;

    return {
      provider: "rakuten",
      status: isRakutenItemSearchResponse(responseBody)
        ? "ok"
        : "invalid_response_shape",
    };
  } catch {
    return { provider: "rakuten", status: "network_error" };
  }
}
