import type { CandidateProfile } from "../core-v1/types";
import { recommendCoreV1 } from "../core-v1/service";
import {
  buildRecommendationDisplayReasons,
  createRyoModeCandidateAnchors,
  getRerankingWeights,
  normalizeOfficialSneakerName,
  rerankRyoModeCandidates,
  selectRecommendationDisplaySet,
} from "./candidates";
import { buildRyoModeCandidateEvaluation } from "./integration";
import type { RyoModeAnswers } from "./types";
import { buildRyoPreferenceVector, summarizeRyoPreferenceVector } from "./vector";

const strongAnswers = {
  style: "amekaji",
  pantsFit: "work_pants",
  taste: "classic",
  sportOrigin: "basketball",
  cut: "low",
  wearingStyle: "tied_silhouette",
  materialAging: "leather_sinking",
  color: "black_white",
  budget: "under_25000",
  techTolerance: "avoid_tech",
  ryoStrength: "ryo_strong",
} as const;

const highBasketballLeatherAnswers = {
  style: "amekaji",
  pantsFit: "denim",
  taste: "classic",
  sportOrigin: "basketball",
  cut: "high",
  wearingStyle: "volume_look",
  materialAging: "leather_sinking",
  color: "black_white",
  budget: "under_20000",
  techTolerance: "heritage_tech_ok",
  ryoStrength: "ryo_mode",
} as const;

const screenshotRegressionAnswers = {
  style: "amekaji",
  pantsFit: "wide_pants",
  taste: "classic",
  sportOrigin: "basketball",
  cut: "high",
  wearingStyle: "tied_silhouette",
  materialAging: "leather_sinking",
  color: "black_white",
  budget: "under_15000",
  techTolerance: "avoid_tech",
  ryoStrength: "balanced",
} as const;

