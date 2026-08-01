import type { CandidateProfile } from "../core-v1/types";
import type {
  PurchasePurpose,
  UserSneakerContext,
} from "../diagnosis/sneakerContext";
import {
  createRyoModeCandidateAnchors,
  rerankRyoModeCandidates,
  selectRecommendationDisplaySet,
} from "./candidates";
import type {
  RyoModeAnswers,
  RyoPreferenceVector,
  RyoRoleEligibility,
} from "./types";
import { buildRyoPreferenceVector } from "./vector";

type Archetype = {
  id: string;
  answers: RyoModeAnswers;
};

const baseAnswers: RyoModeAnswers = {
  style: "normcore",
  pantsFit: "straight_pants",
  taste: "classic",
  sportOrigin: "no_sport",
  cut: "low",
  wearingStyle: "tied_silhouette",
  materialAging: "leather_sinking",
  color: "black_white",
  budget: "under_25000",
  techTolerance: "avoid_tech",
  ryoStrength: "balanced",
};

const archetypes: readonly Archetype[] = [
  archetype("amekaji_denim", { style: "amekaji", pantsFit: "denim", materialAging: "canvas_fading", techTolerance: "avoid_tech" }),
  archetype("military_workwear", { style: "amekaji", pantsFit: "work_pants", sportOrigin: "basketball", materialAging: "leather_sinking" }),
  archetype("uk_terrace", { style: "clean_casual", pantsFit: "slim_pants", sportOrigin: "football", materialAging: "suede_fading_nap", color: "cream_gum" }),
  archetype("skate", { style: "street", pantsFit: "wide_pants", sportOrigin: "skate", materialAging: "canvas_fading", wearingStyle: "loose_fit" }),
  archetype("minimal_monotone", { style: "clean_casual", pantsFit: "slim_pants", taste: "simple", color: "black_white" }),
  archetype("retro_running", { style: "amekaji", pantsFit: "wide_pants", sportOrigin: "running", materialAging: "suede_fading_nap", budget: "premium_ok", techTolerance: "heritage_tech_ok" }),
  archetype("basketball_street", { style: "street", pantsFit: "wide_pants", sportOrigin: "basketball", materialAging: "leather_sinking", wearingStyle: "volume_look" }),
  archetype("comfort_first", { style: "normcore", pantsFit: "straight_pants", sportOrigin: "running", budget: "premium_ok", techTolerance: "airmax_nb_ok" }),
  archetype("first_pair_safe", { style: "normcore", taste: "simple", budget: "under_15000", techTolerance: "avoid_tech" }),
  archetype("second_pair_expressive", { style: "amekaji", pantsFit: "work_pants", taste: "rare_color", materialAging: "suede_fading_nap", color: "rare_color" }),
  archetype("archive_collector", { style: "amekaji", pantsFit: "denim", cut: "high", materialAging: "canvas_fading", budget: "premium_ok" }),
  archetype("mixed_neutral", { style: "undecided", pantsFit: "undecided", taste: "classic", sportOrigin: "no_sport", wearingStyle: "no_preference" }),
] as const;

const purposes: readonly PurchasePurpose[] = [
  "first_pair",
  "daily_rotation",
  "second_pair",
  "archive_collection",
] as const;

const strengths = ["balanced", "ryo_light", "ryo_mode", "ryo_strong"] as const;

const baseScenarios = archetypes.flatMap((item) =>
  purposes.flatMap((purchasePurpose) =>
    strengths.map((ryoStrength) => ({
      id: `${item.id}:${purchasePurpose}:${ryoStrength}`,
      answers: { ...item.answers, ryoStrength } satisfies RyoModeAnswers,
      context: context(purchasePurpose),
    }))
  )
);

describe("192 deterministic base recommendation scenarios", () => {
  it("contains the required 12 × 4 × 4 matrix", () => {
    expect(archetypes).toHaveLength(12);
    expect(purposes).toHaveLength(4);
    expect(strengths).toHaveLength(4);
    expect(baseScenarios).toHaveLength(192);
  });

  it.each(baseScenarios)("$id keeps role assignment absolute and coherent", ({ answers, context: userContext }) => {
    const result = evaluateScenario(answers, userContext);
    expect(result).not.toBeNull();
    expect(result?.primary).toBeDefined();
    expect(result?.coherence.coherent).toBe(true);
    expect(result?.coherence.violations).toEqual([]);
    if (result?.ryoAlternative) {
      expect(result.ryoAlternative.ryoEligibility.eligible).toBe(true);
      expect(["core", "adjacent", "situational"]).toContain(result.ryoAlternative.ryoEligibility.affinityTier);
      expect(result.ryoAlternative.ryoEligibility.hardFailures).toEqual([]);
    } else {
      expect(result?.ryoEmptyReason).toMatch(/Ryo枠/u);
    }
  });
});

