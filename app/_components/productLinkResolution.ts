const maxRecommendationProductNameLength = 160;

export type RecommendationProductLinkSource = {
  analysis?: {
    sneakerName?: string;
    urlAnalysis?: { title?: string };
    visualAnalysis?: { detectedModelName?: string };
  };
  candidate: {
    name: string;
    source: string;
  };
  externalEvidence: {
    listings: Array<{ listingName?: string }>;
    feedbackPatterns: unknown[];
  };
};

export function createLatestRequestGate() {
  let currentRequestId = 0;

  return {
    beginRequest() {
      currentRequestId += 1;
      return currentRequestId;
    },
    isCurrent(requestId: number) {
      return requestId === currentRequestId;
    },
    invalidate() {
      currentRequestId += 1;
    },
  };
}

export function resolveRecommendationProductName(
  recommendation: RecommendationProductLinkSource,
): string | null {
  const candidates = [
    recommendation.analysis?.sneakerName,
    recommendation.analysis?.urlAnalysis?.title,
    recommendation.analysis?.visualAnalysis?.detectedModelName,
    recommendation.externalEvidence.listings[0]?.listingName,
    recommendation.candidate.source === "rakuten"
      ? recommendation.candidate.name
      : undefined,
  ];

  for (const value of candidates) {
    const normalized = normalizeProductName(value);
    if (normalized) return normalized;
  }

  return null;
}

function normalizeProductName(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null;

  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxRecommendationProductNameLength);

  return normalized.length ? normalized : null;
}