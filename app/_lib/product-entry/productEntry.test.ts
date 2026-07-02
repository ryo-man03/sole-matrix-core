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
  });

  it("lets a guest enter while auth actions are available when configured", () => {
    expect(productEntryActions.find((action) => action.kind === "guest")?.href).toBe("/app?session=guest");
    expect(productEntryActions.find((action) => action.kind === "primary")?.status).toBe("available");
    expect(renderToStaticMarkup(createElement(ProductAppPage))).toContain("今日は何をしますか？");
  });

  it("keeps the home page as a landing page with a login CTA", () => {
    const html = renderToStaticMarkup(createElement(HomePage));
    expect(html).toContain('href="/login"');
    expect(html).toContain("はじめる");
    expect(html).not.toContain("recommendation-workspace");
    expect(html).not.toContain("preference-diagnosis-section");
  });
});
