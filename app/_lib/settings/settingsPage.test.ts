import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import SettingsPage from "../../settings/page";

describe("settings page", () => {
  const panelSource = readFileSync(new URL("../../_components/SettingsPanel.tsx", import.meta.url), "utf8");

  it("renders data, session, external evidence, corpus, and Ryo seed policies", () => {
    const html = renderToStaticMarkup(createElement(SettingsPage));
    expect(html).toContain("保存されるデータ");
    expect(panelSource).toContain("ゲスト利用中");
    expect(html).toContain("ログアウト");
    expect(html).toContain("ゲストデータを削除");
    expect(html).toContain("アカウント削除:");
    expect(html).toContain("現在は未対応です。利用可能とは表示しません。");
    expect(html).toContain("推薦結果そのものの一覧・再利用用履歴は保存しません");
    expect(html).toContain("外部API利用");
    expect(html).toContain("共通推薦フィードバックコーパス");
    expect(html).toContain("Ryo Mode curated seed");
  });
});
