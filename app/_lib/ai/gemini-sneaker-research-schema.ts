export type EvidenceUrlType =
  | "direct_product_url"
  | "search_entry_url"
  | "gemini_citation_url";

export type GeminiResearchEvidenceLink = {
  url: string;
  type: EvidenceUrlType;
};

export type ColorwayVerificationStatus =
  | "model_and_colorway_verified"
  | "model_verified_colorway_unverified"
  | "unverified";

export type EvidenceSourceQuality =
  | "official"
  | "authorized_retailer"
  | "reputable_retailer"
  | "reputable_media"
  | "marketplace"
  | "unknown";

export type GeminiSneakerResearchCandidate = {
  brand: string;
  modelName: string;
  colorwayName: string | null;
  styleCode: string | null;
  modelType: string;
  reason: string;
  cautions: string[];
  searchKeywords: string[];
  modelEvidenceUrls: string[];
  colorwayEvidenceUrls: string[];
  styleCodeEvidenceUrls: string[];
  evidenceUrls: string[];
  evidenceLinks: GeminiResearchEvidenceLink[];
  verificationStatus: ColorwayVerificationStatus;
  sourceQuality: EvidenceSourceQuality;
  factualVerification: import("../recommendation-trust/types").FactualVerification;
  confidence: number;
  researchOrigin: "gemini";
};

export type GeminiSneakerResearchResult = {
  candidates: GeminiSneakerResearchCandidate[];
};

export type GeminiSneakerResearchDraftCandidate = Omit<
  GeminiSneakerResearchCandidate,
  | "modelEvidenceUrls"
  | "colorwayEvidenceUrls"
  | "styleCodeEvidenceUrls"
  | "evidenceUrls"
  | "evidenceLinks"
  | "verificationStatus"
  | "sourceQuality"
  | "factualVerification"
  | "researchOrigin"
> & {
  sourceModelName: string;
  sourceColorwayName: string | null;
  sourceStyleCode: string | null;
};

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
          modelName: { type: "STRING", description: "調査メモにある具体的な正式モデル名。カラー名を含めない" },
          colorwayName: { type: "STRING", nullable: true, description: "実在根拠がある正式カラー名。確認できない場合はnull" },
          styleCode: { type: "STRING", nullable: true, description: "根拠があるSKU / Style Code。確認できない場合はnull" },
          modelType: { type: "STRING", description: "モデルの短い分類" },
          reason: { type: "STRING", description: "診断回答と結びつく120字以内の理由" },
          cautions: { type: "ARRAY", maxItems: 2, items: { type: "STRING" } },
          searchKeywords: { type: "ARRAY", minItems: 1, maxItems: 3, items: { type: "STRING" } },
          confidence: { type: "NUMBER", minimum: 0, maximum: 1 },
        },
        required: ["brand", "modelName", "colorwayName", "styleCode", "modelType", "reason", "cautions", "searchKeywords", "confidence"],
      },
    },
  },
  required: ["candidates"],
} as const;

const abstractPatterns = [
  "型", "タイプ", "おすすめ", "クラシック・デイリー", "ストリート・ボリューム",
  "コンフォート・ランナー", "きれいめ", "ローテク", "ハイテク", "定番",
  "カジュアル向け", "ストリート向け", "初心者向け", "レトロなスニーカー",
  "白いスニーカー", "人気モデル", "ランニング系", "custom", "inspired",
  "style", "type", "風商品", "風モデル",
] as const;

const brandOnlyNames = new Set([
  "adidas", "asics", "converse", "hoka", "new balance", "nike", "puma", "reebok", "vans",
]);

