import type { CandidateProfile, RecommendationExplanation } from "../core-v1/types";
import { auditRecommendationExplanation } from "./explanation-audit";

describe("recommendation explanation claim audit", () => {
  it("classifies verified facts, Core inference, Ryo editorial, and unsupported claims", () => {
    const result = auditRecommendationExplanation({
      candidate: sneaker(),
      explanation: explanation([
        "バスケットボール由来のモデルです。",
        "診断回答とパンツ条件に合います。",
        "Ryo Modeらしい定番からの外しです。",
        "月面探査で採用されたモデルです。",
      ]),
      scoreBreakdown: scores(),
    });
    expect(result.evaluation.claims.map((claim) => claim.kind)).toEqual([
      "verified_fact",
      "core_inference",
      "ryo_editorial",
      "unsupported",
      "unsupported",
    ]);
    expect(result.evaluation.claims[0]?.evidenceUrls).toHaveLength(1);
    expect(result.evaluation.claims[1]?.supportingScoreKeys).toContain("userFitScore");
    expect(result.displayClaims).toHaveLength(3);
  });

  it.each([
    ["キャンバス素材なのでレザーの履きジワを楽しめます。", /キャンバス候補/],
    ["Lowモデルですがハイカットです。", /Low候補/],
    ["Black / Whiteカラーです。", /未確認カラー/],
    ["バスケットボール由来です。", /ランニング候補/],
    ["Made in USAモデルです。", /生産国/],
    ["Geminiが確認済みです。", /Core fallback/],
  ] as const)("detects contradiction: %s", (claim, expected) => {
    const candidate = sneaker({
      name: "Example Low Canvas Runner",
      modelName: "Example Low Canvas Runner",
      tags: ["canvas", "running"],
      researchSource: "fallback_catalog",
      verificationStatus: "model_verified_colorway_unverified",
    });
    const result = auditRecommendationExplanation({
      candidate,
      explanation: explanation([claim]),
    });
    expect(result.evaluation.claims[0]?.kind).toBe("unsupported");
    expect(result.evaluation.claims[0]?.contradictionReasons.join(" ")).toMatch(expected);
    expect(result.displayClaims).toEqual([]);
  });

  it("detects owned discovery and budget contradictions", () => {
    const result = auditRecommendationExplanation({
      candidate: sneaker({ priceYen: 40_000 }),
      explanation: explanation([
        "所有状況に対する新しい発見です。",
        "予算内で買いやすい候補です。",
      ]),
      context: {
        purchasePurpose: "second_pair",
        ownedModels: ["Example High"],
        dislikedModels: [],
        dislikedSignals: [],
      },
      budgetYen: 20_000,
    });
    expect(result.evaluation.contradictionCount).toBe(2);
    expect(result.displayClaims).toHaveLength(0);
  });

  it.each([
    "限定モデルなので希少です。",
    "人気が高く、これから値上がりします。",
    "投資価値があり、今買うべきです。",
    "売れば利益が出て儲かる候補です。",
  ])("hides unsupported market-sensitive claim: %s", (claim) => {
    const result = auditRecommendationExplanation({
      candidate: sneaker(),
      explanation: explanation([claim]),
      scoreBreakdown: scores(),
    });
    expect(result.evaluation.claims[0]).toMatchObject({
      kind: "unsupported",
    });
    expect(result.evaluation.claims[0]?.contradictionReasons.join(" ")).toMatch(
      /構造化された根拠/,
    );
    expect(result.displayClaims).toEqual([]);
  });

  it("hides unsupported Japanese production-country claims", () => {
    const result = auditRecommendationExplanation({
      candidate: sneaker(),
      explanation: explanation(["日本製のモデルです。"]),
    });
    expect(result.evaluation.claims[0]?.kind).toBe("unsupported");
    expect(result.evaluation.claims[0]?.contradictionReasons.join(" ")).toMatch(
      /生産国/,
    );
  });

  it("deduplicates reasons and limits ordinary display to four trusted claims", () => {
    const reasons = [
      "診断回答に合います。",
      "診断回答に合います。",
      "予算条件に合います。",
      "パンツに合わせやすいです。",
      "日常で履きやすいです。",
      "服装に合います。",
    ];
    const result = auditRecommendationExplanation({
      candidate: sneaker(),
      explanation: explanation(reasons),
      scoreBreakdown: scores(),
    });
    expect(result.evaluation.claims).toHaveLength(6);
    expect(result.displayClaims).toHaveLength(4);
  });
});

function sneaker(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "candidate",
    name: "Example High",
    source: "local",
    description: "レザーのバスケットボールモデル",
    tags: ["basketball", "heritage"],
    vector: {
      culture: 70,
      styleFit: 70,
      simplicity: 50,
      street: 60,
      volume: 50,
      comfort: 50,
      durability: 70,
      priceLevel: 50,
    },
    budgetFit: 70,
    risk: "low",
    informationCompleteness: 80,
    readiness: "ready_external",
    modelName: "Example High",
    modelEvidenceUrls: ["https://www.nike.com/jp/example"],
    colorwayEvidenceUrls: [],
    styleCodeEvidenceUrls: [],
    verificationStatus: "model_verified_colorway_unverified",
    researchSource: "gemini",
    ...overrides,
  };
}

function explanation(reasons: string[]): RecommendationExplanation {
  return {
    source: "gemini",
    summary: "summary",
    reasons,
    cautions: [],
    balancedView: "",
    ryoView: "",
    finalTone: "balanced",
  };
}

function scores() {
  return {
    userFitScore: 80,
    ryoIdentityScore: 70,
    practicalFitScore: 75,
    explorationScore: 60,
    contextPenalty: 0,
    finalRecommendationScore: 74,
  };
}
