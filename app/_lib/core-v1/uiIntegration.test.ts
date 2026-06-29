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
    expect(componentSource).toContain("resolveRecommendationProductLinks");
    expect(componentSource).toContain("ProductReferenceLinks");
    expect(componentSource).toContain("onRecommendationComplete?.()");
  });

  it("renders result, fallback, readiness, and feedback states", () => {
    expect(componentSource).toContain("Balanced Score");
    expect(componentSource).toContain("Ryo Score");
    expect(componentSource).toContain("ルールベースで説明しています");
    expect(componentSource).toContain("result.readiness.rakuten.detail");
    expect(componentSource).toContain("/api/core-v1/feedback");
  });

  it("labels local, fallback, and normalized Rakuten candidate sources", () => {
    expect(componentSource).toContain("診断 / ローカル候補");
    expect(componentSource).toContain("fallback候補");
    expect(componentSource).toContain("楽天取得データ");
    expect(componentSource).toContain("商品URLはlive確認後の参考リンク欄でのみ表示します");
    expect(componentSource).not.toContain("href={result.candidate.url}");
    expect(componentSource).toContain("shape検証を通過した説明");
    expect(componentSource).toContain('source === "rakuten"');
  });
});
