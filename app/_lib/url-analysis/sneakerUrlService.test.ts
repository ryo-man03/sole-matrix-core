import {
  analyzeSneakerUrl,
  analyzeSneakerUrlSafely,
  SneakerUrlError,
  type ResolveHostname,
} from "./sneakerUrlService";

const publicResolver: ResolveHostname = async () => [
  { address: "93.184.216.34", family: 4 },
];

describe("safe sneaker URL analysis", () => {
  it.each([
    "http://shop.example/item",
    "http://localhost/item",
    "http://127.0.0.1/item",
    "http://0.0.0.0/item",
    "http://[::1]/item",
    "http://169.254.169.254/latest/meta-data",
    "file:///etc/passwd",
    "data:text/html,secret",
    "javascript:alert(1)",
    "ftp://example.com/shoe",
    "https://sole-matrix.ngrok-free.app/shoe",
    "https://demo.pinggy.link/shoe",
    "https://sample.trycloudflare.com/shoe",
  ])("blocks unsafe URL %s before fetch", async (inputUrl) => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      analyzeSneakerUrl(inputUrl, { fetcher, resolveHostname: publicResolver }),
    ).rejects.toBeInstanceOf(SneakerUrlError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("blocks a hostname when DNS resolves to a private address", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const privateResolver: ResolveHostname = async () => [
      { address: "10.0.0.8", family: 4 },
    ];

    await expect(
      analyzeSneakerUrl("https://shop.example/item", {
        fetcher,
        resolveHostname: privateResolver,
      }),
    ).rejects.toMatchObject({ code: "BLOCKED_ADDRESS" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fails closed when the public hostname cannot be resolved", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const failedResolver: ResolveHostname = async () => {
      throw new Error("host lookup fixture failed");
    };

    await expect(
      analyzeSneakerUrl("https://missing.example/item", {
        fetcher,
        resolveHostname: failedResolver,
      }),
    ).rejects.toMatchObject({ code: "DNS_LOOKUP_FAILED" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("extracts only allowed metadata from a public HTML page", async () => {
    const html = `<!doctype html><html><head>
      <title>Fallback title</title>
      <meta name="description" content="Fallback description">
      <meta property="og:title" content="adidas Tobacco Gruen | Example Shop">
      <meta property="og:description" content="Suede &amp; gum sole">
      <meta property="og:image" content="https://cdn.example/shoe.jpg">
      <link rel="canonical" href="/products/tobacco">
    </head><body><script>const secret = 'never return body';</script></body></html>`;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const result = await analyzeSneakerUrl("https://shop.example/item#detail", {
      fetcher,
      resolveHostname: publicResolver,
    });

    expect(result).toMatchObject({
      source: "metadata",
      inputUrl: "https://shop.example/item#detail",
      finalUrl: "https://shop.example/item",
      title: "adidas Tobacco Gruen | Example Shop",
      description: "Suede & gum sole",
      imageUrl: "https://cdn.example/shoe.jpg",
      canonicalUrl: "https://shop.example/products/tobacco",
      extractedNameHint: "adidas Tobacco Gruen",
      confidence: 1,
      cautions: [],
    });
    expect(fetcher).toHaveBeenCalledWith(
      new URL("https://shop.example/item"),
      expect.objectContaining({
        redirect: "manual",
        credentials: "omit",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("revalidates redirect targets and blocks a private redirect", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://127.0.0.1/admin" },
      }),
    );

    await expect(
      analyzeSneakerUrl("https://shop.example/item", {
        fetcher,
        resolveHostname: publicResolver,
      }),
    ).rejects.toMatchObject({ code: "BLOCKED_ADDRESS" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns a non-blocking fallback without exposing the response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("provider details", {
        status: 429,
        headers: { "content-type": "text/plain" },
      }),
    );

    const result = await analyzeSneakerUrlSafely("https://shop.example/item", {
      fetcher,
      resolveHostname: publicResolver,
    });

    expect(result.confidence).toBe(0);
    expect(result.source).toBe("fallback");
    expect(result.cautions).toEqual(["商品ページを取得できませんでした。"]);
    expect(JSON.stringify(result)).not.toContain("provider details");
  });

  it("allows a public HTTPS URL", async () => {
    const inputUrl = "https://shop.example/item";
    const result = await analyzeSneakerUrl(inputUrl, {
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(
        new Response("<title>Public sneaker page</title>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
      resolveHostname: publicResolver,
    });
    expect(result.finalUrl).toBe(inputUrl);
  });

  it.each([
    "::1",
    "fc00::1",
    "fd12:3456:789a::1",
    "fe80::1",
    "ff02::1",
    "2001:db8::1",
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.8",
    "::ffff:169.254.169.254",
  ])("blocks a hostname resolving to private or reserved IPv6 %s", async (address) => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(analyzeSneakerUrl("https://shop.example/item", {
      fetcher,
      resolveHostname: async () => [{ address, family: 6 }],
    })).rejects.toMatchObject({ code: "BLOCKED_ADDRESS" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses validated Gemini URL Context as a fallback", async () => {
    const geminiFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: "Puma Clyde product page",
                      description: "Suede heritage sneaker",
                      extractedNameHint: "Puma Clyde",
                      confidence: 0.74,
                      cautions: ["price not verified"],
                    }),
                  },
                ],
              },
              url_context_metadata: {
                url_metadata: [
                  {
                    retrieved_url: "https://shop.example/private?secret=raw",
                    url_retrieval_status: "URL_RETRIEVAL_STATUS_SUCCESS",
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const result = await analyzeSneakerUrlSafely(
      "https://shop.example/item",
      {
        fetcher: vi.fn<typeof fetch>().mockResolvedValue(
          new Response(null, { status: 500 }),
        ),
        resolveHostname: publicResolver,
        geminiApiKey: "configured-key",
        geminiFetcher,
      },
    );

    expect(result).toMatchObject({
      source: "gemini_url_context",
      title: "Puma Clyde product page",
      extractedNameHint: "Puma Clyde",
      confidence: 0.74,
    });
    expect(result.cautions.join(" ")).toContain("Core Decisionには関与しません");
    expect(JSON.stringify(result)).not.toContain("secret=raw");
    const [request, init] = geminiFetcher.mock.calls[0]!;
    expect(String(request)).not.toContain("configured-key");
    expect(new Headers(init?.headers).get("x-goog-api-key")).toBe(
      "configured-key",
    );
    expect(String(init?.body)).toContain('"url_context"');
  });

  it("falls back safely when Gemini URL Context returns invalid JSON", async () => {
    const result = await analyzeSneakerUrlSafely(
      "https://shop.example/item",
      {
        fetcher: vi.fn<typeof fetch>().mockResolvedValue(
          new Response(null, { status: 500 }),
        ),
        resolveHostname: publicResolver,
        geminiApiKey: "configured-key",
        geminiFetcher: vi.fn<typeof fetch>().mockResolvedValue(
          new Response(
            JSON.stringify({
              candidates: [
                { content: { parts: [{ text: "invalid-json raw detail" }] } },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        ),
      },
    );

    expect(result.source).toBe("fallback");
    expect(JSON.stringify(result)).not.toContain("raw detail");
  });
});
