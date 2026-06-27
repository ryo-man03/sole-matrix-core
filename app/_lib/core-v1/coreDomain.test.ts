import type { CandidateProfile } from "./types";
import { normalizeDiagnosisAnswers } from "./diagnosis";
import { createPreferenceVector } from "./preferenceVector";
import { calculateBalancedScore, calculateRyoScore } from "./scoring";
import { decideRecommendation } from "./decision";

const candidate: CandidateProfile = {
  id: "local-classic",
  name: "クラシック・デイリー型",
  source: "local",
  description: "テスト用のローカル候補",
  tags: ["classic", "minimal", "comfortable", "heritage"],
  vector: {
    culture: 88,
    styleFit: 84,
    simplicity: 90,
    street: 48,
    volume: 36,
    comfort: 78,
    durability: 82,
    priceLevel: 45,
  },
  budgetFit: 90,
  risk: "low",
  informationCompleteness: 85,
  readiness: "ready_local",
};

describe("Core v1 diagnosis and scoring", () => {
  it("normalizes supported diagnosis answers and ignores unknown values", () => {
    expect(
      normalizeDiagnosisAnswers({
        "trusted-classic": "like",
        "simple-daily": "neutral",
        unknown: "like",
        "street-presence": "invalid",
      }),
    ).toEqual([
      { questionId: "trusted-classic", value: "like" },
      { questionId: "simple-daily", value: "neutral" },
    ]);
  });

  it("creates an eight-axis PreferenceVector with neutral unanswered axes", () => {
    const answers = normalizeDiagnosisAnswers({
      "trusted-classic": "like",
      "simple-daily": "like",
      "walking-comfort": "like",
    });
    const vector = createPreferenceVector({
      answers,
      tags: ["classic", "minimal", "unknown", "classic"],
    });

    expect(Object.keys(vector)).toHaveLength(8);
    expect(vector.culture).toBeGreaterThan(70);
    expect(vector.simplicity).toBeGreaterThan(70);
    expect(vector.comfort).toBe(85);
    expect(vector.durability).toBe(50);
    expect(vector.priceLevel).toBe(50);
  });

  it("calculates deterministic Balanced and Ryo scores without AI", () => {
    const preferenceVector = createPreferenceVector({
      answers: normalizeDiagnosisAnswers({
        "trusted-classic": "like",
        "simple-daily": "like",
        "walking-comfort": "like",
        "long-use": "like",
      }),
      tags: ["classic", "minimal", "comfortable"],
    });
    const balanced = calculateBalancedScore({
      preferenceVector,
      candidate,
      preferredTags: ["classic", "minimal", "comfortable"],
    });
    const ryo = calculateRyoScore({ preferenceVector, candidate });

    expect(balanced.total).toBeGreaterThanOrEqual(70);
    expect(balanced.tagMatch).toBeGreaterThan(0);
    expect(ryo.total).toBeGreaterThanOrEqual(70);
    expect(calculateRyoScore({ preferenceVector, candidate })).toEqual(ryo);
  });
});

describe("Core v1 Decision", () => {
  const balancedScore = {
    total: 82,
    featureFit: 84,
    tagMatch: 80,
    budgetFit: 90,
    versatility: 82,
    informationConfidence: 85,
  };
  const ryoScore = {
    total: 78,
    preferenceFit: 80,
    culturalFit: 80,
    classicRetroFit: 80,
    streetFit: 70,
    calmStyleFit: 80,
    enthusiastValue: 75,
  };

  it("returns strong_buy for high scores, low risk, and ready local data", () => {
    expect(
      decideRecommendation({
        balancedScore,
        ryoScore,
        budgetFit: 90,
        risk: "low",
        informationCompleteness: 85,
        readiness: "ready_local",
      }),
    ).toBe("strong_buy");
  });

  it("returns wait for poor budget fit", () => {
    expect(
      decideRecommendation({
        balancedScore,
        ryoScore,
        budgetFit: 30,
        risk: "low",
        informationCompleteness: 85,
        readiness: "ready_local",
      }),
    ).toBe("wait");
  });

  it("returns avoid for high risk and low scores", () => {
    expect(
      decideRecommendation({
        balancedScore: { ...balancedScore, total: 40 },
        ryoScore: { ...ryoScore, total: 42 },
        budgetFit: 80,
        risk: "high",
        informationCompleteness: 80,
        readiness: "degraded",
      }),
    ).toBe("avoid");
  });

  it("returns unknown when data is not ready", () => {
    expect(
      decideRecommendation({
        balancedScore,
        ryoScore,
        budgetFit: 90,
        risk: "low",
        informationCompleteness: 85,
        readiness: "not_ready",
      }),
    ).toBe("unknown");
  });
});
