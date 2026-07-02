export type GeminiSneakerResearchCandidate = {
  brand: string;
  modelName: string;
  modelType: string;
  reason: string;
  cautions: string[];
  searchKeywords: string[];
  evidenceUrls: string[];
  confidence: number;
};

export type GeminiSneakerResearchResult = {
  candidates: GeminiSneakerResearchCandidate[];
};

const abstractPatterns = [
  "型",
  "タイプ",
  "系",
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
] as const;

export function isAbstractSneakerName(modelName: string): boolean {
  const normalized = modelName.normalize("NFKC").trim();
  if (!normalized) return true;
  return abstractPatterns.some((pattern) => normalized.includes(pattern));
}

export function validateEvidenceUrls(urls: string[]): string[] {
  return [...new Set(urls.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }))];
}

export function validateGeminiSneakerResearchResult(
  value: unknown,
): GeminiSneakerResearchResult | null {
  if (!isRecord(value) || !Array.isArray(value["candidates"])) return null;

  const candidates = value["candidates"]
    .slice(0, 5)
    .map(validateCandidate)
    .filter((candidate): candidate is GeminiSneakerResearchCandidate => Boolean(candidate));

  return candidates.length > 0 ? { candidates } : null;
}

function validateCandidate(value: unknown): GeminiSneakerResearchCandidate | null {
  if (!isRecord(value)) return null;
  const brand = cleanText(value["brand"], 80);
  const modelName = cleanText(value["modelName"], 160);
  const modelType = cleanText(value["modelType"], 100);
  const reason = cleanText(value["reason"], 240);
  const cautions = cleanTextArray(value["cautions"], 2, 180);
  const searchKeywords = cleanTextArray(value["searchKeywords"], 6, 180);
  const rawEvidenceUrls = cleanTextArray(value["evidenceUrls"], 6, 2_048);
  const confidence = value["confidence"];

  if (
    !brand || !modelName || isAbstractSneakerName(modelName) || !modelType ||
    !reason || !cautions || !searchKeywords || !rawEvidenceUrls ||
    typeof confidence !== "number" || !Number.isFinite(confidence) ||
    confidence < 0 || confidence > 1
  ) return null;

  const normalizedModelName = normalizeSearchText(modelName);
  if (!searchKeywords.some((keyword) => normalizeSearchText(keyword).includes(normalizedModelName))) {
    return null;
  }
  const evidenceUrls = validateEvidenceUrls(rawEvidenceUrls);
  if (evidenceUrls.length < 1) return null;

  return {
    brand,
    modelName,
    modelType,
    reason,
    cautions,
    searchKeywords,
    evidenceUrls,
    confidence: Math.round(confidence * 100) / 100,
  };
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
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
