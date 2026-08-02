import { describe, expect, it } from "vitest";

import {
  normalizeStyleCode,
  verifyColorwayProposal,
  type AiSneakerProposal,
  type ColorwayEvidence,
} from "./colorway-verification";

describe("verified colorway contract", () => {
  it("verifies model, colorway, and exact Style Code from one official source", () => {
    const result = verifyColorwayProposal(proposal(), [evidence()]);
    expect(result).toMatchObject({
      state: "model_color_style_verified",
      modelName: "Nike Air Force 1 Low",
      colorwayName: "White / Black",
      styleCode: "HF2893-100",
    });
  });

  it("accepts two independent high-quality sources", () => {
    const result = verifyColorwayProposal(proposal(), [
      evidence({ sourceType: "verified_catalog", url: "https://catalog-a.example/item" }),
      evidence({ sourceType: "editorial", url: "https://editorial-b.example/item" }),
    ]);
    expect(result.state).toBe("model_color_style_verified");
  });

  it("never verifies a marketplace-only colorway", () => {
    const result = verifyColorwayProposal(proposal({ confidence: "high" }), [
      evidence({ sourceType: "marketplace_listing", url: "https://www.ebay.com/itm/123" }),
    ]);
    expect(result.state).toBe("unverified");
    expect(result.colorwayName).toBeNull();
    expect(result.warnings.join(" ")).toContain("マーケットプレイス");
  });

  it("falls back to model-only on color or Style Code conflict", () => {
    const result = verifyColorwayProposal(proposal(), [
      evidence(),
      evidence({ url: "https://www.nike.com/jp/t/other", colorwayName: "University Blue", styleCode: "HF2893-101" }),
    ]);
    expect(result.state).toBe("model_only");
    expect(result.colorwayName).toBeNull();
    expect(result.styleCode).toBeNull();
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it("normalizes for exact comparison without accepting partial codes", () => {
    expect(normalizeStyleCode("m991 gl")).toBe("M991GL");
    expect(normalizeStyleCode("M991-GL")).toBe("M991GL");
    const result = verifyColorwayProposal(proposal({ proposedStyleCode: "M991GL" }), [
      evidence({ styleCode: "M991GL2" }),
    ]);
    expect(result.styleCode).toBeNull();
  });

  it("drops unsafe and duplicate evidence", () => {
    const safe = evidence();
    const result = verifyColorwayProposal(proposal(), [safe, safe, evidence({ url: "javascript:alert(1)" })]);
    expect(result.evidence).toHaveLength(1);
  });
});

function proposal(overrides: Partial<AiSneakerProposal> = {}): AiSneakerProposal {
  return {
    proposedModelName: "Nike Air Force 1 Low",
    proposedColorwayName: "White / Black",
    proposedStyleCode: "HF2893-100",
    searchAliases: ["Nike Air Force 1 Low"],
    proposedReasons: ["daily use"],
    sourceHints: [],
    confidence: "medium",
    ...overrides,
  };
}

function evidence(overrides: Partial<ColorwayEvidence> = {}): ColorwayEvidence {
  return {
    sourceType: "brand_official",
    url: "https://www.nike.com/jp/t/air-force-1",
    modelName: "Nike Air Force 1 Low",
    colorwayName: "White / Black",
    styleCode: "HF2893-100",
    sourceTitle: "Nike Air Force 1 Low",
    fetchedAt: "2026-08-01T00:00:00.000Z",
    supportsModel: true,
    supportsColorway: true,
    supportsStyleCode: true,
    ...overrides,
  };
}
