import { readFileSync } from "node:fs";

describe("Core v1 UI integration", () => {
  const componentSource = readFileSync(new URL("../../_components/CoreV1RecommendationPanel.tsx", import.meta.url), "utf8");
  const diagnosisFlowSource = readFileSync(new URL("../../_components/PreferenceDiagnosisFlow.tsx", import.meta.url), "utf8");
  const diagnosisDataSource = readFileSync(new URL("../../_data/preferenceDiagnosisQuestions.ts", import.meta.url), "utf8");
  const ryoResultSource = readFileSync(new URL("../../_components/RyoModeResultPanel.tsx", import.meta.url), "utf8");
  const verifiedResultSource = readFileSync(new URL("../../_components/VerifiedCandidateResult.tsx", import.meta.url), "utf8");
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
    expect(componentSource).toContain("Core候補");
    expect(componentSource).toContain("VerifiedCandidateResult");
    expect(verifiedResultSource).toContain("モデル・カラー確認済み");
    expect(verifiedResultSource).toContain("モデル確認済み・カラー未確認");
    expect(verifiedResultSource).toContain("配色: 実在確認できず");
    expect(verifiedResultSource).toContain("Style Code");
    expect(verifiedResultSource).toContain("あなたの回答との相性");
    expect(verifiedResultSource).toContain("Ryo Modeらしさ");
    expect(verifiedResultSource).toContain("現実的な選びやすさ");
    expect(verifiedResultSource).toContain("二足目・アーカイブ適性");
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
    expect(componentSource).toContain("saveRecommendationFeedback(window.localStorage");
    expect(componentSource).toContain("フィードバックをこの端末に保存しました。");
    expect(componentSource).toContain("保存した内容:");
    expect(componentSource).toContain("保存日時:");
    expect(componentSource).toContain("評価ボタンを選んでください。");
    expect(componentSource).toContain("フィードバックを保存できませんでした。もう一度試してください。");
    expect(componentSource).toContain("前回の成功結果を表示中です");
    expect(componentSource).toContain("recommendRequestInFlightRef.current");
    expect(componentSource).toContain("requestProviderJson<RecommendApiResponse>");
    expect(componentSource).toContain("maxRetries: 0");
    expect(componentSource).toContain("setIsLoading(false)");
    expect(componentSource).toContain("前回の結果を残したまま終了しました");
    expect(componentSource).toContain("回答との主な一致");
    expect(componentSource).toContain("result.explanation.reasons.slice(0, 3)");
    expect(componentSource).toContain("result.explanation.cautions.length");
    expect(componentSource).toContain("現実的な別案");
    expect(componentSource).toContain("Ryoの中心候補");
    expect(componentSource).toContain("条件が合ったRyo隣接候補");
    expect(componentSource).toContain("data-ryo-empty-state");
    expect(componentSource).toContain("今回は下げた候補");
    expect(componentSource).toContain("recommendationDisplaySet");
    expect(componentSource).not.toContain("setResult(null)");
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
    expect(componentSource).toContain("purchasePurpose");
    expect(componentSource).toContain("ownedModels");
    expect(diagnosisFlowSource).toContain("SneakerContextForm");
    expect(diagnosisFlowSource).toContain("userSneakerContext={context}");
    expect(componentSource).toContain("data-ryo-reranking");
    expect(componentSource).toContain("RyoModeResultPanel");
    expect(componentSource).toContain("RyoScoreBreakdown");
    expect(verifiedResultSource).toContain("selectedScoreBreakdownV2");
    expect(ryoResultSource).toContain("productScore");
    expect(ryoResultSource).toContain("recommendationScore");
    expect(ryoResultSource).toContain("totalRyoScore");
    expect(ryoResultSource).toContain("RyoOpinion");
    expect(ryoResultSource).toContain("候補プールを作り");
    expect(ryoResultSource).toContain("data-ryo-affinities");
    expect(ryoResultSource).toContain("Ryo Signature枠");
    expect(ryoResultSource).toContain("formatRyoSignatureBucket");
    expect(ryoResultSource).toContain("Ryo親モデル");
    expect(ryoResultSource).toContain("サブジャンル");
  });
});
