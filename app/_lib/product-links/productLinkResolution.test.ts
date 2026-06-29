import { describe, expect, it } from "vitest";

import {
  createLatestRequestGate,
  resolveRecommendationProductName,
} from "../../_components/productLinkResolution";

describe("product link resolution helpers", () => {
  it("recommendation product links use displayed candidate name", () => {
    const productName = resolveRecommendationProductName({
      analysis: {
        sneakerName: "adidas Samba OG",
      },
      candidate: {
        name: "クラシック・デイリー型",
        source: "local",
      },
      externalEvidence: { listings: [], feedbackPatterns: [] },
    });

    expect(productName).toBe("adidas Samba OG");
  });

  it("fallback search query does not use diagnosis label", () => {
    const productName = resolveRecommendationProductName({
      analysis: {},
      candidate: {
        name: "クラシック・デイリー型",
        source: "local",
      },
      externalEvidence: { listings: [], feedbackPatterns: [] },
    });

    expect(productName).toBeNull();
  });

  it("empty product name does not create product links", () => {
    const productName = resolveRecommendationProductName({
      analysis: {
        sneakerName: "   ",
      },
      candidate: {
        name: "   ",
        source: "local",
      },
      externalEvidence: { listings: [], feedbackPatterns: [] },
    });

    expect(productName).toBeNull();
  });

  it("stale product link response does not overwrite latest recommendation links", () => {
    const gate = createLatestRequestGate();
    const firstRequestId = gate.beginRequest();
    const secondRequestId = gate.beginRequest();

    expect(gate.isCurrent(secondRequestId)).toBe(true);
    expect(gate.isCurrent(firstRequestId)).toBe(false);
  });
});