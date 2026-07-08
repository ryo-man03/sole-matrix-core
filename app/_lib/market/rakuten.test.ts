import { afterEach, describe, expect, it, vi } from "vitest";

import {
  RAKUTEN_MARKET_DISCLAIMER,
  RakutenApiError,
  RakutenCredentialsMissingError,
  calculateRakutenConfidence,
  guessBrand,
  isSuspiciousRakutenTitle,
  normalizeSneakerTitle,
  searchRakutenProducts,
} from "./rakuten";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Rakuten market product search", () => {
  it("normalizes a Rakuten response into market_find candidates", async () => {
    configureCredentials();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      items: [{
        itemName: "【送料無料】 Converse   Jack Purcell CL Black ",
        itemPrice: 12_800,
        itemUrl: "https://item.rakuten.co.jp/example/jack-purcell/",
        mediumImageUrls: [{ imageUrl: "https://thumbnail.example.com/item.jpg" }],
        shopName: "Example Shop",
        shopCode: "example",
        itemCode: "example:jack-purcell",
        availability: 1,
        reviewCount: 12,
        reviewAverage: 4.7,
      }],
    }));
    vi.stubGlobal("fetch", fetcher);

    const products = await searchRakutenProducts({
      query: "Converse Jack Purcell CL black",
    });

    expect(products).toEqual([
      expect.objectContaining({
        source: "rakuten",
        slot: "market_find",
        title: "【送料無料】 Converse Jack Purcell CL Black",
        normalizedModelName: "Converse Jack Purcell CL Black",
        brand: "Converse",
        price: 12_800,
        shopName: "Example Shop",
        shopCode: "example",
        itemCode: "example:jack-purcell",
        availability: 1,
        reviewCount: 12,
        reviewAverage: 4.7,
      }),
    ]);
    expect(products[0]?.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(products[0]?.query).toBe("Converse Jack Purcell CL black");
    expect(products[0]?.disclaimer).toBe(RAKUTEN_MARKET_DISCLAIMER);

    const [request, init] = fetcher.mock.calls[0] ?? [];
    const requestUrl = new URL(String(request));
    const requestHeaders = new Headers(init?.headers);
    expect(requestUrl.pathname).toContain("/20260701");
    expect(requestUrl.searchParams.get("applicationId")).toBe("application-id");
    expect(requestUrl.searchParams.get("accessKey")).toBeNull();
    expect(requestUrl.searchParams.get("formatVersion")).toBe("2");
    expect(requestUrl.searchParams.get("availability")).toBe("1");
    expect(requestUrl.searchParams.get("imageFlag")).toBe("1");
    expect(requestUrl.searchParams.get("field")).toBe("1");
    expect(requestUrl.searchParams.get("carrier")).toBe("2");
    expect(requestUrl.searchParams.get("purchaseType")).toBe("0");
    expect(requestUrl.searchParams.get("hits")).toBe("10");
    expect(requestUrl.searchParams.get("page")).toBe("1");
    expect(requestUrl.searchParams.get("sort")).toBe("standard");
    expect(requestHeaders.get("accept")).toBe("application/json");
    expect(requestHeaders.get("accessKey")).toBe("access-key");
    expect(requestHeaders.get("origin")).toBeNull();
    expect((init as RequestInit & { next?: { revalidate?: number } }).next?.revalidate)
      .toBe(60 * 30);
  });

  it("normalizes the live 2026 Rakuten Items response shape", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      Items: [{
        itemName: "CONVERSE JACK PURCELL CL black",
        itemPrice: 13_200,
        itemUrl: "https://hb.afl.rakuten.co.jp/hgc/example/",
        mediumImageUrls: ["https://thumbnail.image.rakuten.co.jp/example.jpg"],
        shopName: "KICKS LAB. 楽天市場店",
        availability: 1,
      }],
    })));

    const products = await searchRakutenProducts({
      query: "Converse Jack Purcell CL black",
    });

    expect(products).toEqual([
      expect.objectContaining({
        title: "CONVERSE JACK PURCELL CL black",
        imageUrl: "https://thumbnail.image.rakuten.co.jp/example.jpg",
        price: 13_200,
        shopName: "KICKS LAB. 楽天市場店",
      }),
    ]);
  });

  it("sends an Origin header when a request origin is provided", async () => {
    configureCredentials();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      items: [],
    }));
    vi.stubGlobal("fetch", fetcher);

    await searchRakutenProducts({
      query: "Converse Jack Purcell",
      requestOrigin: "https://abc123.ngrok-free.app/search",
    });

    const [, init] = fetcher.mock.calls[0] ?? [];
    const requestHeaders = new Headers(init?.headers);
    expect(requestHeaders.get("origin")).toBe("https://abc123.ngrok-free.app");
  });

  it("throws a recognizable error when credentials are missing", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "");
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);

    await expect(searchRakutenProducts({ query: "adidas Tobacco" }))
      .rejects.toBeInstanceOf(RakutenCredentialsMissingError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects suspicious marketplace titles", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      items: [
        {
          itemName: "Nike style custom sneaker",
          itemUrl: "https://item.rakuten.co.jp/example/custom/",
        },
        {
          itemName: "Nike LD-1000 black sail sesame",
          itemUrl: "https://item.rakuten.co.jp/example/ld-1000/",
        },
      ],
    })));

    const products = await searchRakutenProducts({ query: "Nike LD-1000" });

    expect(products).toHaveLength(1);
    expect(products[0]?.normalizedModelName).toBe("Nike LD-1000 black sail sesame");
    expect(isSuspiciousRakutenTitle("ノーブランド Nike 風 スニーカー")).toBe(true);
    expect(isSuspiciousRakutenTitle("Nike 防風 ランニングジャケット")).toBe(false);
  });

  it.each([
    ["Nike Air Max", "Nike"],
    ["アディダス Tobacco", "adidas"],
    ["Converse One Star", "Converse"],
    ["プーマ Clyde", "PUMA"],
    ["ヴァンズ Authentic", "Vans"],
    ["New Balance 998", "New Balance"],
    ["リーボック Club C", "Reebok"],
    ["PRO-Keds Royal Plus", "PRO-Keds"],
    ["アシックス GEL-LYTE", "ASICS"],
    ["オニツカタイガー MEXICO 66", "Onitsuka Tiger"],
  ])("guesses the brand in %s", (title, expectedBrand) => {
    expect(guessBrand(title)).toBe(expectedBrand);
  });

  it("cleans leading promotion labels without translating model names", () => {
    expect(normalizeSneakerTitle("【送料無料】Converse Jack Purcell CL Black"))
      .toBe("Converse Jack Purcell CL Black");
    expect(normalizeSneakerTitle("[セール] adidas Tobacco Mesa Gum"))
      .toBe("adidas Tobacco Mesa Gum");
  });

  it("returns an empty array for an empty Rakuten response", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ items: [] }),
    ));

    await expect(searchRakutenProducts({ query: "PUMA Clyde" }))
      .resolves.toEqual([]);
  });

  it("throws a structured API error", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          error: "too_many_requests",
          error_description: "Please try again soon.",
        },
        429,
      ),
    ));

    const result = searchRakutenProducts({ query: "PUMA Clyde" });
    await expect(result).rejects.toMatchObject({
      name: "RakutenApiError",
      code: "too_many_requests",
      status: 429,
      message: "Please try again soon.",
    } satisfies Partial<RakutenApiError>);
  });

  it("maps the 2026 gateway error shape into a structured API error", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          errors: {
            errorCode: 403,
            errorMessage: "REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING",
          },
        },
        403,
      ),
    ));

    const result = searchRakutenProducts({ query: "PUMA Clyde" });
    await expect(result).rejects.toMatchObject({
      name: "RakutenApiError",
      code: "REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING",
      status: 403,
      message: "REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING",
    } satisfies Partial<RakutenApiError>);
  });

  it("clamps confidence between zero and one", () => {
    const high = calculateRakutenConfidence({
      itemName: "Converse Jack Purcell CL black",
      itemUrl: "https://item.rakuten.co.jp/example/jack-purcell/",
      mediumImageUrls: [{ imageUrl: "https://thumbnail.example.com/item.jpg" }],
      availability: 1,
      reviewCount: 100,
    }, "Converse Jack Purcell CL black");
    const low = calculateRakutenConfidence({
      itemName: "fake 風",
    }, "Converse Jack Purcell CL black special limited edition");

    expect(high).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(1);
    expect(low).toBeGreaterThanOrEqual(0);
    expect(low).toBeLessThanOrEqual(1);
  });
});

function configureCredentials(): void {
  vi.stubEnv("RAKUTEN_APPLICATION_ID", "application-id");
  vi.stubEnv("RAKUTEN_ACCESS_KEY", "access-key");
  vi.stubEnv("RAKUTEN_AFFILIATE_ID", "affiliate-id");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
