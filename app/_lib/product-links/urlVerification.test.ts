import type { ResolveHostname } from "../url-analysis/sneakerUrlService";
import { verifyProductUrl } from "./urlVerification";

const publicResolver: ResolveHostname = async () => [
  { address: "93.184.216.34", family: 4 },
];
const fixedNow = () => new Date("2026-06-29T03:04:05.000Z");

describe("live product URL verification", () => {
  it.each([
    "ftp://example.com/item",
    "javascript:alert(1)",
    "data:text/html,secret",
    "file:///etc/passwd",
    "http://localhost:3000/item",
    "http://127.0.0.1/item",
    "http://10.0.0.8/item",
    "https://demo.ngrok-free.app/item",
    "https://demo.pinggy.link/item",
    "https://demo.trycloudflare.com/item",
  ])("blocks unsafe URL %s without fetching", async (input) => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await verifyProductUrl(input, {
      fetcher,
      resolveHostname: publicResolver,
      now: fixedNow,
    });

    expect(result).toMatchObject({
      status: "blocked",
      verifiedAt: "2026-06-29T03:04:05.000Z",
    });
    expect(result).not.toHaveProperty("href");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("verifies a public URL and removes tracking, credentials, and hash", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    const result = await verifyProductUrl(
      "https://example.com/item?size=27&utm_source=mail&token=secret&ref=affiliate#buy",
      { fetcher, resolveHostname: publicResolver, now: fixedNow },
    );

    expect(result).toEqual({
      status: "verified_live",
      href: "https://example.com/item?size=27",
      displayDomain: "example.com",
      verifiedAt: "2026-06-29T03:04:05.000Z",
    });
    expect(String(fetcher.mock.calls[0]?.[0])).not.toContain("secret");
    expect(String(fetcher.mock.calls[0]?.[0])).not.toContain("utm_");
  });

  it("revalidates redirects and blocks a private redirect target", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/admin" },
      }),
    );
    const result = await verifyProductUrl("https://example.com/item", {
      fetcher,
      resolveHostname: publicResolver,
      now: fixedNow,
    });

    expect(result.status).toBe("blocked");
    expect(result).not.toHaveProperty("href");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("uses a bounded GET status check when HEAD is unsupported", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const result = await verifyProductUrl("https://example.com/item", {
      fetcher,
      resolveHostname: publicResolver,
      now: fixedNow,
    });

    expect(result.status).toBe("verified_live");
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      new URL("https://example.com/item"),
      expect.objectContaining({
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        headers: expect.objectContaining({ Range: "bytes=0-0" }),
      }),
    );
  });

  it("returns not_found for a timeout or missing page without exposing the URL", async () => {
    const timeoutResult = await verifyProductUrl("https://example.com/private?token=secret", {
      fetcher: vi.fn<typeof fetch>().mockRejectedValue(new Error("timeout")),
      resolveHostname: publicResolver,
      now: fixedNow,
    });
    const missingResult = await verifyProductUrl("https://example.com/missing", {
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 404 }),
      ),
      resolveHostname: publicResolver,
      now: fixedNow,
    });

    expect(timeoutResult.status).toBe("not_found");
    expect(missingResult.status).toBe("not_found");
    expect(JSON.stringify(timeoutResult)).not.toContain("secret");
    expect(timeoutResult).not.toHaveProperty("href");
  });
});
