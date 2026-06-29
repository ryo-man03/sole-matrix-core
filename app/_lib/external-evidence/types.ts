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

export type ExternalEvidenceBundle = {
  listings: ExternalListingEvidence[];
};
