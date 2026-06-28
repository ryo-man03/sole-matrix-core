import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import { assertSafeUserId } from "../user-memory/userMemoryService";
import { validateRecommendRequest, type ValidationError } from "../core-v1/validation";
import type { SneakerVisualAnalysis } from "../image-analysis/types";
import type { SneakerUrlAnalysis } from "../url-analysis/types";
import type {
  IntegratedRecommendationRequest,
  RecommendationAnalysisContext,
} from "./types";

const supportedTags = new Set<SneakerTag>([
  "classic", "low_tech", "canvas", "minimal", "street", "chunky",
  "basketball", "running", "comfortable", "durable", "retro", "collab",
  "trail", "outdoor", "premium", "heritage",
]);
const supportedSilhouettes = new Set(["low", "mid", "high", "unknown"]);
const supportedCategories = new Set([
  "basketball", "running", "training", "skate", "terrace", "canvas",
  "lifestyle", "unknown",
]);

export function validateIntegratedRecommendationRequest(
  value: unknown,
):
  | { ok: true; value: IntegratedRecommendationRequest }
  | { ok: false; error: ValidationError } {
  if (!isRecord(value)) {
    return invalid("body");
  }
  const analysis = normalizeAnalysis(value["analysis"]);
  if (analysis === null) {
    return invalid("analysis");
  }
  const inferredTags = inferTags(analysis);
  const suppliedTags = Array.isArray(value["preferenceTags"])
    ? value["preferenceTags"]
    : [];
  const coreValidation = validateRecommendRequest({
    ...value,
    preferenceTags: [...suppliedTags, ...inferredTags],
    sneakerName: analysis?.sneakerName ?? value["sneakerName"],
    brand:
      analysis?.visualAnalysis?.detectedBrand ??
      value["brand"],
    color:
      analysis?.visualAnalysis?.mainColors[0] ??
      value["color"],
    urlNameHint:
      analysis?.urlAnalysis?.extractedNameHint ??
      value["urlNameHint"],
  });
  if (!coreValidation.ok) {
    return coreValidation;
  }

  const mode = coreValidation.value.mode ?? "balanced";
  const userId = normalizeUserId(value["userId"]);
  if (userId === null) {
    return invalid("userId");
  }

  return {
    ok: true,
    value: {
      ...coreValidation.value,
      mode,
      ...(userId ? { userId } : {}),
      ...(analysis ? { analysis } : {}),
    },
  };
}

function normalizeAnalysis(value: unknown): RecommendationAnalysisContext | null | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!isRecord(value)) {
    return null;
  }
  const sneakerName = optionalText(value["sneakerName"], 160);
  const urlAnalysis = normalizeUrlAnalysis(value["urlAnalysis"]);
  const visualAnalysis = normalizeVisualAnalysis(value["visualAnalysis"]);
  if (sneakerName === null || urlAnalysis === null || visualAnalysis === null) {
    return null;
  }
  return {
    ...(sneakerName ? { sneakerName } : {}),
    ...(urlAnalysis ? { urlAnalysis } : {}),
    ...(visualAnalysis ? { visualAnalysis } : {}),
  };
}

function normalizeUrlAnalysis(value: unknown): SneakerUrlAnalysis | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) return null;
  const inputUrl = optionalText(value["inputUrl"], 2_048);
  const confidence = finiteNumber(value["confidence"], 0, 1);
  const cautions = stringArray(value["cautions"], 8, 240);
  if (!inputUrl || confidence === null || !cautions) return null;
  const optional = {
    finalUrl: optionalHttpUrl(value["finalUrl"]),
    title: optionalText(value["title"], 240),
    description: optionalText(value["description"], 500),
    imageUrl: optionalHttpUrl(value["imageUrl"]),
    canonicalUrl: optionalHttpUrl(value["canonicalUrl"]),
    extractedNameHint: optionalText(value["extractedNameHint"], 160),
  };
  if (Object.values(optional).some((item) => item === null)) return null;
  return {
    inputUrl,
    confidence,
    cautions,
    ...presentStrings(optional),
  };
}

