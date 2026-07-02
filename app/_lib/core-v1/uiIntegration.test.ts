import { readFileSync } from "node:fs";

describe("Core v1 UI integration", () => {
  const componentSource = readFileSync(new URL("../../_components/CoreV1RecommendationPanel.tsx", import.meta.url), "utf8");
  const diagnosisFlowSource = readFileSync(new URL("../../_components/PreferenceDiagnosisFlow.tsx", import.meta.url), "utf8");

  it("connects diagnosis answers to the recommendation API", () => {
    expect(diagnosisFlowSource).toContain("CoreV1RecommendationPanel");
    expect(componentSource).toContain("/api/core-v1/recommend");
    expect(componentSource).toContain("diagnosisAnswers");
    expect(componentSource).toContain("resolveRecommendationProductLinks");
    expect(componentSource).toContain("ProductReferenceLinks");
    expect(componentSource).toContain("onRecommendationComplete?.()");
  });

  it("renders concrete result, fallback, readiness, and feedback states", () => {
    expect(componentSource).toContain("具体的なおすすめモデルを見る");
    expect(componentSource).toContain("fallback catalog");
    expect(componentSource).toContain("Balanced Score");
    expect(componentSource).toContain("Ryo Score");
    expect(componentSource).toContain("rule-based説明");
    expect(componentSource).toContain("result.readiness.rakuten.detail");
    expect(componentSource).toContain("/api/core-v1/feedback");
  });

  it("keeps Gemini and URL evidence outside the final Decision", () => {
    expect(componentSource).toContain("最終DecisionはCoreが決定します");
    expect(componentSource).not.toContain("href={result.candidate.url}");
    expect(componentSource).toContain('source === "rakuten"');
  });
});
