import type {
  MarketProductCandidate,
  SearchRakutenProductsInput,
} from "./types";

const RAKUTEN_ITEM_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

const DEFAULT_ELEMENTS = [
  "itemName",
  "itemPrice",
  "itemUrl",
  "mediumImageUrls",
  "shopName",
  "shopCode",
  "itemCode",
  "availability",
  "reviewCount",
  "reviewAverage",
].join(",");

export const RAKUTEN_MARKET_DISCLAIMER =
  "価格・在庫・サイズは変動します。購入前に販売ページで確認してください。";

type RakutenItem = {
  itemName?: string;
  itemPrice?: number;
  itemUrl?: string;
  mediumImageUrls?: Array<{ imageUrl: string } | string>;
  shopName?: string;
  shopCode?: string;
  itemCode?: string;
  availability?: number;
  reviewCount?: number;
  reviewAverage?: number;
};

type RakutenSearchResponse = {
  count?: number;
  page?: number;
  first?: number;
  last?: number;
  hits?: number;
  pageCount?: number;
  items?: RakutenItem[];
  Items?: RakutenItem[];
  error?: string;
  error_description?: string;
  errors?: {
    errorCode?: number | string;
    errorMessage?: string;
  };
  statusCode?: number;
  message?: string;
};

export class RakutenCredentialsMissingError extends Error {
  override name = "RakutenCredentialsMissingError";

  constructor() {
    super("Rakuten API credentials are not configured.");
  }
}

export class RakutenApiError extends Error {
  override name = "RakutenApiError";

  constructor(
    message = "Rakuten API request failed.",
    readonly code = "rakuten_api_error",
    readonly status?: number,
  ) {
    super(message);
  }
}

export async function searchRakutenProducts(
  input: SearchRakutenProductsInput,
): Promise<MarketProductCandidate[]> {
  assertServerRuntime();

  const query = input.query.replace(/\s+/g, " ").trim();
  if (!query) {
    throw new RakutenApiError(
      "Rakuten search query is required.",
      "invalid_query",
    );
  }

  const applicationId = process.env["RAKUTEN_APPLICATION_ID"]?.trim();
  const accessKey = process.env["RAKUTEN_ACCESS_KEY"]?.trim();
  const affiliateId = process.env["RAKUTEN_AFFILIATE_ID"]?.trim();

  if (!applicationId || !accessKey) {
    throw new RakutenCredentialsMissingError();
  }

  const url = new URL(RAKUTEN_ITEM_SEARCH_ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("availability", "1");
  url.searchParams.set("imageFlag", "1");
  url.searchParams.set("field", "1");
  url.searchParams.set("carrier", "2");
  url.searchParams.set("purchaseType", "0");
  url.searchParams.set("hits", String(input.hits ?? 10));
  url.searchParams.set("page", String(input.page ?? 1));
  url.searchParams.set("elements", DEFAULT_ELEMENTS);
  url.searchParams.set("sort", input.sort ?? "standard");

  if (input.minPrice !== undefined) {
    url.searchParams.set("minPrice", String(input.minPrice));
  }
  if (input.maxPrice !== undefined) {
    url.searchParams.set("maxPrice", String(input.maxPrice));
  }
  if (input.ngKeyword?.trim()) {
    url.searchParams.set("NGKeyword", input.ngKeyword.trim());
  }
  if (affiliateId) {
    url.searchParams.set("affiliateId", affiliateId);
  }

  const requestOrigin = normalizeHttpOrigin(
    input.requestOrigin ?? process.env["RAKUTEN_REQUEST_ORIGIN"],
  );
  const headers: Record<string, string> = {
    Accept: "application/json",
    accessKey,
  };
  if (requestOrigin) {
    headers.Origin = requestOrigin;
    headers.Referer = `${requestOrigin}/`;
  }

  let response: Response;
  try {
    response = await fetchRakutenWithPolicy(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    throw new RakutenApiError("Rakuten API request failed.", "network_error");
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new RakutenApiError(
      safeApiMessage(body, "Rakuten API request failed."),
      responseErrorCode(body),
      response.status,
    );
  }
  if (!body) {
    throw new RakutenApiError(
      "Rakuten API returned an invalid response.",
      "invalid_response",
      response.status,
    );
  }
  if (body.error) {
    throw new RakutenApiError(
      safeApiMessage(body, "Rakuten API returned an invalid response."),
      responseErrorCode(body),
      response.status,
    );
  }
  const responseItems = normalizeRakutenResponseItems(body);
  if (!responseItems) {
    throw new RakutenApiError(
      "Rakuten API returned an invalid response.",
      "invalid_response",
      response.status,
    );
  }

  const fetchedAt = new Date().toISOString();
  return responseItems
    .filter(isRecord)
    .map((item) => normalizeRakutenItem(item, query, fetchedAt))
    .filter((item): item is MarketProductCandidate => item !== null);
}

async function fetchRakutenWithPolicy(url: URL, init: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(8_000) });
      if ((response.status === 502 || response.status === 503) && attempt === 0) continue;
      return response;
    } catch (error) {
      const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      const reset = error instanceof Error && /ECONNRESET|connection reset/iu.test(`${error.message} ${String(error.cause ?? "")}`);
      if ((timeout || reset) && attempt === 0) continue;
      throw error;
    }
  }
  throw new Error("Rakuten API request failed.");
}

