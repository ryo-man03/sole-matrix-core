export type RecommendationSlot =
  | "safe_main"
  | "ryo_core"
  | "twist"
  | "archive"
  | "second_pair"
  | "market_find"
  | "caution";

export type MarketProductCandidate = {
  source: "rakuten";
  slot: "market_find";
  title: string;
  normalizedModelName: string;
  brand: string | null;
  url: string;
  imageUrl?: string;
  price?: number;
  shopName?: string;
  shopCode?: string;
  itemCode?: string;
  reviewCount?: number;
  reviewAverage?: number;
  availability?: number;
  fetchedAt: string;
  query: string;
  confidence: number;
  disclaimer: string;
};

export type SearchRakutenProductsInput = {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  hits?: number;
  page?: number;
  sort?:
    | "standard"
    | "+itemPrice"
    | "-itemPrice"
    | "-reviewCount"
    | "-reviewAverage"
    | "-updateTimestamp";
  ngKeyword?: string;
};

export type RyoSearchRecipe = {
  slot: RecommendationSlot;
  searchIntent: string;
  requiredSignals: string[];
  searchQueries: string[];
  negativeTerms: string[];
  preferredSources: string[];
};
