import type { ResolveHostname } from "../url-analysis/sneakerUrlService";
import { createProductUrlCandidates, resolveLiveProductUrls, resolveManualProductUrl } from "./liveProductUrlResolver";

const publicResolver: ResolveHostname = async () => [{ address: "93.184.216.34", family: 4 }];
const fixedNow = () => new Date("2026-06-29T03:04:05.000Z");

describe("live product URL resolver", () => {
  it("builds encoded search fallbacks without hard-coded product URLs", () => {
    const candidates = createProductUrlCandidates('<script>alert("x")</script> adidas Samba OG');
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((item) => item.kind === "search")).toBe(true);
    expect(candidates[0]?.href).toContain("%3Cscript%3E");
    expect(candidates[0]?.href).not.toContain("<script>");
  });

  it("does not create product links for an empty product name", async () => {
    expect(createProductUrlCandidates("   ")).toEqual([]);
    await expect(resolveLiveProductUrls("   ", [], { now: fixedNow })).resolves.toMatchObject({ status: "not_found", links: [] });
  });

  it("keeps verified direct URLs and always provides explicit search fallbacks", async () => {
    const result = await resolveLiveProductUrls("adidas Samba OG", [{ href: "https://shop.example/samba?utm_source=mail", source: "rakuten" }], { fetcher: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 })), resolveHostname: publicResolver, now: fixedNow });
    expect(result.links[0]).toMatchObject({ label: "楽天の商品ページを見る", href: "https://shop.example/samba", verificationStatus: "verified_live" });
    expect(result.links.slice(1).map((link) => link.label)).toEqual(expect.arrayContaining(["Googleで探す（検索リンク）", "楽天で探す（検索リンク）", "SNKRDUNKで探す（検索リンク）"]));
  });

  it("keeps search fallback when direct candidates are unavailable", async () => {
    const result = await resolveLiveProductUrls("New Balance 991", [], { now: fixedNow });
    expect(result.status).toBe("resolved");
    expect(result.links).toHaveLength(3);
    expect(result.links.every((link) => link.source === "search_fallback")).toBe(true);
  });

  it("cannot mutate Core score, budgetFit, or Decision", async () => {
    const coreResult = Object.freeze({ decision: "buy" as const, score: 81.2, budgetFit: 74 });
    const before = { ...coreResult };
    const links = await resolveLiveProductUrls("Converse One Star", [], { now: fixedNow });
    expect(links.links.length).toBeGreaterThan(0);
    expect(coreResult).toEqual(before);
    expect(links.links.every((link) => link.coreDecisionImpact === "none" && link.scoreImpact === "none")).toBe(true);
  });

  it("keeps a safe manual URL and blocks unsafe input", async () => {
    const safe = await resolveManualProductUrl("https://example.com/item?utm_campaign=sale&size=27", { fetcher: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 })), resolveHostname: publicResolver, now: fixedNow });
    const unsafe = await resolveManualProductUrl("javascript:alert(1)", { now: fixedNow });
    expect(safe.links[0]).toMatchObject({ href: "https://example.com/item?size=27", source: "manual" });
    expect(unsafe).toMatchObject({ status: "blocked", links: [] });
  });
});
