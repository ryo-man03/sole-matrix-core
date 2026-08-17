import type {
  ListingMatchResult,
  MarketCondition,
  MarketListing,
  MarketListingFormat,
  MarketProviderId,
  MarketSearchContext,
  MarketSizeSystem,
  ProviderResponseAudit,
} from "./contracts";
import { emptyProviderAudit } from "./contracts";
import { isMarketListing } from "./runtime-validation";

export type ListingDraft = Omit<
  MarketListing,
  "matchLevel" | "matchReasons" | "mismatchWarnings"
>;

const GENERATION_PATTERN = /\b(?:v\d+|\d{3,4}v\d+|og|adv|pro|44\s*dx|golf|kids?|gs)\b/giu;
const KNOWN_BRANDS = [
  ["newbalance", /\bnew\s*balance\b|\bnb\b/iu],
  ["adidas", /\badidas\b/iu],
  ["nike", /\bnike\b|\bair\s*jordan\b|\baj\s*1\b/iu],
  ["vans", /\bvans\b/iu],
  ["asics", /\basics\b/iu],
  ["converse", /\bconverse\b/iu],
] as const;

export function normalizeStyleCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.normalize("NFKC").toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/gu, "");
  return normalized.length >= 5 && normalized.length <= 16 ? normalized : null;
}

export function styleCodeFromTitle(title: string, expected: string | null): string | null {
  const expectedCode = normalizeStyleCode(expected);
  if (!expectedCode) return null;
  const flexibleCode = [...expectedCode].map(escapeRegExp).join("[- ]*");
  const exactToken = new RegExp(`(?:^|[^A-Z0-9])${flexibleCode}(?=$|[^A-Z0-9])`, "iu");
  return exactToken.test(title.normalize("NFKC").toLocaleUpperCase("en-US")) ? expectedCode : null;
}

export function matchMarketListing(
  context: MarketSearchContext,
  listing: Pick<ListingDraft, "title" | "canonicalBrand" | "canonicalModelName" | "modelFamily" | "generation" | "colorwayName" | "styleCode" | "audience" | "sizeSystem" | "size">,
): ListingMatchResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const haystack = comparable(`${listing.title} ${listing.canonicalModelName ?? ""}`);
  const expectedModel = comparable(context.identity.modelName);
  const expectedBrand = comparable(context.identity.brand ?? "");
  const expectedStyle = normalizeStyleCode(context.identity.styleCode);
  const observedStyle = normalizeStyleCode(listing.styleCode);

  if (expectedStyle && observedStyle && expectedStyle !== observedStyle) {
    return rejected("Style Code が一致しません。", "generation_conflict");
  }
  if (hasBrandConflict(context.identity.brand, listing.canonicalBrand, listing.title)) {
    return rejected("ブランドが一致しません。", "brand_conflict");
  }
  if (hasDerivativeConflict(context.identity.modelName, `${listing.title} ${listing.canonicalModelName ?? ""}`)
    || hasGenerationConflict(context.identity.modelName, `${listing.title} ${listing.generation ?? ""}`)) {
    return rejected("モデル世代が一致しません。", "generation_conflict");
  }
  if (isAudienceConflict(context.gender, listing.audience)) {
    return rejected("メンズ／ウィメンズ／キッズ区分が一致しません。", "gender_conflict");
  }
  if (isSizeConflict(context, listing)) {
    return rejected("指定サイズと一致しません。", "size_conflict");
  }

  if (expectedStyle && observedStyle === expectedStyle) {
    reasons.push("Style Code が完全一致");
    return { matchLevel: "exact", reasons, warnings };
  }

  const modelTokens = significantTokens(context.identity.modelName);
  const matchedTokens = modelTokens.filter((token) => haystack.includes(token));
  const modelRatio = modelTokens.length ? matchedTokens.length / modelTokens.length : 0;
  const brandMatches = !expectedBrand || haystack.includes(expectedBrand);
  const expectedColor = context.identity.verificationState === "model_color_style_verified"
    || context.identity.verificationState === "model_color_verified"
    ? context.identity.colorwayName
    : null;
  const colorTokens = significantTokens(expectedColor ?? "");
  const colorHaystack = comparable(`${listing.title} ${listing.colorwayName ?? ""}`);
  const colorMatches = colorTokens.length === 0 || colorTokens.every((token) => colorHaystack.includes(token));

  if (context.identity.verificationState === "unverified" && brandMatches && modelRatio >= 0.4) {
    reasons.push("入力されたモデル名に近い可能性があります。");
    warnings.push("モデル自体の事実確認が完了していないため、比較用として表示します。");
    return { matchLevel: "related", reasons, warnings };
  }

  if (brandMatches && modelRatio >= 0.8 && colorMatches) {
    reasons.push("モデル名が一致", ...(colorTokens.length ? ["確認済みカラーと一致"] : []));
    if (!expectedStyle) warnings.push("Style Code が未確認のため完全一致ではありません。");
    return { matchLevel: "probable", reasons, warnings };
  }
  if (brandMatches && modelRatio >= 0.4) {
    reasons.push("同じモデル系列の可能性があります。");
    warnings.push("別カラー・別世代・別サイズの可能性があります。購入候補ではなく比較用です。");
    return { matchLevel: "related", reasons, warnings };
  }
  return rejected("推薦モデルとの一致を確認できません。", "identity_conflict");
}

