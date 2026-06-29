import type { ResolveHostname } from "../url-analysis/sneakerUrlService";
import {
  createProductUrlCandidates,
  resolveLiveProductUrls,
  resolveManualProductUrl,
} from "./liveProductUrlResolver";

const publicResolver: ResolveHostname = async () => [
  { address: "93.184.216.34", family: 4 },
];
const fixedNow = () => new Date("2026-06-29T03:04:05.000Z");

describe("live product URL resolver", () => {
  it("builds encoded search fallbacks without hard-coded product URLs", () => {
    const candidates = createProductUrlCandidates(
      '<script>alert("x")</script> adidas Samba OG',
    );

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((item) => item.kind === "search")).toBe(true);
    expect(candidates.every((item) => item.source === "search_fallback")).toBe(true);
    expect(candidates[0]?.href).toContain("%3Cscript%3E");
    expect(candidates[0]?.href).not.toContain("<script>");
  });

  it("does not create candidates for an empty product name", () => {
    expect(createProductUrlCandidates("   ")).toEqual([]);
  });

  it("prefers a verified direct URL and labels verified searches as fallbacks", async () => {
    const result = await resolveLiveProductUrls(
      "adidas Samba OG",
      [{ href: "https://shop.example/samba?utm_source=mail", source: "rakuten" }],
      {
        fetcher: vi.fn<typeof fetch>().mockResolvedValue(
          new Response(null, { status: 200 }),
        ),
        resolveHostname: publicResolver,
        now: fixedNow,
      },
    );

    expect(result.status).toBe("resolved");
    expect(result.links[0]).toMatchObject({
      label: "楽天の商品ページを見る",
      href: "https://shop.example/samba",
      displayDomain: "shop.example",
      source: "rakuten",
      verificationStatus: "verified_live",
      verifiedAt: "2026-06-29T03:04:05.000Z",
      coreDecisionImpact: "none",
      scoreImpact: "none",
    });
    expect(result.links[1]).toMatchObject({
      source: "search_fallback",
      verificationStatus: "search_fallback",
      coreDecisionImpact: "none",
      scoreImpact: "none",
    });
    expect(result.links.every((link) => Number.isFinite(Date.parse(link.verifiedAt)))).toBe(true);
  });

  it("does not return blocked or missing candidates as links", async () => {
    const result = await resolveLiveProductUrls("New Balance 991", [], {
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 404 }),
      ),
      resolveHostname: publicResolver,
      now: fixedNow,
    });

    expect(result).toMatchObject({ status: "not_found", links: [] });
    expect(JSON.stringify(result)).not.toContain("https://");
  });

  it("cannot mutate Core score, budgetFit, or Decision", async () => {
    const coreResult = Object.freeze({
      decision: "buy" as const,
      score: 81.2,
      budgetFit: 74,
    });
    const before = { ...coreResult };
    const linkResult = await resolveLiveProductUrls("Converse One Star", [], {
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 200 }),
      ),
      resolveHostname: publicResolver,
      now: fixedNow,
    });

    expect(linkResult.links.length).toBeGreaterThan(0);
    expect(coreResult).toEqual(before);
    expect(linkResult.links.every((link) => link.coreDecisionImpact === "none")).toBe(true);
    expect(linkResult.links.every((link) => link.scoreImpact === "none")).toBe(true);
  });

  it("keeps a safe manual URL in screen state format and blocks unsafe input", async () => {
    const safe = await resolveManualProductUrl(
      "https://example.com/item?utm_campaign=sale&size=27",
      {
        fetcher: vi.fn<typeof fetch>().mockResolvedValue(
          new Response(null, { status: 200 }),
        ),
        resolveHostname: publicResolver,
        now: fixedNow,
      },
    );
    const unsafe = await resolveManualProductUrl("javascript:alert(1)", {
      fetcher: vi.fn<typeof fetch>(),
      resolveHostname: publicResolver,
      now: fixedNow,
    });

    expect(safe.links[0]).toMatchObject({
      href: "https://example.com/item?size=27",
      source: "manual",
      coreDecisionImpact: "none",
      scoreImpact: "none",
    });
    expect(unsafe).toMatchObject({ status: "blocked", links: [] });
    expect(JSON.stringify(unsafe)).not.toContain("javascript:");
  });
});
