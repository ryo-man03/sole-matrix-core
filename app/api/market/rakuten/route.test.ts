import { afterEach, describe, expect, it, vi } from "vitest";

import { RAKUTEN_MARKET_DISCLAIMER } from "../../../_lib/market/rakuten";
import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/market/rakuten", () => {
  it("returns 400 when q is missing", async () => {
    const response = await GET(request());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "missing_query",
      message: "q is required.",
    });
  });

  it("returns 400 when q is longer than 128 characters", async () => {
    const response = await GET(request(`?q=${"a".repeat(129)}`));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "query_too_long",
      message: "q must be 128 chars or less.",
    });
  });

  it("returns a structured missing_credentials response", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "");

    const response = await GET(request("?q=Converse%20Jack%20Purcell"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "missing_rakuten_credentials",
      message: "Rakuten API credentials are not configured.",
    });
  });

  it("returns a safe market_find response from a mocked Rakuten request", async () => {
    configureCredentials();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      items: [{
        itemName: "adidas Tobacco Mesa Gum",
        itemPrice: 14_800,
        itemUrl: "https://item.rakuten.co.jp/example/tobacco/",
        mediumImageUrls: [{ imageUrl: "https://thumbnail.example.com/tobacco.jpg" }],
        shopName: "Example Shop",
        availability: 1,
      }],
    }));
    vi.stubGlobal("fetch", fetcher);

    const response = await GET(request(
      "?q=adidas%20Tobacco%20Mesa%20Gum&minPrice=10000&maxPrice=20000&hits=5&page=1&sort=%2BitemPrice",
    ));
    const body = await response.json() as Record<string, unknown>;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      source: "rakuten",
      slot: "market_find",
      query: "adidas Tobacco Mesa Gum",
      disclaimer: RAKUTEN_MARKET_DISCLAIMER,
      products: [expect.objectContaining({
        source: "rakuten",
        slot: "market_find",
        normalizedModelName: "adidas Tobacco Mesa Gum",
      })],
    });
    expect(body["fetchedAt"]).toEqual(expect.any(String));
    expect(serialized).not.toContain("application-id-secret");
    expect(serialized).not.toContain("access-key-secret");
    const [, init] = fetcher.mock.calls[0] ?? [];
    const requestHeaders = new Headers(init?.headers);
    expect(requestHeaders.get("origin")).toBe("https://example.com");
  });

  it("does not make market_find safety guarantees or label it as Gemini grounding", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ items: [] }),
    ));

    const response = await GET(request("?q=New%20Balance%20998"));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(200);
    expect(serialized).not.toMatch(/在庫(?:を)?保証/u);
    expect(serialized).not.toMatch(/サイズ(?:を)?保証/u);
    expect(serialized).not.toMatch(/価格(?:を)?保証/u);
    expect(serialized).not.toMatch(/真贋(?:を)?保証|正規品保証/u);
    expect(serialized).not.toMatch(/Gemini grounded success/iu);
    expect(serialized).not.toMatch(/公式確認済み/u);
  });

  it("maps upstream errors without returning configured credentials", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        error: "system_error",
        error_description:
          "Temporary failure for application-id-secret with access-key-secret.",
      }, 500),
    ));

    const response = await GET(request("?q=PRO-Keds%20Royal%20Plus"));
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "rakuten_api_error",
      message: "Temporary failure for [redacted] with [redacted].",
      code: "system_error",
      upstreamStatus: 500,
    });
    expect(serialized).not.toContain("application-id-secret");
    expect(serialized).not.toContain("access-key-secret");
  });

  it("returns the safe 2026 gateway error details", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        errors: {
          errorCode: 403,
          errorMessage: "HTTP_REFERRER_NOT_ALLOWED",
        },
      }, 403),
    ));

    const response = await GET(request("?q=PRO-Keds%20Royal%20Plus"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "rakuten_api_error",
      message: "HTTP_REFERRER_NOT_ALLOWED",
      code: "HTTP_REFERRER_NOT_ALLOWED",
      upstreamStatus: 403,
    });
  });
});

function request(search = ""): Request {
  return new Request(`https://example.com/api/market/rakuten${search}`);
}

function configureCredentials(): void {
  vi.stubEnv("RAKUTEN_APPLICATION_ID", "application-id-secret");
  vi.stubEnv("RAKUTEN_ACCESS_KEY", "access-key-secret");
  vi.stubEnv("RAKUTEN_AFFILIATE_ID", "affiliate-id-secret");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
