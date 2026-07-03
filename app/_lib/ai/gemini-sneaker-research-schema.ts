export type EvidenceUrlType =
  | "direct_product_url"
  | "search_entry_url"
  | "gemini_citation_url";

export type GeminiResearchEvidenceLink = {
  url: string;
  type: EvidenceUrlType;
};

export type GeminiSneakerResearchCandidate = {
  brand: string;
  modelName: string;
  modelType: string;
  reason: string;
  cautions: string[];
  searchKeywords: string[];
  evidenceUrls: string[];
  evidenceLinks: GeminiResearchEvidenceLink[];
  confidence: number;
  researchOrigin: "gemini";
};

export type GeminiSneakerResearchResult = {
  candidates: GeminiSneakerResearchCandidate[];
};

export type GeminiSneakerResearchDraftCandidate = Omit<
  GeminiSneakerResearchCandidate,
  "evidenceUrls" | "evidenceLinks" | "researchOrigin"
> & { sourceModelName: string };

export type GeminiSneakerResearchDraftResult = {
  candidates: GeminiSneakerResearchDraftCandidate[];
};

export type DraftValidationFailure =
  | "schema_invalid"
  | "no_candidates"
  | "model_name_too_abstract";

export const geminiSneakerResearchResponseSchema = {
  type: "OBJECT",
  properties: {
    candidates: {
      type: "ARRAY",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "OBJECT",
        properties: {
          brand: { type: "STRING", description: "スニーカーのブランド名" },
          modelName: { type: "STRING", description: "調査メモにある具体的なモデル名" },
          modelType: { type: "STRING", description: "モデルの短い分類" },
          reason: { type: "STRING", description: "診断回答と結びつく120字以内の理由" },
          cautions: { type: "ARRAY", maxItems: 2, items: { type: "STRING" } },
          searchKeywords: { type: "ARRAY", minItems: 1, maxItems: 3, items: { type: "STRING" } },
          confidence: { type: "NUMBER", minimum: 0, maximum: 1 },
        },
        required: ["brand", "modelName", "modelType", "reason", "cautions", "searchKeywords", "confidence"],
      },
    },
  },
  required: ["candidates"],
} as const;

const abstractPatterns = [
  "型",
  "タイプ",
  "おすすめ",
  "クラシック・デイリー",
  "ストリート・ボリューム",
  "コンフォート・ランナー",
  "きれいめ",
  "ローテク",
  "ハイテク",
  "定番",
  "カジュアル向け",
  "ストリート向け",
  "初心者向け",
  "レトロなスニーカー",
  "白いスニーカー",
  "人気モデル",
  "ランニング系",
] as const;

const brandOnlyNames = new Set([
  "adidas",
  "asics",
  "converse",
  "new balance",
  "nike",
  "puma",
  "vans",
]);

const canonicalModelNames = new Map([
  ["nike|air force 1 low retro", "Nike Air Force 1 Low Retro"],
  ["ナイキ|エア フォース 1 ロー レトロ", "Nike Air Force 1 Low Retro"],
  ["adidas|samba og", "adidas Samba OG"],
  ["アディダス|サンバ og", "adidas Samba OG"],
  ["new balance|991", "New Balance 991"],
  ["ニューバランス|991", "New Balance 991"],
  ["asics|gel kayano 14", "ASICS GEL-KAYANO 14"],
  ["アシックス|ゲル カヤノ 14", "ASICS GEL-KAYANO 14"],
  ["puma|suede classic", "PUMA Suede Classic"],
  ["プーマ|スウェード クラシック", "PUMA Suede Classic"],
  ["プーマ|スエード クラシック", "PUMA Suede Classic"],
]);

const canonicalBrandNames = new Map([
  ["nike", "Nike"],
  ["ナイキ", "Nike"],
  ["adidas", "adidas"],
  ["アディダス", "adidas"],
  ["new balance", "New Balance"],
  ["ニューバランス", "New Balance"],
  ["asics", "ASICS"],
  ["アシックス", "ASICS"],
  ["puma", "PUMA"],
  ["プーマ", "PUMA"],
]);

