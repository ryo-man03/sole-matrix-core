import type { CandidateProfile } from "../core-v1/types";
import { ryoModeSeed } from "../core-v1/ryoModeSeed";
import { sneakerFallbackCatalog } from "../ai/sneaker-fallback-catalog";
import {
  evaluateRecommendationSetCoherence,
  evaluateRyoRoleEligibility,
  getRyoModelAffinityProfile,
} from "./role-policy";
import { getRyoModeAnchorAffinityAudit } from "./candidates";
import type {
  RyoModeAnswers,
  RyoRoleEligibility,
  RyoScoreBreakdownV2,
} from "./types";
import {
  buildRyoPreferenceVector,
  summarizeRyoPreferenceVector,
} from "./vector";

const strongScores: RyoScoreBreakdownV2 = {
  userFitScore: 72,
  ryoIdentityScore: 76,
  practicalFitScore: 70,
  explorationScore: 68,
  contextPenalty: 0,
  finalRecommendationScore: 78,
};

const retroRunningAnswers: RyoModeAnswers = {
  style: "amekaji",
  pantsFit: "wide_pants",
  taste: "classic",
  sportOrigin: "running",
  cut: "low",
  wearingStyle: "loose_fit",
  materialAging: "suede_fading_nap",
  color: "earth_tone",
  budget: "premium_ok",
  techTolerance: "heritage_tech_ok",
  ryoStrength: "ryo_mode",
};

