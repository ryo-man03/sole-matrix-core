import type { CandidateProfile } from "../core-v1/types";
import {
  buildScoredShortlist,
  buildTrustedCandidatePool,
  createTrustedCandidateFunnel,
  TRUSTED_CANDIDATE_LIMITS,
  TRUSTED_SEARCH_SLOTS,
} from "./trusted-pipeline";

describe("trusted recommendation pipeline", () => {
  it("enforces every candidate funnel maximum and preserves deterministic order", () => {
    const candidates = Array.from({ length: 30 }, (_, index) =>
      candidate(`candidate-${String(index).padStart(2, "0")}`));
    const pool = buildTrustedCandidatePool(candidates);
    const scored = buildScoredShortlist(pool.candidates.map((item, index) => ({
      candidate: item,
      balancedScore: { total: index % 4 === 0 ? 80 : 60 },
      ryoScore: { total: index % 4 === 0 ? 70 : 65 },
    })), "ryo");
    const funnel = createTrustedCandidateFunnel(pool.counts, scored.length, 3, 1);

    expect(funnel.discoveryPool).toBe(TRUSTED_CANDIDATE_LIMITS.discoveryPool);
    expect(funnel.normalizedPool).toBe(TRUSTED_CANDIDATE_LIMITS.normalizedPool);
    expect(funnel.verifiedPool).toBe(TRUSTED_CANDIDATE_LIMITS.verifiedPool);
    expect(funnel.scoredShortlist).toBe(TRUSTED_CANDIDATE_LIMITS.scoredShortlist);
    expect(funnel.displaySet).toBe(3);
    expect(funnel.caution).toBe(1);
    expect(funnel.searchSlots).toEqual(TRUSTED_SEARCH_SLOTS);
  });

  it("deduplicates identities and rejects an unverified external model", () => {
    const pool = buildTrustedCandidatePool([
      candidate("duplicate", { modelName: "Converse One Star J" }),
      candidate("duplicate-2", { modelName: "Converse  One-Star J" }),
      candidate("unverified", {
        modelName: "Imaginary Shoe",
        researchSource: "gemini",
        verificationStatus: "unverified",
      }),
      candidate("verified", {
        modelName: "Verified Shoe",
        researchSource: "gemini",
        verificationStatus: "model_verified_colorway_unverified",
      }),
    ]);
    expect(pool.counts.normalizedPool).toBe(3);
    expect(pool.candidates.map((item) => item.id)).toEqual(["duplicate", "verified"]);
  });
});

function candidate(id: string, overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id,
    name: `Model ${id}`,
    modelName: `Model ${id}`,
    source: "local",
    description: "Core curated candidate",
    tags: [],
    vector: {
      culture: 50,
      styleFit: 50,
      simplicity: 50,
      street: 50,
      volume: 50,
      comfort: 50,
      durability: 50,
      priceLevel: 50,
    },
    budgetFit: 70,
    risk: "low",
    informationCompleteness: 80,
    readiness: "ready_local",
    researchSource: "fallback_catalog",
    ...overrides,
  };
}
