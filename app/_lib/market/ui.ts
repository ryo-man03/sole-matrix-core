import type { CandidateProfile } from "../core-v1/types";
import type { MarketProductCandidate } from "./types";

export type RakutenMarketFindPayload = {
  products: MarketProductCandidate[];
};

export function buildRakutenMarketQuery(
  candidate: Pick<CandidateProfile, "name" | "searchKeywords">,
): string {
  const keywords = (candidate.searchKeywords ?? [])
    .map(normalizeQuery)
    .filter((query) => isSpecificModelQuery(query));
  const normalizedName = normalizeQuery(candidate.name);

  return keywords[0] ?? normalizedName;
}

export function parseRakutenMarketFindPayload(
  value: unknown,
): RakutenMarketFindPayload | null {
  if (!isRecord(value) || !Array.isArray(value["products"])) return null;

  return {
    products: value["products"]
      .filter(isMarketProductCandidate)
      .slice(0, 6),
  };
}

function normalizeQuery(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 128);
}

function isSpecificModelQuery(query: string): boolean {
  if (!query) return false;
  const terms = query.split(" ").filter(Boolean);
  const vagueQueries = new Set([
    "おすすめスニーカー",
    "クラシック",
    "黒白",
    "スニーカー",
  ]);
  if (vagueQueries.has(query.toLowerCase())) return false;

  return terms.length >= 2 || /[a-z][a-z0-9-]*\d|\d[a-z0-9-]*/iu.test(query);
}

function isMarketProductCandidate(value: unknown): value is MarketProductCandidate {
  if (!isRecord(value)) return false;
  return value["source"] === "rakuten" &&
    value["slot"] === "market_find" &&
    isNonEmptyString(value["title"]) &&
    isNonEmptyString(value["normalizedModelName"]) &&
    (value["brand"] === null || isNonEmptyString(value["brand"])) &&
    typeof value["url"] === "string" &&
    isSafeHttpsUrl(value["url"]) &&
    isOptionalSafeHttpsUrl(value["imageUrl"]) &&
    isOptionalNonNegativeNumber(value["price"]) &&
    isOptionalString(value["shopName"]) &&
    isOptionalString(value["shopCode"]) &&
    isOptionalString(value["itemCode"]) &&
    isOptionalNonNegativeNumber(value["reviewCount"]) &&
    isOptionalNonNegativeNumber(value["reviewAverage"]) &&
    isOptionalNonNegativeNumber(value["availability"]) &&
    isNonEmptyString(value["fetchedAt"]) &&
    isNonEmptyString(value["query"]) &&
    isConfidence(value["confidence"]) &&
    isNonEmptyString(value["disclaimer"]);
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isOptionalSafeHttpsUrl(value: unknown): boolean {
  return value === undefined || (typeof value === "string" && isSafeHttpsUrl(value));
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isOptionalNonNegativeNumber(value: unknown): boolean {
  return value === undefined || (
    typeof value === "number" && Number.isFinite(value) && value >= 0
  );
}

function isConfidence(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
