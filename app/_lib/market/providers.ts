import "server-only";

import {
  RakutenApiError,
  RakutenCredentialsMissingError,
  searchRakutenProducts,
} from "./rakuten";
import type {
  MarketListing,
  MarketProviderId,
  MarketProviderResult,
  MarketSearchContext,
} from "./contracts";
import { emptyProviderAudit } from "./contracts";
import {
  auditListings,
  dedupeListings,
  finalizeListing,
  isSafePublicHttpsUrl,
  matchMarketListing,
  normalizeCondition,
  normalizeListingFormat,
  normalizeSizeSystem,
  styleCodeFromTitle,
  type ListingDraft,
} from "./listing-match";
import { fetchMarketJson, MarketProviderRequestError } from "./provider-request";
import { getEbayApplicationToken, invalidateEbayApplicationToken } from "./ebay-token-manager";
import type { ProviderVerificationStatus } from "./provider-policy";

export type MarketProviderCapability = Readonly<{
  provider: MarketProviderId | "stockx" | "alias";
  status: ProviderVerificationStatus;
  priceSemantics: readonly string[];
  automatedSearch: boolean;
  persistentStorage: boolean;
}>;

export const MARKET_PROVIDER_CAPABILITIES: readonly MarketProviderCapability[] = [
  { provider: "rakuten", status: "implemented_unverified", priceSemantics: ["current_retail_price"], automatedSearch: true, persistentStorage: false },
  { provider: "yahoo", status: "implemented_unverified", priceSemantics: ["current_retail_price"], automatedSearch: true, persistentStorage: false },
  { provider: "ebay", status: "implemented_unverified", priceSemantics: ["current_listing_price"], automatedSearch: true, persistentStorage: false },
  { provider: "stockx", status: "policy_blocked", priceSemantics: [], automatedSearch: false, persistentStorage: false },
  { provider: "alias", status: "approval_pending", priceSemantics: [], automatedSearch: false, persistentStorage: false },
] as const;

export async function searchRakutenListings(
  context: MarketSearchContext,
): Promise<MarketProviderResult> {
  if (providersDisabled()) return unavailable("rakuten", "外部価格サービスはこの環境では無効です。", "not_configured");
  try {
    const products = await searchRakutenProducts({ query: context.query, hits: 10, page: 1 });
    const drafts: ListingDraft[] = products.map((product) => ({
      provider: "rakuten",
      externalId: product.itemCode ?? null,
      title: product.title,
      canonicalBrand: product.brand,
      canonicalModelName: product.normalizedModelName,
      modelFamily: context.identity.modelName,
      generation: generationFromText(product.title),
      colorwayName: null,
      styleCode: styleCodeFromTitle(product.title, context.identity.styleCode),
      audience: audienceFromText(product.title),
      price: product.price ?? Number.NaN,
      currency: "JPY",
      shippingPrice: null,
      shippingKnown: false,
      totalDisplayedPrice: null,
      priceType: "current_retail_price",
      listingFormat: "fixed_price",
      condition: "unknown",
      providerConditionLabel: null,
      sizeSystem: "UNKNOWN",
      size: null,
      inStock: product.availability === undefined ? null : product.availability > 0,
      imageUrl: product.imageUrl ?? null,
      itemUrl: product.url,
      shopName: product.shopName ?? null,
      fetchedAt: product.fetchedAt,
      cacheExpiresAt: null,
    }));
    return successful("rakuten", context, drafts);
  } catch (error) {
    if (error instanceof RakutenCredentialsMissingError) return unavailable("rakuten", "楽天市場の価格サービスは現在利用できません。", "not_configured");
    if (error instanceof RakutenApiError) {
      const status = error.status === 401 || error.status === 403 ? "unauthorized" : error.status === 429 ? "rate_limited" : "temporarily_unavailable";
      return unavailable("rakuten", safeProviderMessage(status), status);
    }
    return unavailable("rakuten", safeProviderMessage("temporarily_unavailable"), "temporarily_unavailable");
  }
}

