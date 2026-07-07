import type { CandidateProfile } from "../core-v1/types";
import { RYO_MODE_V4_QUESTIONS } from "./questions";
import {
  buildRyoModeCandidateEvaluation,
  buildRyoModeContextForRecommendation,
  buildRyoSneakerFeaturesFromCandidate,
  mapRyoV4AnswersToLegacyDiagnosisInput,
} from "./integration";
import { buildRyoPreferenceVector } from "./vector";

const baseAnswers = {
  style: "amekaji",
  pantsFit: "wide_pants",
  taste: "classic",
  sportOrigin: "basketball",
  cut: "low",
  wearingStyle: "tied_silhouette",
  materialAging: "leather_sinking",
  color: "black_white",
  budget: "under_20000",
  techTolerance: "heritage_tech_ok",
  ryoStrength: "ryo_strong",
} as const;

describe("Ryo Mode v4 Phase 2 integration", () => {
  it("uses the 11-question definition as the UI source of truth", () => {
    expect(RYO_MODE_V4_QUESTIONS).toHaveLength(11);
    expect(RYO_MODE_V4_QUESTIONS[1]?.id).toBe("pantsFit");
    expect(RYO_MODE_V4_QUESTIONS[6]?.id).toBe("materialAging");
    expect(RYO_MODE_V4_QUESTIONS[8]?.id).toBe("budget");
    expect(RYO_MODE_V4_QUESTIONS[10]?.id).toBe("ryoStrength");
  });

  it("builds the v4 vector and a valid legacy API context from all answers", () => {
    const context = buildRyoModeContextForRecommendation(baseAnswers);
    expect(context.vector.pantsFit.widePants).toBe(100);
    expect(context.vector.materialAging.leatherSinking).toBe(100);
    expect(context.vector.budget.under20000).toBe(100);
    expect(context.vector.ryoStrength.ryoStrong).toBe(100);
    expect(context.budgetYen).toBe(20_000);
    expect(context.mode).toBe("ryo");
    expect(context.preferenceTags).toContain("classic");
    expect(context.diagnosisAnswers).toHaveLength(8);
    expect(context.answers).toMatchObject(baseAnswers);
    expect(mapRyoV4AnswersToLegacyDiagnosisInput({})).toHaveLength(8);
    expect(mapRyoV4AnswersToLegacyDiagnosisInput({ materialAging: "unknown_option" })
      .find((answer) => answer.questionId === "long-use")?.value).toBe("neutral");
  });

  it("reflects pants, material, and budget answers in deterministic recommendation scoring", () => {
    const candidate = createCandidate({ priceYen: 22_000 });
    const preferred = buildRyoModeCandidateEvaluation(buildRyoPreferenceVector(baseAnswers), candidate);
    const mismatched = buildRyoModeCandidateEvaluation(buildRyoPreferenceVector({
      ...baseAnswers,
      pantsFit: "slim_pants",
      materialAging: "canvas_fading",
      budget: "under_15000",
    }), candidate);
    expect(preferred.score.matchedSignals).toContain("selected pants compatibility");
    expect(preferred.score.matchedSignals).toContain("preferred material and aging behavior");
    expect(preferred.score.recommendationScore).toBeGreaterThan(mismatched.score.recommendationScore);
    expect(preferred.opinion.summary).toContain("productScore");
    expect(preferred.opinion.strongestSignals.length).toBeGreaterThan(0);
  });

  it("keeps the official English model name and marks missing price as a caution", () => {
    const candidate = createCandidate();
    const features = buildRyoSneakerFeaturesFromCandidate(candidate);
    const evaluation = buildRyoModeCandidateEvaluation(buildRyoPreferenceVector(baseAnswers), candidate);
    expect(features.displayNameOfficial).toBe('Nike Air Force 1 Low "White/White"');
    expect(features.brandOfficial).toBe("Nike");
    expect(features.verified).toBe(true);
    expect(evaluation.score.cautionSignals).toContain("推定価格が不明なため予算適合は加点していません");
  });
});

function createCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "fallback-af1",
    name: "Nike Air Force 1 Low White/White",
    source: "local",
    description: "verified fallback candidate",
    tags: ["classic", "basketball", "street", "durable"],
    vector: { culture: 85, styleFit: 80, simplicity: 70, street: 88, volume: 65, comfort: 70, durability: 85, priceLevel: 55 },
    budgetFit: 80,
    risk: "low",
    informationCompleteness: 90,
    readiness: "ready_local",
    researchSource: "fallback_catalog",
    ...overrides,
  };
}
