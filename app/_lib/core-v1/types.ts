import type { SneakerVector } from "../../../src/domain/sneaker/sneakerVector";
import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { ExternalEvidenceBundle } from "../external-evidence/types";

export type DiagnosisAnswerValue = "like" | "neutral" | "dislike";

export type DiagnosisAnswer = {
  questionId: string;
  value: DiagnosisAnswerValue;
};

export type PreferenceVector = SneakerVector;

export type RecommendationMode = "ryo" | "balanced";

export type ModeDecision = "strong_buy" | "buy" | "wait" | "skip";

export type ModeAwareRecommendation = {
  mode: RecommendationMode;
  decision: ModeDecision;
  balancedScore: number;
  ryoScore: number;
  modeReason: string;
  overlapWithOwned: string[];
  relatedWishlistModels: string[];
  relatedCuratedModels: string[];
  cautions: string[];
};

export type CandidateRisk = "low" | "medium" | "high";
export type CandidateReadiness =
  | "ready_local"
  | "ready_external"
  | "degraded"
  | "not_ready";
export type CandidateSource = "mock" | "local" | "fallback" | "rakuten";

export type CandidateProfile = {
  id: string;
  name: string;
  source: CandidateSource;
  description: string;
  tags: SneakerTag[];
  vector: SneakerVector;
  budgetFit: number;
  risk: CandidateRisk;
  informationCompleteness: number;
  readiness: CandidateReadiness;
  priceYen?: number;
  url?: string;
  imageUrl?: string;
  shopName?: string;
  note?: string;
};

export type BalancedScore = {
  total: number;
  featureFit: number;
  tagMatch: number;
  budgetFit: number;
  versatility: number;
  informationConfidence: number;
};

export type RyoScore = {
  total: number;
  preferenceFit: number;
  culturalFit: number;
  classicRetroFit: number;
  streetFit: number;
  calmStyleFit: number;
  enthusiastValue: number;
};

export type Decision =
  | "strong_buy"
  | "consider"
  | "wait"
  | "avoid"
  | "unknown";

export type ExplanationTone =
  | "positive"
  | "balanced"
  | "cautious"
  | "negative"
  | "unknown";

export type RecommendationExplanation = {
  source: "gemini" | "rule_based";
  summary: string;
  reasons: string[];
  cautions: string[];
  balancedView: string;
  ryoView: string;
  finalTone: ExplanationTone;
};

export type ProviderReadinessStatus =
  | "ready"
  | "fallback"
  | "missing_config"
  | "blocked_forbidden"
  | "blocked_rate_limit"
  | "network_or_http_error"
  | "invalid_response"
  | "not_checked";

export type ProviderReadiness = {
  provider: "gemini" | "rakuten";
  status: ProviderReadinessStatus;
  detail: string;
};

export type RecommendationResult = {
  recommendationId: string;
  preferenceVector: PreferenceVector;
  candidate: CandidateProfile;
  balancedScore: BalancedScore;
  ryoScore: RyoScore;
  decision: Decision;
  explanation: RecommendationExplanation;
  readiness: {
    gemini: ProviderReadiness;
    rakuten: ProviderReadiness;
  };
  externalEvidence: ExternalEvidenceBundle;
};

export type FeedbackSentiment = "helpful" | "not_helpful" | "unsure";

export type FeedbackInput = {
  recommendationId: string;
  sentiment: FeedbackSentiment;
  comment?: string;
  createdAt: string;
};
