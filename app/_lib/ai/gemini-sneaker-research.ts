import {
  buildGeminiSneakerNormalizationPrompt,
  buildGeminiSneakerRepairPrompt,
  buildGeminiSneakerResearchPrompt,
  type GeminiSneakerResearchInput,
} from "./gemini-sneaker-research-prompt";
import {
  geminiSneakerResearchResponseSchema,
  classifyEvidenceSourceQuality,
  validateEvidenceUrls,
  validateGeminiSneakerResearchDraft,
  type GeminiResearchEvidenceLink,
  type GeminiSneakerResearchDraftCandidate,
  type GeminiSneakerResearchCandidate,
  type GeminiSneakerResearchResult,
} from "./gemini-sneaker-research-schema";
import { evaluateFactualCandidate } from "../recommendation-trust/factual-verification";

const defaultModel = "gemini-2.5-flash";
const requestTimeoutMs = 30_000;

export type GeminiResearchReasonCode =
  | "gemini_success"
  | "missing_api_key"
  | "api_error"
  | "rate_limited"
  | "timeout"
  | "invalid_json"
  | "schema_invalid"
  | "no_candidates"
  | "no_evidence_url"
  | "model_name_too_abstract"
  | "core_reevaluation_failed"
  | "fallback_catalog_used";

export type GeminiResearchStageStatus =
  | "ready"
  | "fallback"
  | "error"
  | "not_checked";

export type GeminiResearchStages = {
  grounding: {
    status: GeminiResearchStageStatus;
    evidenceUrlCount: number;
  };
  normalization: {
    status: GeminiResearchStageStatus;
    repairAttempted: boolean;
    candidateCount: number;
  };
};

type OutcomeMetadata = {
  modelUsed: string | null;
  usedFallbackModel: boolean;
  stages: GeminiResearchStages;
};

export type GeminiSneakerResearchOutcome =
  | ({
      status: "ready";
      reasonCode: "gemini_success";
      result: GeminiSneakerResearchResult;
    } & OutcomeMetadata)
  | ({
      status: "fallback" | "error";
      reasonCode: Exclude<GeminiResearchReasonCode, "gemini_success">;
      result: null;
    } & OutcomeMetadata);

type ResearchOptions = {
  apiKey?: string;
  model?: string;
  fallbackModel?: string;
  fetcher?: typeof fetch;
};

type RequestRuntime = {
  currentModel: string;
  fallbackModel: string | null;
  usedFallbackModel: boolean;
  modelUsed: string;
};

type GeminiEnvelope = {
  body: unknown;
  model: string;
};

type RequestResult =
  | { ok: true; value: GeminiEnvelope }
  | {
      ok: false;
      reasonCode: Exclude<GeminiResearchReasonCode, "gemini_success" | "missing_api_key" | "core_reevaluation_failed" | "fallback_catalog_used">;
      retryWithFallbackModel: boolean;
    };

type GroundingEvidence = {
  text: string;
  chunks: Array<{ url: string; title: string } | null>;
  supports: Array<{ text: string; chunkIndices: number[] }>;
};

