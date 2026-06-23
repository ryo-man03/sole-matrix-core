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
  | "json_parse_error"
  | "auth_error"
  | "rate_limited"
  | "network_error"
  | "invalid_response_shape";

export type RakutenSmokeDiagnostic = {
  provider: "rakuten";
  phase: RakutenSmokeDiagnosticPhase;
  networkAttempted: boolean;
  httpStatus?: number;
  responseOk?: boolean;
  errorKind?: ExternalSmokeErrorKind;
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
};

export type ExternalSmokeEnvironment = Record<string, string | undefined>;
