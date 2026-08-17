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
import { emptyProviderAudit } from "./contracts";
import { isSafePublicHttpsUrl } from "./listing-match";
import { parseMarketProviderResult } from "./runtime-validation";
import { buildRakutenMarketQuery } from "./ui";

type BeginnerCandidate = Pick<
  CandidateProfile,
  "name" | "searchKeywords" | "brand" | "modelName" | "colorwayName" | "styleCode" | "verificationStatus" | "factualVerification" | "researchSource"
>;

export const BEGINNER_PURCHASE_CHECKLIST = [
  "商品名とカラーが販売ページと一致するか",
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
  if (state === "model_color_style_verified") return "商品情報を確認済み";
  if (state === "model_color_verified") return "カラーまで確認済み";
  if (state === "model_only") return "カラーは確認できませんでした";
  return "商品情報を確認中";
}

export function matchLabel(level: MarketListing["matchLevel"]): string {
  if (level === "exact") return "おすすめ商品と一致";
  if (level === "probable") return "おすすめ商品と一致する可能性が高い";
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
    || !isDateString(value["searchedAt"])
    || value["recommendationRankingChanged"] !== false || !Array.isArray(value["providers"])
    || value["providers"].length > 3) return null;
  const providers: MarketProviderResult[] = [];
  const seenProviders = new Set<MarketProviderId>();
  for (const item of value["providers"]) {
    if (!isRecord(item) || !isProvider(item["provider"]) || seenProviders.has(item["provider"])) return null;
    seenProviders.add(item["provider"]);
    providers.push(parseMarketProviderResult(item, item["provider"]));
  }
  return { query: value["query"], searchedAt: value["searchedAt"], recommendationRankingChanged: false, providers };
}

function schemaErrorProvider(provider: MarketProviderId): MarketProviderResult {
  return {
    provider,
    status: "schema_error",
    listings: [],
    fetchedAt: null,
    audit: emptyProviderAudit(provider),
    message: "価格情報を安全に検証できなかったため、この販売先の結果だけを表示していません。",
  };
}

function isAudit(value: unknown, provider: MarketProviderId): value is MarketProviderResult["audit"] {
  if (!isRecord(value) || value["provider"] !== provider || !isRecord(value["currencyCount"])) return false;
  const numericKeys = [
    "normalizedCount", "exactCount", "probableCount", "relatedCount", "rejectedCount",
    "missingStyleCodeCount", "missingColorwayCount", "missingSizeCount", "missingConditionCount",
    "missingShippingCount", "generationConflictCount", "audienceConflictCount", "sizeConflictCount",
    "schemaWarningCount", "unsafeUrlCount", "duplicateCount",
  ];
  return numericKeys.every((key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0)
    && Object.entries(value["currencyCount"]).every(([currency, count]) => /^[A-Z]{3}$/u.test(currency) && Number.isSafeInteger(count) && Number(count) >= 0);
}

function isListing(value: unknown, provider: MarketProviderId): value is MarketListing {
  if (!isRecord(value) || value["provider"] !== provider
    || !isNullableString(value["externalId"])
    || typeof value["title"] !== "string" || value["title"].trim().length === 0
    || !isNullableString(value["canonicalBrand"])
    || !isNullableString(value["canonicalModelName"])
    || !isNullableString(value["modelFamily"])
    || !isNullableString(value["generation"])
    || !isNullableString(value["colorwayName"])
    || !isNullableString(value["styleCode"])
    || !["men", "women", "unisex", "kids", "unknown"].includes(String(value["audience"]))
    || typeof value["price"] !== "number" || !Number.isFinite(value["price"]) || value["price"] < 0
    || typeof value["currency"] !== "string" || !/^[A-Z]{3}$/u.test(value["currency"])
    || !isNullableMoney(value["shippingPrice"])
    || typeof value["shippingKnown"] !== "boolean"
    || !isNullableMoney(value["totalDisplayedPrice"])
    || typeof value["itemUrl"] !== "string" || !isSafePublicHttpsUrl(value["itemUrl"])
    || !isProviderPriceType(value["priceType"], provider)
    || !["fixed_price", "auction", "unknown"].includes(String(value["listingFormat"]))
    || !["new", "used", "unknown"].includes(String(value["condition"]))
    || !isNullableString(value["providerConditionLabel"])
    || !["US_M", "US_W", "UK", "EU", "JP", "UNKNOWN"].includes(String(value["sizeSystem"]))
    || !isNullableString(value["size"])
    || !(value["inStock"] === null || typeof value["inStock"] === "boolean")
    || !isNullableString(value["shopName"])
    || !["exact", "probable", "related"].includes(String(value["matchLevel"]))
    || !isStringArray(value["matchReasons"])
    || !isStringArray(value["mismatchWarnings"])
    || !isDateString(value["fetchedAt"])
    || !(value["cacheExpiresAt"] === null || isDateString(value["cacheExpiresAt"]))) return false;
  return value["imageUrl"] === null || (typeof value["imageUrl"] === "string" && isSafePublicHttpsUrl(value["imageUrl"]));
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableMoney(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 40 && value.every((item) => typeof item === "string" && item.length <= 500);
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value));
}

function isProviderPriceType(value: unknown, provider: MarketProviderId): value is MarketListing["priceType"] {
  return provider === "ebay" ? value === "current_listing_price" : value === "current_retail_price";
}

function isProvider(value: unknown): value is MarketProviderId {
  return typeof value === "string" && ["rakuten", "yahoo", "ebay"].includes(value);
}

function isProviderStatus(value: unknown): value is MarketProviderStatus {
  return typeof value === "string" && ["success", "empty", "not_configured", "unauthorized", "rate_limited", "timeout", "schema_error", "temporarily_unavailable", "policy_disabled"].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
