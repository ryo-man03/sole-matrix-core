import type { CandidateProfile } from "../core-v1/types";
import type {
  ColorwayVerificationState,
  MarketListing,
  MarketProviderId,
  MarketProviderResult,
  MarketProviderStatus,
  MarketSearchContext,
  MarketSearchResponse,
} from "./contracts";
import { isSafePublicHttpsUrl } from "./listing-match";
import { buildRakutenMarketQuery } from "./ui";

type BeginnerCandidate = Pick<
  CandidateProfile,
  "name" | "searchKeywords" | "brand" | "modelName" | "colorwayName" | "styleCode" | "verificationStatus" | "factualVerification" | "researchSource"
>;

export const BEGINNER_PURCHASE_CHECKLIST = [
  "モデル名・カラー・Style Codeが商品ページと一致するか",
  "メンズ／ウィメンズ表記とサイズ基準が自分に合うか",
  "新品・中古・再生品のどれか",
  "送料・税・関税を含む支払総額はいくらか",
  "返品条件とキャンセル条件を確認したか",
  "出品者またはショップの評価を確認したか",
  "付属品と箱の有無を確認したか",
  "真贋確認の仕組みがあるか",
  "価格と在庫の取得時刻が古くないか",
] as const;

export const PROVIDER_LABELS: Readonly<Record<MarketProviderId, string>> = {
  rakuten: "楽天市場",
  yahoo: "Yahoo!ショッピング",
  ebay: "eBay",
};

export const PROVIDER_PRICE_EXPLANATIONS: Readonly<Record<MarketProviderId, string>> = {
  rakuten: "ショップが現在表示している販売価格です。成約価格や市場相場ではありません。",
  yahoo: "ショップが現在表示している販売価格です。在庫・送料・サイズは販売先で再確認してください。",
  ebay: "現在出品されている商品の価格です。実際に売れた価格や平均落札価格ではありません。",
};

export function buildMarketSearchContext(candidate: BeginnerCandidate): MarketSearchContext {
  return {
    query: buildRakutenMarketQuery(candidate),
    identity: {
      brand: candidate.brand?.trim() || null,
      modelName: candidate.modelName?.trim() || candidate.name.trim(),
      colorwayName: verifiedColorwayState(candidate) === "model_color_style_verified"
        || verifiedColorwayState(candidate) === "model_color_verified"
        ? candidate.colorwayName?.trim() || null
        : null,
      styleCode: verifiedColorwayState(candidate) === "model_color_style_verified"
        ? candidate.styleCode?.trim() || null
        : null,
      verificationState: verifiedColorwayState(candidate),
    },
    gender: "unknown",
    sizeSystem: "UNKNOWN",
    size: null,
    condition: "unknown",
  };
}

export function verifiedColorwayState(candidate: BeginnerCandidate): ColorwayVerificationState {
  const modelVerified = candidate.factualVerification?.model === "officially_verified"
    || candidate.factualVerification?.model === "independently_verified"
    || candidate.verificationStatus === "model_and_colorway_verified"
    || candidate.verificationStatus === "model_verified_colorway_unverified"
    || candidate.researchSource === "fallback_catalog"
    || candidate.researchSource === "ryo_anchor";
  if (!modelVerified) return "unverified";
  const colorVerified = candidate.verificationStatus === "model_and_colorway_verified"
    && (candidate.factualVerification?.colorway === "officially_verified"
      || candidate.factualVerification?.colorway === "independently_verified");
  if (!colorVerified) return "model_only";
  const styleVerified = Boolean(candidate.styleCode)
    && (candidate.factualVerification?.styleCode === "officially_verified"
      || candidate.factualVerification?.styleCode === "independently_verified");
  return styleVerified ? "model_color_style_verified" : "model_color_verified";
}

export function verificationLabel(state: ColorwayVerificationState): string {
  if (state === "model_color_style_verified") return "モデル・カラー・Style Code確認済み";
  if (state === "model_color_verified") return "モデル・カラー確認済み";
  if (state === "model_only") return "モデルのみ確認済み（カラー未確認）";
  return "候補の事実確認が必要";
}

export function matchLabel(level: MarketListing["matchLevel"]): string {
  if (level === "exact") return "推薦モデルと完全一致";
  if (level === "high") return "推薦モデルと一致する可能性が高い（Style Code未確認）";
  return "関連候補：別カラー・別世代・別サイズの可能性";
}

