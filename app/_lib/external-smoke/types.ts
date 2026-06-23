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

export type ExternalSmokeEnvironment = Record<string, string | undefined>;
