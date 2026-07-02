import { buildGeminiSneakerResearchPrompt } from "./gemini-sneaker-research-prompt";
import {
  isAbstractSneakerName,
  validateEvidenceUrls,
  validateGeminiSneakerResearchDraft,
} from "./gemini-sneaker-research-schema";

const validCandidate = {
  brand: "adidas",
  modelName: "adidas SAMBA OG",
  modelType: "クラシック・デイリー",
  reason: "細身で合わせやすい具体モデルです。",
  cautions: ["販売元でサイズを確認してください。"],
  searchKeywords: ["adidas SAMBA OG"],
  confidence: 0.8,
};

describe("Gemini sneaker research boundary", () => {
  it("builds a grounded-research prompt without asking Gemini to invent URLs", () => {
    const prompt = buildGeminiSneakerResearchPrompt({ answersSummary: "Q1: like", preferenceVector: { culture: 80 }, budget: "20000円まで", mode: "balanced" });
    expect(prompt).toContain("具体モデル名");
    expect(prompt).toContain("Google検索を必ず使い");
    expect(prompt).toContain("URLを推測して本文へ書かない");
    expect(prompt).toContain("価格、在庫、サイズ、真贋、購入可能性を保証しない");
  });

  it("accepts concrete candidates and reports abstract or brand-only names", () => {
    const accepted = validateGeminiSneakerResearchDraft({ candidates: [validCandidate] });
    expect(accepted.ok && accepted.result.candidates[0]?.modelName).toBe("adidas Samba OG");

    const officialName = validateGeminiSneakerResearchDraft({
      candidates: [{
        ...validCandidate,
        brand: "NIKE",
        modelName: "AIR FORCE 1 LOW RETRO",
        searchKeywords: ["NIKE AIR FORCE 1 LOW RETRO"],
      }],
    });
    expect(officialName.ok && officialName.result.candidates[0]?.modelName).toBe("Nike Air Force 1 Low Retro");

    const localizedOfficialName = validateGeminiSneakerResearchDraft({
      candidates: [{
        ...validCandidate,
        brand: "ナイキ",
        modelName: "ナイキ エア フォース 1 ロー レトロ",
        searchKeywords: ["ナイキ エア フォース 1 ロー レトロ"],
      }],
    });
    expect(localizedOfficialName.ok && localizedOfficialName.result.candidates[0]?.modelName).toBe("Nike Air Force 1 Low Retro");

    const localizedBrandName = validateGeminiSneakerResearchDraft({
      candidates: [{
        ...validCandidate,
        brand: "ニューバランス",
        modelName: "ニューバランス 990v6",
        searchKeywords: ["ニューバランス 990v6"],
      }],
    });
    expect(localizedBrandName.ok && localizedBrandName.result.candidates[0]?.modelName).toBe("New Balance 990v6");

    const localizedUnknownName = validateGeminiSneakerResearchDraft({
      candidates: [{
        ...validCandidate,
        brand: "架空ブランド",
        modelName: "架空モデル 一号",
        searchKeywords: ["架空モデル 一号"],
      }],
    });
    expect(localizedUnknownName).toEqual({ ok: false, reasonCode: "schema_invalid" });

    const abstract = validateGeminiSneakerResearchDraft({ candidates: [{ ...validCandidate, modelName: "クラシック・デイリー型", searchKeywords: ["クラシック・デイリー型"] }] });
    expect(abstract).toEqual({ ok: false, reasonCode: "model_name_too_abstract" });
    expect(isAbstractSneakerName("New Balance", "New Balance")).toBe(true);
    expect(isAbstractSneakerName("New Balance 991", "New Balance")).toBe(false);
  });

  it("keeps only HTTP and HTTPS evidence URLs", () => {
    expect(validateEvidenceUrls(["https://example.com/a", "http://example.com/b", "javascript:alert(1)", "not-a-url"])).toEqual(["https://example.com/a", "http://example.com/b"]);
  });
});
