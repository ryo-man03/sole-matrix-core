import type {
  MarketListing,
  MarketProviderId,
  MarketProviderResult,
} from "./contracts";
import { emptyProviderAudit } from "./contracts";

const PROVIDERS = new Set<MarketProviderId>(["rakuten", "yahoo", "ebay"]);
const CONDITIONS = new Set(["new", "used", "unknown"]);
const AUDIENCES = new Set(["men", "women", "unisex", "kids", "unknown"]);
const SIZE_SYSTEMS = new Set(["US_M", "US_W", "UK", "EU", "JP", "UNKNOWN"]);
const FORMATS = new Set(["fixed_price", "auction", "unknown"]);
const MATCH_LEVELS = new Set(["exact", "probable", "related"]);
const FAILURE_STATUSES = new Set([
  "empty", "not_configured", "unauthorized", "rate_limited", "timeout",
  "temporarily_unavailable", "schema_error", "policy_disabled",
]);

export function isMarketListing(value: unknown, expectedProvider?: MarketProviderId): value is MarketListing {
  if (!isRecord(value) || !isProvider(value.provider) || (expectedProvider && value.provider !== expectedProvider)) return false;
  if (!nullableText(value.externalId, 240) || !requiredText(value.title, 500)) return false;
  if (!nullableText(value.canonicalBrand, 120) || !nullableText(value.canonicalModelName, 200)
    || !nullableText(value.modelFamily, 160) || !nullableText(value.generation, 80)
    || !nullableText(value.colorwayName, 200) || !nullableText(value.styleCode, 40)) return false;
  if (!AUDIENCES.has(String(value.audience)) || !money(value.price) || !currency(value.currency)) return false;
  if (!nullableMoney(value.shippingPrice) || typeof value.shippingKnown !== "boolean"
    || value.shippingKnown !== (value.shippingPrice !== null) || !nullableMoney(value.totalDisplayedPrice)) return false;
  if (value.priceType !== (value.provider === "ebay" ? "current_listing_price" : "current_retail_price")) return false;
  if (!FORMATS.has(String(value.listingFormat)) || !CONDITIONS.has(String(value.condition))
    || !nullableText(value.providerConditionLabel, 160) || !SIZE_SYSTEMS.has(String(value.sizeSystem))
    || !nullableText(value.size, 40) || !(value.inStock === null || typeof value.inStock === "boolean")) return false;
  if (!(value.imageUrl === null || safeHttps(value.imageUrl)) || !safeHttps(value.itemUrl)
    || !nullableText(value.shopName, 240) || !MATCH_LEVELS.has(String(value.matchLevel))) return false;
  if (!stringArray(value.matchReasons, 40, 500) || !stringArray(value.mismatchWarnings, 40, 500)) return false;
  return dateString(value.fetchedAt) && (value.cacheExpiresAt === null || dateString(value.cacheExpiresAt));
}

export function parseMarketProviderResult(value: unknown, provider: MarketProviderId): MarketProviderResult {
  if (!isRecord(value) || value.provider !== provider || typeof value.status !== "string"
    || !requiredText(value.message, 500) || !Array.isArray(value.listings)) return schemaFailure(provider);
  if (value.status === "success") {
    if (!dateString(value.fetchedAt) || value.listings.length === 0 || value.listings.length > 30
      || !value.listings.every((listing) => isMarketListing(listing, provider)) || !isAudit(value.audit, provider)) {
      return schemaFailure(provider);
    }
    return {
      provider,
      status: "success",
      listings: value.listings,
      fetchedAt: value.fetchedAt,
      audit: value.audit,
      message: value.message.slice(0, 500),
      ...(requiredText(value.safeCode, 120) ? { safeCode: value.safeCode } : {}),
    };
  }
  if (!FAILURE_STATUSES.has(value.status) || value.listings.length !== 0
    || !(value.fetchedAt === null || dateString(value.fetchedAt)) || !isAudit(value.audit, provider)) {
    return schemaFailure(provider);
  }
  return {
    provider,
    status: value.status as Exclude<MarketProviderResult["status"], "success">,
    listings: [],
    fetchedAt: value.fetchedAt,
    audit: value.audit,
    message: value.message.slice(0, 500),
    ...(requiredText(value.safeCode, 120) ? { safeCode: value.safeCode } : {}),
  };
}

function schemaFailure(provider: MarketProviderId): MarketProviderResult {
  return {
    provider,
    status: "schema_error",
    listings: [],
    fetchedAt: null,
    audit: emptyProviderAudit(provider),
    message: "価格情報を安全に検証できなかったため、この販売先は表示していません。",
    safeCode: "invalid_provider_contract",
  };
}

function isAudit(value: unknown, provider: MarketProviderId): value is MarketProviderResult["audit"] {
  if (!isRecord(value) || value.provider !== provider || !isRecord(value.currencyCount)) return false;
  const keys = [
    "normalizedCount", "exactCount", "probableCount", "relatedCount", "rejectedCount",
    "missingStyleCodeCount", "missingColorwayCount", "missingSizeCount", "missingConditionCount",
    "missingShippingCount", "generationConflictCount", "audienceConflictCount", "sizeConflictCount",
    "schemaWarningCount", "unsafeUrlCount", "duplicateCount",
  ];
  return keys.every((key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0)
    && Object.entries(value.currencyCount).every(([key, count]) => currency(key) && Number.isSafeInteger(count) && Number(count) >= 0);
}

function safeHttps(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLocaleLowerCase("en-US");
    return host !== "localhost" && host !== "0.0.0.0" && host !== "::1"
      && !/^127\./u.test(host) && !/^10\./u.test(host) && !/^192\.168\./u.test(host)
      && !/^169\.254\./u.test(host) && !/^172\.(?:1[6-9]|2\d|3[01])\./u.test(host);
  } catch {
    return false;
  }
}

function requiredText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

function nullableText(value: unknown, maximum: number): boolean {
  return value === null || (typeof value === "string" && value.length <= maximum);
}

function money(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function nullableMoney(value: unknown): boolean {
  return value === null || money(value);
}

function currency(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/u.test(value);
}

function stringArray(value: unknown, maximumItems: number, maximumLength: number): value is string[] {
  return Array.isArray(value) && value.length <= maximumItems
    && value.every((item) => typeof item === "string" && item.length <= maximumLength);
}

function dateString(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value));
}

function isProvider(value: unknown): value is MarketProviderId {
  return typeof value === "string" && PROVIDERS.has(value as MarketProviderId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
