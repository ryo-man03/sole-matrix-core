import { buildGeminiSneakerResearchPrompt } from "./gemini-sneaker-research-prompt";
import {
  classifyEvidenceSourceQuality,
  geminiSneakerResearchResponseSchema,
  isAbstractSneakerName,
  normalizeBrandName,
  normalizeColorwayName,
  normalizeModelName,
  normalizeStyleCode,
  validateEvidenceUrls,
  validateGeminiSneakerResearchDraft,
} from "./gemini-sneaker-research-schema";

const validCandidate = {
  brand: "adidas",
  modelName: "adidas SAMBA OG",
  colorwayName: null,
  styleCode: null,
  modelType: "クラシック・デイリー",
  reason: "細身で合わせやすい具体モデルです。",
  cautions: ["販売元でサイズを確認してください。"],
  searchKeywords: ["adidas SAMBA OG"],
  confidence: 0.8,
};

describe("Gemini sneaker research boundary", () => {
  it("builds a grounded-research prompt without asking Gemini to invent URLs", () => {
    const prompt = buildGeminiSneakerResearchPrompt({
      answersSummary: "Q1: like",
      preferenceVector: { culture: 80 },
      purchasePurpose: "first_pair",
      ownedModels: [],
      dislikedModels: [],
      dislikedSignals: [],
      budget: "20000円まで",
      mode: "balanced",
    });
    expect(prompt).toContain("具体モデル名");
    expect(prompt).toContain("Google検索を必ず使い");
    expect(prompt).toContain("URLを推測して本文へ書かない");
    expect(prompt).toContain("価格、在庫、サイズ、真贋、購入可能性を保証しない");
    expect(prompt).toContain("11問診断");
    expect(prompt).toContain("purchasePurpose: first_pair");
    expect(prompt).not.toContain("8問診断");
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
    const custom = validateGeminiSneakerResearchDraft({ candidates: [{ ...validCandidate, brand: "Nike", modelName: "Nike Dunk Low Custom", searchKeywords: ["Nike Dunk Low Custom"] }] });
    expect(custom).toEqual({ ok: false, reasonCode: "model_name_too_abstract" });
    const concreteUnknownMap = validateGeminiSneakerResearchDraft({
      candidates: [{ ...validCandidate, brand: "Saucony", modelName: "Saucony Jazz Original", searchKeywords: ["Saucony Jazz Original"] }],
    });
    expect(concreteUnknownMap.ok && concreteUnknownMap.result.candidates[0]?.modelName).toBe("Saucony Jazz Original");
    expect(isAbstractSneakerName("New Balance", "New Balance")).toBe(true);
    expect(isAbstractSneakerName("New Balance 991", "New Balance")).toBe(false);
  });

  it("keeps only HTTP and HTTPS evidence URLs", () => {
    expect(validateEvidenceUrls(["https://example.com/a", "http://example.com/b", "javascript:alert(1)", "not-a-url"])).toEqual(["https://example.com/a", "http://example.com/b"]);
  });

  it("keeps colorway and style code nullable in the structured output contract", () => {
    const schemaText = JSON.stringify(geminiSneakerResearchResponseSchema);
    expect(schemaText).toContain('"colorwayName"');
    expect(schemaText).toContain('"styleCode"');
    expect(schemaText.match(/"nullable":true/gu)).toHaveLength(2);
  });

  it("normalizes brand, model, colorway, and style code independently", () => {
    expect(normalizeBrandName("ニューバランス")).toBe("New Balance");
    expect(normalizeModelName("New Balance", "New Balance 990v6")).toBe("New Balance 990v6");
    expect(normalizeModelName("Nike", "Nike Terminator High Black / White", "Black / White")).toBe("Nike Terminator High");
    expect(normalizeColorwayName(" Black / White ")).toBe("Black / White");
    expect(normalizeColorwayName("カラー未確認")).toBeNull();
    expect(normalizeStyleCode(" hf6870 001 ")).toBe("HF6870-001");
    expect(normalizeStyleCode("1234")).toBeNull();
  });

  it("classifies evidence conservatively by allowlisted domain", () => {
    expect(classifyEvidenceSourceQuality(["https://www.nike.com/jp/launch/t/test"])).toBe("official");
    expect(classifyEvidenceSourceQuality(["https://stockx.com/test"])).toBe("marketplace");
    expect(classifyEvidenceSourceQuality(["https://untrusted.example/test"])).toBe("unknown");
  });
});
