export type ExternalListingEvidence = {
  kind: "external_listing";
  provider: "rakuten";
  listingName: string;
  priceYen: number;
  productUrl: string;
  imageUrl?: string;
  shopName?: string;
  confidence: "normalized_listing";
  warnings: string[];
  budgetFitImpact: "none";
  coreDecisionImpact: "none";
};

export type ExternalVisualEvidence = {
  kind: "external_visual_analysis";
  provider: "gemini";
  identification: "estimated" | "unknown";
  summary: string;
  confidence: number;
  confidenceLabel: "uncertain" | "moderate" | "high";
  warnings: string[];
  coreDecisionImpact: "none";
};

export type ExternalUrlEvidence = {
  kind: "external_url_analysis";
  provider: "metadata" | "gemini_url_context" | "fallback";
  domain: string;
  summary: string;
  confidence: number;
  confidenceLabel: "uncertain" | "moderate" | "high";
  warnings: string[];
  coreDecisionImpact: "none";
};

export type ExternalFeedbackPatternEvidence = {
  kind: "recommendation_feedback_patterns";
  source: "global_anonymized_corpus";
  sampleSize: number;
  patterns: string[];
  trust: "reference_only";
  coreDecisionImpact: "none";
};

export type ExternalEvidenceBundle = {
  listings: ExternalListingEvidence[];
  feedbackPatterns: ExternalFeedbackPatternEvidence[];
  visual?: ExternalVisualEvidence;
  url?: ExternalUrlEvidence;
};
