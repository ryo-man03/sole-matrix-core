import { classifyExternalSmokeReadiness } from "./readiness";
import { isRakutenItemSearchResponse } from "./responseValidators";
import type {
  ExternalSmokeEnvironment,
  ExternalSmokeErrorKind,
  ExternalSmokeResult,
  RakutenSmokeDiagnostic,
} from "./types";

const rakutenEndpointContractAvailable = true;
const rakutenItemSearchEndpoint =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";

export async function runRakutenIsolatedSmoke(
  options: {
    env?: ExternalSmokeEnvironment;
    fetcher?: typeof fetch;
    endpointContractAvailable?: boolean;
    endpoint?: string;
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
    return rakutenFailure("network_error", {
      phase: "before_fetch",
      networkAttempted: false,
      errorKind: "network_error",
    });
  }

  let url: URL;

  try {
    url = new URL(options.endpoint ?? rakutenItemSearchEndpoint);
  } catch {
    return rakutenFailure("network_error", {
      phase: "url_build",
      networkAttempted: false,
      errorKind: "url_build_error",
    });
  }

  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", "スニーカー");
  url.searchParams.set("hits", "1");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("elements", "itemName,itemPrice,itemUrl");

  let response: Response;

  try {
    response = await fetcher(url, {
      headers: { accessKey },
    });
  } catch {
    return rakutenFailure("network_error", {
      phase: "fetch_throw",
      networkAttempted: true,
      errorKind: "fetch_throw",
    });
  }

  if (!response.ok) {
    return rakutenFailure("network_error", {
      phase: "http_response",
      networkAttempted: true,
      httpStatus: response.status,
      responseOk: response.ok,
      errorKind: classifyHttpError(response.status),
    });
  }

  let responseBody: unknown;

  try {
    responseBody = (await response.json()) as unknown;
  } catch {
    return rakutenFailure("network_error", {
      phase: "json_parse",
      networkAttempted: true,
      httpStatus: response.status,
      responseOk: response.ok,
      errorKind: "json_parse_error",
    });
  }

  if (!isRakutenItemSearchResponse(responseBody)) {
    return rakutenFailure("invalid_response_shape", {
      phase: "shape_validation",
      networkAttempted: true,
      httpStatus: response.status,
      responseOk: response.ok,
      errorKind: "invalid_response_shape",
    });
  }

  return {
    provider: "rakuten",
    status: "ok",
    diagnostic: {
      provider: "rakuten",
      phase: "shape_validation",
      networkAttempted: true,
      httpStatus: response.status,
      responseOk: response.ok,
    },
  };
}

function classifyHttpError(status: number): ExternalSmokeErrorKind {
  if (status === 400) return "http_400";
  if (status === 401) return "http_401";
  if (status === 403) return "http_403";
  if (status === 404) return "http_404";
  if (status === 429) return "http_429";
  if (status >= 500) return "http_5xx";
  return "network_error";
}

function rakutenFailure(
  status: "network_error" | "invalid_response_shape",
  diagnostic: Omit<RakutenSmokeDiagnostic, "provider">
): ExternalSmokeResult {
  return {
    provider: "rakuten",
    status,
    diagnostic: {
      provider: "rakuten",
      ...diagnostic,
    },
  };
}
