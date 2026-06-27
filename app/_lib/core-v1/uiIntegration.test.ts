import { readFileSync } from "node:fs";

describe("Core v1 UI integration", () => {
  const componentSource = readFileSync(
    new URL("../../_components/CoreV1RecommendationPanel.tsx", import.meta.url),
    "utf8",
  );
  const diagnosisFlowSource = readFileSync(
    new URL("../../_components/PreferenceDiagnosisFlow.tsx", import.meta.url),
    "utf8",
  );

  it("connects diagnosis answers to the recommendation API", () => {
    expect(diagnosisFlowSource).toContain("CoreV1RecommendationPanel");
    expect(componentSource).toContain("/api/core-v1/recommend");
    expect(componentSource).toContain("diagnosisAnswers");
  });

  it("renders result, fallback, readiness, and feedback states", () => {
    expect(componentSource).toContain("Balanced Score");
    expect(componentSource).toContain("Ryo Score");
    expect(componentSource).toContain("ルールベースで説明しています");
    expect(componentSource).toContain("楽天APIは現在利用できないため");
    expect(componentSource).toContain("/api/core-v1/feedback");
  });
});
