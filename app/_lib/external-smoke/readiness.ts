import type {
  ExternalSmokeEnvironment,
  ExternalSmokeProvider,
  ExternalSmokeResult,
} from "./types";

export function classifyExternalSmokeReadiness(input: {
  provider: ExternalSmokeProvider;
  env: ExternalSmokeEnvironment;
  requiredEnvVars: readonly string[];
  endpointContractAvailable: boolean;
}): ExternalSmokeResult | null {
  const missingEnvVars = input.requiredEnvVars.filter(
    (name) => !hasNonEmptyValue(input.env[name])
  );

  if (missingEnvVars.length > 0) {
    return {
      provider: input.provider,
      status: "missing_env",
      missingEnvVars,
    };
  }

  if (input.env.RUN_EXTERNAL_SMOKE?.trim() !== "1") {
    return {
      provider: input.provider,
      status: "skipped_external_smoke",
    };
  }

  if (!input.endpointContractAvailable) {
    return {
      provider: input.provider,
      status: "blocked_missing_endpoint_contract",
    };
  }

  return null;
}

function hasNonEmptyValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
