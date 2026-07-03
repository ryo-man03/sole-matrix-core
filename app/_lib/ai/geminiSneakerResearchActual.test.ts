import { isAbstractSneakerName } from "./gemini-sneaker-research-schema";
import { researchSneakerCandidatesWithGemini } from "./gemini-sneaker-research";

describe("Gemini sneaker research actual smoke", () => {
  it("returns validated concrete candidates only under explicit opt-in", async () => {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      console.log("Gemini sneaker research actual smoke: missing_api_key");
      return;
    }
    if (process.env.RUN_EXTERNAL_SMOKE !== "1") {
      console.log("Gemini sneaker research actual smoke: skipped_external_smoke");
      return;
    }
    const result = await researchSneakerCandidatesWithGemini({
      answersSummary: "trusted-classic: like\nsimple-daily: like\nwalking-comfort: like",
      preferenceVector: { culture: 85, styleFit: 80, simplicity: 88, street: 55, volume: 40, comfort: 82, durability: 78, priceLevel: 50 },
      budget: "20000円まで",
      mode: "balanced",
    }, { fetcher: async (input, init) => {
      let stage = "unknown";
      try {
        const requestBody = JSON.parse(String(init?.body)) as { tools?: unknown[]; generationConfig?: { responseMimeType?: string } };
        stage = requestBody.tools?.length ? "grounding" : requestBody.generationConfig?.responseMimeType === "application/json" ? "structured" : "unknown";
      } catch {
        // Do not log request content. The stage label is diagnostic only.
      }
      const response = await fetch(input, init);
      console.log(`Gemini sneaker research HTTP status: stage=${stage}, status=${response.status}`);
      if (response.ok) {
        const envelope = await response.clone().json() as { candidates?: Array<{ finishReason?: string; groundingMetadata?: { groundingChunks?: unknown[]; groundingSupports?: Array<{ groundingChunkIndices?: unknown[]; segment?: { text?: string } }> } }> };
        const metadata = envelope.candidates?.[0]?.groundingMetadata;
        console.log(`Gemini sneaker research response metadata: stage=${stage}, finishReason=${envelope.candidates?.[0]?.finishReason ?? "missing"}, chunks=${metadata?.groundingChunks?.length ?? 0}, supports=${metadata?.groundingSupports?.length ?? 0}, supportedChunks=${metadata?.groundingSupports?.reduce((count, support) => count + (support.groundingChunkIndices?.length ?? 0), 0) ?? 0}, segmentChars=${metadata?.groundingSupports?.reduce((count, support) => count + (support.segment?.text?.length ?? 0), 0) ?? 0}`);
      }
      return response;
    } });
    if (result.status !== "ready") {
      console.log(`Gemini sneaker research actual smoke: ${result.status} / ${result.reasonCode}`);
    }
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.stages.grounding.status).toBe("ready");
    expect(result.stages.normalization.status).toBe("ready");
    expect(result.result.candidates.length).toBeGreaterThan(0);
    expect(result.result.candidates.every((candidate) => !isAbstractSneakerName(candidate.modelName))).toBe(true);
    expect(result.result.candidates.every((candidate) => candidate.evidenceUrls.length > 0)).toBe(true);
    expect(result.result.candidates.every((candidate) => candidate.evidenceLinks.some((link) => link.type === "gemini_citation_url"))).toBe(true);
    console.log(`Gemini sneaker research actual smoke: passed / source=gemini, reason=${result.reasonCode}, model=${result.modelUsed}, fallbackModel=${result.usedFallbackModel}, grounding=${result.stages.grounding.status}, normalization=${result.stages.normalization.status}, candidates=${result.result.candidates.length}, evidenceUrls=${result.stages.grounding.evidenceUrlCount}`);
  }, 100_000);
});