export async function searchYahooListings(
  context: MarketSearchContext,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<MarketProviderResult> {
  if (providersDisabled()) return unavailable("yahoo", "外部価格サービスはこの環境では無効です。", "not_configured");
  const appId = process.env["YAHOO_SHOPPING_APP_ID"]?.trim();
  if (!appId) return unavailable("yahoo", "Yahoo!ショッピングの価格サービスは現在利用できません。", "not_configured");
  const url = new URL("https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch");
  url.searchParams.set("appid", appId);
  url.searchParams.set("query", context.query);
  url.searchParams.set("results", "10");
  url.searchParams.set("in_stock", "true");
  url.searchParams.set("image_size", "300");
  try {
    const payload = await fetchMarketJson(url, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }, fetcher);
    if (!isRecord(payload) || !Array.isArray(payload["hits"])) return unavailable("yahoo", safeProviderMessage("schema_error"), "schema_error");
    let schemaWarnings = 0;
    const drafts = payload["hits"].slice(0, 10).flatMap((value): ListingDraft[] => {
      if (!isRecord(value)) { schemaWarnings += 1; return []; }
      const title = text(value["name"], 300);
      const price = finiteNumber(value["price"]);
      const itemUrl = text(value["url"], 2_048);
      if (!title || price === null || !itemUrl) { schemaWarnings += 1; return []; }
      const shipping = isRecord(value["shipping"]) && value["shipping"]["code"] === 2 ? 0 : null;
      const condition = normalizeCondition(value["condition"]);
      return [{
        provider: "yahoo",
        externalId: text(value["code"], 200),
        title,
        canonicalBrand: isRecord(value["brand"]) ? text(value["brand"]["name"], 120) : null,
        canonicalModelName: null,
        modelFamily: context.identity.modelName,
        generation: generationFromText(title),
        colorwayName: null,
        styleCode: styleCodeFromTitle(title, context.identity.styleCode),
        audience: audienceFromText(`${title} ${text(value["description"], 500) ?? ""}`),
        price,
        currency: "JPY",
        shippingPrice: shipping,
        shippingKnown: shipping !== null,
        totalDisplayedPrice: null,
        priceType: "current_retail_price",
        listingFormat: "fixed_price",
        condition,
        providerConditionLabel: text(value["condition"], 100),
        sizeSystem: "UNKNOWN",
        size: null,
        inStock: typeof value["inStock"] === "boolean" ? value["inStock"] : null,
        imageUrl: yahooImage(value),
        itemUrl,
        shopName: yahooSeller(value),
        fetchedAt: new Date().toISOString(),
        cacheExpiresAt: null,
      }];
    });
    return successful("yahoo", context, drafts, schemaWarnings);
  } catch (error) {
    return requestFailure("yahoo", error);
  }
}

