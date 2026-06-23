export type ExternalSmokeStatus =
  | "ok"
  | "missing_env"
  | "skipped_external_smoke"
  | "blocked_missing_endpoint_contract"
  | "network_error"
  | "invalid_response_shape";

export type ExternalSmokeProvider = "gemini" | "rakuten";

export type ExternalSmokeResult = {
  provider: ExternalSmokeProvider;
  status: ExternalSmokeStatus;
  missingEnvVars?: string[];
};

export type ExternalSmokeErrorKind =
  | "http_404"
  | "http_429"
  | "auth_error"
  | "rate_limited"
  | "network_error"
  | "invalid_response_shape";

export type ExternalSmokeStatusSummary = {
  provider: ExternalSmokeProvider;
  status: ExternalSmokeStatus;
  networkAttempted: boolean;
  shapeValid: boolean;
  errorKind?: ExternalSmokeErrorKind;
};

export type ExternalSmokeEnvironment = Record<string, string | undefined>;
