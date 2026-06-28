import { createModeAwareRecommendation } from "./modeRecommendation";
import type { BalancedScore, CandidateProfile, RyoScore } from "./types";

const balancedScore: BalancedScore = {
  total: 82,
  featureFit: 84,
  tagMatch: 78,
  budgetFit: 88,
  versatility: 80,
  informationConfidence: 86,
};

const ryoScore: RyoScore = {
  total: 84,
  preferenceFit: 82,
  culturalFit: 92,
  classicRetroFit: 90,
  streetFit: 74,
  calmStyleFit: 86,
  enthusiastValue: 91,
};

function candidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "candidate",
    name: "adidas Tobacco Gruen",
    source: "local",
    description: "スエードとガムソールを使ったterraceモデル",
    tags: ["classic", "low_tech", "heritage"],
    vector: {
      culture: 90,
      styleFit: 84,
      simplicity: 86,
      street: 68,
      volume: 30,
      comfort: 72,
      durability: 78,
      priceLevel: 55,
    },
    budgetFit: 88,
    risk: "low",
    informationCompleteness: 86,
    readiness: "ready_local",
    ...overrides,
  };
}

describe("mode-aware recommendation", () => {
  it("uses the Ryo seed wishlist without delegating score or decision", () => {
    const result = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate(),
      balancedScore,
      ryoScore,
    });

    expect(result.mode).toBe("ryo");
    expect(result.relatedWishlistModels).toContain("adidas Tobacco");
    expect(result.overlapWithOwned).toEqual([]);
    expect(result.ryoScore).toBeGreaterThan(result.balancedScore);
    expect(result.decision).toBe("strong_buy");
  });

  it("penalizes an owned model overlap in Ryo Mode", () => {
    const freshCandidate = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate(),
      balancedScore,
      ryoScore,
    });
    const overlapCandidate = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({ name: "adidas Samba OG" }),
      balancedScore,
      ryoScore,
    });

    expect(overlapCandidate.overlapWithOwned).toContain("adidas Samba");
    expect(overlapCandidate.ryoScore).toBeLessThan(freshCandidate.ryoScore);
    expect(overlapCandidate.cautions[0]).toContain("所有済み");
  });

  it("makes a conservative Balanced decision for poor budget fit and high risk", () => {
    const result = createModeAwareRecommendation({
      mode: "balanced",
      candidate: candidate({ budgetFit: 30, risk: "high" }),
      balancedScore: { ...balancedScore, budgetFit: 30 },
      ryoScore,
    });

    expect(result.mode).toBe("balanced");
    expect(result.decision).toBe("skip");
    expect(result.cautions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("予算"),
        expect.stringContaining("購入リスク"),
      ]),
    );
  });

  it("returns skip when candidate data is not ready", () => {
    const result = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({ readiness: "not_ready" }),
      balancedScore,
      ryoScore,
    });

    expect(result.decision).toBe("skip");
  });
});
