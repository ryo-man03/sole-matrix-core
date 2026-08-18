import { recommendCoreV1 } from "./service";
import { isGeminiResearchShowcaseReady } from "./readiness";

describe("Gemini candidate research and Core re-evaluation", () => {
  it("validates Gemini candidates and keeps the final decision in Core", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(groundedResponse("adidas SAMBA OG は実在するクラシックモデルです。", "adidas SAMBA OG", "https://www.adidas.jp/samba-og"))
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({ candidates: [
        { brand: "adidas", modelName: "クラシック・デイリー型", colorwayName: null, styleCode: null, modelType: "抽象", reason: "invalid", cautions: [], searchKeywords: ["クラシック・デイリー型"], confidence: 0.9 },
        { brand: "adidas", modelName: "adidas SAMBA OG", colorwayName: null, styleCode: null, modelType: "クラシック・デイリー", reason: "診断のクラシック志向に合います。", cautions: ["サイズを確認してください。"], searchKeywords: ["adidas SAMBA OG"], confidence: 0.8 },
      ] })))
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({ summary: "補助説明", reasons: ["補助理由"], cautions: ["補助注意"], balancedView: "balanced", ryoView: "ryo", finalTone: "balanced", decision: "strong_buy" })));

    const result = await recommendCoreV1({ diagnosisAnswers: [{ questionId: "trusted-classic", value: "like" }], preferenceTags: [], mode: "balanced" }, {
      env: { GEMINI_API_KEY: "test-key" },
      geminiFetcher: fetcher,
      rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }),
    });

    expect(result.candidate.name).toBe("adidas Samba OG");
    expect(result.candidate).toMatchObject({
      modelName: "adidas Samba OG",
      colorwayName: null,
      styleCode: null,
      verificationStatus: "model_verified_colorway_unverified",
      sourceQuality: "official",
    });
    expect(result.candidate.researchSource).toBe("gemini");
    expect(result.candidate.evidenceLinks).toEqual([
      { url: "https://www.adidas.jp/samba-og", type: "gemini_citation_url" },
      { url: "https://www.google.com/search?q=adidas%20Samba%20OG", type: "search_entry_url" },
    ]);
    expect(result.candidateResearch).toMatchObject({ source: "gemini", reasonCode: "gemini_success", validCandidateCount: 1, coreReevaluated: true, modelUsed: "gemini-2.5-flash", usedFallbackModel: false, stages: { grounding: { status: "ready", evidenceUrlCount: 1 }, normalization: { status: "ready", repairAttempted: false, candidateCount: 1 } } });
    expect(result.readiness.geminiResearch.status).toBe("ready");
    expect(result.readiness.geminiExplanation.status).toBe("ready");
    expect(result.candidateResearch.detail).toBe("Gemini候補調査を検証し、Core再評価後の結果を表示しています。");
    expect(isGeminiResearchShowcaseReady(result)).toBe(true);
    expect(isGeminiResearchShowcaseReady({
      ...result,
      candidate: { ...result.candidate, evidenceUrls: [], evidenceLinks: [] },
    })).toBe(false);
    expect(result.decision).toMatch(/strong_buy|consider|wait|avoid|unknown/);
    expect(result.explanation).not.toHaveProperty("decision");
  });

  it("falls back to a concrete catalog model when Gemini is unavailable", async () => {
    const result = await recommendCoreV1({ diagnosisAnswers: [{ questionId: "walking-comfort", value: "like" }], preferenceTags: [], mode: "balanced" }, { env: {}, rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }) });
    expect(result.candidateResearch.source).toBe("fallback_catalog");
    expect(result.candidateResearch).toMatchObject({ status: "fallback", reasonCode: "missing_api_key", coreReevaluated: false, stages: { grounding: { status: "not_checked" }, normalization: { status: "not_checked" } } });
    expect(result.readiness.geminiResearch.status).toBe("fallback");
    expect(result.readiness.geminiExplanation.status).toBe("not_configured");
    expect(result.candidate.name).toMatch(/adidas|New Balance|Nike|PUMA|Vans|Converse|ASICS/);
    expect(result.candidate.evidenceUrls?.length).toBeGreaterThan(0);
    expect(isGeminiResearchShowcaseReady(result)).toBe(false);
  });

  it("disables every external provider for deterministic QA even when keys exist", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await recommendCoreV1(
      {
        diagnosisAnswers: [{ questionId: "walking-comfort", value: "like" }],
        preferenceTags: [],
        mode: "balanced",
      },
      {
        env: {
          EXTERNAL_PROVIDERS_DISABLED: "true",
          GEMINI_API_KEY: "configured-but-disabled",
          RAKUTEN_APPLICATION_ID: "configured-but-disabled",
          RAKUTEN_ACCESS_KEY: "configured-but-disabled",
        },
        geminiFetcher: fetcher,
      },
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.candidateResearch).toMatchObject({
      source: "fallback_catalog",
      reasonCode: "missing_api_key",
    });
    expect(result.readiness.geminiExplanation.status).toBe("not_configured");
    expect(result.readiness.rakuten.status).toBe("manual_only");
  });

  it("does not mark candidate research ready when only Gemini explanation succeeds", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("forbidden", { status: 403 }))
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({
        summary: "補助説明",
        reasons: ["補助理由"],
        cautions: ["補助注意"],
        balancedView: "balanced",
        ryoView: "ryo",
        finalTone: "balanced",
      })));

    const result = await recommendCoreV1(
      { diagnosisAnswers: [{ questionId: "walking-comfort", value: "like" }], preferenceTags: [], mode: "balanced" },
      {
        env: { GEMINI_API_KEY: "test-key" },
        geminiFetcher: fetcher,
        rakutenCandidateProvider: async () => ({ status: "missing_config", candidates: [], evidence: [], readiness: { provider: "rakuten", status: "missing_config", detail: "missing" }, networkAttempted: false, responseOk: false, shapeValid: false }),
      },
    );

    expect(result.candidateResearch).toMatchObject({
      source: "fallback_catalog",
      status: "fallback",
      reasonCode: "api_error",
      stages: { grounding: { status: "error" }, normalization: { status: "not_checked" } },
    });
    expect(result.explanation.source).toBe("gemini");
    expect(result.readiness.geminiResearch.status).toBe("fallback");
    expect(result.readiness.geminiExplanation.status).toBe("ready");
    expect(result.candidateResearch.detail).not.toContain("Gemini候補調査を検証");
    expect(isGeminiResearchShowcaseReady(result)).toBe(false);
  });
});

function geminiResponse(text: string): Response {
  return new Response(JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
}

function groundedResponse(text: string, supportedText: string, url: string): Response {
  return new Response(JSON.stringify({ candidates: [{
    finishReason: "STOP",
    content: { parts: [{ text }] },
    groundingMetadata: {
      groundingChunks: [{ web: { uri: url, title: "source.example" } }],
      groundingSupports: [{ segment: { text: supportedText }, groundingChunkIndices: [0] }],
    },
  }] }), { status: 200, headers: { "Content-Type": "application/json" } });
}