const canonicalModelNames = new Map<string, string>([
  ["nike|air force 1 low retro", "Nike Air Force 1 Low Retro"],
  ["nike|エア フォース 1 ロー レトロ", "Nike Air Force 1 Low Retro"],
  ["adidas|samba og", "adidas Samba OG"],
  ["adidas|サンバ og", "adidas Samba OG"],
  ["new balance|991", "New Balance 991"],
  ["asics|gel kayano 14", "ASICS GEL-KAYANO 14"],
  ["asics|ゲル カヤノ 14", "ASICS GEL-KAYANO 14"],
  ["puma|suede classic", "PUMA Suede Classic"],
  ["puma|スウェード クラシック", "PUMA Suede Classic"],
  ["puma|スエード クラシック", "PUMA Suede Classic"],
]);

const canonicalBrandNames = new Map<string, string>([
  ["nike", "Nike"], ["ナイキ", "Nike"],
  ["adidas", "adidas"], ["アディダス", "adidas"],
  ["new balance", "New Balance"], ["ニューバランス", "New Balance"],
  ["asics", "ASICS"], ["アシックス", "ASICS"],
  ["puma", "PUMA"], ["プーマ", "PUMA"],
  ["converse", "Converse"], ["コンバース", "Converse"],
  ["vans", "Vans"], ["ヴァンズ", "Vans"], ["バンズ", "Vans"],
  ["reebok", "Reebok"], ["リーボック", "Reebok"],
  ["hoka", "HOKA"], ["ホカ", "HOKA"],
  ["pro keds", "PRO-Keds"], ["pro-keds", "PRO-Keds"],
]);

const qualityDomains: Readonly<Record<Exclude<EvidenceSourceQuality, "unknown">, readonly string[]>> = {
  official: ["nike.com", "adidas.com", "adidas.jp", "converse.co.jp", "converse.com", "puma.com", "newbalance.com", "newbalance.jp", "asics.com", "asics.com/jp", "vans.com", "reebok.com"],
  authorized_retailer: ["atmos-tokyo.com", "mita-sneakers.co.jp", "billys-tokyo.net", "undefeated.jp"],
  reputable_retailer: ["ssense.com", "endclothing.com", "sneakersnstuff.com", "slamjam.com", "size.co.uk"],
  reputable_media: ["sneakernews.com", "hypebeast.com", "highsnobiety.com", "complex.com"],
  marketplace: ["stockx.com", "goat.com", "ebay.com", "snkrdunk.com", "rakuten.co.jp", "rakuten.com"],
};

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

export function classifyEvidenceSourceQuality(urls: readonly string[]): EvidenceSourceQuality {
  const hosts = validateEvidenceUrls([...urls]).flatMap((url) => {
    try {
      return [new URL(url).hostname.toLocaleLowerCase("en-US").replace(/^www\./u, "")];
    } catch {
      return [];
    }
  });
  const order: Exclude<EvidenceSourceQuality, "unknown">[] = [
    "official", "authorized_retailer", "reputable_retailer", "reputable_media", "marketplace",
  ];
  return order.find((quality) =>
    hosts.some((host) => qualityDomains[quality].some((domain) => host === domain || host.endsWith(`.${domain}`))),
  ) ?? "unknown";
}

export function normalizeBrandName(value: string): string | null {
  const cleaned = cleanText(value, 80);
  if (!cleaned) return null;
  const normalized = normalizeSearchText(cleaned);
  const canonical = canonicalBrandNames.get(normalized);
  if (canonical) return canonical;
  if (containsJapanese(cleaned) || !/[A-Za-z]/u.test(cleaned)) return null;
  return cleaned;
}

