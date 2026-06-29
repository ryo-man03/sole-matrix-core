import {
  buildRakutenSearchKeyword,
  fetchRakutenCandidates,
} from "./rakutenProvider";

describe("Rakuten server-side candidate provider", () => {
  it("returns missing_config without attempting a request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await fetchRakutenCandidates({}, { env: {}, fetcher });

    expect(result.status).toBe("missing_config");
    expect(result.candidates).toEqual([]);
    expect(result.evidence).toEqual([]);
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
      expect(url.searchParams.get("keyword")).toBe(
        "adidas Tobacco brown クラシック スニーカー",
      );
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
      {
        budgetYen: 20_000,
        preferenceTags: ["classic"],
        sneakerName: "adidas Tobacco",
        brand: "adidas",
        color: "brown",
        urlNameHint: "adidas Tobacco",
      },
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
          budgetFit: 65,
          risk: "medium",
          readiness: "ready_external",
        },
      ],
      evidence: [
        {
          kind: "external_listing",
          provider: "rakuten",
          listingName: "Classic Sneaker",
          priceYen: 15_000,
          confidence: "normalized_listing",
          budgetFitImpact: "none",
          coreDecisionImpact: "none",
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("builds a compact query from practical sneaker inputs", () => {
    expect(
      buildRakutenSearchKeyword({
        sneakerName: "  Puma   Clyde MIJ  ",
        brand: "Puma",
        color: "navy",
        urlNameHint: "Puma Clyde MIJ",
        preferenceTags: ["heritage"],
      }),
    ).toBe("Puma Clyde MIJ navy スニーカー");
    expect(buildRakutenSearchKeyword({})).toBe("スニーカー");
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

  it("does not connect Rakuten price directly to budgetFit", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        items: [
          {
            itemName: "Classic Sneaker",
            itemPrice: 15_000,
            itemUrl: "https://item.rakuten.co.jp/example/classic/",
          },
        ],
      }),
    );
    const lowBudget = await fetchRakutenCandidates(
      { budgetYen: 8_000 },
      { env: configuredEnv(), fetcher },
    );
    const highBudget = await fetchRakutenCandidates(
      { budgetYen: 30_000 },
      { env: configuredEnv(), fetcher },
    );

    expect(lowBudget.candidates[0]?.budgetFit).toBe(65);
    expect(highBudget.candidates[0]?.budgetFit).toBe(65);
    expect(lowBudget.evidence[0]?.budgetFitImpact).toBe("none");
  });

  it("never logs request URLs, application IDs, access keys, or raw responses", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await fetchRakutenCandidates(
      {},
      {
        env: configuredEnv(),
        fetcher: vi.fn(async () => jsonResponse({ unexpectedRaw: "raw-secret" })),
      },
    );

    expect(info).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("application-id");
    expect(JSON.stringify(result)).not.toContain("access-key");
    expect(JSON.stringify(result)).not.toContain("raw-secret");
    info.mockRestore();
    log.mockRestore();
    error.mockRestore();
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