describe("Ryo Mode v4 candidate pool and reranking", () => {
  it("selects a deterministic, unique display set without replacing ranked[0]", () => {
    const vector = buildRyoPreferenceVector(screenshotRegressionAnswers);
    const ranked = rerankRyoModeCandidates(
      createRyoModeCandidateAnchors(vector, 15_000)
        .map((value, index) => scored(value, Math.max(58, 88 - index))),
      vector,
      "balanced",
      {
        purchasePurpose: "daily_rotation",
        ownedModels: ["PUMA Suede"],
        dislikedModels: [],
        dislikedSignals: ["ハイテク"],
      },
    );
    const displaySet = selectRecommendationDisplaySet(ranked, {
      purchasePurpose: "daily_rotation",
      ownedModels: ["PUMA Suede"],
      dislikedModels: [],
      dislikedSignals: ["ハイテク"],
    });
    const repeated = selectRecommendationDisplaySet(ranked, {
      purchasePurpose: "daily_rotation",
      ownedModels: ["PUMA Suede"],
      dislikedModels: [],
      dislikedSignals: ["ハイテク"],
    });

    expect(displaySet?.primary.candidate.id).toBe(ranked[0]?.candidate.id);
    expect(repeated?.practicalAlternative?.candidate.id)
      .toBe(displaySet?.practicalAlternative?.candidate.id);
    expect(repeated?.ryoAlternative?.candidate.id)
      .toBe(displaySet?.ryoAlternative?.candidate.id);
    const visibleIds = [
      displaySet?.primary.candidate.id,
      displaySet?.practicalAlternative?.candidate.id,
      displaySet?.ryoAlternative?.candidate.id,
    ].filter(Boolean);
    expect(new Set(visibleIds).size).toBe(visibleIds.length);
    expect(displaySet?.practicalAlternative?.candidate.name).not.toContain("PUMA Suede");
  });

  it("turns internal signature adjustments into at most three user-facing reasons", () => {
    const vector = buildRyoPreferenceVector(strongAnswers);
    const ranked = rerankRyoModeCandidates(
      createRyoModeCandidateAnchors(vector, 25_000)
        .map((value, index) => scored(value, Math.max(60, 90 - index))),
      vector,
      "ryo",
    );
    const displaySet = selectRecommendationDisplaySet(ranked);
    const reasons = displaySet?.ryoAlternative
      ? buildRecommendationDisplayReasons(displaySet.ryoAlternative, "ryo")
      : [];

    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.length).toBeLessThanOrEqual(3);
    expect(reasons.join(" ")).not.toMatch(/Bonus|Penalty|bonus|penalty/);
  });

  it("generates the expected anchors for the strong work-pants answer", () => {
    const anchors = createRyoModeCandidateAnchors(buildRyoPreferenceVector(strongAnswers), 25_000);
    const names = anchors.map((candidate) => candidate.name);
    expect(names).toContain('Nike Air Force 1 Low "White/White"');
    expect(names).toContain("Converse Jack Purcell Leather Black");
    expect(names).toContain("Converse One Star J VTG Black");
    expect(names).toContain("PUMA Suede Black/White");
    expect(names).toContain("adidas Superstar Vintage");
    expect(names).toContain("Converse Pro Leather");
    expect(anchors.every((candidate) => candidate.researchSource === "ryo_anchor")).toBe(true);
  });

  it("keeps AF1 above off-axis Samba and CM996 but below the amekaji core anchors", () => {
    const vector = buildRyoPreferenceVector(strongAnswers);
    const af1 = buildRyoModeCandidateEvaluation(vector, candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]));
    const samba = buildRyoModeCandidateEvaluation(vector, candidate("adidas Samba OG", ["classic", "low_tech", "heritage"]));
    const cm996 = buildRyoModeCandidateEvaluation(vector, candidate("New Balance cm996", ["running", "comfortable", "retro"]));
    const amekajiCore = [
      candidate("Converse One Star J VTG Black", ["classic", "low_tech", "street", "heritage"]),
      candidate("PUMA Clyde Black/White", ["basketball", "classic", "low_tech", "heritage"]),
      candidate("adidas Superstar Vintage", ["basketball", "classic", "low_tech", "heritage"]),
      candidate("Converse Pro Leather", ["basketball", "classic", "low_tech", "heritage"]),
      candidate("Nike Blazer Mid '77", ["basketball", "classic", "street", "heritage"]),
      candidate("Nike Terminator Low Black/White", ["basketball", "classic", "street", "heritage"]),
      candidate("Vans Half Cab Black", ["classic", "low_tech", "street", "heritage"]),
    ].map((value) => buildRyoModeCandidateEvaluation(vector, value));
    expect(af1.score.recommendationScore).toBeGreaterThan(samba.score.recommendationScore);
    expect(af1.score.recommendationScore).toBeGreaterThan(cm996.score.recommendationScore);
    expect(amekajiCore.filter((evaluation) => evaluation.score.recommendationScore > af1.score.recommendationScore).length).toBeGreaterThanOrEqual(5);
    expect(af1.opinion.caution).toContain("汎用白レザーの条件付き候補");
    expect(samba.opinion.caution).toContain("中心から少し外れます");
    expect(cm996.features.displayNameOfficial).toBe("New Balance CM996");
  });

  it("keeps AF1 strong for normcore and beginner white-leather context", () => {
    const vector = buildRyoPreferenceVector({
      ...strongAnswers,
      style: "normcore",
      pantsFit: "straight_pants",
      taste: "simple",
      ryoStrength: "beginner_ryo",
    });
    const af1 = buildRyoModeCandidateEvaluation(vector, candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]));
    const oneStar = buildRyoModeCandidateEvaluation(vector, candidate("Converse One Star J VTG Black", ["classic", "low_tech", "street", "heritage"]));
    expect(af1.score.recommendationScore).toBeGreaterThan(oneStar.score.recommendationScore);
    expect(af1.score.penalties).not.toContain(expect.stringContaining("conditional staple"));
  });

  it("uses strength-specific weights and lets recommendationScore control strong reranking", () => {
    const strongVector = buildRyoPreferenceVector(strongAnswers);
    const balancedVector = buildRyoPreferenceVector({
      ...strongAnswers,
      style: "normcore",
      pantsFit: "straight_pants",
      taste: "simple",
      sportOrigin: "no_sport",
      cut: "low",
      ryoStrength: "balanced",
    });
    expect(getRerankingWeights(summarizeRyoPreferenceVector(strongVector))).toEqual({ existingCoreWeight: 0.3, recommendationWeight: 0.7 });
    expect(getRerankingWeights(summarizeRyoPreferenceVector(balancedVector))).toEqual({ existingCoreWeight: 0.45, recommendationWeight: 0.55 });

    const af1 = scored(candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]), 92);
    const oneStar = scored(candidate("Converse One Star J VTG Black", ["classic", "low_tech", "street", "heritage"]), 82);
    const cm996 = scored(candidate("New Balance CM996", ["running", "comfortable", "retro"]), 82);
    expect(rerankRyoModeCandidates([af1, oneStar], strongVector, "ryo")[0]?.candidate.name).toBe("Converse One Star J VTG Black");
    expect(rerankRyoModeCandidates([af1, cm996], balancedVector, "balanced")[0]?.candidate.name).toBe('Nike Air Force 1 Low "White/White"');
  });

  it("guards the exact screenshot regression in the fallback path", async () => {
    const result = await recommendCoreV1({
      diagnosisAnswers: [],
      preferenceTags: ["classic", "basketball", "heritage", "low_tech"],
      mode: "balanced",
      budgetYen: 15_000,
      ryoModeAnswers: screenshotRegressionAnswers,
    }, {
      env: {},
      rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }),
    });

    expect(result.candidateResearch.source).toBe("fallback_catalog");
    expect(result.ryoReranking).toMatchObject({
      applied: true,
      strength: "balanced",
      existingCoreWeight: 0.45,
      recommendationWeight: 0.55,
    });
    expect(result.candidate.name).not.toBe('Nike Air Force 1 Low "White/White"');
    expect(result.candidate.name).toMatch(/All Star J|Pro Leather|Weapon|Terminator High|Blazer Mid|Air Jordan 1 High/i);
    expect(result.candidate.description).not.toMatch(/アメカジの主軸ではなく/i);
    expect(result.ryoReranking.selectedExplicitPreferenceReasons.join(" ")).not.toMatch(/Low専用|White \/ White配色/i);
  });

  it("prevents a Low-only core favorite from beating a reasonable High or Mid candidate", () => {
    const vector = buildRyoPreferenceVector(screenshotRegressionAnswers);
    const af1 = scored(candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]), 99);
    const blazer = scored(candidate("Nike Blazer Mid '77 Black/White", ["basketball", "classic", "street", "heritage"]), 65);
    const ranked = rerankRyoModeCandidates([af1, blazer], vector, "balanced");

    expect(ranked[0]?.candidate.name).toBe("Nike Blazer Mid '77 Black/White");
    expect(ranked.find((entry) => entry.candidate.name.includes("Air Force"))?.explicitPreferenceReasons).toEqual(expect.arrayContaining([
      "High指定に対してLow専用モデル",
      "Black / White指定に対してWhite / White配色",
    ]));
  });

  it("treats White/White as weaker than an otherwise close Black/White match", () => {
    const vector = buildRyoPreferenceVector({
      style: "normcore",
      pantsFit: "straight_pants",
      taste: "simple",
      sportOrigin: "basketball",
      cut: "low",
      wearingStyle: "tied_silhouette",
      materialAging: "leather_sinking",
      color: "black_white",
      budget: "under_20000",
      techTolerance: "avoid_tech",
      ryoStrength: "balanced",
    });
    const white = scored(candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]), 90);
    const black = scored(candidate("Nike Air Force 1 Low Black/White", ["basketball", "classic", "street", "durable"]), 84);
    const ranked = rerankRyoModeCandidates([white, black], vector, "balanced");

    expect(ranked[0]?.candidate.name).toBe("Nike Air Force 1 Low Black/White");
    expect(ranked[1]?.explicitPreferenceReasons).toContain("Black / White指定に対してWhite / White配色");
  });

  it("integrates fallback and anchors without treating an anchor as Gemini research", async () => {
    const result = await recommendCoreV1({
      diagnosisAnswers: [{ questionId: "trusted-classic", value: "like" }],
      preferenceTags: ["classic", "basketball", "low_tech"],
      mode: "ryo",
      budgetYen: 25_000,
      ryoModeAnswers: strongAnswers,
    }, {
      env: {},
      rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }),
    });
    expect(result.ryoReranking).toMatchObject({ applied: true, strength: "strong", existingCoreWeight: 0.3, recommendationWeight: 0.7 });
    expect(result.ryoReranking.candidatePoolSize).toBeGreaterThan(10);
    expect(result.candidate.name).not.toMatch(/Samba|CM996/i);
    expect(result.candidate.name).not.toBe('Nike Air Force 1 Low "White/White"');
    expect(result.candidate.name).toMatch(/One Star|Jack Purcell|PUMA|Superstar|Pro Leather|Blazer|Terminator|Vans|Reebok/i);
    expect(result.candidate.researchSource).toBe("ryo_anchor");
    expect(result.candidateResearch.source).toBe("fallback_catalog");
    expect(result.readiness.geminiResearch.status).toBe("fallback");
    expect(result.candidate.evidenceUrls?.length).toBeGreaterThan(0);
  });

  it("ranks high basketball leather classics above low canvas skate models", async () => {
    const ranked = rankAnchors(highBasketballLeatherAnswers, 20_000);
    const vansRank = rankOf(ranked, /Vans Authentic/i);
    expect(vansRank).toBeGreaterThan(0);
    expect(countAbove(ranked, vansRank, /Pro Leather|Weapon|Air Jordan 1 High|Terminator High|Blazer Mid|All Star J/i)).toBeGreaterThanOrEqual(3);

    const result = await recommendCoreV1({
      diagnosisAnswers: [],
      preferenceTags: ["classic", "basketball", "heritage"],
      mode: "ryo",
      budgetYen: 20_000,
      ryoModeAnswers: highBasketballLeatherAnswers,
    }, {
      env: {},
      rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }),
    });
    expect(result.candidate.name).not.toMatch(/Vans Authentic/i);
    expect(result.candidate.name).toMatch(/Pro Leather|Weapon|Air Jordan 1 High|Terminator High|Blazer Mid|All Star J/i);
  });

  it("keeps All Star J Hi strong for high amekaji denim with canvas aging", () => {
    const ranked = rankAnchors({
      style: "amekaji",
      pantsFit: "denim",
      taste: "classic",
      sportOrigin: "no_sport",
      cut: "high",
      wearingStyle: "volume_look",
      materialAging: "canvas_fading",
      color: "black_white",
      budget: "under_20000",
      techTolerance: "heritage_tech_ok",
      ryoStrength: "ryo_mode",
    }, 20_000);
    const strongestAllStar = highestScore(ranked, /All Star J|TimeLine|Addict Chuck Taylor/i);
    const strongestVans = highestScore(ranked, /Vans Authentic|Vans Era/i);
    expect(strongestAllStar).toBeGreaterThanOrEqual(75);
    expect(strongestAllStar).toBeGreaterThan(strongestVans);
  });

  it("preserves Vans strength for low skate canvas aging answers", () => {
    const ranked = rankAnchors({
      style: "street",
      pantsFit: "straight_pants",
      taste: "simple",
      sportOrigin: "skate",
      cut: "low",
      wearingStyle: "loose_fit",
      materialAging: "canvas_fading",
      color: "black_white",
      budget: "under_15000",
      techTolerance: "avoid_tech",
      ryoStrength: "ryo_mode",
    }, 15_000);
    expect(ranked[0]?.candidate.name).toMatch(/Vans Authentic/i);
    expect(highestScore(ranked, /Vans Authentic|Vans Era|Vans Half Cab/i)).toBeGreaterThanOrEqual(75);
  });

  it("does not leak terrace or Superstar context into premium running suede answers", async () => {
    const result = await recommendCoreV1({
      diagnosisAnswers: [{ questionId: "trusted-classic", value: "like" }],
      preferenceTags: ["classic", "running", "comfortable", "premium"],
      mode: "ryo",
      ryoModeAnswers: {
        style: "normcore",
        pantsFit: "wide_pants",
        taste: "muted_color",
        sportOrigin: "running",
        cut: "low",
        wearingStyle: "no_preference",
        materialAging: "suede_fading_nap",
        color: "earth_tone",
        budget: "premium_ok",
        techTolerance: "airmax_nb_ok",
        ryoStrength: "balanced",
      },
    }, {
      env: {},
      rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }),
    });

    expect(result.candidate.name).toMatch(/New Balance (991|998|990v3|990v4|1500)|Nike Cortez/i);
    expect(result.candidate.name).not.toMatch(/Superstar|Tobacco|Hamburg|London|Spezial/i);
    expect(result.candidate.ryoMetadata?.parentModelIds).not.toContain("adidas_archive");
    expect([
      ...result.explanation.reasons,
      ...(result.candidate.ryoMetadata?.cultureSignals ?? []),
      result.candidate.ryoMetadata?.genre ?? "",
    ].join(" ")).not.toMatch(/Samba|Tobacco|football terrace|City Series/i);
  });

  it("keeps leather-aging explanations off canvas-primary Vans and All Star J", () => {
    const vector = buildRyoPreferenceVector(highBasketballLeatherAnswers);
    const anchors = createRyoModeCandidateAnchors(vector, 20_000);
    const vans = evaluateAnchor(anchors, vector, /Vans Authentic/i);
    const allStar = evaluateAnchor(anchors, vector, /All Star J Hi$/i);
    const proLeather = evaluateAnchor(anchors, vector, /Pro Leather/i);

    expect(vans.score.matchedSignals.join(" ")).not.toMatch(/革の沈み|革のシワ|leather aging/i);
    expect(allStar.score.matchedSignals.join(" ")).not.toMatch(/革の沈み|革のシワ|leather aging/i);
    expect(proLeather.score.matchedSignals.join(" ")).toMatch(/革のシワ|leather/i);

    const canvasVector = buildRyoPreferenceVector({ ...highBasketballLeatherAnswers, sportOrigin: "no_sport", materialAging: "canvas_fading" });
    const canvasAnchors = createRyoModeCandidateAnchors(canvasVector, 20_000);
    const canvasAllStar = evaluateAnchor(canvasAnchors, canvasVector, /All Star J Hi$/i);
    expect(canvasAllStar.score.matchedSignals.join(" ")).toMatch(/Hiカット|デニム|キャンバス|日本製|VTG|TimeLine|Addict/);
  });

  it("does not force All Star J Hi to first place for low leather amekaji denim", () => {
    const ranked = rankAnchors({
      style: "amekaji",
      pantsFit: "denim",
      taste: "classic",
      sportOrigin: "no_sport",
      cut: "low",
      wearingStyle: "tied_silhouette",
      materialAging: "leather_sinking",
      color: "black_white",
      budget: "under_20000",
      techTolerance: "heritage_tech_ok",
      ryoStrength: "ryo_mode",
    }, 20_000);
    expect(ranked[0]?.candidate.name).not.toMatch(/All Star J Hi/i);
    expect(countAbove(ranked, rankOf(ranked, /All Star J Hi$/i), /One Star Leather|Jack Purcell Leather|Pro Leather/i)).toBeGreaterThanOrEqual(1);
  });
});