export async function searchEbayListings(
  context: MarketSearchContext,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<MarketProviderResult> {
  if (providersDisabled()) return unavailable("ebay", "外部価格サービスはこの環境では無効です。", "not_configured");
  const clientId = process.env["EBAY_PRODUCTION_CLIENT_ID"]?.trim();
  const clientSecret = process.env["EBAY_PRODUCTION_CLIENT_SECRET"]?.trim();
  if (!clientId || !clientSecret) return unavailable("ebay", "eBayの価格サービスは現在利用できません。", "not_configured");
  try {
    let token = await getEbayApplicationToken({ clientId, clientSecret }, fetcher);
    const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    url.searchParams.set("q", context.query);
    url.searchParams.set("limit", "10");
    const marketplace = process.env["EBAY_PRODUCTION_MARKETPLACE_ID"]?.trim() || "EBAY_US";
    let payload: unknown;
    try {
      payload = await fetchEbayBrowse(url, marketplace, token, fetcher);
    } catch (error) {
      if (!(error instanceof MarketProviderRequestError) || error.upstreamStatus !== 401) throw error;
      invalidateEbayApplicationToken(token);
      token = await getEbayApplicationToken({ clientId, clientSecret }, fetcher);
      payload = await fetchEbayBrowse(url, marketplace, token, fetcher);
    }
    if (!isRecord(payload) || !Array.isArray(payload["itemSummaries"])) return unavailable("ebay", safeProviderMessage("schema_error"), "schema_error");
    let schemaWarnings = 0;
    const drafts = payload["itemSummaries"].slice(0, 10).flatMap((value): ListingDraft[] => {
      if (!isRecord(value) || !isRecord(value["price"])) { schemaWarnings += 1; return []; }
      const title = text(value["title"], 300);
      const itemUrl = text(value["itemWebUrl"], 2_048);
      const price = finiteNumber(value["price"]["value"]);
      const currency = text(value["price"]["currency"], 3);
      if (!title || !itemUrl || price === null || !currency || !/^[A-Z]{3}$/u.test(currency)) { schemaWarnings += 1; return []; }
      const aspects = ebayAspects(value["localizedAspects"]);
      const shippingPrice = ebayShipping(value["shippingOptions"]);
      const size = aspects.get("size") ?? null;
      const sizeSystem = normalizeSizeSystem(aspects.get("size system") ?? aspects.get("department"));
      const buyingOptions = Array.isArray(value["buyingOptions"]) ? value["buyingOptions"].filter((item): item is string => typeof item === "string") : [];
      return [{
        provider: "ebay",
        externalId: text(value["itemId"], 200),
        title,
        canonicalBrand: aspects.get("brand") ?? null,
        canonicalModelName: null,
        modelFamily: context.identity.modelName,
        generation: generationFromText(title),
        colorwayName: aspects.get("color") ?? null,
        styleCode: normalizeAspectStyle(aspects, title, context.identity.styleCode),
        audience: audienceFromText(`${title} ${aspects.get("department") ?? ""}`),
        price,
        currency,
        shippingPrice,
        shippingKnown: shippingPrice !== null,
        totalDisplayedPrice: null,
        priceType: "current_listing_price",
        listingFormat: normalizeListingFormat(buyingOptions.join(" ")),
        condition: normalizeCondition(text(value["condition"], 100)),
        providerConditionLabel: text(value["condition"], 100),
        sizeSystem,
        size,
        inStock: null,
        imageUrl: ebayImage(value["image"]),
        itemUrl,
        shopName: ebaySeller(value["seller"]),
        fetchedAt: new Date().toISOString(),
        cacheExpiresAt: null,
      }];
    });
    return successful("ebay", context, drafts, schemaWarnings);
  } catch (error) {
    return requestFailure("ebay", error);
  }
}

function successful(
  provider: MarketProviderId,
  context: MarketSearchContext,
  drafts: readonly ListingDraft[],
  schemaWarningCount = 0,
): MarketProviderResult {
  let unsafeUrlCount = 0;
  const rejected = drafts.flatMap((draft) => {
    if (!isSafePublicHttpsUrl(draft.itemUrl) || (draft.imageUrl && !isSafePublicHttpsUrl(draft.imageUrl))) {
      unsafeUrlCount += 1;
      return [{ matchLevel: "rejected" as const, reasons: ["安全でないURL"], warnings: ["unsafe_url"] }];
    }
    const match = matchMarketListing(context, draft);
    return match.matchLevel === "rejected" ? [match] : [];
  });
  const normalized = drafts.flatMap((draft): MarketListing[] => {
    const listing = finalizeListing(context, draft);
    return listing ? [listing] : [];
  });
  const deduped = dedupeListings(normalized);
  const unclassifiedRejectedCount = Math.max(0, drafts.length - normalized.length - rejected.length);
  const audit = auditListings(provider, deduped.listings, [
    ...rejected,
    ...Array.from({ length: unclassifiedRejectedCount }, () => ({
      matchLevel: "rejected" as const,
      reasons: ["schemaまたは価格を安全に正規化できません。"],
      warnings: ["schema_warning"],
    })),
  ], { schemaWarningCount, unsafeUrlCount, duplicateCount: deduped.duplicateCount });
  if (!deduped.listings.length) {
    return { provider, status: "empty", listings: [], fetchedAt: null, audit, message: "一致する販売商品を確認できませんでした。" };
  }
  return { provider, status: "success", listings: deduped.listings, fetchedAt: new Date().toISOString(), audit, message: "現在表示されている価格を取得しました。" };
}

function unavailable(provider: MarketProviderId, message: string, status: Exclude<MarketProviderResult["status"], "success">, safeCode?: string): MarketProviderResult {
  return { provider, status, listings: [], fetchedAt: null, audit: emptyProviderAudit(provider), message, ...(safeCode ? { safeCode } : {}) };
}

function requestFailure(provider: MarketProviderId, error: unknown): MarketProviderResult {
  const status: Exclude<MarketProviderResult["status"], "success"> = error instanceof MarketProviderRequestError
    ? error.status === "success" ? "schema_error" : error.status
    : "temporarily_unavailable";
  return unavailable(provider, safeProviderMessage(status), status, error instanceof MarketProviderRequestError && error.upstreamStatus ? `upstream_${error.upstreamStatus}` : undefined);
}

function safeProviderMessage(status: MarketProviderResult["status"]): string {
  if (status === "unauthorized" || status === "not_configured") return "この価格サービスは現在利用できません。";
  if (status === "timeout") return "価格情報の取得に時間がかかっています。推薦結果はそのまま確認できます。";
  if (status === "rate_limited") return "現在この価格サービスへのアクセスが集中しています。";
  if (status === "schema_error") return "価格情報を安全に表示できなかったため、今回は表示していません。";
  return "価格情報を取得できませんでした。推薦結果には影響しません。";
}

function providersDisabled(): boolean {
  return process.env["EXTERNAL_PROVIDERS_DISABLED"]?.trim().toLocaleLowerCase("en-US") === "true";
}

function audienceFromText(value: string): ListingDraft["audience"] {
  const textValue = value.normalize("NFKC").toLocaleLowerCase("en-US");
  if (/kids?|youth|gs\b|キッズ/iu.test(textValue)) return "kids";
  if (/women|womens|wmns|ladies|ウィメンズ|レディース/iu.test(textValue)) return "women";
  if (/men|mens|メンズ/iu.test(textValue)) return "men";
  if (/unisex|ユニセックス/iu.test(textValue)) return "unisex";
  return "unknown";
}

function generationFromText(value: string): string | null {
  const match = value.normalize("NFKC").match(/\b(?:v\d+|\d{3,4}v\d+|OG|ADV|44\s*DX|Golf)\b/iu);
  return match?.[0]?.toLocaleLowerCase("en-US").replace(/\s+/gu, "") ?? null;
}

async function fetchEbayBrowse(url: URL, marketplace: string, token: string, fetcher: typeof fetch): Promise<unknown> {
  return fetchMarketJson(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace,
    },
    cache: "no-store",
  }, fetcher);
}

