import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RecommendationWorkspace } from "../../_components/RecommendationWorkspace";

describe("responsive product workspace", () => {
  it("renders a five-step product-only mobile structure and the desktop grid", () => {
    const html = renderToStaticMarkup(createElement(RecommendationWorkspace));

    expect(html).toContain("mobile-workspace-steps");
    expect(html).toContain("desktop-workspace-layout");
    for (let step = 1; step <= 5; step += 1) {
      expect(html).toContain(`mobile-step-${step}`);
    }
    expect(html).not.toContain("workspace-diagnosis-card");
  });

  it("uses intrinsic grid tracks and enables three columns at 1024px", () => {
    const css = readFileSync(
      path.join(process.cwd(), "app", "globals.css"),
      "utf8",
    );
    const normalizedCss = css.replace(/\r\n/g, "\n");

    expect(normalizedCss).toContain("@media (min-width: 1024px)");
    expect(normalizedCss).toContain(
      "grid-template-columns:\n      minmax(0, 0.92fr)",
    );
    expect(normalizedCss).toContain(
      "grid-template-columns: repeat(3, minmax(0, 1fr))",
    );
    expect(normalizedCss).not.toMatch(
      /\.mobile-workspace-steps\s*\{[^}]*width:\s*\d{4,}px/s,
    );
    expect(normalizedCss).toMatch(
      /\.product-link-list li\s*\{[^}]*min-width:\s*0/s,
    );
    expect(normalizedCss).toMatch(
      /\.manual-product-link input,[\s\S]*?min-width:\s*0/s,
    );
  });
});
