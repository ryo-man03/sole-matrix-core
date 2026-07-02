import { buildGeminiSneakerResearchPrompt } from "./gemini-sneaker-research-prompt";
import {
  validateGeminiSneakerResearchResult,
  type GeminiSneakerResearchResult,
} from "./gemini-sneaker-research-schema";

const defaultModel = "gemini-2.5-flash";

export async function researchSneakerCandidatesWithGemini(
  input: Parameters<typeof buildGeminiSneakerResearchPrompt>[0],
  options: { apiKey?: string; model?: string; fetcher?: typeof fetch } = {},
): Promise<GeminiSneakerResearchResult | null> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const fetcher = options.fetcher ?? globalThis.fetch;
  if (!apiKey || typeof fetcher !== "function") return null;

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
    if (response.status === 429 || response.status === 503) {
      response = await fetcher(endpoint, { ...request, signal: AbortSignal.timeout(30_000) });
    }
    if (!response.ok) return null;
    const text = extractGeminiText(await response.json());
    if (!text || text.length > 30_000) return null;
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as unknown;
    return validateGeminiSneakerResearchResult(parsed);
  } catch {
    return null;
  }
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