export function normalizeRakutenItem(
  item: RakutenItem,
  query: string,
  fetchedAt = new Date().toISOString(),
): MarketProductCandidate | null {
  const title = normalizeListingTitle(item.itemName);
  const url = normalizeHttpsUrl(item.itemUrl);
  if (!title || !url || isSuspiciousRakutenTitle(title)) {
    return null;
  }

  const normalizedModelName = normalizeSneakerTitle(title);
  if (!normalizedModelName) {
    return null;
  }

  const imageUrl = normalizeRakutenImageUrl(item.mediumImageUrls?.[0]);
  const price = optionalNonNegativeNumber(item.itemPrice);
  const availability = optionalNonNegativeNumber(item.availability);
  const reviewCount = optionalNonNegativeNumber(item.reviewCount);
  const reviewAverage = optionalNonNegativeNumber(item.reviewAverage);
  const shopName = normalizeOptionalText(item.shopName);
  const shopCode = normalizeOptionalText(item.shopCode);
  const itemCode = normalizeOptionalText(item.itemCode);

  return {
    source: "rakuten",
    slot: "market_find",
    title,
    normalizedModelName,
    brand: guessBrand(normalizedModelName),
    url,
    ...(imageUrl ? { imageUrl } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(shopName ? { shopName } : {}),
    ...(shopCode ? { shopCode } : {}),
    ...(itemCode ? { itemCode } : {}),
    ...(reviewCount !== undefined ? { reviewCount } : {}),
    ...(reviewAverage !== undefined ? { reviewAverage } : {}),
    ...(availability !== undefined ? { availability } : {}),
    fetchedAt,
    query,
    confidence: calculateRakutenConfidence(item, query),
    disclaimer: RAKUTEN_MARKET_DISCLAIMER,
  };
}

export function normalizeSneakerTitle(title: string): string {
  let normalized = title.normalize("NFKC").replace(/\s+/g, " ").trim();

  // Leading brackets on marketplace listings are usually sale or shipping labels.
  // Only remove them when a meaningful title remains.
  for (let count = 0; count < 4; count += 1) {
    const withoutLeadingLabel = normalized
      .replace(/^\s*(?:\[[^\]]{1,40}\]|【[^】]{1,40}】|〔[^〕]{1,40}〕)\s*/u, "")
      .trim();
    if (!withoutLeadingLabel || withoutLeadingLabel === normalized) {
      break;
    }
    normalized = withoutLeadingLabel;
  }

  return normalized.replace(/\s+/g, " ").trim();
}

export function guessBrand(title: string): string | null {
  const normalized = title.normalize("NFKC");
  const brands: ReadonlyArray<[string, RegExp]> = [
    ["Onitsuka Tiger", /(?:onitsuka\s+tiger|オニツカタイガー)/iu],
    ["New Balance", /(?:new\s+balance|ニューバランス)/iu],
    ["PRO-Keds", /(?:pro[\s-]?keds|プロケッズ)/iu],
    ["Converse", /(?:converse|コンバース)/iu],
    ["Reebok", /(?:reebok|リーボック)/iu],
    ["adidas", /(?:adidas|アディダス)/iu],
    ["ASICS", /(?:asics|アシックス)/iu],
    ["PUMA", /(?:puma|プーマ)/iu],
    ["Vans", /(?:vans|バンズ|ヴァンズ)/iu],
    ["Nike", /(?:nike|ナイキ)/iu],
  ];

  return brands.find(([, pattern]) => pattern.test(normalized))?.[0] ?? null;
}