function normalizeVisualAnalysis(value: unknown): SneakerVisualAnalysis | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) return null;
  const mainColors = stringArray(value["mainColors"], 8, 60);
  const materialHints = stringArray(value["materialHints"], 8, 80);
  const culturalContext = stringArray(value["culturalContext"], 6, 180);
  const cautions = stringArray(value["cautions"], 6, 240);
  const silhouette = value["silhouette"];
  const category = value["category"];
  const confidence = finiteNumber(value["confidence"], 0, 1);
  const scores = ["vintageScore", "streetScore", "cleanScore", "uniquenessScore"]
    .map((key) => finiteNumber(value[key], 0, 100));
  if (
    !mainColors || !materialHints || !culturalContext || !cautions ||
    typeof silhouette !== "string" || !supportedSilhouettes.has(silhouette) ||
    typeof category !== "string" || !supportedCategories.has(category) ||
    confidence === null || scores.some((score) => score === null)
  ) return null;
  const optional = {
    detectedBrand: optionalText(value["detectedBrand"], 100),
    detectedModelName: optionalText(value["detectedModelName"], 160),
    detectedColorway: optionalText(value["detectedColorway"], 160),
  };
  if (Object.values(optional).some((item) => item === null)) return null;
  return {
    ...presentStrings(optional),
    mainColors,
    silhouette: silhouette as SneakerVisualAnalysis["silhouette"],
    category: category as SneakerVisualAnalysis["category"],
    materialHints,
    vintageScore: scores[0]!,
    streetScore: scores[1]!,
    cleanScore: scores[2]!,
    uniquenessScore: scores[3]!,
    culturalContext,
    confidence,
    cautions,
  };
}

function inferTags(analysis: RecommendationAnalysisContext | undefined): SneakerTag[] {
  if (!analysis) return [];
  const tags = new Set<SneakerTag>();
  const category = analysis.visualAnalysis?.category;
  const categoryTags: Partial<Record<NonNullable<typeof category>, SneakerTag>> = {
    basketball: "basketball", running: "running", skate: "street",
    terrace: "low_tech", canvas: "canvas", lifestyle: "classic",
  };
  if (category && categoryTags[category]) tags.add(categoryTags[category]!);
  const text = [
    analysis.sneakerName,
    analysis.urlAnalysis?.title,
    analysis.urlAnalysis?.description,
    analysis.visualAnalysis?.detectedModelName,
    ...(analysis.visualAnalysis?.materialHints ?? []),
    ...(analysis.visualAnalysis?.culturalContext ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
  const rules: Array<[SneakerTag, RegExp]> = [
    ["classic", /classic|定番/], ["retro", /retro|vintage|復刻|レトロ/],
    ["heritage", /heritage|history|歴史|文化/], ["low_tech", /terrace|gum sole|ガムソール/],
    ["premium", /made in japan|mij|日本製|ドイツ製|leather|レザー/],
    ["street", /street|skate|ストリート|スケート/],
  ];
  for (const [tag, pattern] of rules) if (pattern.test(text)) tags.add(tag);
  return [...tags].slice(0, 5);
}

function normalizeUserId(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;
  try { return assertSafeUserId(value); } catch { return null; }
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized && normalized.length <= max ? normalized : null;
}

function optionalHttpUrl(value: unknown): string | null | undefined {
  const text = optionalText(value, 2_048);
  if (!text) return text;
  try {
    const url = new URL(text);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password
      ? url.toString()
      : null;
  } catch { return null; }
}

function finiteNumber(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
}

function stringArray(value: unknown, maxItems: number, maxLength: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const output = value.map((item) => optionalText(item, maxLength));
  return output.some((item) => !item) ? null : output as string[];
}

function presentStrings<T extends Record<string, string | null | undefined>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string")) as {
    [K in keyof T]?: string;
  };
}

function invalid(field: string): { ok: false; error: ValidationError } {
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "入力内容を確認してください。", field } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
