import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import OnboardingPage from "../../onboarding/page";

describe("onboarding page", () => {
  it("renders every target-user onboarding category", () => {
    const html = renderToStaticMarkup(createElement(OnboardingPage));

    expect(html).toContain("買うか迷っている");
    expect(html).toContain("初心者");
    expect(html).toContain("1〜2万円");
    expect(html).toContain("合わせやすさ");
    expect(html).toContain("長く履けるか");
    expect(html).toContain("初回設定を完了する");
  });
});
