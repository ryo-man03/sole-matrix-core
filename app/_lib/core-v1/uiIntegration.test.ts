import { readFileSync } from "node:fs";

describe("Core v1 UI integration", () => {
  const componentSource = readFileSync(new URL("../../_components/CoreV1RecommendationPanel.tsx", import.meta.url), "utf8");
  const diagnosisFlowSource = readFileSync(new URL("../../_components/PreferenceDiagnosisFlow.tsx", import.meta.url), "utf8");
  const diagnosisDataSource = readFileSync(new URL("../../_data/preferenceDiagnosisQuestions.ts", import.meta.url), "utf8");
  const ryoResultSource = readFileSync(new URL("../../_components/RyoModeResultPanel.tsx", import.meta.url), "utf8");
  const readinessSource = readFileSync(new URL("./readiness.ts", import.meta.url), "utf8");

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
    expect(readinessSource).toContain("rule-based説明");
    expect(componentSource).toContain("Gemini候補調査:");
    expect(componentSource).toContain("Gemini補助説明:");
    expect(componentSource).toContain("Google Search Grounding:");
    expect(componentSource).toContain("JSON整形・schema検証:");
    expect(componentSource).toContain('data-research-stage="grounding"');
    expect(componentSource).toContain('data-research-stage="normalization"');
    expect(componentSource).toContain("候補調査:");
    expect(componentSource).toContain("Gemini調査");
    expect(componentSource).toContain("引用URL");
    expect(componentSource).toContain("検索入口");
    expect(componentSource).toContain("result.readiness.geminiResearch.detail");
    expect(componentSource).toContain("result.readiness.geminiExplanation.detail");
    expect(componentSource).not.toContain("Gemini: {result.readiness.gemini.status}");
    expect(componentSource).toContain("result.readiness.rakuten.detail");
    expect(componentSource).toContain("/api/core-v1/feedback");
  });

  it("keeps Gemini and URL evidence outside the final Decision", () => {
    expect(readinessSource).toContain("最終DecisionはCoreが決定します");
    expect(componentSource).not.toContain("href={result.candidate.url}");
    expect(componentSource).toContain('source === "rakuten"');
  });

  it("connects the 11-question Ryo Mode v4 flow to candidate reranking", () => {
    expect(diagnosisDataSource).toContain("RYO_MODE_V4_QUESTIONS.map");
    expect(diagnosisFlowSource).toContain("11の質問で好みを整理する");
    expect(diagnosisFlowSource).toContain("buildRyoPreferenceVector");
    expect(componentSource).toContain("buildRyoModeContextForRecommendation");
    expect(componentSource).toContain("ryoModeAnswers");
    expect(componentSource).toContain("data-ryo-reranking");
    expect(componentSource).toContain("RyoModeResultPanel");
    expect(ryoResultSource).toContain("productScore");
    expect(ryoResultSource).toContain("recommendationScore");
    expect(ryoResultSource).toContain("totalRyoScore");
    expect(ryoResultSource).toContain("RyoOpinion");
    expect(ryoResultSource).toContain("候補プールを作り");
  });
});
