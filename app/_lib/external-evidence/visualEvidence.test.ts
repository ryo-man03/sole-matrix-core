import { createExternalVisualEvidence } from "./visualEvidence";

describe("Gemini image external evidence", () => {
  it("marks low-confidence analysis as uncertain and non-decisional", () => {
    const evidence = createExternalVisualEvidence({
      detectedBrand: "Converse",
      detectedModelName: "One Star?",
      mainColors: ["black"],
      silhouette: "low",
      category: "skate",
      materialHints: ["suede"],
      vintageScore: 60,
      streetScore: 60,
      cleanScore: 30,
      uniquenessScore: 30,
      culturalContext: [],
      confidence: 0.42,
      cautions: ["model is estimated"],
    });

    expect(evidence).toMatchObject({
      kind: "external_visual_analysis",
      provider: "gemini",
      identification: "estimated",
      confidenceLabel: "uncertain",
      coreDecisionImpact: "none",
    });
    expect(evidence.warnings.join(" ")).toContain("不確か");
    expect(evidence.warnings.join(" ")).toContain("商品同定を確定しません");
  });
});