export async function researchSneakerCandidatesWithGemini(
  input: GeminiSneakerResearchInput,
  options: ResearchOptions = {},
): Promise<GeminiSneakerResearchOutcome> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const fetcher = options.fetcher ?? globalThis.fetch;
  const stages = createInitialStages();
  if (!apiKey?.trim()) return failure("missing_api_key", null, false, stages);
  if (typeof fetcher !== "function") {
    stages.grounding.status = "error";
    return failure("api_error", null, false, stages, "error");
  }

  const primaryModel = options.model ?? process.env.GEMINI_RESEARCH_MODEL ?? defaultModel;
  const configuredFallback = options.fallbackModel ?? process.env.GEMINI_RESEARCH_FALLBACK_MODEL;
  const runtime: RequestRuntime = {
    currentModel: primaryModel,
    fallbackModel: configuredFallback && configuredFallback !== primaryModel ? configuredFallback : null,
    usedFallbackModel: false,
    modelUsed: primaryModel,
  };

  const groundedResponse = await requestGemini(
    buildGeminiSneakerResearchPrompt(input),
    {
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0,
        candidateCount: 1,
        maxOutputTokens: 4_096,
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    apiKey,
    fetcher,
    runtime,
  );
  if (!groundedResponse.ok) {
    stages.grounding.status = stageFailureStatus(groundedResponse.reasonCode);
    return runtimeFailure(groundedResponse.reasonCode, runtime, stages);
  }
  if (!hasUsableCandidate(groundedResponse.value.body)) {
    stages.grounding.status = "error";
    return runtimeFailure("api_error", runtime, stages);
  }

  const grounding = extractGroundingEvidence(groundedResponse.value.body);
  if (!grounding) {
    stages.grounding.status = "fallback";
    return runtimeFailure("no_evidence_url", runtime, stages);
  }
  stages.grounding = {
    status: "ready",
    evidenceUrlCount: new Set(grounding.chunks.flatMap((chunk) => chunk?.url ?? [])).size,
  };

  const normalizedResponse = await requestGemini(
    buildGeminiSneakerNormalizationPrompt(grounding.text),
    structuredRequestBody(),
    apiKey,
    fetcher,
    runtime,
  );
  if (!normalizedResponse.ok) {
    stages.normalization.status = stageFailureStatus(normalizedResponse.reasonCode);
    return runtimeFailure(normalizedResponse.reasonCode, runtime, stages);
  }
  if (!hasUsableCandidate(normalizedResponse.value.body)) {
    stages.normalization.status = "error";
    return runtimeFailure("api_error", runtime, stages);
  }

  const normalizedText = extractGeminiText(normalizedResponse.value.body);
  if (!normalizedText || normalizedText.length > 30_000) {
    stages.normalization.status = "fallback";
    return runtimeFailure("schema_invalid", runtime, stages);
  }

  let parsed = parseJson(normalizedText);
  if (!parsed.ok) {
    stages.normalization.repairAttempted = true;
    const repairResponse = await requestGemini(
      buildGeminiSneakerRepairPrompt(normalizedText),
      structuredRequestBody(),
      apiKey,
      fetcher,
      runtime,
    );
    if (!repairResponse.ok) {
      stages.normalization.status = "fallback";
      return runtimeFailure("invalid_json", runtime, stages);
    }
    const repairedText = extractGeminiText(repairResponse.value.body);
    if (!repairedText || repairedText.length > 30_000) {
      stages.normalization.status = "fallback";
      return runtimeFailure("invalid_json", runtime, stages);
    }
    parsed = parseJson(repairedText);
    if (!parsed.ok) {
      stages.normalization.status = "fallback";
      return runtimeFailure("invalid_json", runtime, stages);
    }
  }

  const validated = validateGeminiSneakerResearchDraft(parsed.value);
  if (!validated.ok) {
    stages.normalization.status = "fallback";
    return runtimeFailure(validated.reasonCode, runtime, stages);
  }

  const candidates = validated.result.candidates
    .map((candidate) => attachTrustedEvidence(candidate, grounding))
    .filter((candidate): candidate is GeminiSneakerResearchCandidate => Boolean(candidate));
  if (candidates.length < 1) {
    stages.normalization.status = "fallback";
    return runtimeFailure("no_evidence_url", runtime, stages);
  }
  stages.normalization = {
    ...stages.normalization,
    status: "ready",
    candidateCount: candidates.length,
  };

  return {
    status: "ready",
    reasonCode: "gemini_success",
    result: { candidates },
    modelUsed: runtime.modelUsed,
    usedFallbackModel: runtime.usedFallbackModel,
    stages: snapshotStages(stages),
  };
}

function structuredRequestBody(): Record<string, unknown> {
  return {
    generationConfig: {
      temperature: 0,
      candidateCount: 1,
      maxOutputTokens: 4_096,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: geminiSneakerResearchResponseSchema,
    },
  };
}

async function requestGemini(
  prompt: string,
  body: Record<string, unknown>,
  apiKey: string,
  fetcher: typeof fetch,
  runtime: RequestRuntime,
): Promise<RequestResult> {
  const first = await requestModel(prompt, body, runtime.currentModel, apiKey, fetcher);
  if (first.ok) {
    runtime.modelUsed = first.value.model;
    return first;
  }
  if (!first.retryWithFallbackModel || !runtime.fallbackModel || runtime.usedFallbackModel) {
    return first;
  }

  runtime.currentModel = runtime.fallbackModel;
  runtime.usedFallbackModel = true;
  runtime.modelUsed = runtime.currentModel;
  return requestModel(prompt, body, runtime.currentModel, apiKey, fetcher);
}

async function requestModel(
  prompt: string,
  body: Record<string, unknown>,
  model: string,
  apiKey: string,
  fetcher: typeof fetch,
): Promise<RequestResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  try {
    const response = await fetcher(endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...body,
      }),
    });
    if (!response.ok) {
      return {
        ok: false,
        reasonCode: mapHttpReason(response.status),
        retryWithFallbackModel: response.status === 429 || response.status >= 500,
      };
    }
    try {
      return { ok: true, value: { body: await response.json() as unknown, model } };
    } catch {
      return { ok: false, reasonCode: "invalid_json", retryWithFallbackModel: false };
    }
  } catch (error) {
    const timeout = isTimeoutError(error);
    return {
      ok: false,
      reasonCode: timeout ? "timeout" : "api_error",
      retryWithFallbackModel: timeout,
    };
  }
}

