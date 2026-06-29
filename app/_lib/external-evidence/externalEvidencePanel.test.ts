import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ExternalEvidencePanel } from "../../_components/ExternalEvidencePanel";

describe("External Evidence Panel", () => {
  it("renders safe fallback sections and the Core boundary", () => {
    const html = renderToStaticMarkup(
      createElement(ExternalEvidencePanel, { result: null }),
    );
    expect(html).toContain("外部証拠・参考情報");
    expect(html).toContain("楽天候補");
    expect(html).toContain("画像分析結果");
    expect(html).toContain("URL分析結果");
    expect(html).toContain("過去の推薦評価からの参考");
    expect(html).toContain("ここから上書きしません");
  });

  it("contains none of the prohibited certainty claims", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app", "_components", "ExternalEvidencePanel.tsx"),
      "utf8",
    );
    for (const forbidden of [
      "楽天完全連携完了",
      "Geminiが購入判断",
      "AIが正解を出した",
      "この価格が絶対に妥当",
      "過去データにより正解が確定した",
      "在庫あり",
      "最安値",
      "公式価格",
      "このURLを根拠に買うべき",
    ]) {
      expect(source).not.toContain(forbidden);
    }
    expect(source).not.toContain('<a href={listing.productUrl}');
  });

  it("renders only verified links with safe external-link attributes", () => {
    const html = renderToStaticMarkup(
      createElement(ExternalEvidencePanel, {
        result: null,
        productLinks: [
          {
            label: "Googleで探す（検索リンク）",
            href: "https://www.google.com/search?q=adidas%20Samba%20OG",
            displayDomain: "www.google.com",
            source: "search_fallback",
            verificationStatus: "search_fallback",
            verifiedAt: "2026-06-29T03:04:05.000Z",
            coreDecisionImpact: "none",
            scoreImpact: "none",
            note: "直接商品URLではなく、確認済みの検索リンクです。",
          },
          {
            label: "blocked link",
            href: "https://blocked.example/item",
            displayDomain: "blocked.example",
            source: "manual",
            verificationStatus: "blocked",
            verifiedAt: "2026-06-29T03:04:05.000Z",
            coreDecisionImpact: "none",
            scoreImpact: "none",
            note: "blocked",
          },
        ],
      }),
    );

    expect(html).toContain("商品参考リンク");
    expect(html).toContain("検索リンク");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("blocked.example");
    expect(html).toContain("購入判断スコアには影響しません");
  });
});
