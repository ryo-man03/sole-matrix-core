import { mockCandidateRepository } from "./repository";
import { recommendCoreV1 } from "./service";
import type {
  Decision,
  RecommendationExplanation,
} from "./types";

type SafeEnvironment = Record<string, string | undefined>;

export type GeminiActualSmokeStatus =
  | "ok"
  | "missing_env"
  | "skipped_external_smoke"
  | "network_error";

export type GeminiActualSmokeResult = {
  provider: "gemini";
  status: GeminiActualSmokeStatus;
  networkAttempted: boolean;
  shapeValid: boolean;
  summaryNonEmpty: boolean;
  reasonsCount: number;
  cautionsIsArray: boolean;
  source: "gemini" | "rule_based";
  decision: Decision;
  decisionSource: "typescript";
  fallback?: "rule_based";
};

const smokeInput = {
  diagnosisAnswers: [
    { questionId: "trusted-classic", value: "like" as const },
    { questionId: "simple-daily", value: "like" as const },
    { questionId: "walking-comfort", value: "neutral" as const },
  ],
  preferenceTags: ["classic" as const, "minimal" as const],
  budgetYen: 20_000,
};

export async function runGeminiActualGenerationSmoke(
  options: {
    env?: SafeEnvironment;
    fetcher?: typeof fetch;
  } = {},
): Promise<GeminiActualSmokeResult> {
  const env = options.env ?? process.env;

  if (env["RUN_EXTERNAL_SMOKE"]?.trim() !== "1") {
    return emptyResult("skipped_external_smoke");
  }

  const apiKey = env["GEMINI_API_KEY"]?.trim();

  if (!apiKey) {
    return emptyResult("missing_env");
  }

  const underlyingFetcher = options.fetcher ?? globalThis.fetch;

  if (typeof underlyingFetcher !== "function") {
    return {
      ...emptyResult("network_error"),
      fallback: "rule_based",
    };
  }

  let networkAttempted = false;
  const trackingFetcher: typeof fetch = (...args) => {
    networkAttempted = true;
    return underlyingFetcher(...args);
  };
  const recommendation = await recommendCoreV1(smokeInput, {
    candidateRepository: mockCandidateRepository,
    env: { GEMINI_API_KEY: apiKey },
    geminiFetcher: trackingFetcher,
  });
  const explanation = recommendation.explanation;
  const shape = inspectExplanationShape(explanation);
  const ok = explanation.source === "gemini" && shape.shapeValid;

  return {
    provider: "gemini",
    status: ok ? "ok" : "network_error",
    networkAttempted,
    ...shape,
    source: explanation.source,
    decision: recommendation.decision,
    decisionSource: "typescript",
    ...(ok ? {} : { fallback: "rule_based" as const }),
  };
}

export function formatGeminiActualSmokeResult(
  result: GeminiActualSmokeResult,
): string {
  return [
    "Gemini actual generation smoke:",
    `provider: ${result.provider}`,
    `status: ${result.status}`,
    `networkAttempted: ${result.networkAttempted}`,
    `shapeValid: ${result.shapeValid}`,
    `summaryNonEmpty: ${result.summaryNonEmpty}`,
    `reasonsCount: ${result.reasonsCount}`,
    `cautionsIsArray: ${result.cautionsIsArray}`,
    `source: ${result.source}`,
    `decision: ${result.decision}`,
    `decisionSource: ${result.decisionSource}`,
    ...(result.fallback ? [`fallback: ${result.fallback}`] : []),
  ].join("\n");
}

function inspectExplanationShape(explanation: RecommendationExplanation) {
  const summaryNonEmpty = explanation.summary.trim().length > 0;
  const reasonsCount = Array.isArray(explanation.reasons)
    ? explanation.reasons.filter((reason) => reason.trim().length > 0).length
    : 0;
  const cautionsIsArray = Array.isArray(explanation.cautions);
  const balancedViewNonEmpty = explanation.balancedView.trim().length > 0;
  const ryoViewNonEmpty = explanation.ryoView.trim().length > 0;
  const validTone = [
    "positive",
    "balanced",
    "cautious",
    "negative",
    "unknown",
  ].includes(explanation.finalTone);

  return {
    shapeValid:
      summaryNonEmpty &&
      reasonsCount >= 1 &&
      cautionsIsArray &&
      balancedViewNonEmpty &&
      ryoViewNonEmpty &&
      validTone,
    summaryNonEmpty,
    reasonsCount,
    cautionsIsArray,
  };
}

function emptyResult(
  status: Extract<
    GeminiActualSmokeStatus,
    "missing_env" | "skipped_external_smoke" | "network_error"
  >,
): GeminiActualSmokeResult {
  return {
    provider: "gemini",
    status,
    networkAttempted: false,
    shapeValid: false,
    summaryNonEmpty: false,
    reasonsCount: 0,
    cautionsIsArray: false,
    source: "rule_based",
    decision: "unknown",
    decisionSource: "typescript",
  };
}
