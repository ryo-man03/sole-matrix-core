import { researchSneakerCandidatesWithGemini } from "./gemini-sneaker-research";

const input = {
  answersSummary: "trusted-classic: like",
  preferenceVector: { culture: 85 },
  budget: null,
  mode: "balanced" as const,
};

describe("Gemini sneaker research outcome", () => {
  it("reports missing configuration without making a request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "", fetcher });

    expect(outcome).toEqual({ status: "not_configured", reasonCode: "missing_env", result: null });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    [403, "http_403"],
    [429, "http_429"],
    [500, "http_5xx"],
  ] as const)("maps HTTP %s to %s without exposing a response body", async (status, reasonCode) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("secret response", { status }));
    const outcome = await researchSneakerCandidatesWithGemini(input, { apiKey: "test-key", fetcher });

    expect(outcome).toEqual({ status: "error", reasonCode, result: null });
  });

  it("reports a timeout safely", async () => {
    const timeout = Object.assign(new Error("request details must stay private"), { name: "TimeoutError" });
    const outcome = await researchSneakerCandidatesWithGemini(input, {
      apiKey: "test-key",
      fetcher: vi.fn<typeof fetch>().mockRejectedValue(timeout),
    });

    expect(outcome).toEqual({ status: "error", reasonCode: "timeout", result: null });
  });

  it("distinguishes invalid JSON, invalid schema, and no valid candidates", async () => {
    const invalidJson = await researchSneakerCandidatesWithGemini(input, {
      apiKey: "test-key",
      fetcher: async () => new Response("not-json", { status: 200 }),
    });
    const schemaInvalid = await researchSneakerCandidatesWithGemini(input, {
      apiKey: "test-key",
      fetcher: async () => geminiResponse(JSON.stringify({ unexpected: [] })),
    });
    const noValidCandidates = await researchSneakerCandidatesWithGemini(input, {
      apiKey: "test-key",
      fetcher: async () => geminiResponse(JSON.stringify({ candidates: [] })),
    });

    expect(invalidJson.reasonCode).toBe("invalid_json");
    expect(schemaInvalid.reasonCode).toBe("schema_invalid");
    expect(noValidCandidates.reasonCode).toBe("no_valid_candidates");
  });

  it("reports unknown errors without leaking exception details", async () => {
    const outcome = await researchSneakerCandidatesWithGemini(input, {
      apiKey: "test-key",
      fetcher: vi.fn<typeof fetch>().mockRejectedValue(new Error("API key and raw payload")),
    });

    expect(outcome).toEqual({ status: "error", reasonCode: "unknown_error", result: null });
    expect(JSON.stringify(outcome)).not.toContain("API key");
  });
});

function geminiResponse(text: string): Response {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
