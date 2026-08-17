export type MarketProviderId = "rakuten" | "yahoo" | "ebay";

export type MarketPriceSemantic =
  | "current_retail_price"
  | "current_listing_price"
  | "lowest_ask"
  | "highest_bid"
  | "recent_sale"
  | "sold_price"
  | "recommended_sell"
  | "recommended_buy";

export type MarketMatchLevel = "exact" | "probable" | "related" | "rejected";
export type MarketCondition = "new" | "used" | "unknown";
export type MarketSizeSystem = "US_M" | "US_W" | "UK" | "EU" | "JP" | "UNKNOWN";
export type MarketListingFormat = "fixed_price" | "auction" | "unknown";
export type MarketAudience = "men" | "women" | "unisex" | "kids" | "unknown";
export type MarketQueryMode = "strict" | "relaxed" | "model_only";

export type ColorwayVerificationState =
  | "model_color_style_verified"
  | "model_color_verified"
  | "model_only"
  | "unverified";

export type VerifiedRecommendationIdentity = Readonly<{
  brand: string | null;
  modelName: string;
  colorwayName: string | null;
  styleCode: string | null;
  verificationState: ColorwayVerificationState;
}>;

export type MarketSearchContext = Readonly<{
  query: string;
  identity: VerifiedRecommendationIdentity;
  gender: MarketAudience;
  sizeSystem: MarketSizeSystem;
  size: string | null;
  condition: MarketCondition;
}>;

export type ListingMatchResult = Readonly<{
  matchLevel: MarketMatchLevel;
  reasons: string[];
  warnings: string[];
}>;

export type MarketListing = Readonly<{
  provider: MarketProviderId;
  externalId: string | null;
  title: string;
  canonicalBrand: string | null;
  canonicalModelName: string | null;
  modelFamily: string | null;
  generation: string | null;
  colorwayName: string | null;
  styleCode: string | null;
  audience: MarketAudience;
  price: number;
  currency: string;
  shippingPrice: number | null;
  shippingKnown: boolean;
  totalDisplayedPrice: number | null;
  priceType: Extract<MarketPriceSemantic, "current_retail_price" | "current_listing_price">;
  listingFormat: MarketListingFormat;
  condition: MarketCondition;
  providerConditionLabel: string | null;
  sizeSystem: MarketSizeSystem;
  size: string | null;
  inStock: boolean | null;
  imageUrl: string | null;
  itemUrl: string;
  shopName: string | null;
  matchLevel: MarketMatchLevel;
  matchReasons: string[];
  mismatchWarnings: string[];
  fetchedAt: string;
  cacheExpiresAt: string | null;
}>;

export type PricePresentation = Readonly<{
  provider: MarketProviderId;
  semantic: MarketPriceSemantic;
  amount: number;
  currency: string;
  shippingAmount: number | null;
  shippingKnown: boolean;
  totalAmount: number | null;
  totalKnown: boolean;
  taxIncluded: boolean | null;
  dutyIncluded: boolean | null;
  condition: MarketCondition;
  sizeSystem: MarketSizeSystem;
  size: string | null;
  matchLevel: MarketMatchLevel;
  fetchedAt: string;
  fromCache: boolean;
  warnings: string[];
}>;

export type ProviderResponseAudit = Readonly<{
  provider: MarketProviderId;
  normalizedCount: number;
  exactCount: number;
  probableCount: number;
  relatedCount: number;
  rejectedCount: number;
  missingStyleCodeCount: number;
  missingColorwayCount: number;
  missingSizeCount: number;
  missingConditionCount: number;
  missingShippingCount: number;
  generationConflictCount: number;
  audienceConflictCount: number;
  sizeConflictCount: number;
  currencyCount: Record<string, number>;
  schemaWarningCount: number;
  unsafeUrlCount: number;
  duplicateCount: number;
}>;

export type MarketProviderStatus =
  | "success"
  | "empty"
  | "not_configured"
  | "unauthorized"
  | "rate_limited"
  | "timeout"
  | "schema_error"
  | "temporarily_unavailable"
  | "policy_disabled";

export type MarketProviderResult =
  | Readonly<{
      provider: MarketProviderId;
      status: "success";
      listings: MarketListing[];
      fetchedAt: string;
      audit: ProviderResponseAudit;
      message: string;
      safeCode?: string;
    }>
  | Readonly<{
      provider: MarketProviderId;
      status: Exclude<MarketProviderStatus, "success">;
      listings: [];
      fetchedAt: string | null;
      audit: ProviderResponseAudit;
      message: string;
      safeCode?: string;
    }>;

export type MarketSearchResponse = Readonly<{
  query: string;
  searchedAt: string;
  recommendationRankingChanged: false;
  providers: MarketProviderResult[];
}>;

export type MarketSearchQuery = Readonly<{
  mode: MarketQueryMode;
  query: string;
  reason: "style_code" | "brand_style_code" | "model_style_code" | "model_colorway" | "model";
}>;

export type MarketPriceSummary = Readonly<{
  provider: MarketProviderId;
  condition: MarketCondition;
  currency: string;
  listingCount: number;
  minimum: number | null;
  median: number | null;
  maximum: number | null;
  fetchedAt: string | null;
}>;

export function toPricePresentation(listing: MarketListing): PricePresentation {
  const shippingKnown = listing.shippingKnown;
  const totalKnown = listing.totalDisplayedPrice !== null;
  const totalAmount = listing.totalDisplayedPrice;
  return {
    provider: listing.provider,
    semantic: listing.priceType,
    amount: listing.price,
    currency: listing.currency,
    shippingAmount: listing.shippingPrice,
    shippingKnown,
    totalAmount,
    totalKnown,
    taxIncluded: null,
    dutyIncluded: null,
    condition: listing.condition,
    sizeSystem: listing.sizeSystem,
    size: listing.size,
    matchLevel: listing.matchLevel,
    fetchedAt: listing.fetchedAt,
    fromCache: false,
    warnings: [...listing.mismatchWarnings],
  };
}

export function emptyProviderAudit(provider: MarketProviderId): ProviderResponseAudit {
  return {
    provider,
    normalizedCount: 0,
    exactCount: 0,
    probableCount: 0,
    relatedCount: 0,
    rejectedCount: 0,
    missingStyleCodeCount: 0,
    missingColorwayCount: 0,
    missingSizeCount: 0,
    missingConditionCount: 0,
    missingShippingCount: 0,
    generationConflictCount: 0,
    audienceConflictCount: 0,
    sizeConflictCount: 0,
    currencyCount: {},
    schemaWarningCount: 0,
    unsafeUrlCount: 0,
    duplicateCount: 0,
  };
}
