import type {
  ColorwayVerificationStatus,
  EvidenceSourceQuality,
} from "../ai/gemini-sneaker-research-schema";

export type VerificationLevel =
  | "officially_verified"
  | "independently_verified"
  | "partially_verified"
  | "unverified"
  | "rejected";

export type VerificationSubject = "model" | "colorway" | "style_code";

export type VerificationEvidence = {
  subject: VerificationSubject;
  url: string;
  domain: string;
  sourceQuality: EvidenceSourceQuality;
  supportedText?: string;
  modelName?: string;
  colorwayName?: string | null;
  styleCode?: string | null;
};

export type FactualVerification = {
  model: VerificationLevel;
  colorway: VerificationLevel;
  styleCode: VerificationLevel;
  modelEvidence: VerificationEvidence[];
  colorwayEvidence: VerificationEvidence[];
  styleCodeEvidence: VerificationEvidence[];
  unsupportedClaims: string[];
  contradictions: string[];
  evidenceCount: number;
};

export type ExplanationClaimKind =
  | "verified_fact"
  | "core_inference"
  | "ryo_editorial"
  | "unsupported";

export type ExplanationClaim = {
  id: string;
  text: string;
  kind: ExplanationClaimKind;
  evidenceUrls: string[];
  supportingScoreKeys: string[];
  supportingCandidateFields: string[];
  contradictionReasons: string[];
};

export type ExplanationTrustEvaluation = {
  claims: ExplanationClaim[];
  verifiedFactCount: number;
  inferenceCount: number;
  editorialCount: number;
  unsupportedCount: number;
  contradictionCount: number;
};

export type RyoAuthenticityEvaluation = {
  historyFit: number;
  materialStoryFit: number;
  outfitFit: number;
  culturalFit: number;
  adjacentDiscoveryFit: number;
  collectionRoleFit: number;
  wearableColorFit: number;
  tooSafePenalty: number;
  hypeOnlyPenalty: number;
  contextMismatchPenalty: number;
  total: number;
  rubricVersion: string;
  reasons: string[];
  penalties: string[];
  matchedGoldRules: string[];
};

export type RecommendationTrustStatus =
  | "verified"
  | "partially_verified"
  | "needs_review"
  | "rejected";

export type RecommendationTrustEvaluation = {
  factual: FactualVerification;
  diagnosisFitScore: number;
  ryoAuthenticity: RyoAuthenticityEvaluation;
  explanationTrust: ExplanationTrustEvaluation;
  status: RecommendationTrustStatus;
  reviewReasons: string[];
};

export type LegacyVerificationStatus = ColorwayVerificationStatus;
