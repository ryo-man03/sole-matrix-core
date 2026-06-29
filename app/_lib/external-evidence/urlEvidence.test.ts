import { createExternalUrlEvidence } from "./urlEvidence";

describe("URL external evidence", () => {
  it("keeps only a safe domain summary and marks fallback uncertainty", () => {
    const evidence = createExternalUrlEvidence({
      source: "gemini_url_context",
      inputUrl: "https://shop.example/private/path?token=secret",
      title: "Example sneaker",
      confidence: 0.5,
      cautions: ["retrieval incomplete"],
    });

    expect(evidence).toMatchObject({
      provider: "gemini_url_context",
      domain: "shop.example",
      confidenceLabel: "uncertain",
      coreDecisionImpact: "none",
    });
    expect(JSON.stringify(evidence)).not.toContain("token=secret");
    expect(evidence.warnings.join(" ")).toContain("不確か");
  });
});
