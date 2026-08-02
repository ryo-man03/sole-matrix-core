import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("beginner market price result UI", () => {
  const panelSource = readFileSync(
    new URL("../../_components/CoreV1RecommendationPanel.tsx", import.meta.url),
    "utf8",
  );
  const marketSource = readFileSync(
    new URL("../../_components/RakutenMarketFind.tsx", import.meta.url),
    "utf8",
  );
  const beginnerSource = readFileSync(new URL("./beginner.ts", import.meta.url), "utf8");

  it("keeps market search manual and separate from recommendation ranking", () => {
    expect(panelSource).toContain("RakutenMarketFind");
    expect(marketSource).toContain("現在価格を確認");
    expect(marketSource).toContain("onClick={searchProducts}");
    expect(marketSource).not.toContain("useEffect(");
    expect(marketSource).toContain("/api/market/search");
    expect(marketSource).toContain("推薦順位やスコアは変更していません");
  });

  it("explains price semantics and purchase risks before technical detail", () => {
    expect(marketSource).toContain("最初に見る4項目");
    expect(beginnerSource).toContain("現在の出品価格");
    expect(marketSource).toContain("未確認（無料ではありません）");
    expect(marketSource).toContain("税・関税込み総額は未確認");
    expect(marketSource).toContain("技術的な取得詳細");
    expect(marketSource).toContain('target="_blank" rel="noreferrer"');
  });

  it("retains the previous result and separates related listings", () => {
    expect(marketSource).toContain("前回取得した情報を表示しています");
    expect(marketSource).toContain("比較用の関連候補");
    expect(marketSource).toContain("推薦結果には影響しません");
    expect(marketSource).toContain("カラーは表示しません");
  });
});
