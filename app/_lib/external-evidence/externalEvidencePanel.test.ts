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
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