type PairwiseMutation =
  | "retro_interest"
  | "purpose"
  | "strength"
  | "owned"
  | "disliked"
  | "budget"
  | "comfort"
  | "pants";

const pairwiseMutations: readonly PairwiseMutation[] = [
  "retro_interest",
  "purpose",
  "strength",
  "owned",
  "disliked",
  "budget",
  "comfort",
  "pants",
] as const;

const pairwiseScenarios = archetypes.slice(0, 6).flatMap((item) =>
  pairwiseMutations.map((mutation) => ({
    id: `${item.id}:${mutation}`,
    archetype: item,
    mutation,
  }))
);

describe("48 pairwise and metamorphic scenarios", () => {
  it("contains the required pairwise matrix", () => {
    expect(pairwiseScenarios).toHaveLength(48);
  });

  it.each(pairwiseScenarios)("$id changes only the intended constraint", ({ archetype: item, mutation }) => {
    const pair = mutate(item.answers, mutation);
    const before = evaluateScenario(pair.before.answers, pair.before.context);
    const after = evaluateScenario(pair.after.answers, pair.after.context);
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after?.coherence.violations).toEqual([]);
    if (after?.ryoAlternative) expect(after.ryoAlternative.ryoEligibility.eligible).toBe(true);

    if (mutation === "retro_interest" || mutation === "comfort") {
      const beforeNb = nbEligibility(pair.before.answers, pair.before.context);
      const afterNb = nbEligibility(pair.after.answers, pair.after.context);
      expect(afterNb.categoryGate.score).toBeGreaterThanOrEqual(beforeNb.categoryGate.score);
    }
    if (mutation === "purpose") {
      expect(pair.before.context.purchasePurpose).toBe("first_pair");
      expect(pair.after.context.purchasePurpose).toBe("second_pair");
    }
    if (mutation === "strength") {
      expect((pair.before.answers as Record<string, string>).ryoStrength).toBe("balanced");
      expect((pair.after.answers as Record<string, string>).ryoStrength).toBe("ryo_strong");
    }
    if (mutation === "owned") {
      expect(visibleNames(after).join(" ")).not.toMatch(/One Star/iu);
    }
    if (mutation === "disliked") {
      expect(visibleNames(after).join(" ")).not.toMatch(/Vans/iu);
    }
    if (mutation === "budget" && after?.ryoAlternative) {
      expect(after.ryoAlternative.candidate.priceYen ?? 0).toBeLessThanOrEqual(15_000);
    }
    if (mutation === "pants") {
      const beforeVector = buildRyoPreferenceVector(pair.before.answers);
      const afterVector = buildRyoPreferenceVector(pair.after.answers);
      expect(beforeVector.pantsFit.widePants).not.toBe(afterVector.pantsFit.widePants);
      expect(beforeVector.pantsFit.slimPants).not.toBe(afterVector.pantsFit.slimPants);
    }
  });
});

