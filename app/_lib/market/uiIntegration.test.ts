import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("Rakuten market_find result UI", () => {
  const panelSource = readFileSync(
    new URL("../../_components/CoreV1RecommendationPanel.tsx", import.meta.url),
    "utf8",
  );
  const marketSource = readFileSync(
    new URL("../../_components/RakutenMarketFind.tsx", import.meta.url),
    "utf8",
  );

  it("renders a separate, click-to-search Rakuten section", () => {
    expect(panelSource).toContain("RakutenMarketFind");
    expect(marketSource).toContain("楽天で近い商品を探す");
    expect(marketSource).toContain("楽天市場の購入参考候補");
    expect(marketSource).toContain("onClick={searchProducts}");
    expect(marketSource).not.toContain("useEffect(");
    expect(marketSource).toContain("/api/market/rakuten?q=");
  });

  it("renders product details, a safe link, and the required disclaimer", () => {
    expect(marketSource).toContain("product.title");
    expect(marketSource).toContain("product.shopName");
    expect(marketSource).toContain("formatPrice(product.price)");
    expect(marketSource).toContain('target="_blank" rel="noreferrer"');
    expect(marketSource).toContain("価格・在庫・サイズは変動します。購入前に販売ページで確認してください。");
  });

  it("keeps empty and API failure states soft and separate from recommendations", () => {
    expect(marketSource).toContain('status: "empty"');
    expect(marketSource).toContain('status: "error"');
    expect(marketSource).toContain("推薦結果には影響ありません。");
    expect(marketSource).not.toContain("公式確認済み");
    expect(marketSource).not.toContain("検証済みモデル");
    expect(marketSource).not.toContain("在庫あり確定");
  });
});