export function finalizeListing(context: MarketSearchContext, draft: ListingDraft): MarketListing | null {
  if (!isSafePublicHttpsUrl(draft.itemUrl) || (draft.imageUrl && !isSafePublicHttpsUrl(draft.imageUrl))) return null;
  if (!Number.isFinite(draft.price) || draft.price < 0 || !/^[A-Z]{3}$/u.test(draft.currency)) return null;
  const match = matchMarketListing(context, draft);
  if (match.matchLevel === "rejected") return null;
  const listing: MarketListing = {
    ...draft,
    matchLevel: match.matchLevel,
    matchReasons: match.reasons,
    mismatchWarnings: match.warnings,
  };
  return isMarketListing(listing, draft.provider) ? listing : null;
}

export function auditListings(
  provider: MarketProviderId,
  listings: readonly MarketListing[],
  rejected: readonly ListingMatchResult[] = [],
  extra: Partial<Pick<ProviderResponseAudit, "schemaWarningCount" | "unsafeUrlCount" | "duplicateCount">> = {},
): ProviderResponseAudit {
  const audit = emptyProviderAudit(provider);
  const currencyCount: Record<string, number> = {};
  for (const listing of listings) currencyCount[listing.currency] = (currencyCount[listing.currency] ?? 0) + 1;
  return {
    ...audit,
    normalizedCount: listings.length,
    exactCount: listings.filter((item) => item.matchLevel === "exact").length,
    probableCount: listings.filter((item) => item.matchLevel === "probable").length,
    relatedCount: listings.filter((item) => item.matchLevel === "related").length,
    rejectedCount: rejected.length,
    missingStyleCodeCount: listings.filter((item) => !item.styleCode).length,
    missingColorwayCount: listings.filter((item) => !item.colorwayName).length,
    missingSizeCount: listings.filter((item) => !item.size).length,
    missingConditionCount: listings.filter((item) => item.condition === "unknown").length,
    missingShippingCount: listings.filter((item) => item.shippingPrice === null).length,
    generationConflictCount: rejected.filter((item) => item.warnings.includes("generation_conflict")).length,
    audienceConflictCount: rejected.filter((item) => item.warnings.includes("gender_conflict")).length,
    sizeConflictCount: rejected.filter((item) => item.warnings.includes("size_conflict")).length,
    currencyCount,
    schemaWarningCount: extra.schemaWarningCount ?? 0,
    unsafeUrlCount: extra.unsafeUrlCount ?? 0,
    duplicateCount: extra.duplicateCount ?? 0,
  };
}

