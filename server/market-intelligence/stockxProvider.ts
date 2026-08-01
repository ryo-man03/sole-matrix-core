import {
  matchSneakerIdentity,
  type CanonicalSneakerIdentity,
  type SneakerVariant,
} from "../../app/_lib/market-intelligence/identity";
import type {
  MarketCatalogQuery,
  MarketCatalogSearchResult,
  MarketDataProvider,
  MarketProviderCapability,
  MarketSnapshotResult,
  ProviderResult,
} from "../../app/_lib/market-intelligence/provider";
import type { MarketSnapshot } from "../../app/_lib/market-intelligence/snapshot";
import {
  parseStockXCatalogPage,
  parseStockXMarketData,
  parseStockXVariants,
  type StockXCatalogPage,
} from "./stockxSchemas";

const API_BASE = "https://api.stockx.com";
const TOKEN_URL = "https://accounts.stockx.com/oauth/token";
const AUDIENCE = "gateway.stockx.com";
const STOCKX_CURRENCIES = new Set([
  "AUD", "CAD", "CHF", "EUR", "GBP", "HKD",
  "JPY", "KRW", "MXN", "NZD", "SGD", "USD",
]);

export type StockXTokenSet = Readonly<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
}>;

export interface StockXTokenStore {
  load(): Promise<StockXTokenSet | null>;
  save(tokens: StockXTokenSet): Promise<void>;
}

export type StockXOAuthState = Readonly<{
  redirectUri: string;
  expiresAt: string;
}>;

export interface StockXOAuthStateStore {
  save(state: string, value: StockXOAuthState): Promise<void>;
  consume(state: string): Promise<StockXOAuthState | null>;
}

export class InMemoryStockXOAuthStateStore implements StockXOAuthStateStore {
  readonly #states = new Map<string, StockXOAuthState>();

  async save(state: string, value: StockXOAuthState): Promise<void> {
    this.#states.set(state, value);
  }

  async consume(state: string): Promise<StockXOAuthState | null> {
    const value = this.#states.get(state) ?? null;
    this.#states.delete(state);
    return value;
  }
}

export class InMemoryStockXTokenStore implements StockXTokenStore {
  #tokens: StockXTokenSet | null;

  constructor(initial: StockXTokenSet | null = null) {
    this.#tokens = initial;
  }

  async load(): Promise<StockXTokenSet | null> {
    return this.#tokens;
  }

  async save(tokens: StockXTokenSet): Promise<void> {
    this.#tokens = tokens;
  }
}

export type StockXProviderConfig = Readonly<{
  apiKey: string | null;
  clientId: string | null;
  clientSecret: string | null;
  redirectUri: string | null;
  currency: string;
  tokenStore: StockXTokenStore;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  timeoutMs?: number;
  cacheTtlMs?: number;
}>;

type JsonResponse =
  | { status: "success"; data: unknown }
  | Exclude<ProviderResult<never>, { status: "success" } | { status: "partial" }>;

