import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ProductAppPage from "../../app/page";

describe("responsive product workspace", () => {
  it("renders a six-step mobile structure and the desktop workspace grid", () => {
    const html = renderToStaticMarkup(createElement(ProductAppPage));

    expect(html).toContain("mobile-workspace-steps");
    expect(html).toContain("desktop-workspace-layout");
    for (let step = 1; step <= 6; step += 1) {
      expect(html).toContain(`mobile-step-${step}`);
    }
  });

  it("uses intrinsic grid tracks and enables three columns at 1024px", () => {
    const css = readFileSync(
      path.join(process.cwd(), "app", "globals.css"),
      "utf8",
    );

    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain("grid-template-columns:\n      minmax(0, 0.92fr)");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).not.toMatch(/\.mobile-workspace-steps\s*\{[^}]*width:\s*\d{4,}px/s);
  });
});
