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

export type ExternalEvidenceBundle = {
  listings: ExternalListingEvidence[];
  visual?: ExternalVisualEvidence;
};
