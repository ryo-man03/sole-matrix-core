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
  return summarizeExternalSmokeResult(
    result,
    result.diagnostic?.networkAttempted ?? networkAttempted
  );
}

export function summarizeExternalSmokeResult(
  result: ExternalSmokeResult,
  networkAttempted = [
    "ok",
    "network_error",
    "invalid_response_shape",
  ].includes(result.status)
): ExternalSmokeStatusSummary {
  if (result.provider === "rakuten" && result.diagnostic) {
    const credentialContractCheck =
      result.diagnostic.credentialContractCheck;

    return {
      provider: result.provider,
      status: result.status,
      networkAttempted: result.diagnostic.networkAttempted,
      shapeValid: result.status === "ok",
      phase: result.diagnostic.phase,
      ...(result.diagnostic.httpStatus === undefined
        ? {}
        : { httpStatus: result.diagnostic.httpStatus }),
      ...(result.diagnostic.responseOk === undefined
        ? {}
        : { responseOk: result.diagnostic.responseOk }),
      ...(result.diagnostic.errorKind === undefined
        ? {}
        : { errorKind: result.diagnostic.errorKind }),
      ...(credentialContractCheck === undefined
        ? {}
        : {
            endpointContractOk: credentialContractCheck.endpointContractOk,
            requiredParameterNamesPresent:
              credentialContractCheck.requiredParameterNamesPresent,
            accessKeyTransport: credentialContractCheck.accessKeyTransport,
            ...(credentialContractCheck.bodyReadable === undefined
              ? {}
              : { bodyReadable: credentialContractCheck.bodyReadable }),
            ...(credentialContractCheck.bodyErrorCodeKind === undefined
              ? {}
              : {
                  bodyErrorCodeKind:
                    credentialContractCheck.bodyErrorCodeKind,
                }),
          }),
    };
  }

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

  if (summary.phase) {
    lines.push(`phase: ${summary.phase}`);
  }

  if (summary.httpStatus !== undefined) {
    lines.push(`httpStatus: ${summary.httpStatus}`);
  }

  if (summary.responseOk !== undefined) {
    lines.push(`responseOk: ${summary.responseOk}`);
  }

  if (summary.errorKind) {
    lines.push(`errorKind: ${summary.errorKind}`);
  }

  if (summary.endpointContractOk !== undefined) {
    lines.push(`endpointContractOk: ${summary.endpointContractOk}`);
  }

  if (summary.requiredParameterNamesPresent !== undefined) {
    lines.push(
      `requiredParameterNamesPresent: ${summary.requiredParameterNamesPresent}`
    );
  }

  if (summary.accessKeyTransport) {
    lines.push(`accessKeyTransport: ${summary.accessKeyTransport}`);
  }

  if (summary.bodyReadable !== undefined) {
    lines.push(`bodyReadable: ${summary.bodyReadable}`);
  }

  if (summary.bodyErrorCodeKind) {
    lines.push(`bodyErrorCodeKind: ${summary.bodyErrorCodeKind}`);
  }

  return lines.join("\n");
}

export function printExternalSmokeStatusSummary(
  label: "Gemini" | "Rakuten",
  summary: ExternalSmokeStatusSummary
): void {
  console.info(formatExternalSmokeStatusSummary(label, summary));
}