function cleanSecret(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function readStockXConfigFromEnv(
  env: Readonly<Record<string, string | undefined>>,
  tokenStore: StockXTokenStore = new InMemoryStockXTokenStore(),
): StockXProviderConfig {
  return {
    apiKey: cleanSecret(env.STOCKX_API_KEY),
    clientId: cleanSecret(env.STOCKX_CLIENT_ID),
    clientSecret: cleanSecret(env.STOCKX_CLIENT_SECRET),
    redirectUri: cleanSecret(env.STOCKX_REDIRECT_URI),
    currency: STOCKX_CURRENCIES.has(env.STOCKX_CURRENCY ?? "")
      ? env.STOCKX_CURRENCY!
      : "JPY",
    tokenStore,
  };
}

function capability(config: StockXProviderConfig): MarketProviderCapability {
  return {
    provider: "stockx",
    access: "approved_account",
    catalogSearch: true,
    currentAsk: true,
    currentBid: true,
    soldPrice: false,
    listingSearch: false,
    historicalSeries: false,
    sizeSpecific: true,
    automatedCollectionAllowed: true,
    credentialsAvailable: Boolean(
      config.apiKey && config.clientId && config.clientSecret,
    ),
    termsCheckedAt: "2026-07-30",
  };
}

function sizeTypeFor(variant: SneakerVariant): string {
  return {
    US_M: "us m",
    US_W: "us w",
    JP_CM: "jp cm",
    UK: "uk",
    EU: "eu",
  }[variant.sizeSystem];
}

function sameNumericSize(left: string, right: string): boolean {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  return Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
    ? leftNumber === rightNumber
    : left.normalize("NFKC").trim() === right.normalize("NFKC").trim();
}

function parseRetryAfter(response: Response): number | null {
  const raw = response.headers.get("retry-after");
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function validRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ||
      (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}

export class StockXProvider implements MarketDataProvider {
  readonly id = "stockx" as const;
  readonly #config: StockXProviderConfig;
  readonly #fetch: typeof fetch;
  readonly #now: () => Date;
  readonly #timeoutMs: number;
  readonly #cacheTtlMs: number;
  readonly #cache = new Map<string, { expiresAt: number; value: unknown }>();
  readonly #inFlight = new Map<string, Promise<JsonResponse>>();

  constructor(config: StockXProviderConfig) {
    this.#config = config;
    this.#fetch = config.fetchImpl ?? fetch;
    this.#now = config.now ?? (() => new Date());
    this.#timeoutMs = config.timeoutMs ?? 8_000;
    this.#cacheTtlMs = config.cacheTtlMs ?? 60_000;
  }

  getCapability(): MarketProviderCapability {
    return capability(this.#config);
  }

  async searchCatalog(
    query: MarketCatalogQuery,
  ): Promise<MarketCatalogSearchResult> {
    if (!this.getCapability().credentialsAvailable) {
      return { status: "not_configured" };
    }
    const trimmed = query.query.trim();
    if (!trimmed || trimmed.length > 100) return { status: "schema_error" };
    const limit = Math.max(1, Math.min(50, Math.floor(query.limit ?? 10)));
    const page = Number(query.cursor ?? "1");
    if (!Number.isSafeInteger(page) || page < 1) {
      return { status: "schema_error" };
    }
    const params = new URLSearchParams({
      query: trimmed,
      pageSize: String(limit),
      pageNumber: String(page),
    });
    const result = await this.#requestJson(`/v2/catalog/search?${params}`);
    if (result.status !== "success") return result;
    const parsed = parseStockXCatalogPage(result.data);
    if (!parsed) return { status: "schema_error" };
    return {
      status: "success",
      data: {
        items: parsed.products.map((product) => ({
          provider: "stockx",
          providerProductId: product.productId,
          brand: product.brand,
          modelName: product.title,
          colorwayName: product.colorway,
          styleCode: product.styleId,
          releaseYear: product.releaseYear,
        })),
        nextCursor: parsed.hasNextPage ? String(parsed.pageNumber + 1) : null,
      },
    };
  }

  async getCurrentSnapshot(
    identity: CanonicalSneakerIdentity,
    variant: SneakerVariant,
  ): Promise<MarketSnapshotResult> {
    if (!this.getCapability().credentialsAvailable) {
      return { status: "not_configured" };
    }
    if (!identity.styleCode || variant.condition !== "new") {
      return { status: "not_supported" };
    }

    const catalogResult = await this.#requestJson(
      `/v2/catalog/search?${new URLSearchParams({
        query: identity.styleCode,
        pageSize: "10",
        pageNumber: "1",
      })}`,
    );
    if (catalogResult.status !== "success") return catalogResult;
    const catalog = parseStockXCatalogPage(catalogResult.data);
    if (!catalog) return { status: "schema_error" };
    const product = this.#findExactProduct(identity, catalog);
    if (!product) return { status: "not_supported" };

    const variantsResult = await this.#requestJson(
      `/v2/catalog/products/${encodeURIComponent(product.productId)}/variants`,
    );
    if (variantsResult.status !== "success") return variantsResult;
    const variants = parseStockXVariants(variantsResult.data);
    if (!variants) return { status: "schema_error" };
    const stockxVariant = variants.find(
      (item) =>
        item.sizeType.toLocaleLowerCase("en-US") === sizeTypeFor(variant) &&
        sameNumericSize(item.size, variant.sizeValue),
    );
    if (!stockxVariant) return { status: "not_supported" };

    const params = new URLSearchParams({ currencyCode: this.#config.currency });
    const marketResult = await this.#requestJson(
      `/v2/catalog/products/${encodeURIComponent(product.productId)}/variants/${encodeURIComponent(stockxVariant.variantId)}/market-data?${params}`,
    );
    if (marketResult.status !== "success") return marketResult;
    const market = parseStockXMarketData(marketResult.data);
    if (
      !market ||
      market.productId !== product.productId ||
      market.variantId !== stockxVariant.variantId ||
      market.currencyCode !== this.#config.currency
    ) {
      return { status: "schema_error" };
    }

    const observedAt = this.#now().toISOString();
    const common: Omit<MarketSnapshot, "priceType" | "amount"> = {
      provider: "stockx",
      identity,
      variant,
      currency: market.currencyCode,
      observedAt,
      sourceReference: `stockx:${product.productId}:${stockxVariant.variantId}`,
      sampleCount: null,
      identityMatch: "exact",
      sourceQuality: "official_api",
      includesFees: null,
      includesShipping: null,
      includesTax: null,
    };
    const snapshots: MarketSnapshot[] = [];
    if (market.lowestAskAmount !== null) {
      snapshots.push({
        ...common,
        priceType: "lowest_ask",
        amount: market.lowestAskAmount,
      });
    }
    if (market.highestBidAmount !== null) {
      snapshots.push({
        ...common,
        priceType: "highest_bid",
        amount: market.highestBidAmount,
      });
    }

    return { status: "success", data: { identity, variant, snapshots } };
  }

  #findExactProduct(
    identity: CanonicalSneakerIdentity,
    catalog: StockXCatalogPage,
  ): StockXCatalogPage["products"][number] | null {
    return catalog.products.find((product) =>
      matchSneakerIdentity(identity, {
        brand: product.brand,
        modelName: product.title,
        colorwayName: product.colorway,
        styleCode: product.styleId,
        releaseYear: product.releaseYear,
      }).match === "exact"
    ) ?? null;
  }

  async #requestJson(path: string, allowRefresh = true): Promise<JsonResponse> {
    const cached = this.#cache.get(path);
    const now = this.#now().getTime();
    if (cached && cached.expiresAt > now) {
      return { status: "success", data: cached.value };
    }
    const existing = this.#inFlight.get(path);
    if (existing) return existing;

    const request = this.#performRequest(path, allowRefresh);
    this.#inFlight.set(path, request);
    try {
      const result = await request;
      if (result.status === "success") {
        this.#cache.set(path, {
          expiresAt: now + this.#cacheTtlMs,
          value: result.data,
        });
      }
      return result;
    } finally {
      this.#inFlight.delete(path);
    }
  }

  async #performRequest(path: string, allowRefresh: boolean): Promise<JsonResponse> {
    if (!this.#config.apiKey) return { status: "not_configured" };
    const tokens = await this.#getUsableTokens();
    if (tokens === "not_authorized") return { status: "not_authorized" };
    if (!tokens) return { status: "not_configured" };

    let response: Response;
    try {
      response = await this.#fetch(`${API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "x-api-key": this.#config.apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.#timeoutMs),
      });
    } catch (error) {
      return error instanceof DOMException && error.name === "TimeoutError"
        ? { status: "timeout" }
        : { status: "network_error" };
    }

    if (response.status === 429) {
      return { status: "rate_limited", retryAfter: parseRetryAfter(response) };
    }
    if (response.status === 401 && allowRefresh) {
      const refreshed = await this.#refreshTokens(tokens.refreshToken);
      if (!refreshed) return { status: "not_authorized" };
      return this.#performRequest(path, false);
    }
    if (response.status === 401 || response.status === 403) {
      return { status: "not_authorized" };
    }
    if (!response.ok) return { status: "network_error" };

    try {
      return { status: "success", data: await response.json() };
    } catch {
      return { status: "schema_error" };
    }
  }

  async #getUsableTokens(): Promise<
    StockXTokenSet | "not_authorized" | null
  > {
    const tokens = await this.#config.tokenStore.load();
    if (!tokens) return null;
    if (Date.parse(tokens.expiresAt) > this.#now().getTime() + 30_000) {
      return tokens;
    }
    return await this.#refreshTokens(tokens.refreshToken) ?? "not_authorized";
  }

  async #refreshTokens(refreshToken: string | null): Promise<StockXTokenSet | null> {
    if (
      !refreshToken ||
      !this.#config.clientId ||
      !this.#config.clientSecret
    ) {
      return null;
    }
    try {
      const response = await this.#fetch(TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: this.#config.clientId,
          client_secret: this.#config.clientSecret,
          refresh_token: refreshToken,
          audience: AUDIENCE,
        }),
        signal: AbortSignal.timeout(this.#timeoutMs),
      });
      if (!response.ok) return null;
      const value: unknown = await response.json();
      if (
        typeof value !== "object" ||
        value === null ||
        !("access_token" in value) ||
        typeof value.access_token !== "string" ||
        !("expires_in" in value) ||
        typeof value.expires_in !== "number" ||
        !Number.isFinite(value.expires_in) ||
        value.expires_in <= 0
      ) {
        return null;
      }
      const tokens: StockXTokenSet = {
        accessToken: value.access_token,
        refreshToken:
          "refresh_token" in value && typeof value.refresh_token === "string"
            ? value.refresh_token
            : refreshToken,
        expiresAt: new Date(
          this.#now().getTime() + value.expires_in * 1_000,
        ).toISOString(),
      };
      await this.#config.tokenStore.save(tokens);
      return tokens;
    } catch {
      return null;
    }
  }
}

