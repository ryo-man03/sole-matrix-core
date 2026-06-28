import {
  analyzeSneakerImage,
  validateSneakerImage,
} from "../image-analysis/sneakerVisionService";
import { createIntegratedRecommendationHandler } from "../../../server/routes/integratedRecommendation";

type SafeEnvironment = Record<string, string | undefined>;

export type AllInOneSmokeStatus =
  | "ok"
  | "fallback"
  | "missing_env"
  | "skipped_external_smoke"
  | "error";

export type GeminiImageSmokeResult = {
  provider: "gemini_image";
  status: AllInOneSmokeStatus;
  networkAttempted: boolean;
  shapeValid: boolean;
  confidencePresent: boolean;
  decisionSource: "typescript";
};

export type RecommendationApiSmokeResult = {
  provider: "recommendation_api";
  status: AllInOneSmokeStatus;
  responseOk: boolean;
  shapeValid: boolean;
  decisionSource: "typescript";
  candidateSource?: "local" | "rakuten" | "fallback" | "mock";
  geminiStatus?: string;
  rakutenStatus?: string;
};

const onePixelPng = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9ZsAAAAASUVORK5CYII=",
    "base64",
  ),
);

export async function runGeminiImageSmoke(
  options: { env?: SafeEnvironment; fetcher?: typeof fetch } = {},
): Promise<GeminiImageSmokeResult> {
  const env = options.env ?? process.env;
  if (env["RUN_EXTERNAL_SMOKE"]?.trim() !== "1") {
    return emptyImageResult("skipped_external_smoke");
  }
  const apiKey = env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) {
    return emptyImageResult("missing_env");
  }
  const underlyingFetcher = options.fetcher ?? globalThis.fetch;
  if (typeof underlyingFetcher !== "function") {
    return emptyImageResult("error");
  }
  let networkAttempted = false;
  const fetcher: typeof fetch = (...args) => {
    networkAttempted = true;
    return underlyingFetcher(...args);
  };
  const image = validateSneakerImage({
    bytes: onePixelPng,
    mimeType: "image/png",
    fileName: "smoke.png",
  });
  const result = await analyzeSneakerImage(image, { apiKey, fetcher });
  const shapeValid =
    Array.isArray(result.mainColors) &&
    Array.isArray(result.materialHints) &&
    Array.isArray(result.culturalContext) &&
    Array.isArray(result.cautions) &&
    [result.vintageScore, result.streetScore, result.cleanScore, result.uniquenessScore]
      .every((value) => Number.isFinite(value) && value >= 0 && value <= 100) &&
    Number.isFinite(result.confidence) &&
    result.confidence >= 0 &&
    result.confidence <= 1;
  const fallback = result.confidence === 0 && result.cautions.some((caution) =>
    caution.includes("画像分析を利用できない"),
  );

  return {
    provider: "gemini_image",
    status: shapeValid ? (fallback ? "fallback" : "ok") : "error",
    networkAttempted,
    shapeValid,
    confidencePresent: result.confidence > 0,
    decisionSource: "typescript",
  };
}

export async function runRecommendationApiSmoke(
  options: { env?: SafeEnvironment } = {},
): Promise<RecommendationApiSmokeResult> {
  const env = options.env ?? process.env;
  if (env["RUN_EXTERNAL_SMOKE"]?.trim() !== "1") {
    return {
      provider: "recommendation_api",
      status: "skipped_external_smoke",
      responseOk: false,
      shapeValid: false,
      decisionSource: "typescript",
    };
  }
  const handler = createIntegratedRecommendationHandler({ core: { env } });
  const response = await handler(
    new Request("http://localhost/api/recommendations/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagnosisAnswers: [
          { questionId: "trusted-classic", value: "like" },
          { questionId: "simple-daily", value: "like" },
        ],
        preferenceTags: ["classic"],
        budgetYen: 25_000,
        mode: "balanced",
        analysis: { sneakerName: "Puma Clyde MIJ" },
      }),
    }),
  );
  const payload = (await response.json()) as unknown;
  if (!isRecord(payload) || payload["ok"] !== true || !isRecord(payload["data"])) {
    return {
      provider: "recommendation_api",
      status: "error",
      responseOk: response.ok,
      shapeValid: false,
      decisionSource: "typescript",
    };
  }
  const data = payload["data"];
  const modeRecommendation = data["modeRecommendation"];
  const candidate = data["candidate"];
  const readiness = data["readiness"];
  const shapeValid =
    isRecord(modeRecommendation) &&
    typeof modeRecommendation["decision"] === "string" &&
    typeof modeRecommendation["balancedScore"] === "number" &&
    typeof modeRecommendation["ryoScore"] === "number" &&
    isRecord(candidate) &&
    typeof candidate["source"] === "string" &&
    isRecord(readiness) &&
    isRecord(readiness["gemini"]) &&
    isRecord(readiness["rakuten"]);

  return {
    provider: "recommendation_api",
    status: shapeValid ? "ok" : "error",
    responseOk: response.ok,
    shapeValid,
    decisionSource: "typescript",
    ...(isRecord(candidate) && isCandidateSource(candidate["source"])
      ? { candidateSource: candidate["source"] }
      : {}),
    ...(isRecord(readiness) && isRecord(readiness["gemini"]) && typeof readiness["gemini"]["status"] === "string"
      ? { geminiStatus: readiness["gemini"]["status"] }
      : {}),
    ...(isRecord(readiness) && isRecord(readiness["rakuten"]) && typeof readiness["rakuten"]["status"] === "string"
      ? { rakutenStatus: readiness["rakuten"]["status"] }
      : {}),
  };
}

export function formatAllInOneSmokeResult(
  result: GeminiImageSmokeResult | RecommendationApiSmokeResult,
): string {
  return Object.entries(result)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");
}

function emptyImageResult(status: AllInOneSmokeStatus): GeminiImageSmokeResult {
  return {
    provider: "gemini_image",
    status,
    networkAttempted: false,
    shapeValid: false,
    confidencePresent: false,
    decisionSource: "typescript",
  };
}

function isCandidateSource(
  value: unknown,
): value is NonNullable<RecommendationApiSmokeResult["candidateSource"]> {
  return typeof value === "string" && ["local", "rakuten", "fallback", "mock"].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