describe("Ryo model affinity and absolute role eligibility", () => {
  it("classifies every in-repository anchor with a complete affinity profile", () => {
    const audit = getRyoModeAnchorAffinityAudit();
    expect(audit.length).toBeGreaterThanOrEqual(50);
    for (const item of audit) {
      expect(item.profile.reasonForTier).not.toBe("");
      expect(item.profile.historicalContext.length).toBeGreaterThan(0);
      expect(item.profile.materialCharacter.length).toBeGreaterThan(0);
      expect(item.profile.wardrobeMatches.length).toBeGreaterThan(0);
      expect(item.profile.disqualifyingConditions.length).toBeGreaterThan(0);
    }
    const tiers = countBy(audit.map((item) => item.profile.affinityTier));
    expect(tiers.core).toBeGreaterThan(0);
    expect(tiers.adjacent).toBeGreaterThan(0);
    expect(tiers.situational).toBeGreaterThan(0);
    expect(tiers.practical).toBeGreaterThan(0);
    expect(tiers.excluded).toBeGreaterThan(0);
  });

  it("covers all 49 curated seeds and all fallback candidates through the same family policy", () => {
    expect(ryoModeSeed.curatedRecommendationModels).toHaveLength(49);
    for (const item of ryoModeSeed.curatedRecommendationModels) {
      const profile = getRyoModelAffinityProfile({
        name: item.rawName,
        tags: [],
        ...(item.modelFamily ? { modelType: item.modelFamily } : {}),
      });
      expect(profile.reasonForTier).not.toBe("");
      expect(profile.promotionConditions).toBeDefined();
    }
    for (const item of sneakerFallbackCatalog) {
      const profile = getRyoModelAffinityProfile({
        name: item.modelName,
        tags: item.tags,
        modelType: item.modelType,
      });
      expect(profile.reasonForTier).not.toBe("");
    }
  });

  it("keeps New Balance heritage runners adjacent instead of blacklisting the brand", () => {
    for (const model of ["New Balance 991", "New Balance 998", "New Balance 1500", "New Balance 990v3", "New Balance 990v4"]) {
      expect(getRyoModelAffinityProfile(candidate(model, 42_000)).affinityTier).toBe("adjacent");
    }
    expect(getRyoModelAffinityProfile(candidate("New Balance 2002R", 18_000)).affinityTier).toBe("practical");
    expect(getRyoModelAffinityProfile(candidate("New Balance 1906", 19_000)).affinityTier).toBe("excluded");
  });

  it("NB 991 Case A: rejects weak retro-running context for an amekaji first pair", () => {
    const eligibility = eligibilityFor({
      style: "amekaji",
      pantsFit: "denim",
      taste: "classic",
      sportOrigin: "no_sport",
      cut: "low",
      wearingStyle: "tied_silhouette",
      materialAging: "leather_sinking",
      color: "black_white",
      budget: "premium_ok",
      techTolerance: "avoid_tech",
      ryoStrength: "ryo_mode",
    }, { purchasePurpose: "first_pair", ownedModels: [], dislikedModels: [], dislikedSignals: [] });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.categoryGate.passed).toBe(false);
    expect(eligibility.hardFailures.map((reason) => reason.code)).toContain("category_gate_failed");
  });

  it("NB 991 Case B: allows promotion when running, comfort, material, pants, purpose and budget align", () => {
    const eligibility = eligibilityFor(retroRunningAnswers, {
      purchasePurpose: "second_pair",
      ownedModels: [],
      dislikedModels: [],
      dislikedSignals: [],
    });

    expect(eligibility.eligible).toBe(true);
    expect(eligibility.affinityTier).toBe("adjacent");
    expect(eligibility.categoryGate.matchedEvidence).toEqual(expect.arrayContaining([
      "レトロランニングへの関心",
      "履き心地とヘリテージ技術",
      "スエード／メッシュの質感",
      "太いデニム／軍パン系との相性",
      "二足目またはローテーション用途",
      "予算適合",
    ]));
  });

  it("NB 991 Case C: rejects an otherwise strong profile when the budget is insufficient", () => {
    const eligibility = eligibilityFor({ ...retroRunningAnswers, budget: "under_15000" }, {
      purchasePurpose: "second_pair",
      ownedModels: [],
      dislikedModels: [],
      dislikedSignals: [],
    });
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.hardFailures.map((reason) => reason.code)).toContain("budget_violation");
  });

  it("NB 991 Case D: never repeats an owned NB 991", () => {
    const eligibility = eligibilityFor(retroRunningAnswers, {
      purchasePurpose: "second_pair",
      ownedModels: ["New Balance 991"],
      dislikedModels: [],
      dislikedSignals: [],
    });
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.hardFailures.map((reason) => reason.code)).toContain("owned_duplicate");
  });

  it("NB 991 Case E: never displays a disliked NB 991", () => {
    const eligibility = eligibilityFor(retroRunningAnswers, {
      purchasePurpose: "second_pair",
      ownedModels: [],
      dislikedModels: ["New Balance 991"],
      dislikedSignals: [],
    });
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.hardFailures.map((reason) => reason.code)).toContain("disliked_model");
  });
});