export function normalizeModelName(brand: string, modelName: string, colorwayName?: string | null): string | null {
  const cleaned = cleanText(modelName, 160);
  if (!cleaned) return null;
  const canonicalBrand = normalizeBrandName(brand);
  if (!canonicalBrand) return null;
  const rawBrandAliases = [...canonicalBrandNames.entries()]
    .filter(([, value]) => value === canonicalBrand)
    .map(([alias]) => alias);
  let withoutBrand = cleaned;
  for (const alias of [canonicalBrand, ...rawBrandAliases].sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`^${escapeRegExp(alias).replace(/\\ /gu, "\\s+")}[\\s-]+`, "iu");
    withoutBrand = withoutBrand.replace(pattern, "");
  }
  if (colorwayName) {
    const color = cleanText(colorwayName, 120);
    if (color) {
      withoutBrand = withoutBrand.replace(new RegExp(`[\\s"'(/-]*${escapeRegExp(color)}[\\s"')/-]*$`, "iu"), "").trim();
    }
  }
  const normalizedModel = normalizeSearchText(withoutBrand);
  const canonical = canonicalModelNames.get(`${normalizeSearchText(canonicalBrand)}|${normalizedModel}`);
  if (canonical) return canonical;
  if (!normalizedModel || containsJapanese(withoutBrand) || isAbstractSneakerName(withoutBrand, canonicalBrand)) return null;
  return `${canonicalBrand} ${withoutBrand}`.replace(/\s+/gu, " ").trim();
}

export function normalizeColorwayName(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = cleanText(value, 120);
  if (!cleaned || containsJapanese(cleaned)) return null;
  if (/^(?:unknown|unconfirmed|n\/a|none|null|未確認)$/iu.test(cleaned)) return null;
  return cleaned;
}

export function normalizeStyleCode(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = cleanText(value, 40)?.toLocaleUpperCase("en-US").replace(/\s+/gu, "-") ?? "";
  if (!/^[A-Z0-9][A-Z0-9-]{3,29}$/u.test(cleaned)) return null;
  if (!/[A-Z]/u.test(cleaned) || !/[0-9]/u.test(cleaned)) return null;
  return cleaned;
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
  const sourceBrand = cleanText(value["brand"], 80);
  const sourceModelName = cleanText(value["modelName"], 160);
  const sourceColorwayName = value["colorwayName"] === null ? null : cleanText(value["colorwayName"], 120);
  const sourceStyleCode = value["styleCode"] === null ? null : cleanText(value["styleCode"], 40);
  const brand = sourceBrand ? normalizeBrandName(sourceBrand) : null;
  const colorwayName = normalizeColorwayName(sourceColorwayName);
  const modelName = brand && sourceModelName ? normalizeModelName(brand, sourceModelName, colorwayName) : null;
  const styleCode = normalizeStyleCode(sourceStyleCode);
  const modelType = cleanText(value["modelType"], 100);
  const reason = cleanText(value["reason"], 240);
  const cautions = cleanTextArray(value["cautions"], 2, 180);
  const searchKeywords = cleanTextArray(value["searchKeywords"], 3, 180);
  const confidence = value["confidence"];

  if (
    !brand || !sourceModelName || !modelName || isAbstractSneakerName(modelName, brand) || !modelType ||
    !reason || !cautions || !searchKeywords || searchKeywords.length < 1 ||
    typeof confidence !== "number" || !Number.isFinite(confidence) ||
    confidence < 0 || confidence > 1
  ) return null;

  const normalizedSourceModelName = normalizeSearchText(sourceModelName);
  const normalizedOfficialModelName = normalizeSearchText(modelName);
  if (!searchKeywords.some((keyword) => {
    const normalizedKeyword = normalizeSearchText(keyword);
    return normalizedKeyword.includes(normalizedSourceModelName)
      || normalizedKeyword.includes(normalizedOfficialModelName);
  })) return null;

  return {
    brand,
    modelName,
    colorwayName,
    styleCode,
    sourceModelName,
    sourceColorwayName: colorwayName,
    sourceStyleCode: styleCode,
    modelType,
    reason,
    cautions,
    searchKeywords,
    confidence: Math.round(confidence * 100) / 100,
  };
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]+/gu, " ")
    .replace(/\s+/gu, " ")
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

function containsJapanese(value: string): boolean {
  return /\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Han}/u.test(value);
}

function isPublicHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
