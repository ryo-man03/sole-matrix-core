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
    "http://localhost/item",
    "http://127.0.0.1/item",
    "http://[::1]/item",
    "http://169.254.169.254/latest/meta-data",
    "file:///etc/passwd",
    "data:text/html,secret",
    "javascript:alert(1)",
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
        headers: { location: "http://127.0.0.1/admin" },
      }),
    );

    await expect(
      analyzeSneakerUrl("http://shop.example/item", {
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
    expect(result.cautions).toEqual(["商品ページを取得できませんでした。"]);
    expect(JSON.stringify(result)).not.toContain("provider details");
  });
});
