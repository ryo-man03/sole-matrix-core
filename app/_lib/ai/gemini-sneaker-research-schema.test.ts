import { buildGeminiSneakerResearchPrompt } from "./gemini-sneaker-research-prompt";
import { isAbstractSneakerName, validateEvidenceUrls, validateGeminiSneakerResearchResult } from "./gemini-sneaker-research-schema";

const validCandidate = {
  brand: "adidas",
  modelName: "adidas SAMBA OG",
  modelType: "クラシック・デイリー",
  reason: "細身で合わせやすい具体モデルです。",
  cautions: ["販売元でサイズを確認してください。"],
  searchKeywords: ["adidas SAMBA OG"],
  evidenceUrls: ["https://www.google.com/search?q=adidas%20SAMBA%20OG"],
  confidence: 0.8,
};

describe("Gemini sneaker research boundary", () => {
  it("builds a prompt that requires concrete names and evidence URLs", () => {
    const prompt = buildGeminiSneakerResearchPrompt({ answersSummary: "Q1: like", preferenceVector: { culture: 80 }, budget: "20000円まで", mode: "balanced" });
    expect(prompt).toContain("具体的なスニーカーモデル名");
    expect(prompt).toContain("evidenceUrls");
    expect(prompt).toContain("価格、在庫、サイズ、購入可能性を保証しない");
  });

  it("accepts concrete candidates and rejects abstract names", () => {
    expect(validateGeminiSneakerResearchResult({ candidates: [validCandidate] })?.candidates[0]?.modelName).toBe("adidas SAMBA OG");
    expect(validateGeminiSneakerResearchResult({ candidates: [{ ...validCandidate, modelName: "クラシック・デイリー型", searchKeywords: ["クラシック・デイリー型"] }] })).toBeNull();
    expect(isAbstractSneakerName("初心者向けモデル")).toBe(true);
    expect(isAbstractSneakerName("New Balance 991")).toBe(false);
  });

  it("keeps only HTTP and HTTPS evidence URLs", () => {
    expect(validateEvidenceUrls(["https://example.com/a", "http://example.com/b", "javascript:alert(1)", "not-a-url"])).toEqual(["https://example.com/a", "http://example.com/b"]);
  });
});
