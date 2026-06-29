import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../api/product-links/resolve/route";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("product link resolve route", () => {
  it("normalizes a client rakuten claim on an untrusted URL to manual", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 })),
    );

    const response = await POST(
      new Request("https://example.com/api/product-links/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "recommendation",
          productName: "adidas Samba OG",
          directUrls: [
            { href: "https://example.com/item?token=secret", source: "rakuten" },
          ],
        }),
      }),
    );
    const body = (await response.json()) as {
      ok: boolean;
      data: { links: Array<{ href: string; source: string }> };
    };

    expect(body.ok).toBe(true);
    expect(body.data.links[0]).toMatchObject({
      href: "https://example.com/item",
      source: "manual",
    });
    expect(JSON.stringify(body)).not.toContain("token=secret");
  });

  it("normalizes a client official claim on an untrusted URL to manual", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 })),
    );

    const response = await POST(
      new Request("https://example.com/api/product-links/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "recommendation",
          productName: "Nike Air Jordan 1 High",
          directUrls: [
            { href: "https://example.com/item?api_key=hidden", source: "official" },
          ],
        }),
      }),
    );
    const body = (await response.json()) as {
      ok: boolean;
      data: { links: Array<{ href: string; source: string }> };
    };

    expect(body.ok).toBe(true);
    expect(body.data.links[0]).toMatchObject({
      href: "https://example.com/item",
      source: "manual",
    });
    expect(JSON.stringify(body)).not.toContain("api_key");
  });

  it("keeps Rakuten provider URLs as rakuten links even when the client claims manual", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 })),
    );

    const response = await POST(
      new Request("https://example.com/api/product-links/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "recommendation",
          productName: "adidas Samba OG",
          directUrls: [
            {
              href: "https://item.rakuten.co.jp/example/samba?utm_source=mail",
              source: "manual",
            },
          ],
        }),
      }),
    );
    const body = (await response.json()) as {
      ok: boolean;
      data: { links: Array<{ href: string; source: string }> };
    };

    expect(body.ok).toBe(true);
    expect(body.data.links[0]).toMatchObject({
      href: "https://item.rakuten.co.jp/example/samba",
      source: "rakuten",
    });
    expect(JSON.stringify(body)).not.toContain("utm_source");
  });
});