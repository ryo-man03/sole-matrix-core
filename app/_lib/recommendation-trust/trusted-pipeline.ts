import type {
  CandidateProfile,
  RecommendationMode,
} from "../core-v1/types";

export const TRUSTED_CANDIDATE_LIMITS = {
  discoveryPool: 24,
  normalizedPool: 20,
  verifiedPool: 16,
  scoredShortlist: 8,
  displaySet: 3,
  caution: 1,
} as const;

export const TRUSTED_SEARCH_SLOTS = [
  "hard_constraint",
  "ryo_core",
  "adjacent_discovery",
  "archive_wildcard",
  "practical_anchor",
] as const;

export type TrustedSearchSlot = (typeof TRUSTED_SEARCH_SLOTS)[number];

export type TrustedCandidateFunnel = {
  limits: typeof TRUSTED_CANDIDATE_LIMITS;
  searchSlots: readonly TrustedSearchSlot[];
  discoveryPool: number;
  normalizedPool: number;
  verifiedPool: number;
  scoredShortlist: number;
  displaySet: number;
  caution: number;
};

export type CoreScoredCandidateLike = {
  candidate: CandidateProfile;
  balancedScore: { total: number };
  ryoScore: { total: number };
};

export function buildTrustedCandidatePool(candidates: readonly CandidateProfile[]): {
  candidates: CandidateProfile[];
  counts: Pick<TrustedCandidateFunnel, "discoveryPool" | "normalizedPool" | "verifiedPool">;
} {
  const discovery = candidates.slice(0, TRUSTED_CANDIDATE_LIMITS.discoveryPool);
  const normalized = dedupeCandidates(discovery).slice(0, TRUSTED_CANDIDATE_LIMITS.normalizedPool);
  const verified = normalized
    .filter(isCandidateEligibleForScoring)
    .slice(0, TRUSTED_CANDIDATE_LIMITS.verifiedPool);
  return {
    candidates: verified,
    counts: {
      discoveryPool: discovery.length,
      normalizedPool: normalized.length,
      verifiedPool: verified.length,
    },
  };
}

export function buildScoredShortlist<T extends CoreScoredCandidateLike>(
  entries: readonly T[],
  mode: RecommendationMode | undefined,
): T[] {
  return [...entries]
    .sort((left, right) => {
      const leftScore = activeScore(left, mode);
      const rightScore = activeScore(right, mode);
      return rightScore - leftScore
        || left.candidate.id.localeCompare(right.candidate.id, "en-US");
    })
    .slice(0, TRUSTED_CANDIDATE_LIMITS.scoredShortlist);
}

export function createTrustedCandidateFunnel(
  counts: Pick<TrustedCandidateFunnel, "discoveryPool" | "normalizedPool" | "verifiedPool">,
  scoredShortlist: number,
  displaySet: number,
  caution: number,
): TrustedCandidateFunnel {
  return {
    limits: TRUSTED_CANDIDATE_LIMITS,
    searchSlots: TRUSTED_SEARCH_SLOTS,
    ...counts,
    scoredShortlist: Math.min(scoredShortlist, TRUSTED_CANDIDATE_LIMITS.scoredShortlist),
    displaySet: Math.min(displaySet, TRUSTED_CANDIDATE_LIMITS.displaySet),
    caution: Math.min(caution, TRUSTED_CANDIDATE_LIMITS.caution),
  };
}

function activeScore(entry: CoreScoredCandidateLike, mode: RecommendationMode | undefined): number {
  if (mode === "ryo") return entry.ryoScore.total;
  if (mode === "balanced") return entry.balancedScore.total;
  return entry.balancedScore.total + entry.ryoScore.total;
}

function isCandidateEligibleForScoring(candidate: CandidateProfile): boolean {
  const source = candidate.researchSource ?? "fallback_catalog";
  if (source === "fallback_catalog" || source === "ryo_anchor" || source === "product_input") {
    return true;
  }
  const modelStatus = candidate.factualVerification?.model;
  return modelStatus === "officially_verified"
    || modelStatus === "independently_verified"
    || candidate.verificationStatus === "model_and_colorway_verified"
    || candidate.verificationStatus === "model_verified_colorway_unverified";
}

function dedupeCandidates(candidates: readonly CandidateProfile[]): CandidateProfile[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = [
      candidate.brand,
      candidate.modelName ?? candidate.name,
      candidate.styleCode,
    ].map((part) => comparable(part ?? "")).join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((candidate) => ({ ...candidate }));
}

function comparable(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}
