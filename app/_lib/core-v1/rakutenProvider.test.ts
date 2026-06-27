import { fetchRakutenCandidates } from "./rakutenProvider";

describe("Rakuten server-side candidate provider", () => {
  it("returns missing_config without attempting a request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await fetchRakutenCandidates({}, { env: {}, fetcher });

    expect(result.status).toBe("missing_config");
    expect(result.candidates).toEqual([]);
    expect(result.networkAttempted).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    [403, "blocked_forbidden"],
    [429, "blocked_rate_limit"],
    [500, "network_or_http_error"],
  ] as const)("maps HTTP %s to %s and preserves fallback", async (httpStatus, status) => {
    const result = await fetchRakutenCandidates(
      {},
      {
        env: configuredEnv(),
        fetcher: vi.fn(async () => new Response(null, { status: httpStatus })),
      },
    );

    expect(result).toMatchObject({
      status,
      candidates: [],
      networkAttempted: true,
      responseOk: false,
      shapeValid: false,
      httpStatus,
    });
  });

  it("uses a valid HTTP 200 response as normalized Rakuten candidates", async () => {
    const fetcher = vi.fn(async (request: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(request));
      const headers = new Headers(init?.headers);

      expect(url.searchParams.get("formatVersion")).toBe("2");
      expect(url.searchParams.get("accessKey")).toBeNull();
      expect(headers.get("accessKey")).toBe("access-key");

      return jsonResponse({
        items: [
          {
            itemName: "Classic Sneaker",
            itemPrice: 15_000,
            itemUrl: "https://item.rakuten.co.jp/example/classic/",
            shopName: "Example Shop",
          },
        ],
      });
    });
    const result = await fetchRakutenCandidates(
      { budgetYen: 20_000, preferenceTags: ["classic"] },
      { env: configuredEnv(), fetcher },
    );

    expect(result).toMatchObject({
      status: "ready",
      networkAttempted: true,
      responseOk: true,
      shapeValid: true,
      httpStatus: 200,
      readiness: { status: "ready" },
      candidates: [
        {
          name: "Classic Sneaker",
          source: "rakuten",
          priceYen: 15_000,
          budgetFit: 100,
          risk: "low",
          readiness: "ready_external",
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects HTTP 200 when response shape is invalid", async () => {
    const result = await fetchRakutenCandidates(
      {},
      {
        env: configuredEnv(),
        fetcher: vi.fn(async () => jsonResponse({ items: [{ itemName: "shoe" }] })),
      },
    );

    expect(result).toMatchObject({
      status: "invalid_response",
      candidates: [],
      networkAttempted: true,
      responseOk: true,
      shapeValid: false,
    });
  });

  it("maps thrown fetches to a safe network fallback", async () => {
    const result = await fetchRakutenCandidates(
      {},
      {
        env: configuredEnv(),
        fetcher: vi.fn(async () => {
          throw new Error("sensitive transport detail");
        }),
      },
    );

    expect(result.status).toBe("network_or_http_error");
    expect(JSON.stringify(result)).not.toContain("sensitive");
  });
});

function configuredEnv() {
  return {
    RAKUTEN_APPLICATION_ID: "application-id",
    RAKUTEN_ACCESS_KEY: "access-key",
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