describe("recommendation display set coherence", () => {
  it("keeps an eligible contextual category change coherent", () => {
    const eligibility = eligibilityFor(retroRunningAnswers, {
      purchasePurpose: "second_pair",
      ownedModels: [],
      dislikedModels: [],
      dislikedSignals: [],
    });
    const result = evaluateRecommendationSetCoherence({
      primary: coherenceEntry(candidate("Vans Authentic Black/White", 8_000), coreEligibility("core", "skate")),
      practicalAlternative: coherenceEntry(candidate("Nike Air Force 1 Low", 18_000), coreEligibility("adjacent", "basketball_classic")),
      ryoAlternative: coherenceEntry(candidate("New Balance 991", 42_000), eligibility),
      userContext: { purchasePurpose: "second_pair", ownedModels: [], dislikedModels: [], dislikedSignals: [] },
    });
    expect(result.coherent).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("detects a forced adjacent promotion and unexplained category jump in a broken fixture", () => {
    const eligibility = {
      ...eligibilityFor(retroRunningAnswers, {
        purchasePurpose: "second_pair",
        ownedModels: [],
        dislikedModels: [],
        dislikedSignals: [],
      }),
      categoryGate: {
        category: "retro_running" as const,
        passed: false,
        matchedEvidence: ["予算適合"],
        missingEvidence: ["レトロランニングへの関心"],
        score: 20,
        requiredMatches: 4,
        categoryInterest: false,
      },
    };
    const result = evaluateRecommendationSetCoherence({
      primary: coherenceEntry(candidate("Vans Authentic Black/White", 8_000), coreEligibility("core", "skate")),
      practicalAlternative: coherenceEntry(candidate("Nike Air Force 1 Low", 18_000), coreEligibility("adjacent", "basketball_classic")),
      ryoAlternative: coherenceEntry(candidate("New Balance 991", 42_000), eligibility),
    });
    expect(result.coherent).toBe(false);
    expect(result.violations.map((violation) => violation.code)).toEqual(expect.arrayContaining([
      "adjacent_overpromotion",
      "unexplained_category_jump",
    ]));
  });

  it("detects model-family duplication instead of rewarding arbitrary diversity", () => {
    const result = evaluateRecommendationSetCoherence({
      primary: coherenceEntry(candidate("PUMA Suede Black/White", 13_000), coreEligibility("core", "basketball_classic")),
      practicalAlternative: coherenceEntry(candidate("PUMA Clyde Black/White", 15_000), coreEligibility("core", "basketball_classic")),
      ryoAlternative: null,
    });
    expect(result.coherent).toBe(false);
    expect(result.violations.map((violation) => violation.code)).toContain("duplicate_model_family");
  });
});

function eligibilityFor(
  answers: RyoModeAnswers,
  userContext: Parameters<typeof evaluateRyoRoleEligibility>[0]["userContext"],
): RyoRoleEligibility {
  const vector = buildRyoPreferenceVector(answers);
  return evaluateRyoRoleEligibility({
    candidate: candidate("New Balance 991", 42_000),
    vector,
    ...(userContext ? { userContext } : {}),
    preferenceSummary: summarizeRyoPreferenceVector(vector),
    scoreBreakdown: strongScores,
    explicitPreferencePenalty: 0,
  });
}

function candidate(name: string, priceYen: number): CandidateProfile {
  const running = /New Balance/u.test(name);
  const canvas = /Vans/u.test(name);
  const basketball = /PUMA|Air Force/u.test(name);
  return {
    id: name.toLocaleLowerCase("en-US").replace(/\W+/gu, "-"),
    name,
    source: "local",
    description: "test",
    tags: [
      ...(running ? ["running", "comfortable", "premium", "heritage"] as const : []),
      ...(canvas ? ["classic", "canvas", "low_tech", "street"] as const : []),
      ...(basketball ? ["basketball", "classic", "street", "heritage"] as const : []),
    ],
    vector: { culture: 80, styleFit: 80, simplicity: 70, street: 70, volume: 60, comfort: 80, durability: 80, priceLevel: 60 },
    budgetFit: 90,
    risk: "low",
    informationCompleteness: 90,
    readiness: "ready_local",
    priceYen,
    researchSource: "ryo_anchor",
  };
}

function coherenceEntry(candidateValue: CandidateProfile, eligibility: RyoRoleEligibility) {
  return { candidate: candidateValue, scoreBreakdownV2: strongScores, ryoEligibility: eligibility };
}

function coreEligibility(
  affinityTier: RyoRoleEligibility["affinityTier"],
  category: RyoRoleEligibility["categoryGate"]["category"],
): RyoRoleEligibility {
  return {
    eligible: true,
    affinityTier,
    hardFailures: [],
    softWarnings: [],
    positiveReasons: [],
    contextMatchScore: 80,
    wardrobeMatchScore: 80,
    purposeMatchScore: 80,
    cultureMatchScore: 80,
    materialMatchScore: 80,
    categoryGate: {
      category,
      passed: true,
      matchedEvidence: ["fixture"],
      missingEvidence: [],
      score: 80,
      requiredMatches: 1,
      categoryInterest: true,
    },
  };
}

function countBy(values: readonly string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