export function isAbstractSneakerName(modelName: string, brand?: string): boolean {
  const normalized = normalizeSearchText(modelName);
  if (!normalized) return true;
  if (abstractPatterns.some((pattern) => normalized.includes(normalizeSearchText(pattern)))) return true;
  if (brandOnlyNames.has(normalized)) return true;
  return Boolean(brand && normalized === normalizeSearchText(brand));
}

export function validateEvidenceUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(isPublicHttpUrl))];
}

export function validateGeminiSneakerResearchDraft(
  value: unknown,
): { ok: true; result: GeminiSneakerResearchDraftResult } | { ok: false; reasonCode: DraftValidationFailure } {
  if (!isRecord(value) || !Array.isArray(value["candidates"])) {
    return { ok: false, reasonCode: "schema_invalid" };
  }
  if (value["candidates"].length < 1) return { ok: false, reasonCode: "no_candidates" };

  let sawAbstractName = false;
  const candidates = value["candidates"]
    .slice(0, 3)
    .map((candidate) => {
      if (isRecord(candidate) && typeof candidate["modelName"] === "string") {
        const brand = typeof candidate["brand"] === "string" ? candidate["brand"] : undefined;
        sawAbstractName ||= isAbstractSneakerName(candidate["modelName"], brand);
      }
      return validateCandidate(candidate);
    })
    .filter((candidate): candidate is GeminiSneakerResearchDraftCandidate => Boolean(candidate));

  if (candidates.length > 0) return { ok: true, result: { candidates } };
  return { ok: false, reasonCode: sawAbstractName ? "model_name_too_abstract" : "schema_invalid" };
}

function validateCandidate(value: unknown): GeminiSneakerResearchDraftCandidate | null {
  if (!isRecord(value)) return null;
  const brand = cleanText(value["brand"], 80);
  const modelName = cleanText(value["modelName"], 160);
  const modelType = cleanText(value["modelType"], 100);
  const reason = cleanText(value["reason"], 240);
  const cautions = cleanTextArray(value["cautions"], 2, 180);
  const searchKeywords = cleanTextArray(value["searchKeywords"], 3, 180);
  const confidence = value["confidence"];

  if (
    !brand || !modelName || isAbstractSneakerName(modelName, brand) || !modelType ||
    !reason || !cautions || !searchKeywords || searchKeywords.length < 1 ||
    typeof confidence !== "number" || !Number.isFinite(confidence) ||
    confidence < 0 || confidence > 1
  ) return null;

  const normalizedModelName = normalizeSearchText(modelName);
  if (!searchKeywords.some((keyword) => normalizeSearchText(keyword).includes(normalizedModelName))) {
    return null;
  }

  const officialModelName = normalizeOfficialModelName(brand, modelName);
  if (!officialModelName) return null;

  return {
    brand,
    modelName: officialModelName,
    sourceModelName: modelName,
    modelType,
    reason,
    cautions,
    searchKeywords,
    confidence: Math.round(confidence * 100) / 100,
  };
}

function normalizeOfficialModelName(brand: string, modelName: string): string | null {
  const normalizedBrand = normalizeSearchText(brand);
  const normalizedModel = normalizeSearchText(modelName);
  const modelWithoutBrand = normalizedModel.startsWith(`${normalizedBrand} `)
    ? normalizedModel.slice(normalizedBrand.length + 1)
    : normalizedModel;
  const canonical = canonicalModelNames.get(`${normalizedBrand}|${modelWithoutBrand}`);
  if (canonical) return canonical;
  if (/\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Han}/u.test(modelWithoutBrand)) return null;
  const canonicalBrand = canonicalBrandNames.get(normalizedBrand);
  if (!canonicalBrand) return null;
  if (normalizedModel.startsWith(`${normalizedBrand} `) && canonicalBrand === brand) return modelName;
  return `${canonicalBrand} ${modelWithoutBrand}`;
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function cleanTextArray(value: unknown, maxItems: number, maxLength: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const output = value.map((item) => cleanText(item, maxLength));
  return output.some((item) => !item) ? null : output as string[];
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function isPublicHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