export function isSuspiciousRakutenTitle(title: string): boolean {
  const normalized = title.normalize("NFKC").toLowerCase();
  const suspiciousTerms = [
    /(?:^|[^防])風(?:$|[\s】\]）)、・\/])/u,
    /タイプ/u,
    /\btype\b/u,
    /\bstyle\b/u,
    /スタイル/u,
    /オマージュ/u,
    /ノーブランド/u,
    /互換/u,
    /カスタム/u,
    /\bcustom\b/u,
    /レプリカ/u,
    /コピー/u,
    /\bfake\b/u,
    /偽物/u,
    /並行輸入風/u,
  ];

  return suspiciousTerms.some((pattern) => pattern.test(normalized));
}

export function calculateRakutenConfidence(
  item: RakutenItem,
  query: string,
): number {
  const title = normalizeListingTitle(item.itemName) ?? "";
  const titleTerms = searchableTerms(title);
  const queryTerms = searchableTerms(query);
  const matchedTerms = queryTerms.filter((term) => titleTerms.some(
    (titleTerm) => titleTerm.includes(term) || term.includes(titleTerm),
  ));
  const matchRatio = queryTerms.length > 0
    ? matchedTerms.length / queryTerms.length
    : 0;

  let score = 0.5;
  score += matchRatio * 0.2;
  if (matchRatio === 1 && queryTerms.length > 0) score += 0.05;
  if (normalizeHttpsUrl(item.itemUrl)) score += 0.05;
  if (normalizeRakutenImageUrl(item.mediumImageUrls?.[0])) score += 0.05;
  if (item.availability === 1) score += 0.05;
  if ((item.reviewCount ?? 0) > 0) score += 0.05;
  if (guessBrand(title)) score += 0.05;
  if (title.length < 8) score -= 0.15;
  if (isSuspiciousRakutenTitle(title)) score -= 0.5;
  if (queryTerms.length > 0 && matchRatio < 0.25) score -= 0.15;

  return Number(Math.max(0, Math.min(1, score)).toFixed(2));
}

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new RakutenApiError(
      "Rakuten product search is only available on the server.",
      "server_only",
    );
  }
}

async function readResponseBody(
  response: Response,
): Promise<RakutenSearchResponse | null> {
  try {
    const value = (await response.json()) as unknown;
    if (!isRecord(value)) return null;
    return value as RakutenSearchResponse;
  } catch {
    return null;
  }
}

function safeApiMessage(
  body: RakutenSearchResponse | null,
  fallback: string,
): string {
  const message =
    body?.error_description ??
    body?.errors?.errorMessage ??
    body?.message;
  if (typeof message !== "string") return fallback;
  let normalized = message.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
  for (const secret of [
    process.env["RAKUTEN_APPLICATION_ID"],
    process.env["RAKUTEN_ACCESS_KEY"],
    process.env["RAKUTEN_AFFILIATE_ID"],
  ]) {
    if (secret?.trim()) normalized = normalized.replaceAll(secret.trim(), "[redacted]");
  }
  return normalized ? normalized.slice(0, 240) : fallback;
}

function responseErrorCode(body: RakutenSearchResponse | null): string {
  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error.trim().slice(0, 80);
  }
  if (typeof body?.errors?.errorMessage === "string" && body.errors.errorMessage.trim()) {
    return body.errors.errorMessage.trim().slice(0, 80);
  }
  if (body?.errors?.errorCode !== undefined) {
    return String(body.errors.errorCode).trim().slice(0, 80);
  }
  if (body?.statusCode !== undefined) {
    return String(body.statusCode).trim().slice(0, 80);
  }
  return "rakuten_api_error";
}

function normalizeRakutenResponseItems(
  body: RakutenSearchResponse,
): RakutenItem[] | null {
  const items: unknown = body.items ?? body.Items;
  if (!Array.isArray(items)) return null;
  return items.map((item: unknown) => {
    if (!isRecord(item)) return item;
    if (isRecord(item["item"])) return item["item"] as RakutenItem;
    if (isRecord(item["Item"])) return item["Item"] as RakutenItem;
    return item;
  }) as RakutenItem[];
}

function normalizeListingTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 300) : null;
}

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 200) : undefined;
}

function normalizeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2_048) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeRakutenImageUrl(value: unknown): string | undefined {
  if (typeof value === "string") return normalizeHttpsUrl(value);
  if (isRecord(value)) return normalizeHttpsUrl(value["imageUrl"]);
  return undefined;
}

function normalizeHttpOrigin(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 512) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function optionalNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function searchableTerms(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}-]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
