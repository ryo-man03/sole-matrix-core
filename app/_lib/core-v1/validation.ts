import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import { RYO_MODE_V4_QUESTIONS } from "../ryo-mode-v4/questions";
import type { RyoModeAnswers, RyoModeQuestionId } from "../ryo-mode-v4/types";
import { normalizeDiagnosisAnswers } from "./diagnosis";
import type {
  DiagnosisAnswer,
  FeedbackInput,
  FeedbackSentiment,
  RecommendationMode,
} from "./types";

const supportedTags = new Set<SneakerTag>([
  "classic",
  "low_tech",
  "canvas",
  "minimal",
  "street",
  "chunky",
  "basketball",
  "running",
  "comfortable",
  "durable",
  "retro",
  "collab",
  "trail",
  "outdoor",
  "premium",
  "heritage",
]);
const supportedFeedbackSentiments = new Set<FeedbackSentiment>([
  "helpful",
  "not_helpful",
  "unsure",
]);

export type ValidationError = {
  code: "VALIDATION_ERROR";
  message: string;
  field: string;
};

export type RecommendRequestInput = {
  diagnosisAnswers: DiagnosisAnswer[];
  preferenceTags: SneakerTag[];
  budgetYen?: number;
  mode?: RecommendationMode;
  sneakerName?: string;
  brand?: string;
  color?: string;
  urlNameHint?: string;
  ryoModeAnswers?: RyoModeAnswers;
};

export function validateRecommendRequest(
  value: unknown,
): { ok: true; value: RecommendRequestInput } | { ok: false; error: ValidationError } {
  if (!isRecord(value)) {
    return invalid("body");
  }

  const diagnosisAnswers = normalizeDiagnosisAnswers(value["diagnosisAnswers"]);
  const preferenceTags = normalizeTags(value["preferenceTags"]);
  const budgetResult = normalizeBudget(value["budgetYen"]);
  const mode = normalizeMode(value["mode"]);
  const sneakerName = normalizeOptionalString(value["sneakerName"], 160);
  const brand = normalizeOptionalString(value["brand"], 80);
  const color = normalizeOptionalString(value["color"], 80);
  const urlNameHint = normalizeOptionalString(value["urlNameHint"], 160);
  const ryoModeAnswers = normalizeRyoModeAnswers(value["ryoModeAnswers"]);

  if (!budgetResult.ok) {
    return budgetResult;
  }

  if (
    mode === null ||
    sneakerName === null ||
    brand === null ||
    color === null ||
    urlNameHint === null ||
    ryoModeAnswers === null
  ) {
    return invalid("recommendationContext");
  }

  if (diagnosisAnswers.length === 0 && preferenceTags.length === 0) {
    return invalid("diagnosisAnswers");
  }

  return {
    ok: true,
    value: {
      diagnosisAnswers,
      preferenceTags,
      ...(budgetResult.value === undefined
        ? {}
        : { budgetYen: budgetResult.value }),
      ...(mode ? { mode } : {}),
      ...(sneakerName ? { sneakerName } : {}),
      ...(brand ? { brand } : {}),
      ...(color ? { color } : {}),
      ...(urlNameHint ? { urlNameHint } : {}),
      ...(ryoModeAnswers ? { ryoModeAnswers } : {}),
    },
  };
}

function normalizeRyoModeAnswers(value: unknown): RyoModeAnswers | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) return null;
  const normalized: Partial<Record<RyoModeQuestionId, string>> = {};
  for (const question of RYO_MODE_V4_QUESTIONS) {
    const optionId = value[question.id];
    if (optionId === undefined) continue;
    if (typeof optionId !== "string" || !question.options.some((option) => option.id === optionId)) return null;
    normalized[question.id] = optionId;
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeMode(value: unknown): RecommendationMode | null | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value === "ryo" || value === "balanced" ? value : null;
}

export function validateFeedbackRequest(
  value: unknown,
  now = new Date(),
): { ok: true; value: FeedbackInput } | { ok: false; error: ValidationError } {
  if (!isRecord(value)) {
    return invalid("body");
  }

  const recommendationId = normalizeRequiredString(
    value["recommendationId"],
    100,
  );
  const sentiment = value["sentiment"];
  const comment = normalizeOptionalString(value["comment"], 500);

  if (!recommendationId) {
    return invalid("recommendationId");
  }

  if (
    typeof sentiment !== "string" ||
    !supportedFeedbackSentiments.has(sentiment as FeedbackSentiment)
  ) {
    return invalid("sentiment");
  }

  if (comment === null) {
    return invalid("comment");
  }

  return {
    ok: true,
    value: {
      recommendationId,
      sentiment: sentiment as FeedbackSentiment,
      ...(comment === undefined ? {} : { comment }),
      createdAt: now.toISOString(),
    },
  };
}

function normalizeTags(value: unknown): SneakerTag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (tag): tag is SneakerTag =>
          typeof tag === "string" && supportedTags.has(tag as SneakerTag),
      ),
    ),
  ].slice(0, 5);
}

function normalizeBudget(
  value: unknown,
):
  | { ok: true; value: number | undefined }
  | { ok: false; error: ValidationError } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: undefined };
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0 ||
    value > 1_000_000
  ) {
    return invalid("budgetYen");
  }

  return { ok: true, value };
}

function normalizeRequiredString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 && normalized.length <= maxLength
    ? normalized
    : null;
}

function normalizeOptionalString(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return normalizeRequiredString(value, maxLength);
}

function invalid(
  field: string,
): { ok: false; error: ValidationError } {
  return {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "入力内容を確認してください。",
      field,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
