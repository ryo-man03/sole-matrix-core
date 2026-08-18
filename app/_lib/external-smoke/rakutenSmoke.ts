import { classifyExternalSmokeReadiness } from "./readiness";
import { isRakutenItemSearchResponse } from "./responseValidators";
import type {
  ExternalSmokeEnvironment,
  ExternalSmokeErrorKind,
  ExternalSmokeResult,
  RakutenAccessKeyTransport,
  RakutenCredentialContractCheck,
  RakutenForbiddenBodyErrorKind,
  RakutenNextStep,
  RakutenNormalizationReadiness,
  RakutenSmokeDiagnostic,
} from "./types";

const rakutenEndpointContractAvailable = true;
const rakutenItemSearchEndpoint =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";
const rakutenEndpointHost = "openapi.rakuten.co.jp";
const rakutenEndpointPathname = "/ichibams/api/IchibaItem/Search/20260701";

export async function runRakutenIsolatedSmoke(
  options: {
    env?: ExternalSmokeEnvironment;
    fetcher?: typeof fetch;
    endpointContractAvailable?: boolean;
    endpoint?: string;
    accessKeyTransport?: Extract<RakutenAccessKeyTransport, "header" | "query">;
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
  const requestOrigin = normalizeHttpOrigin(env.RAKUTEN_REQUEST_ORIGIN);
  const fetcher = options.fetcher ?? globalThis.fetch;
  const accessKeyTransport = options.accessKeyTransport ?? "header";

  if (!applicationId || !accessKey || typeof fetcher !== "function") {
    return rakutenFailure("network_error", {
      phase: "before_fetch",
      networkAttempted: false,
      accessKeyTransport,
      endpointContractOk: false,
      requiredParameterNamesPresent: false,
      errorKind: "network_error",
      normalizationReadiness: "blocked_network",
      next: "WEB-12F.5 transport / network check",
    });
  }

  let url: URL;

  try {
    url = new URL(options.endpoint ?? rakutenItemSearchEndpoint);
  } catch {
    return rakutenFailure("network_error", {
      phase: "url_build",
      networkAttempted: false,
      accessKeyTransport,
      endpointContractOk: false,
      requiredParameterNamesPresent: false,
      errorKind: "url_build_error",
      normalizationReadiness: "blocked_network",
      next: "WEB-12F.5 transport / network check",
    });
  }

  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", "スニーカー");
  url.searchParams.set("hits", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("elements", "itemName,itemPrice,itemUrl");

  if (accessKeyTransport === "query") {
    url.searchParams.set("accessKey", accessKey);
  }

  const endpointContractOk = isRakutenEndpointContractOk(url);
  const requiredParameterNamesPresent = hasRequiredParameterNames({
    url,
    accessKeyTransport,
  });

  let response: Response;

  try {
    const requestContextHeaders = requestOrigin
      ? { Origin: requestOrigin, Referer: `${requestOrigin}/` }
      : {};
    const headers = accessKeyTransport === "header"
      ? { accessKey, ...requestContextHeaders }
      : requestContextHeaders;
    response = await fetcher(
      url,
      Object.keys(headers).length > 0 ? { headers } : undefined,
    );
  } catch {
    return rakutenFailure("network_error", {
      phase: "fetch_throw",
      networkAttempted: true,
      accessKeyTransport,
      endpointContractOk,
      requiredParameterNamesPresent,
      errorKind: "fetch_throw",
      normalizationReadiness: "blocked_network",
      next: "WEB-12F.5 transport / network check",
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
      accessKeyTransport,
      endpointContractOk,
      requiredParameterNamesPresent,
      httpStatus: response.status,
      responseOk: response.ok,
      errorKind: classifyHttpError(response.status),
      normalizationReadiness: classifyNormalizationReadiness(response.status),
      next: classifyNextStep(response.status),
      ...(response.status === 403
        ? {
            credentialContractCheck: buildCredentialContractCheck({
              url,
              accessKeyTransport,
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
    return rakutenFailure("invalid_response_shape", {
      phase: "json_parse",
      networkAttempted: true,
      accessKeyTransport,
      endpointContractOk,
      requiredParameterNamesPresent,
      httpStatus: response.status,
      responseOk: response.ok,
      errorKind: "json_parse_error",
      normalizationReadiness: "blocked_shape_mismatch",
      next: "WEB-12G-PRE shape contract review",
    });
  }

  if (!isRakutenItemSearchResponse(responseBody)) {
    return rakutenFailure("invalid_response_shape", {
      phase: "shape_validation",
      networkAttempted: true,
      accessKeyTransport,
      endpointContractOk,
      requiredParameterNamesPresent,
      httpStatus: response.status,
      responseOk: response.ok,
      errorKind: "invalid_response_shape",
      normalizationReadiness: "blocked_shape_mismatch",
      next: "WEB-12G-PRE shape contract review",
    });
  }

  return {
    provider: "rakuten",
    status: "ok",
    diagnostic: {
      provider: "rakuten",
      phase: "shape_validation",
      networkAttempted: true,
      accessKeyTransport,
      endpointContractOk,
      requiredParameterNamesPresent,
      httpStatus: response.status,
      responseOk: response.ok,
      normalizationReadiness: "ready",
      next: "WEB-12G response normalization design",
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

function classifyNormalizationReadiness(
  status: number
): RakutenNormalizationReadiness {
  if (status === 400) return "blocked_parameter_contract";
  if (status === 401) return "blocked_auth";
  if (status === 403) return "blocked_forbidden";
  if (status === 404) return "blocked_endpoint_contract";
  if (status === 429) return "blocked_rate_limit";
  if (status >= 500) return "blocked_server_error";
  return "blocked_network";
}

function classifyNextStep(status: number): RakutenNextStep {
  if (status === 400) return "WEB-12F.5 parameter contract fix";
  if (status === 401) return "WEB-12F.5 credential check";
  if (status === 403) {
    return "WEB-12F.5 dashboard / credential / permission / referrer-origin manual check";
  }
  if (status === 404) return "WEB-12F.5 endpoint contract fix";
  if (status === 429) return "WEB-12F.5 rate limit policy";
  if (status >= 500) return "degraded behavior / retry policy";
  return "WEB-12F.5 transport / network check";
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
  const endpointContractOk = isRakutenEndpointContractOk(input.url);
  const requiredParameterNamesPresent = hasRequiredParameterNames({
    url: input.url,
    accessKeyTransport: input.accessKeyTransport,
  });

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

function isRakutenEndpointContractOk(url: URL): boolean {
  return (
    url.hostname === rakutenEndpointHost &&
    url.pathname === rakutenEndpointPathname
  );
}

function hasRequiredParameterNames(input: {
  url: URL;
  accessKeyTransport: RakutenAccessKeyTransport;
}): boolean {
  const hasApplicationId = input.url.searchParams.has("applicationId");

  if (input.accessKeyTransport === "header") {
    return hasApplicationId;
  }

  if (input.accessKeyTransport === "query") {
    return hasApplicationId && input.url.searchParams.has("accessKey");
  }

  return false;
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

function normalizeHttpOrigin(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 512) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
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
