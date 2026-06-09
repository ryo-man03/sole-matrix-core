import { createGeminiExplanationPrompt } from "./createGeminiExplanationPrompt";
import type {
  GeminiExplanationInput,
  GeminiExplanationOutput,
} from "./types";

const defaultModel = "gemini-2.5-flash";
const maxOutputCharacters = 2000;
const maxListItems = 5;
const maxListItemCharacters = 300;

type GenerateGeminiExplanationOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

type GeminiJsonExplanation = {
  summary?: unknown;
  reasons?: unknown;
  cautions?: unknown;
};

export async function generateGeminiExplanation(
  input: GeminiExplanationInput,
  options: GenerateGeminiExplanationOptions = {}
): Promise<GeminiExplanationOutput> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return createFallbackOutput(input);
  }

  const fetcher = options.fetcher ?? globalThis.fetch;

  if (typeof fetcher !== "function") {
    return createFallbackOutput(input);
  }

  try {
    const model = options.model ?? defaultModel;
    const prompt = createGeminiExplanationPrompt(input);
    const response = await fetcher(createGeminiUrl(model, apiKey), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      return createFallbackOutput(input);
    }

    const responseBody = (await response.json()) as unknown;
    const text = extractGeminiText(responseBody);
    const explanation = parseAndValidateGeminiText(text);

    if (!explanation) {
      return createFallbackOutput(input);
    }

    return {
      provider: "gemini",
      sneakerId: input.result.sneakerId,
      name: input.result.name,
      summary: explanation.summary,
      reasons: explanation.reasons,
      cautions: explanation.cautions,
    };
  } catch {
    return createFallbackOutput(input);
  }
}

function createFallbackOutput(
  input: GeminiExplanationInput
): GeminiExplanationOutput {
  return {
    provider: "rule-based",
    sneakerId: input.result.sneakerId,
    name: input.result.name,
    summary: input.fallback.summary,
    reasons: [...input.fallback.reasons],
    cautions: [...input.fallback.cautions],
  };
}

function createGeminiUrl(model: string, apiKey: string): string {
  const encodedModel = encodeURIComponent(model);
  const encodedApiKey = encodeURIComponent(apiKey);

  return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent?key=${encodedApiKey}`;
}

function extractGeminiText(responseBody: unknown): string | undefined {
  if (!isRecord(responseBody)) {
    return undefined;
  }

  const candidates = responseBody["candidates"];

  if (!Array.isArray(candidates)) {
    return undefined;
  }

  const firstCandidate = candidates[0];

  if (!isRecord(firstCandidate)) {
    return undefined;
  }

  const content = firstCandidate["content"];

  if (!isRecord(content)) {
    return undefined;
  }

  const parts = content["parts"];

  if (!Array.isArray(parts)) {
    return undefined;
  }

  const textParts = parts
    .map((part) => (isRecord(part) ? part["text"] : undefined))
    .filter((text): text is string => typeof text === "string");

  const text = textParts.join("\n").trim();

  return text === "" ? undefined : text;
}

function parseAndValidateGeminiText(
  text: string | undefined
): Pick<GeminiExplanationOutput, "summary" | "reasons" | "cautions"> | undefined {
  if (!text || text.length > maxOutputCharacters || containsUnsafeClaim(text)) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonCodeFence(text));
  } catch {
    return undefined;
  }

  if (!isRecord(parsed)) {
    return undefined;
  }

  const candidate = parsed as GeminiJsonExplanation;
  const summary = normalizeText(candidate.summary);
  const reasons = normalizeTextArray(candidate.reasons);
  const cautions = normalizeTextArray(candidate.cautions);

  if (!summary || !reasons || !cautions) {
    return undefined;
  }

  const combined = [summary, ...reasons, ...cautions].join("\n");

  if (
    combined.length > maxOutputCharacters ||
    containsUnsafeClaim(combined)
  ) {
    return undefined;
  }

  return { summary, reasons, cautions };
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();

  return text === "" ? undefined : text;
}

function normalizeTextArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length > maxListItems) {
    return undefined;
  }

  const items = value.map(normalizeText);

  if (items.some((item) => item === undefined)) {
    return undefined;
  }

  const normalizedItems = items as string[];

  if (normalizedItems.some((item) => item.length > maxListItemCharacters)) {
    return undefined;
  }

  return normalizedItems;
}

function stripJsonCodeFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function containsUnsafeClaim(text: string): boolean {
  return /絶対に買うべき|絶対買うべき|必ず買うべき|実在価格|実売価格|現在価格|販売価格|在庫あり|在庫があります|在庫確保|プレ値|リセール|転売価格|真贋|本物です|偽物です|正規品です|authentic|fake|stock available|resale value|market price/i.test(
    text
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

