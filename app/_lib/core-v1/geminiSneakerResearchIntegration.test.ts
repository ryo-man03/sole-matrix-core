import { recommendCoreV1 } from "./service";

describe("Gemini candidate research and Core re-evaluation", () => {
  it("validates Gemini candidates and keeps the final decision in Core", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({ candidates: [
        { brand: "adidas", modelName: "クラシック・デイリー型", modelType: "抽象", reason: "invalid", cautions: [], searchKeywords: ["クラシック・デイリー型"], evidenceUrls: ["https://example.com/type"], confidence: 0.9 },
        { brand: "adidas", modelName: "adidas SAMBA OG", modelType: "クラシック・デイリー", reason: "診断のクラシック志向に合います。", cautions: ["サイズを確認してください。"], searchKeywords: ["adidas SAMBA OG"], evidenceUrls: ["https://www.google.com/search?q=adidas%20SAMBA%20OG"], confidence: 0.8 },
      ] })))
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({ summary: "補助説明", reasons: ["補助理由"], cautions: ["補助注意"], balancedView: "balanced", ryoView: "ryo", finalTone: "balanced", decision: "strong_buy" })));

    const result = await recommendCoreV1({ diagnosisAnswers: [{ questionId: "trusted-classic", value: "like" }], preferenceTags: [], mode: "balanced" }, {
      env: { GEMINI_API_KEY: "test-key" },
      geminiFetcher: fetcher,
      rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }),
    });

    expect(result.candidate.name).toBe("adidas SAMBA OG");
    expect(result.candidate.researchSource).toBe("gemini");
    expect(result.candidate.evidenceUrls).toHaveLength(1);
    expect(result.candidateResearch).toMatchObject({ source: "gemini", validCandidateCount: 1 });
    expect(result.decision).toMatch(/strong_buy|consider|wait|avoid|unknown/);
    expect(result.explanation).not.toHaveProperty("decision");
  });

  it("falls back to a concrete catalog model when Gemini is unavailable", async () => {
    const result = await recommendCoreV1({ diagnosisAnswers: [{ questionId: "walking-comfort", value: "like" }], preferenceTags: [], mode: "balanced" }, { env: {}, rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }) });
    expect(result.candidateResearch.source).toBe("fallback_catalog");
    expect(result.candidate.name).toMatch(/adidas|New Balance|Nike|PUMA|Vans|Converse|ASICS/);
    expect(result.candidate.evidenceUrls?.length).toBeGreaterThan(0);
  });
});

function geminiResponse(text: string): Response {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
}
