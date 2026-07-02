import { buildGeminiSneakerResearchPrompt } from "./gemini-sneaker-research-prompt";
import {
  validateGeminiSneakerResearchResult,
  type GeminiSneakerResearchResult,
} from "./gemini-sneaker-research-schema";

const defaultModel = "gemini-2.5-flash";

export type GeminiResearchReasonCode =
  | "missing_env"
  | "http_429"
  | "http_403"
  | "http_5xx"
  | "timeout"
  | "invalid_json"
  | "schema_invalid"
  | "no_valid_candidates"
  | "unknown_error";

export type GeminiSneakerResearchOutcome =
  | { status: "ready"; reasonCode: null; result: GeminiSneakerResearchResult }
  | { status: "not_configured"; reasonCode: "missing_env"; result: null }
  | { status: "fallback" | "error"; reasonCode: Exclude<GeminiResearchReasonCode, "missing_env">; result: null };

export async function researchSneakerCandidatesWithGemini(
  input: Parameters<typeof buildGeminiSneakerResearchPrompt>[0],
  options: { apiKey?: string; model?: string; fetcher?: typeof fetch } = {},
): Promise<GeminiSneakerResearchOutcome> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const fetcher = options.fetcher ?? globalThis.fetch;
  if (!apiKey) return failure("not_configured", "missing_env");
  if (typeof fetcher !== "function") return failure("error", "unknown_error");

  try {
    const model = options.model ?? process.env.GEMINI_RESEARCH_MODEL ?? defaultModel;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const request: RequestInit = {
        method: "POST",
        signal: AbortSignal.timeout(30_000),
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildGeminiSneakerResearchPrompt(input) }] }],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 4_000,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                candidates: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      brand: { type: "STRING" },
                      modelName: { type: "STRING" },
                      modelType: { type: "STRING" },
                      reason: { type: "STRING" },
                      cautions: { type: "ARRAY", items: { type: "STRING" } },
                      searchKeywords: { type: "ARRAY", items: { type: "STRING" } },
                      evidenceUrls: { type: "ARRAY", items: { type: "STRING" } },
                      confidence: { type: "NUMBER" },
                    },
                    required: ["brand", "modelName", "modelType", "reason", "cautions", "searchKeywords", "evidenceUrls", "confidence"],
                  },
                },
              },
              required: ["candidates"],
            },
          },
        }),
      };
    let response = await fetcher(endpoint, request);
    if (response.status === 429 || response.status >= 500) {
      response = await fetcher(endpoint, { ...request, signal: AbortSignal.timeout(30_000) });
    }
    if (!response.ok) return failure("error", mapHttpReason(response.status));

    let responseBody: unknown;
    try {
      responseBody = await response.json() as unknown;
    } catch {
      return failure("fallback", "invalid_json");
    }
    const text = extractGeminiText(responseBody);
    if (!text || text.length > 30_000) return failure("fallback", "schema_invalid");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as unknown;
    } catch {
      return failure("fallback", "invalid_json");
    }
    if (!isRecord(parsed) || !Array.isArray(parsed["candidates"])) {
      return failure("fallback", "schema_invalid");
    }
    const validated = validateGeminiSneakerResearchResult(parsed);
    if (!validated) return failure("fallback", "no_valid_candidates");
    return { status: "ready", reasonCode: null, result: validated };
  } catch (error) {
    return failure("error", isTimeoutError(error) ? "timeout" : "unknown_error");
  }
}

function failure(status: "not_configured", reasonCode: "missing_env"): Extract<GeminiSneakerResearchOutcome, { status: "not_configured" }>;
function failure(status: "fallback" | "error", reasonCode: Exclude<GeminiResearchReasonCode, "missing_env">): Extract<GeminiSneakerResearchOutcome, { status: "fallback" | "error" }>;
function failure(status: "not_configured" | "fallback" | "error", reasonCode: GeminiResearchReasonCode): GeminiSneakerResearchOutcome {
  if (status === "not_configured") return { status, reasonCode: "missing_env", result: null };
  return { status, reasonCode: reasonCode as Exclude<GeminiResearchReasonCode, "missing_env">, result: null };
}

function mapHttpReason(status: number): Exclude<GeminiResearchReasonCode, "missing_env"> {
  if (status === 403) return "http_403";
  if (status === 429) return "http_429";
  if (status >= 500) return "http_5xx";
  return "unknown_error";
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

function extractGeminiText(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value["candidates"])) return null;
  const candidate = value["candidates"][0];
  if (!isRecord(candidate) || !isRecord(candidate["content"]) || !Array.isArray(candidate["content"]["parts"])) return null;
  const text = candidate["content"]["parts"]
    .map((part) => isRecord(part) && typeof part["text"] === "string" ? part["text"] : "")
    .join("\n")
    .trim();
  return text || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