export function priceSemanticLabel(listing: MarketListing): string {
  if (listing.priceType === "current_listing_price") return "現在の出品価格";
  return "現在の販売価格";
}

export function providerStatusMessage(status: MarketProviderStatus): string {
  if (status === "success") return "価格情報を取得しました。";
  if (status === "empty") return "一致する販売商品を確認できませんでした。";
  if (status === "not_configured" || status === "unauthorized") return "この価格サービスは現在利用できません。";
  if (status === "timeout") return "価格情報の取得に時間がかかっています。推薦結果はそのまま確認できます。";
  if (status === "rate_limited") return "現在この価格サービスへのアクセスが集中しています。";
  if (status === "schema_error") return "価格情報を安全に表示できなかったため、今回は表示していません。";
  return "価格情報を取得できませんでした。推薦結果には影響しません。";
}

export function parseMarketSearchResponse(value: unknown): MarketSearchResponse | null {
  if (!isRecord(value) || typeof value["query"] !== "string" || typeof value["searchedAt"] !== "string"
    || value["recommendationRankingChanged"] !== false || !Array.isArray(value["providers"])) return null;
  const providers = value["providers"].flatMap((item): MarketProviderResult[] => {
    const parsed = parseProvider(item);
    return parsed ? [parsed] : [];
  });
  if (providers.length !== value["providers"].length || providers.length > 3) return null;
  return { query: value["query"], searchedAt: value["searchedAt"], recommendationRankingChanged: false, providers };
}

function parseProvider(value: unknown): MarketProviderResult | null {
  if (!isRecord(value) || !isProvider(value["provider"]) || !isProviderStatus(value["status"])
    || !Array.isArray(value["listings"]) || typeof value["message"] !== "string" || !isAudit(value["audit"], value["provider"])) return null;
  const listings = value["listings"].filter(isListing).slice(0, 10);
  if (listings.length !== value["listings"].length) return null;
  const audit = value["audit"] as MarketProviderResult["audit"];
  return { provider: value["provider"], status: value["status"], listings, audit, message: value["message"].slice(0, 240) };
}

function isAudit(value: unknown, provider: MarketProviderId): value is MarketProviderResult["audit"] {
  if (!isRecord(value) || value["provider"] !== provider || !isRecord(value["currencyCount"])) return false;
  const numericKeys = [
    "normalizedCount", "exactCount", "highCount", "relatedCount", "rejectedCount",
    "missingStyleCodeCount", "missingColorwayCount", "missingSizeCount", "missingConditionCount",
    "missingShippingCount", "generationConflictCount", "genderConflictCount", "sizeConflictCount",
    "schemaWarningCount", "unsafeUrlCount", "duplicateCount",
  ];
  return numericKeys.every((key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0)
    && Object.entries(value["currencyCount"]).every(([currency, count]) => /^[A-Z]{3}$/u.test(currency) && Number.isSafeInteger(count) && Number(count) >= 0);
}

function isListing(value: unknown): value is MarketListing {
  if (!isRecord(value) || !isProvider(value["provider"]) || typeof value["title"] !== "string"
    || typeof value["price"] !== "number" || !Number.isFinite(value["price"]) || value["price"] < 0
    || typeof value["currency"] !== "string" || !/^[A-Z]{3}$/u.test(value["currency"])
    || typeof value["itemUrl"] !== "string" || !isSafePublicHttpsUrl(value["itemUrl"])
    || !["current_retail_price", "current_listing_price"].includes(String(value["priceType"]))
    || !["exact", "high", "related"].includes(String(value["matchLevel"]))
    || typeof value["fetchedAt"] !== "string") return false;
  return value["imageUrl"] === null || (typeof value["imageUrl"] === "string" && isSafePublicHttpsUrl(value["imageUrl"]));
}

function isProvider(value: unknown): value is MarketProviderId {
  return typeof value === "string" && ["rakuten", "yahoo", "ebay"].includes(value);
}

function isProviderStatus(value: unknown): value is MarketProviderStatus {
  return typeof value === "string" && ["success", "empty", "not_configured", "unauthorized", "rate_limited", "timeout", "network_error", "schema_error", "temporarily_unavailable"].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