describe("official name normalization", () => {
  it.each([
    ["New Balance cm996", "New Balance CM996"],
    ["adidas samba og", "adidas Samba OG"],
    ["nike air force 1 low white/white", 'Nike Air Force 1 Low "White/White"'],
    ["converse one star", "Converse One Star"],
    ["puma suede", "PUMA Suede"],
    ["puma clyde", "PUMA Clyde"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeOfficialSneakerName(input)).toBe(expected);
  });
});

function candidate(name: string, tags: CandidateProfile["tags"]): CandidateProfile {
  return {
    id: name,
    name,
    source: "local",
    description: "test candidate",
    tags,
    vector: { culture: 82, styleFit: 80, simplicity: 76, street: 80, volume: 60, comfort: 72, durability: 82, priceLevel: 50 },
    budgetFit: 90,
    risk: "low",
    informationCompleteness: 88,
    readiness: "ready_local",
    priceYen: 18_000,
    researchSource: "fallback_catalog",
  };
}

function scored(value: CandidateProfile, coreScore: number) {
  return {
    candidate: value,
    balancedScore: { total: coreScore, featureFit: coreScore, tagMatch: coreScore, budgetFit: 90, versatility: coreScore, informationConfidence: 90 },
    ryoScore: { total: coreScore, preferenceFit: coreScore, culturalFit: coreScore, classicRetroFit: coreScore, streetFit: coreScore, calmStyleFit: coreScore, enthusiastValue: coreScore },
    decision: "consider" as const,
  };
}

