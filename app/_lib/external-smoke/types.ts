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
  httpStatus?: number;
  responseOk?: boolean;
  errorKind?: ExternalSmokeErrorKind;
  credentialContractCheck?: RakutenCredentialContractCheck;
};

export type ExternalSmokeStatusSummary = {
  provider: ExternalSmokeProvider;
  status: ExternalSmokeStatus;
  networkAttempted: boolean;
  shapeValid: boolean;
  phase?: RakutenSmokeDiagnosticPhase;
  httpStatus?: number;
  responseOk?: boolean;
  errorKind?: ExternalSmokeErrorKind;
  endpointContractOk?: boolean;
  requiredParameterNamesPresent?: boolean;
  accessKeyTransport?: RakutenAccessKeyTransport;
  bodyReadable?: boolean;
  bodyErrorCodeKind?: RakutenForbiddenBodyErrorKind;
};

export type ExternalSmokeEnvironment = Record<string, string | undefined>;
