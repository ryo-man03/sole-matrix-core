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
    expect(marketSource).toContain("現在の販売・出品情報を見る");
    expect(marketSource).toContain("onClick={searchProducts}");
    expect(marketSource).toContain('useEffect(() =>');
    expect(marketSource).toContain('/api/me/fit-confidence');
    expect(marketSource).toContain("/api/market/search");
    expect(marketSource.indexOf('/api/market/search')).toBeGreaterThan(marketSource.indexOf("async function searchProducts"));
    expect(marketSource).toContain("おすすめの順位や評価には影響しません");
    expect(marketSource).not.toContain("Core Score");
    expect(marketSource).not.toContain("Ryo Score");
  });

  it("explains price semantics and purchase risks before technical detail", () => {
    expect(marketSource).toContain("最初に見る4項目");
    expect(beginnerSource).toContain("現在の出品価格");
    expect(marketSource).toContain("未確認（無料とは限りません）");
    expect(marketSource).toContain("税・関税込み総額は未確認");
    expect(marketSource).toContain("技術的な取得詳細");
    expect(marketSource).toContain("商品情報の確認内容を見る");
    expect(panelSource).toContain("相場データ・履歴・技術情報を見る");
    expect(marketSource).toContain('target="_blank" rel="noreferrer"');
    expect(marketSource).toContain("Supported by Rakuten Developers");
  });

  it("retains the previous result and separates related listings", () => {
    expect(marketSource).toContain("前回の結果を表示しています");
    expect(marketSource).toContain("比較用の関連候補");
    expect(marketSource).toContain("おすすめ結果には影響しません");
    expect(marketSource).toContain("確認できていないカラーは表示しません");
  });

  it("separates domestic retail from international marketplace evidence", () => {
    expect(marketSource).toContain("国内の販売情報");
    expect(marketSource).toContain("Rakuten・Yahoo!ショッピング");
    expect(marketSource).toContain("海外の出品情報");
    expect(marketSource).toContain("通貨・送料・関税と商品の状態");
    expect(marketSource).toContain("summary.condition");
    expect(marketSource).toContain("summary.currency");
  });
});
