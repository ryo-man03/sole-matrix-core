import type { CandidateProfile } from "../core-v1/types";
import type {
  ColorwayVerificationState,
  MarketListing,
  MarketProviderId,
  MarketProviderStatus,
  MarketSearchContext,
  MarketSearchResponse,
} from "./contracts";
import { parseMarketProviderResult } from "./runtime-validation";
import { buildRakutenMarketQuery } from "./ui";

type BeginnerCandidate = Pick<
  CandidateProfile,
  "name" | "searchKeywords" | "brand" | "modelName" | "colorwayName" | "styleCode" | "verificationStatus" | "factualVerification" | "researchSource"
>;

export const BEGINNER_PURCHASE_CHECKLIST = [
  "商品名・カラー・商品番号が販売ページと一致するか",
  "メンズ・ウィメンズ表記とサイズ基準が自分に合うか",
  "新品・中古・状態未確認のどれか",
  "送料・税・関税を含む支払総額はいくらか",
  "返品条件とキャンセル条件を確認したか",
  "出品者またはショップの評価を確認したか",
  "付属品と箱の有無を確認したか",
  "正規品確認の仕組みがあるか",
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
  const verificationState = verifiedColorwayState(candidate);
  return {
    query: buildRakutenMarketQuery(candidate),
    identity: {
      brand: candidate.brand?.trim() || null,
      modelName: candidate.modelName?.trim() || candidate.name.trim(),
      colorwayName: verificationState === "model_color_style_verified" || verificationState === "model_color_verified"
        ? candidate.colorwayName?.trim() || null : null,
      styleCode: verificationState === "model_color_style_verified" ? candidate.styleCode?.trim() || null : null,
      verificationState,
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
  if (state === "model_color_style_verified") return "商品番号とカラーまで確認済み";
  if (state === "model_color_verified") return "カラーまで確認済み";
  if (state === "model_only") return "モデルのみ確認済み（カラーは未確認）";
  return "商品情報を追加確認してください";
}

export function matchLabel(level: MarketListing["matchLevel"]): string {
  if (level === "exact") return "おすすめ商品と一致";
  if (level === "probable") return "おすすめ商品と一致する可能性が高い";
  if (level === "related") return "関連候補（別カラー・別世代などの可能性）";
  return "一致しないため除外";
}

export function priceSemanticLabel(listing: MarketListing): string {
  return listing.priceType === "current_listing_price" ? "現在の出品価格" : "現在の販売価格";
}

export function providerStatusMessage(status: MarketProviderStatus): string {
  if (status === "success") return "販売・出品情報を取得しました。";
  if (status === "empty") return "一致する商品を確認できませんでした。";
  if (status === "not_configured" || status === "unauthorized") return "この販売サービスは現在利用できません。";
  if (status === "timeout") return "取得に時間がかかっています。他の販売先の結果は確認できます。";
  if (status === "rate_limited") return "この販売サービスへのアクセスが集中しています。";
  if (status === "schema_error") return "安全に検証できなかったため、この販売先は表示していません。";
  if (status === "policy_disabled") return "利用方針により、この販売サービスは無効です。";
  return "販売・出品情報を取得できませんでした。他の結果には影響しません。";
}

export function parseMarketSearchResponse(value: unknown): MarketSearchResponse | null {
  if (!isRecord(value) || typeof value.query !== "string" || value.query.length > 128
    || typeof value.searchedAt !== "string" || !Number.isFinite(Date.parse(value.searchedAt))
    || value.recommendationRankingChanged !== false || !Array.isArray(value.providers) || value.providers.length > 3) return null;
  const providers = [];
  const seen = new Set<MarketProviderId>();
  for (const item of value.providers) {
    if (!isRecord(item) || !isProvider(item.provider) || seen.has(item.provider)) return null;
    seen.add(item.provider);
    providers.push(parseMarketProviderResult(item, item.provider));
  }
  return { query: value.query, searchedAt: value.searchedAt, recommendationRankingChanged: false, providers };
}

function isProvider(value: unknown): value is MarketProviderId {
  return typeof value === "string" && ["rakuten", "yahoo", "ebay"].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
