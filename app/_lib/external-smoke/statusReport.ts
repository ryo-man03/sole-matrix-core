import { runGeminiIsolatedSmoke } from "./geminiSmoke";
import { runRakutenIsolatedSmoke } from "./rakutenSmoke";
import type {
  ExternalSmokeEnvironment,
  ExternalSmokeResult,
  ExternalSmokeStatusSummary,
} from "./types";

type SmokeRunOptions = {
  env?: ExternalSmokeEnvironment;
  fetcher?: typeof fetch;
  endpointContractAvailable?: boolean;
};

export async function runGeminiIsolatedSmokeStatusReport(
  options: SmokeRunOptions = {}
): Promise<ExternalSmokeStatusSummary> {
  let networkAttempted = false;
  const fetcher = options.fetcher ?? globalThis.fetch;
  const reportOptions = { ...options };

  if (typeof fetcher === "function") {
    reportOptions.fetcher = (...args) => {
      networkAttempted = true;
      return fetcher(...args);
    };
  }

  const result = await runGeminiIsolatedSmoke(reportOptions);
  return summarizeExternalSmokeResult(result, networkAttempted);
}

export async function runRakutenIsolatedSmokeStatusReport(
  options: SmokeRunOptions = {}
): Promise<ExternalSmokeStatusSummary> {
  let networkAttempted = false;
  const fetcher = options.fetcher ?? globalThis.fetch;
  const reportOptions = { ...options };

  if (typeof fetcher === "function") {
    reportOptions.fetcher = (...args) => {
      networkAttempted = true;
      return fetcher(...args);
    };
  }

  const result = await runRakutenIsolatedSmoke(reportOptions);
  return summarizeExternalSmokeResult(result, networkAttempted);
}

export function summarizeExternalSmokeResult(
  result: ExternalSmokeResult,
  networkAttempted = [
    "ok",
    "network_error",
    "invalid_response_shape",
  ].includes(result.status)
): ExternalSmokeStatusSummary {
  if (result.status === "network_error") {
    return {
      provider: result.provider,
      status: result.status,
      networkAttempted,
      shapeValid: false,
      errorKind: "network_error",
    };
  }

  if (result.status === "invalid_response_shape") {
    return {
      provider: result.provider,
      status: result.status,
      networkAttempted,
      shapeValid: false,
      errorKind: "invalid_response_shape",
    };
  }

  return {
    provider: result.provider,
    status: result.status,
    networkAttempted,
    shapeValid: result.status === "ok",
  };
}

export function formatExternalSmokeStatusSummary(
  label: "Gemini" | "Rakuten",
  summary: ExternalSmokeStatusSummary
): string {
  const lines = [
    `${label} isolated smoke status summary:`,
    `provider: ${summary.provider}`,
    `status: ${summary.status}`,
    `networkAttempted: ${summary.networkAttempted}`,
    `shapeValid: ${summary.shapeValid}`,
  ];

  if (summary.errorKind) {
    lines.push(`errorKind: ${summary.errorKind}`);
  }

  return lines.join("\n");
}

export function printExternalSmokeStatusSummary(
  label: "Gemini" | "Rakuten",
  summary: ExternalSmokeStatusSummary
): void {
  console.info(formatExternalSmokeStatusSummary(label, summary));
}
