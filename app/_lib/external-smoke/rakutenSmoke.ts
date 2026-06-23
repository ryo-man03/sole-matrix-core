import { classifyExternalSmokeReadiness } from "./readiness";
import { isRakutenItemSearchResponse } from "./responseValidators";
import type {
  ExternalSmokeEnvironment,
  ExternalSmokeErrorKind,
  ExternalSmokeResult,
  RakutenAccessKeyTransport,
  RakutenCredentialContractCheck,
  RakutenForbiddenBodyErrorKind,
  RakutenSmokeDiagnostic,
} from "./types";

const rakutenEndpointContractAvailable = true;
const rakutenItemSearchEndpoint =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";
const rakutenEndpointHost = "openapi.rakuten.co.jp";
const rakutenEndpointPathname = "/ichibams/api/IchibaItem/Search/20260401";
const rakutenAccessKeyTransport: RakutenAccessKeyTransport = "header";

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
  url.searchParams.set("format", "json");
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
    const forbiddenBody =
      response.status === 403
        ? await classifyForbiddenResponseBody(response)
        : undefined;

    return rakutenFailure("network_error", {
      phase: "http_response",
      networkAttempted: true,
      httpStatus: response.status,
      responseOk: response.ok,
      errorKind: classifyHttpError(response.status),
      ...(response.status === 403
        ? {
            credentialContractCheck: buildCredentialContractCheck({
              url,
              accessKeyTransport: rakutenAccessKeyTransport,
              httpStatus: response.status,
              responseOk: response.ok,
              bodyReadable: forbiddenBody?.bodyReadable,
              bodyErrorCodeKind: forbiddenBody?.bodyErrorCodeKind,
            }),
          }
        : {}),
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

async function classifyForbiddenResponseBody(
  response: Response
): Promise<{
  bodyReadable: boolean;
  bodyErrorCodeKind?: RakutenForbiddenBodyErrorKind;
}> {
  try {
    const body = (await response.json()) as unknown;
    return {
      bodyReadable: true,
      bodyErrorCodeKind: classifyForbiddenJsonBody(body),
    };
  } catch {
    return { bodyReadable: false };
  }
}

function classifyForbiddenJsonBody(
  value: unknown
): RakutenForbiddenBodyErrorKind {
  const markers = collectForbiddenMarkers(value);

  if (
    markers.some(
      (marker) =>
        marker.includes("invalid_access_key") ||
        marker.includes("invalid access key") ||
        marker.includes("accesskey invalid") ||
        marker.includes("access key invalid")
    )
  ) {
    return "invalid_access_key_possible";
  }

  if (
    markers.some(
      (marker) =>
        marker.includes("referrer") ||
        marker.includes("referer") ||
        marker.includes("origin") ||
        marker.includes("allowed domain") ||
        marker.includes("domain restriction")
    )
  ) {
    return "referrer_or_origin_possible";
  }

  if (
    markers.some(
      (marker) =>
        marker.includes("scope") ||
        marker.includes("permission") ||
        marker.includes("not allowed") ||
        marker.includes("forbidden")
    )
  ) {
    return "requested_scope_possible";
  }

  return "unknown_forbidden";
}

function collectForbiddenMarkers(value: unknown): string[] {
  const markers: string[] = [];
  const queue: unknown[] = [value];

  while (queue.length > 0 && markers.length < 64) {
    const current = queue.shift();

    if (typeof current === "string") {
      markers.push(current.toLowerCase());
      continue;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (isRecord(current)) {
      for (const [key, nestedValue] of Object.entries(current)) {
        markers.push(key.toLowerCase());
        queue.push(nestedValue);
      }
    }
  }

  return markers;
}

function buildCredentialContractCheck(input: {
  url: URL;
  accessKeyTransport: RakutenAccessKeyTransport;
  httpStatus: number;
  responseOk: boolean;
  bodyReadable?: boolean | undefined;
  bodyErrorCodeKind?: RakutenForbiddenBodyErrorKind | undefined;
}): RakutenCredentialContractCheck {
  const endpointContractOk =
    input.url.hostname === rakutenEndpointHost &&
    input.url.pathname === rakutenEndpointPathname;
  const requiredParameterNamesPresent =
    input.url.searchParams.has("applicationId") &&
    input.accessKeyTransport === "header";

  return {
    provider: "rakuten",
    endpointContractOk,
    requiredParameterNamesPresent,
    accessKeyTransport: input.accessKeyTransport,
    httpStatus: input.httpStatus,
    responseOk: input.responseOk,
    ...(input.bodyReadable === undefined
      ? {}
      : { bodyReadable: input.bodyReadable }),
    ...(input.bodyErrorCodeKind === undefined
      ? {}
      : { bodyErrorCodeKind: input.bodyErrorCodeKind }),
    errorKind: classifyCredentialContractError({
      endpointContractOk,
      requiredParameterNamesPresent,
      accessKeyTransport: input.accessKeyTransport,
      bodyErrorCodeKind: input.bodyErrorCodeKind,
    }),
  };
}

function classifyCredentialContractError(input: {
  endpointContractOk: boolean;
  requiredParameterNamesPresent: boolean;
  accessKeyTransport: RakutenAccessKeyTransport;
  bodyErrorCodeKind?: RakutenForbiddenBodyErrorKind | undefined;
}): RakutenCredentialContractCheck["errorKind"] {
  if (!input.endpointContractOk) {
    return "endpoint_contract_mismatch";
  }

  if (
    !input.requiredParameterNamesPresent ||
    !["header", "query", "both_tested"].includes(input.accessKeyTransport)
  ) {
    return "access_key_transport_mismatch";
  }

  return input.bodyErrorCodeKind ?? "unknown_forbidden";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
