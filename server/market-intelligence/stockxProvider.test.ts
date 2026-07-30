import {
  STOCKX_CATALOG_FIXTURE,
  STOCKX_MARKET_DATA_FIXTURE,
  STOCKX_VARIANTS_FIXTURE,
} from "./stockxFixtures";
import {
  beginStockXAuthorization,
  completeStockXAuthorization,
  createStockXAuthorizationUrl,
  InMemoryStockXOAuthStateStore,
  InMemoryStockXTokenStore,
  readStockXConfigFromEnv,
  StockXProvider,
  type StockXProviderConfig,
} from "./stockxProvider";

const NOW = new Date("2026-07-30T12:00:00.000Z");
const identity = {
  brand: "Nike",
  modelName: "Air Jordan 1 Retro High OG",
  colorwayName: "Chicago",
  styleCode: "DZ5485-612",
  releaseYear: 2022,
} as const;
const variant = {
  sizeSystem: "US_M",
  sizeValue: "9",
  condition: "new",
} as const;

function config(fetchImpl: typeof fetch): StockXProviderConfig {
  return {
    apiKey: "test-api-key",
    clientId: "test-client",
    clientSecret: "test-secret",
    redirectUri: "https://example.com/api/stockx/callback",
    currency: "JPY",
    tokenStore: new InMemoryStockXTokenStore({
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresAt: "2026-07-30T13:00:00.000Z",
    }),
    fetchImpl,
    now: () => NOW,
  };
}

