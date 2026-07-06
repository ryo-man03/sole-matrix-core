import type { CandidateProfile } from "../core-v1/types";
import { recommendCoreV1 } from "../core-v1/service";
import {
  createRyoModeCandidateAnchors,
  getRerankingWeights,
  normalizeOfficialSneakerName,
  rerankRyoModeCandidates,
} from "./candidates";
import { buildRyoModeCandidateEvaluation } from "./integration";
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

describe("Ryo Mode v4 candidate pool and reranking", () => {
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

  it("gives Air Force 1 a stronger recommendation fit than Samba and CM996", () => {
    const vector = buildRyoPreferenceVector(strongAnswers);
    const af1 = buildRyoModeCandidateEvaluation(vector, candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]));
    const samba = buildRyoModeCandidateEvaluation(vector, candidate("adidas Samba OG", ["classic", "low_tech", "heritage"]));
    const cm996 = buildRyoModeCandidateEvaluation(vector, candidate("New Balance cm996", ["running", "comfortable", "retro"]));
    expect(af1.score.recommendationScore).toBeGreaterThan(samba.score.recommendationScore);
    expect(af1.score.recommendationScore).toBeGreaterThan(cm996.score.recommendationScore);
    expect(samba.opinion.caution).toContain("中心から少し外れます");
    expect(cm996.features.displayNameOfficial).toBe("New Balance CM996");
  });

  it("uses strength-specific weights and lets recommendationScore control strong reranking", () => {
    const strongVector = buildRyoPreferenceVector(strongAnswers);
    const balancedVector = buildRyoPreferenceVector({ ...strongAnswers, ryoStrength: "balanced" });
    expect(getRerankingWeights(summarizeRyoPreferenceVector(strongVector))).toEqual({ existingCoreWeight: 0.35, recommendationWeight: 0.65 });
    expect(getRerankingWeights(summarizeRyoPreferenceVector(balancedVector))).toEqual({ existingCoreWeight: 0.9, recommendationWeight: 0.1 });

    const samba = scored(candidate("adidas Samba OG", ["classic", "low_tech", "heritage"]), 96);
    const af1 = scored(candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]), 75);
    expect(rerankRyoModeCandidates([samba, af1], strongVector, "ryo")[0]?.candidate.name).toBe('Nike Air Force 1 Low "White/White"');
    expect(rerankRyoModeCandidates([samba, af1], balancedVector, "balanced")[0]?.candidate.name).toBe("adidas Samba OG");
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
    expect(result.ryoReranking).toMatchObject({ applied: true, strength: "strong", existingCoreWeight: 0.35, recommendationWeight: 0.65 });
    expect(result.ryoReranking.candidatePoolSize).toBeGreaterThan(10);
    expect(result.candidate.name).not.toMatch(/Samba|CM996/i);
    expect(result.candidate.researchSource).toBe("ryo_anchor");
    expect(result.candidateResearch.source).toBe("fallback_catalog");
    expect(result.readiness.geminiResearch.status).toBe("fallback");
    expect(result.candidate.evidenceUrls?.length).toBeGreaterThan(0);
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
