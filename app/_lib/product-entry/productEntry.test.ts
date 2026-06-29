import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ProductAppPage from "../../app/page";
import LoginPage, { productEntryActions } from "../../login/page";

describe("product entry", () => {
  it("renders login, signup, guest entry, and the storage explanation", () => {
    const html = renderToStaticMarkup(createElement(LoginPage));

    expect(html).toContain("SOLE//MATRIX");
    expect(html).toContain("ログイン");
    expect(html).toContain("新規登録");
    expect(html).toContain("ゲストで試す");
    expect(html).toContain("保存される情報");
  });

  it("lets a guest enter the app without provider configuration", () => {
    const guestAction = productEntryActions.find(
      (action) => action.kind === "guest",
    );
    const loginAction = productEntryActions.find(
      (action) => action.kind === "primary",
    );

    expect(guestAction?.href).toBe("/app?session=guest");
    expect(loginAction?.href).toBe("/login?intent=login");
    expect(renderToStaticMarkup(createElement(ProductAppPage))).toContain(
      "ログインは必須ではありません",
    );
  });
});
