export const RECOMMENDATION_FEEDBACK_STORAGE_KEY = "sole-matrix:recommendation-feedback:v1";

export type RecommendationFeedbackUsefulness = "helpful" | "unsure" | "needs_improvement";
export type RecommendationFeedbackReason =
  | "model_mismatch"
  | "role_mismatch"
  | "ryo_role_mismatch"
  | "good_as_practical"
  | "set_incoherent"
  | "too_safe"
  | "rare_only"
  | "wardrobe_mismatch"
  | "purpose_mismatch"
  | "owned_too_similar";

export type RecommendationFeedback = {
  id: string;
  createdAt: string;
  resultModelName: string;
  decision: string;
  usefulness: RecommendationFeedbackUsefulness;
  reason?: RecommendationFeedbackReason;
  comment: string;
  ryoMode?: {
    templates?: string[];
    parentModels?: string[];
    retroRunningProfiles?: string[];
    productScore?: number;
    recommendationScore?: number;
    totalRyoScore?: number;
    topSignals?: string[];
  };
  readiness?: {
    candidateResearch?: string;
    grounding?: string;
    jsonSchema?: string;
    explanation?: string;
    source?: string;
  };
};

export type FeedbackStorage = Pick<Storage, "getItem" | "setItem">;

export function loadRecommendationFeedback(storage: FeedbackStorage): RecommendationFeedback[] {
  const raw = storage.getItem(RECOMMENDATION_FEEDBACK_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecommendationFeedback).slice(-100);
  } catch {
    return [];
  }
}

export function saveRecommendationFeedback(storage: FeedbackStorage, feedback: RecommendationFeedback): RecommendationFeedback[] {
  const next = [...loadRecommendationFeedback(storage), feedback].slice(-100);
  storage.setItem(RECOMMENDATION_FEEDBACK_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function createRecommendationFeedbackId(now = new Date()): string {
  return `feedback:${now.getTime()}:${Math.random().toString(36).slice(2, 10)}`;
}

function isRecommendationFeedback(value: unknown): value is RecommendationFeedback {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<RecommendationFeedback>;
  return typeof entry.id === "string"
    && typeof entry.createdAt === "string"
    && typeof entry.resultModelName === "string"
    && typeof entry.decision === "string"
    && (entry.usefulness === "helpful" || entry.usefulness === "unsure" || entry.usefulness === "needs_improvement")
    && (entry.reason === undefined || FEEDBACK_REASONS.has(entry.reason))
    && typeof entry.comment === "string";
}

const FEEDBACK_REASONS = new Set<RecommendationFeedbackReason>([
  "model_mismatch",
  "role_mismatch",
  "ryo_role_mismatch",
  "good_as_practical",
  "set_incoherent",
  "too_safe",
  "rare_only",
  "wardrobe_mismatch",
  "purpose_mismatch",
  "owned_too_similar",
]);