function extractGroundingEvidence(value: unknown): GroundingEvidence | null {
  const candidate = firstCandidate(value);
  if (!candidate || hasAbnormalFinishReason(candidate)) return null;
  const text = extractTextFromCandidate(candidate);
  const metadata = candidate["groundingMetadata"];
  if (!text || !isRecord(metadata)) return null;

  const rawChunks = Array.isArray(metadata["groundingChunks"]) ? metadata["groundingChunks"] : [];
  const chunks: GroundingEvidence["chunks"] = rawChunks.map((chunk) => {
    if (!isRecord(chunk) || !isRecord(chunk["web"])) return null;
    const url = typeof chunk["web"]["uri"] === "string" ? chunk["web"]["uri"] : "";
    const title = typeof chunk["web"]["title"] === "string" ? chunk["web"]["title"] : "";
    return validateEvidenceUrls([url]).length ? { url, title } : null;
  });

  const rawSupports = Array.isArray(metadata["groundingSupports"]) ? metadata["groundingSupports"] : [];
  const supports = rawSupports.map((support) => {
    if (!isRecord(support) || !isRecord(support["segment"])) return null;
    const segmentText = typeof support["segment"]["text"] === "string" ? support["segment"]["text"] : "";
    const indices = Array.isArray(support["groundingChunkIndices"])
      ? support["groundingChunkIndices"].filter((index): index is number =>
          Number.isInteger(index) && index >= 0 && index < chunks.length && Boolean(chunks[index]))
      : [];
    return segmentText && indices.length ? { text: segmentText, chunkIndices: indices } : null;
  }).filter((support): support is { text: string; chunkIndices: number[] } => Boolean(support));

  return chunks.some(Boolean) && supports.length ? { text, chunks, supports } : null;
}

function attachTrustedEvidence(
  candidate: GeminiSneakerResearchDraftCandidate,
  grounding: GroundingEvidence,
): GeminiSneakerResearchCandidate | null {
  const modelTokens = [
    normalizeForMatch(candidate.sourceModelName),
    normalizeForMatch(candidate.modelName),
  ].filter(Boolean);
  const modelSupports = grounding.supports.filter((support) => {
    const text = normalizeForMatch(support.text);
    return modelTokens.some((modelName) => text.includes(modelName));
  });
  const modelEvidenceUrls = supportUrls(modelSupports, grounding);
  if (modelEvidenceUrls.length < 1) return null;

  const colorwayEvidenceUrls = candidate.sourceColorwayName
    ? supportUrls(grounding.supports.filter((support) => {
        const text = normalizeForMatch(support.text);
        return modelTokens.some((modelName) => text.includes(modelName))
          && text.includes(normalizeForMatch(candidate.sourceColorwayName!));
      }), grounding)
    : [];
  const candidateSourceQuality = classifyEvidenceSourceQuality([
    ...modelEvidenceUrls,
    ...colorwayEvidenceUrls,
  ]);
  const verifiedColorway = candidate.colorwayName
    && colorwayEvidenceUrls.length > 0
    && candidateSourceQuality !== "unknown"
    ? candidate.colorwayName
    : null;
  const styleCodeEvidenceUrls = candidate.sourceStyleCode
    ? findStyleCodeEvidenceUrls(candidate.sourceStyleCode, modelTokens, grounding)
    : [];
  const verifiedStyleCode = styleCodeEvidenceUrls.length > 0 ? candidate.styleCode : null;
  const evidenceUrls = validateEvidenceUrls([
    ...modelEvidenceUrls,
    ...(verifiedColorway ? colorwayEvidenceUrls : []),
    ...(verifiedStyleCode ? styleCodeEvidenceUrls : []),
  ]);

  const evidenceLinks: GeminiResearchEvidenceLink[] = [
    ...evidenceUrls.slice(0, 6).map((url) => ({ url, type: "gemini_citation_url" as const })),
    { url: createModelSearchEntryUrl(candidate.modelName), type: "search_entry_url" },
  ];
  const {
    sourceModelName: _sourceModelName,
    sourceColorwayName: _sourceColorwayName,
    sourceStyleCode: _sourceStyleCode,
    ...publicCandidate
  } = candidate;
  const factualResult = evaluateFactualCandidate({
    brand: publicCandidate.brand,
    modelName: publicCandidate.modelName,
    colorwayName: verifiedColorway,
    styleCode: verifiedStyleCode,
    modelEvidenceUrls,
    colorwayEvidenceUrls: verifiedColorway ? colorwayEvidenceUrls : [],
    styleCodeEvidenceUrls: verifiedStyleCode ? styleCodeEvidenceUrls : [],
    groundingText: grounding.text,
  });
  if (!factualResult.acceptedForRecommendation) return null;
  return {
    ...publicCandidate,
    colorwayName: factualResult.colorwayName,
    styleCode: factualResult.styleCode,
    modelEvidenceUrls,
    colorwayEvidenceUrls: verifiedColorway ? colorwayEvidenceUrls : [],
    styleCodeEvidenceUrls: verifiedStyleCode ? styleCodeEvidenceUrls : [],
    evidenceUrls,
    evidenceLinks,
    verificationStatus: factualResult.verificationStatus,
    sourceQuality: candidateSourceQuality,
    factualVerification: factualResult.factual,
    confidence: candidateSourceQuality === "marketplace"
      ? Math.min(publicCandidate.confidence, 0.65)
      : publicCandidate.confidence,
    researchOrigin: "gemini",
  };
}

