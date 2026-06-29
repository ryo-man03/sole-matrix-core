export type ProductUrlSource =
  | "rakuten"
  | "official"
  | "retailer"
  | "marketplace"
  | "manual"
  | "search_fallback";

export type ProductUrlVerificationStatus =
  | "verified_live"
  | "blocked"
  | "not_found"
  | "search_fallback";

export type LiveProductUrl = {
  label: string;
  href: string;
  displayDomain: string;
  source: ProductUrlSource;
  verificationStatus: ProductUrlVerificationStatus;
  verifiedAt: string;
  coreDecisionImpact: "none";
  scoreImpact: "none";
  note: string;
};

export type ProductUrlResolution = {
  links: LiveProductUrl[];
  checkedAt: string;
  status: "resolved" | "not_found" | "blocked";
  message: string;
};

export type ProductUrlCandidate = {
  label: string;
  href: string;
  source: ProductUrlSource;
  kind: "direct" | "search";
};
