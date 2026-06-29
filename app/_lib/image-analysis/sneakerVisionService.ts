import type {
  SneakerCategory,
  SneakerSilhouette,
  SneakerVisualAnalysis,
  ValidatedSneakerImage,
} from "./types";

export const MAX_SNEAKER_IMAGE_BYTES = 5 * 1024 * 1024;
const defaultModel = "gemini-2.5-flash";
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const silhouettes = new Set<SneakerSilhouette>(["low", "mid", "high", "unknown"]);
const categories = new Set<SneakerCategory>([
  "basketball",
  "running",
  "training",
  "skate",
  "terrace",
  "canvas",
  "lifestyle",
  "unknown",
]);
const signals = new Set(["none", "low", "medium", "high"]);
const forbiddenOutputKeys = new Set([
  "decision",
  "recommendation",
  "balancedScore",
  "ryoScore",
  "price",
  "authenticity",
  "isFake",
]);

export class SneakerImageValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SneakerImageValidationError";
  }
}

export type SneakerVisionOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

type GeminiVisualJson = {
  detectedBrand?: unknown;
  detectedModelName?: unknown;
  detectedColorway?: unknown;
  mainColors?: unknown;
  silhouette?: unknown;
  category?: unknown;
  materialHints?: unknown;
  vintageSignal?: unknown;
  streetSignal?: unknown;
  cleanSignal?: unknown;
  uniquenessSignal?: unknown;
  culturalContext?: unknown;
  confidence?: unknown;
  cautions?: unknown;
};

export function validateSneakerImage(input: {
  bytes: Uint8Array;
  mimeType: string;
  fileName?: string;
}): ValidatedSneakerImage {
  const mimeType = input.mimeType.toLowerCase();
  if (!allowedMimeTypes.has(mimeType)) {
    throw new SneakerImageValidationError(
      "UNSUPPORTED_IMAGE_TYPE",
      "JPEG、PNG、WebP画像だけを利用できます。",
    );
  }
  if (
    input.bytes.byteLength === 0 ||
    input.bytes.byteLength > MAX_SNEAKER_IMAGE_BYTES
  ) {
    throw new SneakerImageValidationError(
      "INVALID_IMAGE_SIZE",
      "画像は1byte以上5MB以下にしてください。",
    );
  }
  if (!matchesMagicBytes(input.bytes, mimeType)) {
    throw new SneakerImageValidationError(
      "IMAGE_SIGNATURE_MISMATCH",
      "画像の実形式とMIME typeが一致しません。",
    );
  }

  return {
    bytes: input.bytes.slice(),
    mimeType: mimeType as ValidatedSneakerImage["mimeType"],
    fileName: normalizeFileName(input.fileName ?? "sneaker-image"),
  };
}

