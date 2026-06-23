export type ExternalSmokeStatus =
  | "ok"
  | "missing_env"
  | "skipped_external_smoke"
  | "blocked_missing_endpoint_contract"
  | "network_error"
  | "invalid_response_shape";

export type ExternalSmokeProvider = "gemini" | "rakuten";

export type RakutenSmokeDiagnosticPhase =
  | "before_fetch"
  | "url_build"
  | "fetch_throw"
  | "http_response"
  | "json_parse"
  | "shape_validation";

export type ExternalSmokeResult = {
  provider: ExternalSmokeProvider;
  status: ExternalSmokeStatus;
  missingEnvVars?: string[];
  diagnostic?: RakutenSmokeDiagnostic;
};

export type ExternalSmokeErrorKind =
  | "url_build_error"
  | "fetch_throw"
  | "http_400"
  | "http_401"
  | "http_403"
  | "http_404"
  | "http_429"
  | "http_5xx"
  | "invalid_access_key_possible"
  | "requested_scope_possible"
  | "referrer_or_origin_possible"
  | "endpoint_contract_mismatch"
  | "access_key_transport_mismatch"
  | "unknown_forbidden"
  | "json_parse_error"
  | "auth_error"
  | "rate_limited"
  | "network_error"
  | "invalid_response_shape";

export type RakutenAccessKeyTransport =
  | "header"
  | "query"
  | "both_tested"
  | "unknown";

export type RakutenNormalizationReadiness =
  | "ready"
  | "blocked_shape_mismatch"
  | "blocked_parameter_contract"
  | "blocked_auth"
  | "blocked_forbidden"
  | "blocked_endpoint_contract"
  | "blocked_rate_limit"
  | "blocked_server_error"
  | "blocked_network";

export type RakutenNextStep =
  | "WEB-12G response normalization design"
  | "WEB-12G-PRE shape contract review"
  | "WEB-12F.5 parameter contract fix"
  | "WEB-12F.5 credential check"
  | "WEB-12F.5 dashboard / credential / permission / referrer-origin manual check"
  | "WEB-12F.5 endpoint contract fix"
  | "WEB-12F.5 rate limit policy"
  | "degraded behavior / retry policy"
  | "WEB-12F.5 transport / network check";

export type RakutenForbiddenBodyErrorKind =
  | "invalid_access_key_possible"
  | "requested_scope_possible"
  | "referrer_or_origin_possible"
  | "unknown_forbidden";

export type RakutenCredentialContractCheck = {
  provider: "rakuten";
  endpointContractOk: boolean;
  requiredParameterNamesPresent: boolean;
  accessKeyTransport: RakutenAccessKeyTransport;
  httpStatus?: number;
  responseOk?: boolean;
  bodyReadable?: boolean;
  bodyErrorCodeKind?: RakutenForbiddenBodyErrorKind;
  errorKind: Extract<
    ExternalSmokeErrorKind,
    | "invalid_access_key_possible"
    | "requested_scope_possible"
    | "referrer_or_origin_possible"
    | "endpoint_contract_mismatch"
    | "access_key_transport_mismatch"
    | "unknown_forbidden"
  >;
};

export type RakutenSmokeDiagnostic = {
  provider: "rakuten";
  phase: RakutenSmokeDiagnosticPhase;
  networkAttempted: boolean;
  accessKeyTransport?: RakutenAccessKeyTransport;
  endpointContractOk?: boolean;
  requiredParameterNamesPresent?: boolean;
  httpStatus?: number;
  responseOk?: boolean;
  errorKind?: ExternalSmokeErrorKind;
  normalizationReadiness?: RakutenNormalizationReadiness;
  next?: RakutenNextStep;
  credentialContractCheck?: RakutenCredentialContractCheck;
};

export type ExternalSmokeStatusSummary = {
  provider: ExternalSmokeProvider;
  status: ExternalSmokeStatus;
  networkAttempted: boolean;
  shapeValid: boolean;
  phase?: RakutenSmokeDiagnosticPhase;
  transport?: RakutenAccessKeyTransport;
  httpStatus?: number;
  responseOk?: boolean;
  errorKind?: ExternalSmokeErrorKind;
  normalizationReadiness?: RakutenNormalizationReadiness;
  next?: RakutenNextStep;
  endpointContractOk?: boolean;
  requiredParameterNamesPresent?: boolean;
  accessKeyTransport?: RakutenAccessKeyTransport;
  bodyReadable?: boolean;
  bodyErrorCodeKind?: RakutenForbiddenBodyErrorKind;
};

export type ExternalSmokeEnvironment = Record<string, string | undefined>;

export type RakutenTransportStatusReports = {
  header: ExternalSmokeStatusSummary;
  query: ExternalSmokeStatusSummary;
};