function response(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("authorized StockX provider", () => {
  it("stays not configured when approved credentials are absent", async () => {
    const provider = new StockXProvider(
      readStockXConfigFromEnv({}, new InMemoryStockXTokenStore()),
    );
    expect(provider.getCapability().credentialsAvailable).toBe(false);
    await expect(provider.searchCatalog({ query: "Nike" })).resolves.toEqual({
      status: "not_configured",
    });
  });

  it("normalizes official catalog search fixture", async () => {
    const provider = new StockXProvider(
      config(async () => response(STOCKX_CATALOG_FIXTURE)),
    );
    const result = await provider.searchCatalog({
      query: "DZ5485-612",
      limit: 10,
    });
    expect(result).toEqual({
      status: "success",
      data: {
        items: [{
          provider: "stockx",
          providerProductId: "product-1",
          brand: "Nike",
          modelName: "Air Jordan 1 Retro High OG Chicago Reimagined",
          colorwayName: "Chicago",
          styleCode: "DZ5485-612",
          releaseYear: 2022,
        }],
        nextCursor: null,
      },
    });
  });

  it("keeps official lowest ask and highest bid separate in JPY", async () => {
    const bodies = [
      STOCKX_CATALOG_FIXTURE,
      STOCKX_VARIANTS_FIXTURE,
      STOCKX_MARKET_DATA_FIXTURE,
    ];
    const requests: string[] = [];
    const provider = new StockXProvider(
      config(async (input) => {
        requests.push(String(input));
        return response(bodies.shift());
      }),
    );

    const result = await provider.getCurrentSnapshot(identity, variant);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.snapshots.map(({ priceType, amount, currency }) => ({
      priceType,
      amount,
      currency,
    }))).toEqual([
      { priceType: "lowest_ask", amount: 42_000, currency: "JPY" },
      { priceType: "highest_bid", amount: 38_000, currency: "JPY" },
    ]);
    expect(requests.at(-1)).toContain("currencyCode=JPY");
  });

  it("rejects used-condition and model-only market requests", async () => {
    const provider = new StockXProvider(
      config(async () => response(STOCKX_CATALOG_FIXTURE)),
    );
    await expect(provider.getCurrentSnapshot(identity, {
      ...variant,
      condition: "used",
    })).resolves.toEqual({ status: "not_supported" });
    await expect(provider.getCurrentSnapshot({
      ...identity,
      styleCode: null,
    }, variant)).resolves.toEqual({ status: "not_supported" });
  });

  it("maps 429 without retrying", async () => {
    let calls = 0;
    const provider = new StockXProvider(
      config(async () => {
        calls += 1;
        return response({}, 429, { "retry-after": "60" });
      }),
    );
    await expect(provider.searchCatalog({ query: "Nike" })).resolves.toEqual({
      status: "rate_limited",
      retryAfter: 60,
    });
    expect(calls).toBe(1);
  });

  it("refreshes an expired OAuth token before the authorized request", async () => {
    const urls: string[] = [];
    const providerConfig = config(async (input) => {
      const url = String(input);
      urls.push(url);
      if (url.includes("/oauth/token")) {
        return response({
          access_token: "refreshed-access",
          refresh_token: "refreshed-refresh",
          expires_in: 3600,
        });
      }
      return response(STOCKX_CATALOG_FIXTURE);
    });
    const provider = new StockXProvider({
      ...providerConfig,
      tokenStore: new InMemoryStockXTokenStore({
        accessToken: "expired-access",
        refreshToken: "refresh-token",
        expiresAt: "2026-07-30T11:00:00.000Z",
      }),
    });
    await expect(provider.searchCatalog({ query: "Nike" }))
      .resolves.toMatchObject({ status: "success" });
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("/oauth/token");
    expect(urls[1]).toContain("/v2/catalog/search");
  });

  it("reports not_authorized when an expired OAuth token cannot refresh", async () => {
    const providerConfig = config(async () => response({}, 401));
    const provider = new StockXProvider({
      ...providerConfig,
      tokenStore: new InMemoryStockXTokenStore({
        accessToken: "expired-access",
        refreshToken: "rejected-refresh",
        expiresAt: "2026-07-30T11:00:00.000Z",
      }),
    });
    await expect(provider.searchCatalog({ query: "Nike" })).resolves.toEqual({
      status: "not_authorized",
    });
  });

  it("maps a request timeout without logging secrets", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const provider = new StockXProvider(
      config(async () => {
        throw new DOMException("timed out", "TimeoutError");
      }),
    );
    await expect(provider.searchCatalog({ query: "Nike" })).resolves.toEqual({
      status: "timeout",
    });
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("returns not_supported when the official catalog has no exact style match", async () => {
    const provider = new StockXProvider(
      config(async () => response({
        ...STOCKX_CATALOG_FIXTURE,
        products: [{
          ...STOCKX_CATALOG_FIXTURE.products[0],
          styleId: "WRONG-001",
        }],
      })),
    );
    await expect(provider.getCurrentSnapshot(identity, variant)).resolves.toEqual({
      status: "not_supported",
    });
  });

  it("preserves missing ask and bid as no observations instead of zero", async () => {
    const bodies = [
      STOCKX_CATALOG_FIXTURE,
      STOCKX_VARIANTS_FIXTURE,
      {
        ...STOCKX_MARKET_DATA_FIXTURE,
        lowestAskAmount: null,
        highestBidAmount: null,
      },
    ];
    const provider = new StockXProvider(
      config(async () => response(bodies.shift())),
    );
    const result = await provider.getCurrentSnapshot(identity, variant);
    expect(result).toMatchObject({
      status: "success",
      data: { snapshots: [] },
    });
  });

  it("maps malformed provider JSON to schema_error", async () => {
    const provider = new StockXProvider(
      config(async () => response({ products: "not-an-array" })),
    );
    await expect(provider.searchCatalog({ query: "Nike" })).resolves.toEqual({
      status: "schema_error",
    });
  });

  it("deduplicates concurrent requests and caches normalized source JSON briefly", async () => {
    let calls = 0;
    const provider = new StockXProvider(
      config(async () => {
        calls += 1;
        await Promise.resolve();
        return response(STOCKX_CATALOG_FIXTURE);
      }),
    );
    await Promise.all([
      provider.searchCatalog({ query: "Nike" }),
      provider.searchCatalog({ query: "Nike" }),
    ]);
    await provider.searchCatalog({ query: "Nike" });
    expect(calls).toBe(1);
  });

  it("requires a secure exact redirect and strong CSRF state", () => {
    expect(createStockXAuthorizationUrl({
      clientId: "client",
      redirectUri: "https://example.com/exact/callback",
    }, "a".repeat(32))).toContain(
      "redirect_uri=https%3A%2F%2Fexample.com%2Fexact%2Fcallback",
    );
    expect(createStockXAuthorizationUrl({
      clientId: "client",
      redirectUri: "http://example.com/callback",
    }, "a".repeat(32))).toBeNull();
    expect(createStockXAuthorizationUrl({
      clientId: "client",
      redirectUri: "https://example.com/callback",
    }, "weak")).toBeNull();
  });

  it("consumes CSRF state once and validates the exact redirect before token exchange", async () => {
    const stateStore = new InMemoryStockXOAuthStateStore();
    const providerConfig = config(async () => response({
      access_token: "issued-access",
      refresh_token: "issued-refresh",
      expires_in: 3600,
    }));
    const authorizationUrl = await beginStockXAuthorization(
      providerConfig,
      stateStore,
      {
        now: () => NOW,
        createState: () => "s".repeat(64),
      },
    );
    expect(authorizationUrl).toContain(`state=${"s".repeat(64)}`);

    const result = await completeStockXAuthorization(
      providerConfig,
      stateStore,
      {
        code: "authorization-code",
        state: "s".repeat(64),
        redirectUri: "https://example.com/api/stockx/callback",
      },
    );
    expect(result).toEqual({
      status: "success",
      data: { expiresAt: "2026-07-30T13:00:00.000Z" },
    });

    await expect(completeStockXAuthorization(
      providerConfig,
      stateStore,
      {
        code: "authorization-code",
        state: "s".repeat(64),
        redirectUri: "https://example.com/api/stockx/callback",
      },
    )).resolves.toEqual({ status: "not_authorized" });
  });

  it("rejects a callback redirect mismatch before sending secrets", async () => {
    let calls = 0;
    const providerConfig = config(async () => {
      calls += 1;
      return response({});
    });
    const stateStore = new InMemoryStockXOAuthStateStore();
    await beginStockXAuthorization(providerConfig, stateStore, {
      now: () => NOW,
      createState: () => "m".repeat(64),
    });
    await expect(completeStockXAuthorization(
      providerConfig,
      stateStore,
      {
        code: "authorization-code",
        state: "m".repeat(64),
        redirectUri: "https://attacker.example/callback",
      },
    )).resolves.toEqual({ status: "not_authorized" });
    expect(calls).toBe(0);
  });

  it("never exposes secret or token values in provider capability", () => {
    const provider = new StockXProvider(config(async () => response({})));
    const serialized = JSON.stringify(provider.getCapability());
    expect(serialized).not.toContain("test-api-key");
    expect(serialized).not.toContain("test-secret");
    expect(serialized).not.toContain("test-access-token");
  });
});
