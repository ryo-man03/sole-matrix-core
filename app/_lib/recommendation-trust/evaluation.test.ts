import {
  clampTrustScore,
  createExplanationTrustEvaluation,
  createFactualVerification,
  createRecommendationTrustEvaluation,
  createRyoAuthenticityEvaluation,
  deriveLegacyVerificationStatus,
} from "./evaluation";
import type {
  ExplanationClaim,
  FactualVerification,
  RyoAuthenticityEvaluation,
  VerificationEvidence,
} from "./types";

const officialEvidence: VerificationEvidence = {
  subject: "model",
  url: "https://www.nike.com/jp/example",
  domain: "nike.com",
  sourceQuality: "official",
  modelName: "Nike Air Force 1",
};

describe("recommendation trust domain model", () => {
  it("clamps finite scores and rejects NaN, Infinity, and negative values", () => {
    expect(clampTrustScore(100.06)).toBe(100);
    expect(clampTrustScore(-1)).toBe(0);
    expect(clampTrustScore(Number.NaN)).toBe(0);
    expect(clampTrustScore(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("deduplicates evidence and derives its count from unique URLs", () => {
    const factual = createFactualVerification({
      model: "officially_verified",
      colorway: "unverified",
      styleCode: "unverified",
      modelEvidence: [officialEvidence, officialEvidence],
      colorwayEvidence: [],
      styleCodeEvidence: [],
      unsupportedClaims: [],
      contradictions: ["same", "same"],
    });
    expect(factual.evidenceCount).toBe(1);
    expect(factual.contradictions).toEqual(["same"]);
  });

  it("counts classified claims and keeps contradiction detail", () => {
    const claims: ExplanationClaim[] = [
      claim("fact", "verified_fact"),
      claim("fit", "core_inference"),
      claim("edit", "ryo_editorial"),
      { ...claim("bad", "unsupported"), contradictionReasons: ["color mismatch"] },
    ];
    expect(createExplanationTrustEvaluation(claims)).toMatchObject({
      verifiedFactCount: 1,
      inferenceCount: 1,
      editorialCount: 1,
      unsupportedCount: 1,
      contradictionCount: 1,
    });
  });

  it.each([
    ["verified", factual("officially_verified", "independently_verified"), 80, []],
    ["partially_verified", factual("officially_verified", "unverified"), 80, ["カラーは未確認です。"]],
    ["needs_review", factual("unverified", "unverified"), 80, ["モデルの実在証拠が不足しています。"]],
    ["needs_review", factual("officially_verified", "unverified"), 20, ["診断条件との一致が基準未満です。"]],
    ["rejected", factual("rejected", "rejected"), 90, ["モデルの実在性に重大な矛盾があります。"]],
  ] as const)("derives %s status", (status, factualInput, diagnosisFitScore, reasons) => {
    const result = createRecommendationTrustEvaluation({
      factual: factualInput,
      diagnosisFitScore,
      ryoAuthenticity: ryoEvaluation(),
      explanationTrust: createExplanationTrustEvaluation([]),
    });
    expect(result.status).toBe(status);
    expect(result.reviewReasons).toEqual(expect.arrayContaining([...reasons]));
  });

  it("keeps model-only and legacy verification compatibility", () => {
    expect(deriveLegacyVerificationStatus(
      factual("officially_verified", "unverified"),
    )).toBe("model_verified_colorway_unverified");
    expect(deriveLegacyVerificationStatus(
      factual("independently_verified", "officially_verified"),
    )).toBe("model_and_colorway_verified");
  });

  it("normalizes every Ryo rubric axis and remains JSON serializable", () => {
    const result = createRyoAuthenticityEvaluation({
      ...ryoEvaluation(),
      historyFit: Number.NaN,
      materialStoryFit: 120,
      tooSafePenalty: -2,
    });
    expect(result.historyFit).toBe(0);
    expect(result.materialStoryFit).toBe(100);
    expect(result.tooSafePenalty).toBe(0);
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

function factual(
  model: FactualVerification["model"],
  colorway: FactualVerification["colorway"],
): FactualVerification {
  return createFactualVerification({
    model,
    colorway,
    styleCode: "unverified",
    modelEvidence: model === "unverified" || model === "rejected" ? [] : [officialEvidence],
    colorwayEvidence: [],
    styleCodeEvidence: [],
    unsupportedClaims: [],
    contradictions: [],
  });
}

function claim(text: string, kind: ExplanationClaim["kind"]): ExplanationClaim {
  return {
    id: text,
    text,
    kind,
    evidenceUrls: [],
    supportingScoreKeys: [],
    supportingCandidateFields: [],
    contradictionReasons: [],
  };
}

function ryoEvaluation(): RyoAuthenticityEvaluation {
  return {
    historyFit: 60,
    materialStoryFit: 60,
    outfitFit: 60,
    culturalFit: 60,
    adjacentDiscoveryFit: 60,
    collectionRoleFit: 60,
    wearableColorFit: 60,
    tooSafePenalty: 0,
    hypeOnlyPenalty: 0,
    contextMismatchPenalty: 0,
    total: 60,
    rubricVersion: "1.0.0",
    reasons: [],
    penalties: [],
    matchedGoldRules: [],
  };
}
