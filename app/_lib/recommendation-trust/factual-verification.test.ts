import { evaluateFactualCandidate } from "./factual-verification";

describe("factual sneaker verification", () => {
  it.each([
    ["official model", ["https://www.nike.com/jp/t/air-force-1"], "officially_verified", true],
    ["authorized retailer model", ["https://www.atmos-tokyo.com/item/nike/af1"], "independently_verified", true],
    ["marketplace only", ["https://stockx.com/nike-air-force-1"], "unverified", false],
    ["unknown only", ["https://source.example/af1"], "unverified", false],
    ["no evidence", [], "unverified", false],
  ] as const)("%s", (_label, urls, level, accepted) => {
    const result = evaluateFactualCandidate(candidate({ modelEvidenceUrls: urls }));
    expect(result.factual.model).toBe(level);
    expect(result.acceptedForRecommendation).toBe(accepted);
  });

  it("separates model-only from a verified colorway", () => {
    const modelOnly = evaluateFactualCandidate(candidate());
    const colorway = evaluateFactualCandidate(candidate({
      colorwayName: "White / Black",
      colorwayEvidenceUrls: ["https://www.nike.com/jp/t/air-force-1"],
    }));
    expect(modelOnly.verificationStatus).toBe("model_verified_colorway_unverified");
    expect(modelOnly.colorwayName).toBeNull();
    expect(colorway.verificationStatus).toBe("model_and_colorway_verified");
    expect(colorway.colorwayName).toBe("White / Black");
  });

  it("keeps a style code only with matching trusted evidence", () => {
    const verified = evaluateFactualCandidate(candidate({
      styleCode: "HF2893-100",
      styleCodeEvidenceUrls: ["https://www.nike.com/jp/t/air-force-1"],
    }));
    const unverified = evaluateFactualCandidate(candidate({ styleCode: "HF2893-100" }));
    expect(verified.styleCode).toBe("HF2893-100");
    expect(verified.factual.styleCode).toBe("officially_verified");
    expect(unverified.styleCode).toBeNull();
  });

  it("drops evidence that points at another model or color", () => {
    const url = "https://www.nike.com/jp/t/air-force-1";
    const result = evaluateFactualCandidate(candidate({
      colorwayName: "White / Black",
      colorwayEvidenceUrls: [url],
      evidenceDetails: [{
        subject: "colorway",
        url,
        modelName: "Nike Dunk Low",
        colorwayName: "University Blue",
      }],
    }));
    expect(result.colorwayName).toBeNull();
    expect(result.factual.contradictions.join(" ")).toContain("別モデル");
  });

  it.each(["Custom", "Inspired", "Replica", "Fake", "Unreleased rumor"] as const)(
    "rejects excluded candidate wording: %s",
    (word) => {
      const result = evaluateFactualCandidate(candidate({
        modelName: `Nike Air Force 1 ${word}`,
      }));
      expect(result.factual.model).toBe("rejected");
      expect(result.acceptedForRecommendation).toBe(false);
    },
  );

  it("rejects brand and Kids audience contradictions", () => {
    const brand = evaluateFactualCandidate(candidate({ brand: "adidas" }));
    const kids = evaluateFactualCandidate(candidate({
      expectedAudience: "mens",
      evidenceAudience: "kids",
    }));
    expect(brand.factual.contradictions.join(" ")).toContain("ブランド不一致");
    expect(kids.factual.contradictions.join(" ")).toContain("Kids");
  });

  it("deduplicates evidence and drops unsafe URLs", () => {
    const url = "https://www.nike.com/jp/t/air-force-1";
    const result = evaluateFactualCandidate(candidate({
      modelEvidenceUrls: [url, url, "javascript:alert(1)"],
    }));
    expect(result.factual.modelEvidence).toHaveLength(1);
    expect(result.factual.evidenceCount).toBe(1);
  });
});

function candidate(overrides: Partial<Parameters<typeof evaluateFactualCandidate>[0]> = {}) {
  return {
    brand: "Nike",
    modelName: "Nike Air Force 1",
    colorwayName: null,
    styleCode: null,
    modelEvidenceUrls: ["https://www.nike.com/jp/t/air-force-1"],
    colorwayEvidenceUrls: [],
    styleCodeEvidenceUrls: [],
    ...overrides,
  };
}
