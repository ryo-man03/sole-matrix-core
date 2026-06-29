import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import SettingsPage from "../../settings/page";

describe("settings page", () => {
  it("renders data, session, external evidence, corpus, and Ryo seed policies", () => {
    const html = renderToStaticMarkup(createElement(SettingsPage));
    expect(html).toContain("保存されるデータ");
    expect(html).toContain("ログアウト");
    expect(html).toContain("ゲストデータ削除");
    expect(html).toContain("将来のアカウント削除（準備中）");
    expect(html).toContain("外部API利用");
    expect(html).toContain("共通推薦フィードバックコーパス");
    expect(html).toContain("Ryo Mode curated seed");
  });
});