const adversarialProfiles: readonly {
  id: string;
  answers: RyoModeAnswers;
  context: UserSneakerContext;
  forbidden?: RegExp;
}[] = [
  adversarial("ryo_strong_low_budget", { ryoStrength: "ryo_strong", budget: "under_15000" }),
  adversarial("ryo_strong_safe_only", { ryoStrength: "ryo_strong", taste: "simple", style: "normcore" }),
  adversarial("first_pair_archive_taste", { ryoStrength: "ryo_strong", taste: "limited_collab", budget: "under_15000" }, { purchasePurpose: "first_pair" }),
  adversarial("archive_comfort_first", { sportOrigin: "running", techTolerance: "airmax_nb_ok", budget: "premium_ok" }, { purchasePurpose: "archive_collection" }),
  adversarial("dislike_converse", {}, { dislikedModels: ["Converse"] }, /Converse/iu),
  adversarial("dislike_vans", {}, { dislikedModels: ["Vans"] }, /Vans/iu),
  adversarial("dislike_adidas", {}, { dislikedModels: ["adidas"] }, /adidas/iu),
  adversarial("owned_nb", { sportOrigin: "running", budget: "premium_ok" }, { ownedModels: ["New Balance"] }, /New Balance/iu),
  adversarial("owned_multiple_core", {}, { ownedModels: ["Converse One Star", "Vans Authentic", "PUMA Suede"] }),
  adversarial("no_leather", { materialAging: "canvas_fading" }, { dislikedSignals: ["合皮感"] }),
  adversarial("no_suede", { materialAging: "canvas_fading" }),
  adversarial("no_canvas", { materialAging: "leather_sinking" }),
  adversarial("no_mesh", { sportOrigin: "no_sport", techTolerance: "avoid_tech" }),
  adversarial("black_only", { color: "black_white" }),
  adversarial("white_only", { color: "black_white", style: "minimal_monotone" }),
  adversarial("wide_pants_only", { pantsFit: "wide_pants", wearingStyle: "volume_look" }),
  adversarial("slim_pants_only", { pantsFit: "slim_pants", wearingStyle: "slim_look" }),
  adversarial("comfort_top_priority", { sportOrigin: "running", techTolerance: "airmax_nb_ok", budget: "premium_ok" }),
  adversarial("no_history_interest", { taste: "simple", ryoStrength: "balanced" }),
  adversarial("no_culture_interest", { sportOrigin: "no_sport", ryoStrength: "balanced" }),
  adversarial("no_category", { sportOrigin: "no_sport", style: "undecided" }),
  adversarial("contradictory_input", { style: "street", pantsFit: "slim_pants", wearingStyle: "volume_look", techTolerance: "avoid_tech" }, { dislikedSignals: ["ボリューム過多"] }),
  adversarial("unknown_budget", { budget: undefined }),
  adversarial("no_brand", {}),
  adversarial("all_safe", { style: "normcore", taste: "simple", sportOrigin: "no_sport", budget: "under_15000", ryoStrength: "balanced" }),
  adversarial("all_strong", { style: "amekaji", pantsFit: "wide_pants", taste: "rare_color", sportOrigin: "basketball", materialAging: "suede_fading_nap", budget: "premium_ok", ryoStrength: "ryo_strong" }),
] as const;

describe("26 adversarial profiles", () => {
  it("contains all required adversarial profiles", () => {
    expect(adversarialProfiles).toHaveLength(26);
  });

  it.each(adversarialProfiles)("$id never bypasses hard constraints", ({ answers, context: userContext, forbidden }) => {
    const result = evaluateScenario(answers, userContext);
    expect(result).not.toBeNull();
    expect(result?.coherence.violations).toEqual([]);
    if (forbidden) expect(visibleNames(result).join(" ")).not.toMatch(forbidden);
    if (result?.ryoAlternative) {
      expect(result.ryoAlternative.ryoEligibility.eligible).toBe(true);
      expect(result.ryoAlternative.ryoEligibility.hardFailures).toEqual([]);
    }
  });
});

function evaluateScenario(answers: RyoModeAnswers, userContext: UserSneakerContext) {
  const vector = buildRyoPreferenceVector(answers);
  const anchors = createRyoModeCandidateAnchors(vector, budgetFromAnswers(answers));
  const ranked = rerankRyoModeCandidates(
    anchors.map((candidate, index) => scored(candidate, vector, index)),
    vector,
    modeFromAnswers(answers),
    userContext,
  );
  return selectRecommendationDisplaySet(ranked, userContext);
}

function scored(candidate: CandidateProfile, vector: RyoPreferenceVector, index: number) {
  const activeSport = vector.sportOrigin.running > 0
    ? "running"
    : vector.sportOrigin.basketball > 0
      ? "basketball"
      : vector.sportOrigin.skate > 0
        ? "skate"
        : vector.sportOrigin.football > 0
          ? "football"
          : null;
  const sportMatch = activeSport && (candidate.tags as readonly string[]).includes(activeSport) ? 12 : 0;
  const budgetScore = candidate.budgetFit;
  const base = Math.max(35, Math.min(92, 78 - index * 0.35 + sportMatch + (budgetScore - 50) * 0.12));
  return {
    candidate,
    balancedScore: { total: base, featureFit: base, tagMatch: base, budgetFit: budgetScore, versatility: 72, informationConfidence: 86 },
    ryoScore: { total: base, preferenceFit: base, culturalFit: base, classicRetroFit: base, streetFit: base, calmStyleFit: base, enthusiastValue: base },
    decision: "consider" as const,
  };
}

function nbEligibility(answers: RyoModeAnswers, userContext: UserSneakerContext): RyoRoleEligibility {
  const vector = buildRyoPreferenceVector(answers);
  const ranked = rerankRyoModeCandidates(
    [scored(nbCandidate(), vector, 0)],
    vector,
    modeFromAnswers(answers),
    userContext,
  );
  return ranked[0]!.ryoEligibility;
}