export function createStockXAuthorizationUrl(
  config: Pick<StockXProviderConfig, "clientId" | "redirectUri">,
  state: string,
): string | null {
  if (
    !config.clientId ||
    !config.redirectUri ||
    !validRedirectUri(config.redirectUri) ||
    state.length < 32
  ) {
    return null;
  }
  const url = new URL("https://accounts.stockx.com/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "openid offline_access",
    audience: AUDIENCE,
    state,
  }).toString();
  return url.toString();
}

export async function beginStockXAuthorization(
  config: Pick<StockXProviderConfig, "clientId" | "redirectUri">,
  stateStore: StockXOAuthStateStore,
  options: Readonly<{
    now?: () => Date;
    createState?: () => string;
  }> = {},
): Promise<string | null> {
  const now = options.now?.() ?? new Date();
  const state = options.createState?.() ??
    `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const url = createStockXAuthorizationUrl(config, state);
  if (!url || !config.redirectUri) return null;
  await stateStore.save(state, {
    redirectUri: config.redirectUri,
    expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
  });
  return url;
}

export async function completeStockXAuthorization(
  config: StockXProviderConfig,
  stateStore: StockXOAuthStateStore,
  callback: Readonly<{ code: string; state: string; redirectUri: string }>,
): Promise<ProviderResult<Readonly<{ expiresAt: string }>>> {
  const pending = await stateStore.consume(callback.state);
  const now = config.now?.() ?? new Date();
  if (
    !pending ||
    Date.parse(pending.expiresAt) <= now.getTime() ||
    pending.redirectUri !== callback.redirectUri ||
    config.redirectUri !== callback.redirectUri ||
    !validRedirectUri(callback.redirectUri) ||
    !callback.code.trim()
  ) {
    return { status: "not_authorized" };
  }
  if (!config.clientId || !config.clientSecret) {
    return { status: "not_configured" };
  }

  try {
    const response = await (config.fetchImpl ?? fetch)(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: callback.code,
        redirect_uri: callback.redirectUri,
        audience: AUDIENCE,
      }),
      signal: AbortSignal.timeout(config.timeoutMs ?? 8_000),
    });
    if (response.status === 401 || response.status === 403) {
      return { status: "not_authorized" };
    }
    if (!response.ok) return { status: "network_error" };
    const value: unknown = await response.json();
    if (
      typeof value !== "object" ||
      value === null ||
      !("access_token" in value) ||
      typeof value.access_token !== "string" ||
      !("refresh_token" in value) ||
      typeof value.refresh_token !== "string" ||
      !("expires_in" in value) ||
      typeof value.expires_in !== "number" ||
      !Number.isFinite(value.expires_in) ||
      value.expires_in <= 0
    ) {
      return { status: "schema_error" };
    }
    const tokens: StockXTokenSet = {
      accessToken: value.access_token,
      refreshToken: value.refresh_token,
      expiresAt: new Date(
        now.getTime() + value.expires_in * 1_000,
      ).toISOString(),
    };
    await config.tokenStore.save(tokens);
    return { status: "success", data: { expiresAt: tokens.expiresAt } };
  } catch (error) {
    return error instanceof DOMException && error.name === "TimeoutError"
      ? { status: "timeout" }
      : { status: "network_error" };
  }
}