export function dedupeListings(listings: readonly MarketListing[]): { listings: MarketListing[]; duplicateCount: number } {
  const seen = new Set<string>();
  const unique = listings.filter((listing) => {
    const key = `${listing.provider}:${listing.externalId ?? listing.itemUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { listings: unique, duplicateCount: listings.length - unique.length };
}

export function normalizeCondition(value: unknown): MarketCondition {
  if (typeof value !== "string") return "unknown";
  const normalized = value.normalize("NFKC").toLocaleLowerCase("en-US");
  if (/refurb|再生|整備/iu.test(normalized)) return "used";
  if (/used|pre-owned|中古/iu.test(normalized)) return "used";
  if (/new|新品|new_with/iu.test(normalized)) return "new";
  return "unknown";
}

export function normalizeListingFormat(value: unknown): MarketListingFormat {
  if (typeof value !== "string") return "unknown";
  const normalized = value.toLocaleUpperCase("en-US");
  if (normalized.includes("AUCTION")) return "auction";
  if (normalized.includes("FIXED") || normalized.includes("BUY_IT_NOW")) return "fixed_price";
  return "unknown";
}

export function normalizeSizeSystem(value: unknown): MarketSizeSystem {
  if (typeof value !== "string") return "UNKNOWN";
  const normalized = value.normalize("NFKC").toLocaleUpperCase("en-US").replace(/[^A-Z]/gu, "_");
  if (normalized.includes("US_W") || normalized.includes("WOMEN")) return "US_W";
  if (normalized.includes("US") || normalized.includes("MEN")) return "US_M";
  if (normalized.includes("UK")) return "UK";
  if (normalized.includes("EU")) return "EU";
  if (normalized.includes("JP") || normalized.includes("CM")) return "JP";
  return "UNKNOWN";
}

export function isSafePublicHttpsUrl(value: string): boolean {
  if (value.length > 2_048) return false;
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

function significantTokens(value: string): string[] {
  return value.normalize("NFKC").toLocaleLowerCase("en-US")
    .split(/[^\p{L}\p{N}]+/gu).filter((token) => token.length >= 2 && !new Set(["nike", "adidas", "new", "balance"]).has(token));
}

function comparable(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function hasGenerationConflict(expected: string, observed: string): boolean {
  const expectedGenerations = new Set((expected.match(GENERATION_PATTERN) ?? []).map(comparable));
  const observedGenerations = new Set((observed.match(GENERATION_PATTERN) ?? []).map(comparable));
  if (!expectedGenerations.size || !observedGenerations.size) return false;
  return [...expectedGenerations].some((value) => !observedGenerations.has(value))
    && [...observedGenerations].some((value) => !expectedGenerations.has(value));
}

function isAudienceConflict(expected: MarketSearchContext["gender"], observed: ListingDraft["audience"]): boolean {
  return expected !== "unknown" && observed !== "unknown" && expected !== "unisex" && observed !== "unisex" && expected !== observed;
}

function hasBrandConflict(expected: string | null, observed: string | null, title: string): boolean {
  const expectedBrand = canonicalBrand(expected ?? "");
  if (!expectedBrand) return false;
  const observedBrand = canonicalBrand(observed ?? "") ?? canonicalBrand(title);
  return observedBrand !== null && observedBrand !== expectedBrand;
}

function canonicalBrand(value: string): string | null {
  const match = KNOWN_BRANDS.find(([, pattern]) => pattern.test(value.normalize("NFKC")));
  return match?.[0] ?? null;
}

function hasDerivativeConflict(expected: string, observed: string): boolean {
  const expectedIdentity = derivativeIdentity(expected);
  const observedIdentity = derivativeIdentity(observed);
  if (!expectedIdentity || !observedIdentity) return false;
  return expectedIdentity.family === observedIdentity.family && expectedIdentity.variant !== observedIdentity.variant;
}

function derivativeIdentity(value: string): { family: string; variant: string } | null {
  const compact = value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^a-z0-9]/gu, "");
  const known = [
    [/991v2/u, "991", "v2"], [/991(?!v\d)/u, "991", "base"],
    [/990v3/u, "990", "v3"], [/990v4/u, "990", "v4"],
    [/sambaadv/u, "samba", "adv"], [/sambaog/u, "samba", "og"],
    [/authentic44dx/u, "authentic", "44dx"], [/authentic/u, "authentic", "base"],
    [/(?:aj1|airjordan1)lowgolf/u, "aj1low", "golf"], [/(?:aj1|airjordan1)low/u, "aj1low", "base"],
  ] as const;
  const found = known.find(([pattern]) => pattern.test(compact));
  return found ? { family: found[1], variant: found[2] } : null;
}

function isSizeConflict(context: MarketSearchContext, listing: Pick<ListingDraft, "sizeSystem" | "size">): boolean {
  if (!context.size || !listing.size) return false;
  if (context.sizeSystem !== "UNKNOWN" && listing.sizeSystem !== "UNKNOWN" && context.sizeSystem !== listing.sizeSystem) return true;
  return normalizeSize(context.size) !== normalizeSize(listing.size);
}

function normalizeSize(value: string): string {
  const numeric = Number(value.normalize("NFKC").trim());
  return Number.isFinite(numeric) ? String(numeric) : value.normalize("NFKC").toLocaleUpperCase("en-US").replace(/\s+/gu, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function rejected(reason: string, warning: string): ListingMatchResult {
  return { matchLevel: "rejected", reasons: [reason], warnings: [warning] };
}
