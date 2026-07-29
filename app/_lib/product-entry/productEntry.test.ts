import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProductAppPage from "../../app/page";
import LoginPage, { productEntryActions } from "../../login/page";
import HomePage from "../../page";

describe("product entry", () => {
  it("renders login, signup, guest entry, and storage explanation", () => {
    const html = renderToStaticMarkup(createElement(LoginPage));
    expect(html).toContain("SOLE//MATRIX");
    expect(html).toContain("ログイン");
    expect(html).toContain("新規登録");
    expect(html).toContain("ゲストで試す");
    expect(html).toContain("保存される情報");
    expect(html).toContain("プロフィール / 評価を保存");
    expect(html).toContain("推薦結果そのものを一覧・再利用できる履歴保存には現在対応していません");
    expect(html).toContain("パスワードを表示");
    expect(html).toContain("8文字以上");
  });

  it("lets a guest enter while auth actions are available when configured", () => {
    expect(productEntryActions.find((action) => action.kind === "guest")?.href).toBe("/app?session=guest");
    expect(productEntryActions.find((action) => action.kind === "primary")?.status).toBe("available");
    expect(renderToStaticMarkup(createElement(ProductAppPage))).toContain("今日は何をしますか？");
  });

  it("keeps the home page as a landing page with direct diagnosis and product paths", () => {
    const html = renderToStaticMarkup(createElement(HomePage));
    expect(html).toContain('href="/app?session=guest&amp;path=diagnosis"');
    expect(html).toContain('href="/app?session=guest&amp;path=product"');
    expect(html).toContain("はじめる");
    expect(html).toContain("スニーカー診断を始める");
    expect(html).toContain("楽天検索は推薦結果と分離して手動実行します");
    expect(html).not.toContain("recommendation-workspace");
    expect(html).not.toContain("preference-diagnosis-section");
  });
});