function yahooImage(value: Record<string, unknown>): string | null {
  if (isRecord(value["exImage"])) return text(value["exImage"]["url"], 2_048);
  if (isRecord(value["image"])) return text(value["image"]["medium"], 2_048);
  return null;
}

function yahooSeller(value: Record<string, unknown>): string | null {
  return isRecord(value["seller"]) ? text(value["seller"]["name"], 200) : null;
}

function ebayImage(value: unknown): string | null {
  return isRecord(value) ? text(value["imageUrl"], 2_048) : null;
}

function ebaySeller(value: unknown): string | null {
  return isRecord(value) ? text(value["username"], 200) : null;
}

function ebayShipping(value: unknown): number | null {
  if (!Array.isArray(value)) return null;
  for (const option of value) {
    if (!isRecord(option) || !isRecord(option["shippingCost"])) continue;
    const amount = finiteNumber(option["shippingCost"]["value"]);
    if (amount !== null && amount >= 0) return amount;
  }
  return null;
}

function ebayAspects(value: unknown): Map<string, string> {
  const result = new Map<string, string>();
  if (!Array.isArray(value)) return result;
  for (const aspect of value) {
    if (!isRecord(aspect)) continue;
    const name = text(aspect["name"], 100)?.toLocaleLowerCase("en-US");
    const aspectValue = text(aspect["value"], 200);
    if (name && aspectValue && !result.has(name)) result.set(name, aspectValue);
  }
  return result;
}

function normalizeAspectStyle(aspects: ReadonlyMap<string, string>, title: string, expected: string | null): string | null {
  return aspects.get("style code")
    ?? aspects.get("product code")
    ?? aspects.get("manufacturer part number")
    ?? aspects.get("mpn")
    ?? styleCodeFromTitle(title, expected);
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function text(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]+/gu, " ").replace(/\s+/gu, " ").trim();
  return normalized ? normalized.slice(0, maximum) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