type RankedAnchor = {
  candidate: CandidateProfile;
  evaluation: ReturnType<typeof buildRyoModeCandidateEvaluation>;
};

function rankAnchors(answers: RyoModeAnswers, budgetYen: number): RankedAnchor[] {
  const vector = buildRyoPreferenceVector(answers);
  return createRyoModeCandidateAnchors(vector, budgetYen)
    .map((candidate) => ({ candidate, evaluation: buildRyoModeCandidateEvaluation(vector, candidate) }))
    .sort((left, right) => right.evaluation.score.recommendationScore - left.evaluation.score.recommendationScore);
}

function rankOf(ranked: readonly RankedAnchor[], pattern: RegExp): number {
  return ranked.findIndex((item) => pattern.test(item.candidate.name));
}

function countAbove(ranked: readonly RankedAnchor[], rank: number, pattern: RegExp): number {
  expect(rank).toBeGreaterThanOrEqual(0);
  return ranked.slice(0, rank).filter((item) => pattern.test(item.candidate.name)).length;
}

function highestScore(ranked: readonly RankedAnchor[], pattern: RegExp): number {
  return Math.max(...ranked.filter((item) => pattern.test(item.candidate.name)).map((item) => item.evaluation.score.recommendationScore));
}

function evaluateAnchor(
  anchors: readonly CandidateProfile[],
  vector: Parameters<typeof buildRyoModeCandidateEvaluation>[0],
  pattern: RegExp,
): ReturnType<typeof buildRyoModeCandidateEvaluation> {
  const candidate = anchors.find((item) => pattern.test(item.name));
  expect(candidate).toBeDefined();
  return buildRyoModeCandidateEvaluation(vector, candidate!);
}
