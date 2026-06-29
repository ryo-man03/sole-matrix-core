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
  it("uses the real Ryo collection and wishlist without delegating score or decision", () => {
    const result = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate(),
      balancedScore,
      ryoScore,
    });

    expect(result.mode).toBe("ryo");
    expect(result.relatedWishlistModels).toContain(
      'adidas Tobacco "Pantone/Mesa/Gum"',
    );
    expect(result.overlapWithOwned).toContain(
      'adidas Tobacco "Core Black/Dark Brown/Gum"',
    );
    expect(result.ryoScore).toBeGreaterThan(result.balancedScore);
    expect(result.decision).toBe("strong_buy");
  });

  it("penalizes an owned model overlap in Ryo Mode", () => {
    const freshCandidate = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({
        name: 'Wales Bonner × adidas Karintha "Core Black/Wonder White/Lush Blue"',
      }),
      balancedScore,
      ryoScore,
    });
    const overlapCandidate = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({ name: "adidas Samba OG" }),
      balancedScore,
      ryoScore,
    });

    expect(overlapCandidate.overlapWithOwned).toContain(
      'JJJJound × adidas Samba Tobacco "Mesa/Gum"',
    );
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

  it("references curated recommendations without mutating Core score inputs", () => {
    const balancedInput = { ...balancedScore };
    const ryoInput = { ...ryoScore };
    const result = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({
        name: "Vans Authentic Black / Black",
        description: "classic black canvas",
        priceYen: 8_800,
      }),
      balancedScore: balancedInput,
      ryoScore: ryoInput,
    });

    expect(result.relatedCuratedModels).toContain("Vans Authentic Black / Black");
    expect(balancedInput).toEqual(balancedScore);
    expect(ryoInput).toEqual(ryoScore);
  });

  it("prefers an affordable classic when the same budget fits poorly elsewhere", () => {
    const affordable = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({
        name: "Reebok Classic Leather 1983 Vintage Chalk",
        priceYen: 11_000,
        budgetFit: 90,
      }),
      balancedScore: { ...balancedScore, budgetFit: 90 },
      ryoScore,
    });
    const expensive = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({
        name: "New Balance U993GG Gray",
        priceYen: 39_600,
        budgetFit: 35,
      }),
      balancedScore: { ...balancedScore, budgetFit: 35 },
      ryoScore,
    });

    expect(affordable.ryoScore).toBeGreaterThan(expensive.ryoScore);
    expect(affordable.decision).not.toBe("wait");
    expect(expensive.decision).toBe("wait");
  });

  it("does not automatically boost New Balance 990v5 or later", () => {
    const v4 = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({ name: "New Balance U990NV4 Navy" }),
      balancedScore,
      ryoScore,
    });
    const v5 = createModeAwareRecommendation({
      mode: "ryo",
      candidate: candidate({ name: "New Balance 990v5 Navy" }),
      balancedScore,
      ryoScore,
    });

    expect(v4.relatedCuratedModels).toContain("New Balance U990NV4 Navy");
    expect(v5.relatedCuratedModels).toHaveLength(0);
    expect(v5.ryoScore).toBeLessThan(v4.ryoScore);
  });
});
