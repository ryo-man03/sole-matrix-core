import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExternalEvidencePanel } from "../../_components/ExternalEvidencePanel";

describe("External Evidence Panel", () => {
  it("keeps the Core boundary visible and collapses secondary evidence", () => {
    const html = renderToStaticMarkup(createElement(ExternalEvidencePanel, { result: null }));
    expect(html).toContain("外部証拠・参考情報");
    expect(html).toContain("参考リンク・画像・URLの内容を見る");
    expect(html).toContain("商品参考リンク");
    expect(html).toContain("Core score・Decision・budgetFitを変更しません");
    expect(html).not.toContain("画像がある場合に");
    expect(html).not.toContain("URLがある場合に");
  });

  it("contains none of the prohibited certainty claims", () => {
    const source = readFileSync(path.join(process.cwd(), "app", "_components", "ExternalEvidencePanel.tsx"), "utf8");
    for (const forbidden of ["在庫あり", "最安値", "購入可能です", "本物保証"]) expect(source).not.toContain(forbidden);
    expect(source).not.toContain('<a href={listing.productUrl}');
  });

  it("renders only displayable links with safe external-link attributes", () => {
    const html = renderToStaticMarkup(createElement(ExternalEvidencePanel, { result: null, productLinks: [
      { label: "Googleで探す（検索リンク）", href: "https://www.google.com/search?q=adidas%20Samba%20OG", displayDomain: "www.google.com", source: "search_fallback", verificationStatus: "search_fallback", verifiedAt: "2026-06-29T03:04:05.000Z", coreDecisionImpact: "none", scoreImpact: "none", note: "未検証の検索入口です。" },
      { label: "blocked link", href: "https://blocked.example/item", displayDomain: "blocked.example", source: "manual", verificationStatus: "blocked", verifiedAt: "2026-06-29T03:04:05.000Z", coreDecisionImpact: "none", scoreImpact: "none", note: "blocked" },
    ] }));
    expect(html).toContain("商品参考リンク");
    expect(html).toContain("未検証の検索入口");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("blocked.example");
  });
});