function supportUrls(
  supports: GroundingEvidence["supports"],
  grounding: GroundingEvidence,
): string[] {
  return validateEvidenceUrls(supports.flatMap((support) =>
    support.chunkIndices.map((index) => grounding.chunks[index]?.url ?? ""),
  ));
}

function findStyleCodeEvidenceUrls(
  styleCode: string,
  modelTokens: string[],
  grounding: GroundingEvidence,
): string[] {
  const normalizedCode = normalizeForMatch(styleCode);
  const supportEvidence = supportUrls(grounding.supports.filter((support) => {
    const text = normalizeForMatch(support.text);
    return text.includes(normalizedCode) && modelTokens.some((modelName) => text.includes(modelName));
  }), grounding);
  const titleEvidence = grounding.chunks.flatMap((chunk) => {
    if (!chunk) return [];
    const title = normalizeForMatch(chunk.title);
    return title.includes(normalizedCode) && modelTokens.some((modelName) => title.includes(modelName))
      ? [chunk.url]
      : [];
  });
  return validateEvidenceUrls([...supportEvidence, ...titleEvidence]);
}

function createModelSearchEntryUrl(modelName: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(modelName)}`;
}

function extractGeminiText(value: unknown): string | null {
  const candidate = firstCandidate(value);
  if (!candidate || hasAbnormalFinishReason(candidate)) return null;
  return extractTextFromCandidate(candidate);
}

function firstCandidate(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value) || !Array.isArray(value["candidates"])) return null;
  const candidate = value["candidates"][0];
  return isRecord(candidate) ? candidate : null;
}

function hasUsableCandidate(value: unknown): boolean {
  const candidate = firstCandidate(value);
  return Boolean(candidate && !hasAbnormalFinishReason(candidate));
}

function extractTextFromCandidate(candidate: Record<string, unknown>): string | null {
  if (!isRecord(candidate["content"]) || !Array.isArray(candidate["content"]["parts"])) return null;
  const text = candidate["content"]["parts"]
    .map((part) => isRecord(part) && typeof part["text"] === "string" ? part["text"] : "")
    .join("\n")
    .trim();
  return text || null;
}

function hasAbnormalFinishReason(candidate: Record<string, unknown>): boolean {
  const finishReason = candidate["finishReason"];
  return typeof finishReason === "string" && finishReason !== "STOP";
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text.trim()) as unknown };
  } catch {
    return { ok: false };
  }
}

function failure(
  reasonCode: Exclude<GeminiResearchReasonCode, "gemini_success">,
  modelUsed: string | null,
  usedFallbackModel: boolean,
  stages: GeminiResearchStages,
  status: "fallback" | "error" = "fallback",
): GeminiSneakerResearchOutcome {
  return { status, reasonCode, result: null, modelUsed, usedFallbackModel, stages: snapshotStages(stages) };
}

function runtimeFailure(
  reasonCode: Exclude<GeminiResearchReasonCode, "gemini_success">,
  runtime: RequestRuntime,
  stages: GeminiResearchStages,
): GeminiSneakerResearchOutcome {
  return failure(reasonCode, runtime.modelUsed, runtime.usedFallbackModel, stages);
}

function createInitialStages(): GeminiResearchStages {
  return {
    grounding: { status: "not_checked", evidenceUrlCount: 0 },
    normalization: { status: "not_checked", repairAttempted: false, candidateCount: 0 },
  };
}

function snapshotStages(stages: GeminiResearchStages): GeminiResearchStages {
  return {
    grounding: { ...stages.grounding },
    normalization: { ...stages.normalization },
  };
}

function stageFailureStatus(reasonCode: GeminiResearchReasonCode): GeminiResearchStageStatus {
  return reasonCode === "api_error" || reasonCode === "rate_limited" || reasonCode === "timeout"
    ? "error"
    : "fallback";
}

function mapHttpReason(status: number): Exclude<GeminiResearchReasonCode, "gemini_success" | "missing_api_key" | "core_reevaluation_failed" | "fallback_catalog_used"> {
  if (status === 429) return "rate_limited";
  return "api_error";
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

function normalizeForMatch(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/[^\p{L}\p{N}]+/gu, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