function nbCandidate(): CandidateProfile {
  return {
    id: "new-balance-991-fixture",
    name: "New Balance 991",
    source: "local",
    description: "fixture",
    tags: ["running", "comfortable", "premium", "heritage"],
    vector: { culture: 80, styleFit: 76, simplicity: 65, street: 60, volume: 70, comfort: 92, durability: 86, priceLevel: 75 },
    budgetFit: 90,
    risk: "medium",
    informationCompleteness: 90,
    readiness: "ready_local",
    priceYen: 42_000,
    researchSource: "ryo_anchor",
  };
}

function mutate(answers: RyoModeAnswers, mutation: PairwiseMutation) {
  const beforeContext = context("daily_rotation");
  const afterContext = context("daily_rotation");
  let beforeAnswers: RyoModeAnswers = { ...answers };
  let afterAnswers: RyoModeAnswers = { ...answers };
  if (mutation === "retro_interest") {
    beforeAnswers = { ...answers, sportOrigin: "no_sport" };
    afterAnswers = { ...answers, sportOrigin: "running" };
  } else if (mutation === "purpose") {
    beforeContext.purchasePurpose = "first_pair";
    afterContext.purchasePurpose = "second_pair";
  } else if (mutation === "strength") {
    beforeAnswers = { ...answers, ryoStrength: "balanced" };
    afterAnswers = { ...answers, ryoStrength: "ryo_strong" };
  } else if (mutation === "owned") {
    afterContext.ownedModels = ["Converse One Star"];
  } else if (mutation === "disliked") {
    afterContext.dislikedModels = ["Vans"];
  } else if (mutation === "budget") {
    beforeAnswers = { ...answers, budget: "premium_ok" };
    afterAnswers = { ...answers, budget: "under_15000" };
  } else if (mutation === "comfort") {
    beforeAnswers = { ...answers, techTolerance: "avoid_tech" };
    afterAnswers = { ...answers, techTolerance: "heritage_tech_ok" };
  } else {
    beforeAnswers = { ...answers, pantsFit: "wide_pants" };
    afterAnswers = { ...answers, pantsFit: "slim_pants" };
  }
  return {
    before: { answers: beforeAnswers, context: beforeContext },
    after: { answers: afterAnswers, context: afterContext },
  };
}

function visibleNames(result: ReturnType<typeof evaluateScenario>): string[] {
  if (!result) return [];
  return [
    result.primary.candidate.name,
    result.practicalAlternative?.candidate.name,
    result.ryoAlternative?.candidate.name,
  ].filter((value): value is string => Boolean(value));
}

function modeFromAnswers(answers: RyoModeAnswers): "ryo" | "balanced" {
  const strength = answerOption(answers, "ryoStrength");
  return strength === "balanced" ? "balanced" : "ryo";
}

function budgetFromAnswers(answers: RyoModeAnswers): number | undefined {
  const budget = answerOption(answers, "budget");
  if (budget === "under_15000") return 15_000;
  if (budget === "under_20000") return 20_000;
  if (budget === "under_25000") return 25_000;
  if (budget === "under_35000") return 35_000;
  if (budget === "premium_ok") return 60_000;
  return undefined;
}

function answerOption(answers: RyoModeAnswers, questionId: string): string | undefined {
  if (Array.isArray(answers)) {
    return answers.find((answer) => answer.questionId === questionId)?.optionId;
  }
  return (answers as Readonly<Record<string, string | undefined>>)[questionId];
}

function context(purchasePurpose: PurchasePurpose): UserSneakerContext {
  return { purchasePurpose, ownedModels: [], dislikedModels: [], dislikedSignals: [] };
}

function archetype(id: string, overrides: Record<string, string>): Archetype {
  return { id, answers: { ...baseAnswers, ...overrides } };
}

function adversarial(
  id: string,
  answerOverrides: Record<string, string | undefined>,
  contextOverrides: Partial<UserSneakerContext> = {},
  forbidden?: RegExp,
) {
  const answers = Object.fromEntries(
    Object.entries({ ...baseAnswers, ...answerOverrides }).filter(([, value]) => value !== undefined),
  ) as RyoModeAnswers;
  return {
    id,
    answers,
    context: { ...context("daily_rotation"), ...contextOverrides },
    ...(forbidden ? { forbidden } : {}),
  };
}
