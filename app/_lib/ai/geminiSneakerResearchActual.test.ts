import { isAbstractSneakerName } from "./gemini-sneaker-research-schema";
import { researchSneakerCandidatesWithGemini } from "./gemini-sneaker-research";

describe("Gemini sneaker research actual smoke", () => {
  it("returns validated concrete candidates only under explicit opt-in", async () => {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      console.log("Gemini sneaker research actual smoke: missing_env");
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
      const response = await fetch(input, init);
      console.log(`Gemini sneaker research HTTP status: ${response.status}`);
      if (response.ok) {
        const envelope = await response.clone().json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const text = envelope.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
        try {
          const normalized = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          const parsed = JSON.parse(normalized) as { candidates?: unknown[] };
          console.log(`Gemini sneaker research raw candidate count: ${parsed.candidates?.length ?? 0}`);
        } catch {
          console.log(`Gemini sneaker research raw JSON: invalid (length=${text.length})`);
        }
      }
      return response;
    } });
    if (result.status !== "ready") {
      console.log(`Gemini sneaker research actual smoke: ${result.status} / ${result.reasonCode}`);
    }
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.result.candidates.length).toBeGreaterThan(0);
    expect(result.result.candidates.every((candidate) => !isAbstractSneakerName(candidate.modelName))).toBe(true);
    expect(result.result.candidates.every((candidate) => candidate.evidenceUrls.length > 0)).toBe(true);
    console.log("Gemini sneaker research actual smoke: passed");
  }, 40_000);
});