export async function analyzeSneakerImage(
  image: ValidatedSneakerImage,
  options: SneakerVisionOptions = {},
): Promise<SneakerVisualAnalysis> {
  const fallback = createVisualAnalysisFallback();
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const fetcher = options.fetcher ?? globalThis.fetch;
  if (!apiKey || typeof fetcher !== "function") {
    return fallback;
  }

  try {
    const response = await fetcher(
      createGeminiEndpoint(options.model ?? defaultModel),
      {
        method: "POST",
        signal: AbortSignal.timeout(12_000),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: createVisionPrompt() },
                {
                  inlineData: {
                    mimeType: image.mimeType,
                    data: Buffer.from(image.bytes).toString("base64"),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 900,
            responseMimeType: "application/json",
            responseSchema: createResponseSchema(),
          },
        }),
      },
    );

    if (!response.ok) {
      return fallback;
    }

    const responseBody = (await response.json()) as unknown;
    return parseGeminiVisualAnalysis(extractGeminiText(responseBody)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function createVisualAnalysisFallback(
  caution = "画像分析を利用できないため、名前・URL・診断回答から判断を続けます。",
): SneakerVisualAnalysis {
  return {
    mainColors: [],
    silhouette: "unknown",
    category: "unknown",
    materialHints: [],
    vintageScore: 0,
    streetScore: 0,
    cleanScore: 0,
    uniquenessScore: 0,
    culturalContext: [],
    confidence: 0,
    cautions: [caution],
  };
}

function createGeminiEndpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

function createVisionPrompt(): string {
  return [
    "You are the visual feature extractor for SOLE//MATRIX.",
    "Describe only visible sneaker characteristics in concise Japanese or standard brand/model names.",
    "You may estimate brand, model, colorway, colors, material, silhouette, category, visual mood, and cultural context.",
    "Never decide whether to buy, calculate a recommendation score, assess price truth, or claim authenticity/fake status.",
    "The four *Signal fields are qualitative visual observations only: none, low, medium, or high.",
    "Return JSON only and exactly follow the response schema.",
    "If uncertain, omit optional names, use unknown categories, lower confidence, and add a caution.",
  ].join("\n");
}

function createResponseSchema() {
  const signalSchema = {
    type: "STRING",
    enum: ["none", "low", "medium", "high"],
  };
  return {
    type: "OBJECT",
    properties: {
      detectedBrand: { type: "STRING" },
      detectedModelName: { type: "STRING" },
      detectedColorway: { type: "STRING" },
      mainColors: { type: "ARRAY", items: { type: "STRING" } },
      silhouette: {
        type: "STRING",
        enum: ["low", "mid", "high", "unknown"],
      },
      category: {
        type: "STRING",
        enum: [
          "basketball",
          "running",
          "training",
          "skate",
          "terrace",
          "canvas",
          "lifestyle",
          "unknown",
        ],
      },
      materialHints: { type: "ARRAY", items: { type: "STRING" } },
      vintageSignal: signalSchema,
      streetSignal: signalSchema,
      cleanSignal: signalSchema,
      uniquenessSignal: signalSchema,
      culturalContext: { type: "ARRAY", items: { type: "STRING" } },
      confidence: { type: "NUMBER", minimum: 0, maximum: 1 },
      cautions: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: [
      "mainColors",
      "silhouette",
      "category",
      "materialHints",
      "vintageSignal",
      "streetSignal",
      "cleanSignal",
      "uniquenessSignal",
      "culturalContext",
      "confidence",
      "cautions",
    ],
  };
}

function extractGeminiText(responseBody: unknown): string | undefined {
  if (!isRecord(responseBody) || !Array.isArray(responseBody["candidates"])) {
    return undefined;
  }
  const firstCandidate = responseBody["candidates"][0];
  if (!isRecord(firstCandidate) || !isRecord(firstCandidate["content"])) {
    return undefined;
  }
  const parts = firstCandidate["content"]["parts"];
  if (!Array.isArray(parts)) {
    return undefined;
  }
  const text = parts
    .map((part) => (isRecord(part) ? part["text"] : undefined))
    .filter((value): value is string => typeof value === "string")
    .join("\n")
    .trim();
  return text || undefined;
}

function parseGeminiVisualAnalysis(
  text: string | undefined,
): SneakerVisualAnalysis | undefined {
  if (!text || text.length > 6_000) {
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
  if (Object.keys(parsed).some((key) => forbiddenOutputKeys.has(key))) {
    return undefined;
  }

  const candidate = parsed as GeminiVisualJson;
  const mainColors = normalizeStringArray(candidate.mainColors, 8, 60);
  const materialHints = normalizeStringArray(candidate.materialHints, 8, 80);
  const culturalContext = normalizeStringArray(candidate.culturalContext, 6, 180);
  const cautions = normalizeStringArray(candidate.cautions, 6, 240);
  const silhouette = candidate.silhouette;
  const category = candidate.category;
  const confidence = candidate.confidence;
  const signalValues = [
    candidate.vintageSignal,
    candidate.streetSignal,
    candidate.cleanSignal,
    candidate.uniquenessSignal,
  ];

  if (
    !mainColors ||
    !materialHints ||
    !culturalContext ||
    !cautions ||
    typeof silhouette !== "string" ||
    !silhouettes.has(silhouette as SneakerSilhouette) ||
    typeof category !== "string" ||
    !categories.has(category as SneakerCategory) ||
    typeof confidence !== "number" ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1 ||
    signalValues.some((value) => typeof value !== "string" || !signals.has(value))
  ) {
    return undefined;
  }

  const optionalFields = {
    detectedBrand: normalizeOptionalText(candidate.detectedBrand, 100),
    detectedModelName: normalizeOptionalText(candidate.detectedModelName, 160),
    detectedColorway: normalizeOptionalText(candidate.detectedColorway, 160),
  };
  const combinedText = [
    ...Object.values(optionalFields),
    ...mainColors,
    ...materialHints,
    ...culturalContext,
    ...cautions,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  if (/偽物|本物と断定|正規品と断定|価格(?:は|が)正しい|購入すべき/.test(combinedText)) {
    return undefined;
  }
  const evidenceCautions = [
    ...cautions,
    "画像だけでは商品名・カラーを確定できません。",
    ...(confidence < 0.6
      ? ["confidenceが低いため、画像分析結果は不確かです。"]
      : []),
  ];

  return {
    ...(optionalFields.detectedBrand
      ? { detectedBrand: optionalFields.detectedBrand }
      : {}),
    ...(optionalFields.detectedModelName
      ? { detectedModelName: optionalFields.detectedModelName }
      : {}),
    ...(optionalFields.detectedColorway
      ? { detectedColorway: optionalFields.detectedColorway }
      : {}),
    mainColors,
    silhouette: silhouette as SneakerSilhouette,
    category: category as SneakerCategory,
    materialHints,
    vintageScore: signalToScore(candidate.vintageSignal as string),
    streetScore: signalToScore(candidate.streetSignal as string),
    cleanScore: signalToScore(candidate.cleanSignal as string),
    uniquenessScore: signalToScore(candidate.uniquenessSignal as string),
    culturalContext,
    confidence: Math.round(confidence * 100) / 100,
    cautions: [...new Set(evidenceCautions)],
  };
}

function matchesMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  return (
    bytes.length >= 12 &&
    textAt(bytes, 0, 4) === "RIFF" &&
    textAt(bytes, 8, 4) === "WEBP"
  );
}

function textAt(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function normalizeFileName(value: string): string {
  const baseName = value.split(/[\\/]/).pop() ?? "sneaker-image";
  return baseName
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 120) || "sneaker-image";
}

function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function normalizeStringArray(
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] | undefined {
  if (!Array.isArray(value) || value.length > maxItems) {
    return undefined;
  }
  const normalized = value.map((item) => normalizeOptionalText(item, maxLength));
  return normalized.some((item) => item === undefined)
    ? undefined
    : (normalized as string[]);
}

function signalToScore(signal: string): number {
  return { none: 0, low: 30, medium: 60, high: 90 }[signal] ?? 0;
}

function stripJsonCodeFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
