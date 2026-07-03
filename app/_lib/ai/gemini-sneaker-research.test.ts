import { researchSneakerCandidatesWithGemini } from "./gemini-sneaker-research";

const input = {
  answersSummary: "trusted-classic: like",
  preferenceVector: { culture: 85 },
  budget: null,
  mode: "balanced" as const,
};

const validCandidate = {
  brand: "adidas",
  modelName: "adidas SAMBA OG",
  modelType: "クラシック",
  reason: "診断のクラシック志向に合います。",
  cautions: ["サイズを確認してください。"],
  searchKeywords: ["adidas SAMBA OG"],
  confidence: 0.86,
};

describe("Gemini sneaker research outcome", () => {
  it("reports missing API configuration without making a request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "", fetcher });

    expect(outcome).toEqual({
      status: "fallback",
      reasonCode: "missing_api_key",
      result: null,
      modelUsed: null,
      usedFallbackModel: false,
      stages: {
        grounding: { status: "not_checked", evidenceUrlCount: 0 },
        normalization: { status: "not_checked", repairAttempted: false, candidateCount: 0 },
      },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses grounding first, validates structured output, and trusts metadata URLs only", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(groundedResponse("adidas SAMBA OG は実在するクラシックモデルです。", "adidas SAMBA OG", "https://source.example/samba"))
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({ candidates: [{ ...validCandidate, evidenceUrls: ["https://untrusted.example/in-json"] }] })));

    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "test-key", fetcher });

    expect(outcome.status).toBe("ready");
    if (outcome.status !== "ready") return;
    expect(outcome.reasonCode).toBe("gemini_success");
    expect(outcome.stages).toEqual({
      grounding: { status: "ready", evidenceUrlCount: 1 },
      normalization: { status: "ready", repairAttempted: false, candidateCount: 1 },
    });
    expect(outcome.result.candidates[0]).toMatchObject({ modelName: "adidas Samba OG", researchOrigin: "gemini" });
    expect(outcome.result.candidates[0]?.evidenceLinks).toEqual([
      { url: "https://source.example/samba", type: "gemini_citation_url" },
      { url: "https://www.google.com/search?q=adidas%20Samba%20OG", type: "search_entry_url" },
    ]);
    expect(outcome.result.candidates[0]?.evidenceUrls).not.toContain("https://untrusted.example/in-json");

    const groundingBody = requestBody(fetcher, 0);
    const structuredBody = requestBody(fetcher, 1);
    expect(groundingBody).toMatchObject({ tools: [{ googleSearch: {} }], generationConfig: { temperature: 0, candidateCount: 1, thinkingConfig: { thinkingBudget: 0 } } });
    expect(structuredBody).toMatchObject({ generationConfig: { responseMimeType: "application/json", temperature: 0, candidateCount: 1, thinkingConfig: { thinkingBudget: 0 } } });
    expect(JSON.stringify(structuredBody)).not.toContain("evidenceUrls");
  });

  it("does not accept a Core-generated search entry when the candidate has no matching Gemini citation", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(groundedResponse("別のモデルに関する根拠です。", "別のモデル", "https://source.example/other"))
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({ candidates: [validCandidate] })));

    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "test-key", fetcher });

    expect(outcome).toMatchObject({
      status: "fallback",
      reasonCode: "no_evidence_url",
      result: null,
      stages: {
        grounding: { status: "ready", evidenceUrlCount: 1 },
        normalization: { status: "fallback", repairAttempted: false, candidateCount: 0 },
      },
    });
  });

  it("repairs malformed JSON once and validates the repaired result", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(groundedResponse("adidas SAMBA OG は実在するモデルです。", "adidas SAMBA OG", "https://source.example/samba"))
      .mockResolvedValueOnce(geminiResponse('{"candidates":['))
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({ candidates: [validCandidate] })));

    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "test-key", fetcher });

    expect(outcome.status).toBe("ready");
    expect(outcome.stages.normalization).toEqual({ status: "ready", repairAttempted: true, candidateCount: 1 });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(requestBody(fetcher, 2))).toContain("JSON構文だけを修復");
  });

  it("falls back with invalid_json when one repair cannot produce JSON", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(groundedResponse("adidas SAMBA OG は実在するモデルです。", "adidas SAMBA OG", "https://source.example/samba"))
      .mockResolvedValueOnce(geminiResponse("not json"))
      .mockResolvedValueOnce(geminiResponse("still not json"));

    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "test-key", fetcher });

    expect(outcome).toMatchObject({ status: "fallback", reasonCode: "invalid_json", result: null, stages: { grounding: { status: "ready" }, normalization: { status: "fallback", repairAttempted: true } } });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("distinguishes schema, empty candidate, and abstract-name failures", async () => {
    const outcomes = await Promise.all([
      runWithStructured({ unexpected: [] }),
      runWithStructured({ candidates: [] }),
      runWithStructured({ candidates: [{ ...validCandidate, brand: "Nike", modelName: "Nike", searchKeywords: ["Nike"] }] }),
    ]);

    expect(outcomes.map((outcome) => outcome.reasonCode)).toEqual(["schema_invalid", "no_candidates", "model_name_too_abstract"]);
    expect(outcomes.every((outcome) => outcome.stages.grounding.status === "ready" && outcome.stages.normalization.status === "fallback")).toBe(true);
  });

  it("uses a distinct fallback model only once after a transient failure", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("limited", { status: 429 }))
      .mockResolvedValueOnce(groundedResponse("adidas SAMBA OG は実在するモデルです。", "adidas SAMBA OG", "https://source.example/samba"))
      .mockResolvedValueOnce(geminiResponse(JSON.stringify({ candidates: [validCandidate] })));

    const outcome = await researchSneakerCandidatesWithGemini(input, {
      apiKey: "test-key",
      model: "primary-model",
      fallbackModel: "fallback-model",
      fetcher,
    });

    expect(outcome).toMatchObject({ status: "ready", modelUsed: "fallback-model", usedFallbackModel: true });
    expect(outcome.stages).toMatchObject({ grounding: { status: "ready" }, normalization: { status: "ready" } });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("primary-model");
    expect(String(fetcher.mock.calls[1]?.[0])).toContain("fallback-model");
    expect(String(fetcher.mock.calls[2]?.[0])).toContain("fallback-model");

    const forbiddenFetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("forbidden", { status: 403 }));
    const forbidden = await researchSneakerCandidatesWithGemini(input, {
      apiKey: "test-key",
      model: "primary-model",
      fallbackModel: "fallback-model",
      fetcher: forbiddenFetcher,
    });
    expect(forbidden).toMatchObject({ status: "fallback", reasonCode: "api_error", usedFallbackModel: false });
    expect(forbiddenFetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    [429, "rate_limited"],
    [500, "api_error"],
    [403, "api_error"],
  ] as const)("maps HTTP %s to %s without exposing the response body", async (status, reasonCode) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("secret response", { status }));
    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "test-key", fetcher });

    expect(outcome).toMatchObject({ status: "fallback", reasonCode, result: null, usedFallbackModel: false, stages: { grounding: { status: "error" }, normalization: { status: "not_checked" } } });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(outcome)).not.toContain("secret response");
  });

  it("reports a timeout safely", async () => {
    const timeout = Object.assign(new Error("request details must stay private"), { name: "TimeoutError" });
    const outcome = await researchSneakerCandidatesWithGemini(input, {
      apiKey: "test-key",
      fetcher: vi.fn<typeof fetch>().mockRejectedValue(timeout),
    });

    expect(outcome).toMatchObject({ status: "fallback", reasonCode: "timeout", result: null, stages: { grounding: { status: "error" }, normalization: { status: "not_checked" } } });
    expect(JSON.stringify(outcome)).not.toContain("request details");
  });

  it("does not parse a blocked or truncated candidate", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse("partial", "MAX_TOKENS"));
    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "test-key", fetcher });

    expect(outcome).toMatchObject({ status: "fallback", reasonCode: "api_error", result: null, stages: { grounding: { status: "error" }, normalization: { status: "not_checked" } } });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

async function runWithStructured(value: unknown) {
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(groundedResponse("adidas SAMBA OG は実在するモデルです。", "adidas SAMBA OG", "https://source.example/samba"))
    .mockResolvedValueOnce(geminiResponse(JSON.stringify(value)));
  return researchSneakerCandidatesWithGemini(input, { apiKey: "test-key", fetcher });
}

function requestBody(fetcher: ReturnType<typeof vi.fn<typeof fetch>>, index: number): Record<string, unknown> {
  const init = fetcher.mock.calls[index]?.[1];
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

function groundedResponse(text: string, supportedText: string, url: string): Response {
  return new Response(JSON.stringify({
    candidates: [{
      finishReason: "STOP",
      content: { parts: [{ text }] },
      groundingMetadata: {
        webSearchQueries: [supportedText],
        groundingChunks: [{ web: { uri: url, title: "source.example" } }],
        groundingSupports: [{ segment: { text: supportedText }, groundingChunkIndices: [0] }],
      },
    }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

function geminiResponse(text: string, finishReason = "STOP"): Response {
  return new Response(JSON.stringify({ candidates: [{ finishReason, content: { parts: [{ text }] } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
