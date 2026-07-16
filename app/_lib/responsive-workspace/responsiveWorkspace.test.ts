import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RecommendationWorkspace } from "../../_components/RecommendationWorkspace";
import { ExternalEvidencePanel } from "../../_components/ExternalEvidencePanel";
import { SettingsPanel } from "../../_components/SettingsPanel";
import HomePage from "../../page";

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

  it("uses intrinsic tracks and keeps the result readable at laptop widths", () => {
    const css = readFileSync(
      path.join(process.cwd(), "app", "globals.css"),
      "utf8",
    );
    const normalizedCss = css.replace(/\r\n/g, "\n");

    expect(normalizedCss).toContain("@media (min-width: 1024px)");
    expect(normalizedCss).toContain("@media (min-width: 1120px)");
    expect(normalizedCss).toContain(
      "grid-template-columns: minmax(280px, 340px) minmax(0, 1fr)",
    );
    expect(normalizedCss).toContain(
      "grid-template-columns: minmax(0, 860px) minmax(280px, 340px)",
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
    expect(normalizedCss).toContain("--surface-page:");
    expect(normalizedCss).toContain("--accent-primary:");
    expect(normalizedCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(normalizedCss).not.toMatch(/html\s*\{[^}]*overflow-x:\s*hidden/s);
    expect(normalizedCss).toContain(".workspace-progress");
    expect(normalizedCss).toContain(".workspace-image-preview");
    expect(normalizedCss).not.toContain("min-height: 650px");
    expect(normalizedCss).toContain("text-wrap: balance");
    expect(normalizedCss).toContain("line-break: strict");
    expect(normalizedCss).toMatch(
      /\.workspace-candidate-summary h4\s*\{[^}]*overflow-wrap:\s*anywhere/s,
    );
  });

  it("lets headings wrap naturally and keeps secondary detail collapsible", () => {
    const homeHtml = renderToStaticMarkup(createElement(HomePage));
    const evidenceHtml = renderToStaticMarkup(
      createElement(ExternalEvidencePanel, { result: null }),
    );
    const settingsHtml = renderToStaticMarkup(createElement(SettingsPanel));

    expect(homeHtml).toContain("迷っている一足を、買う前に整理する。");
    expect(homeHtml).toContain("AIの答えではなく、あなたの購入判断をつくる。");
    expect(homeHtml).not.toContain("<br");
    expect(evidenceHtml).toContain("external-evidence-details");
    expect(evidenceHtml).toContain("参考リンク・画像・URLの内容を見る");
    expect(settingsHtml).toContain("settings-technical-details");
    expect(settingsHtml).toContain("技術情報と外部サービスの扱い");
  });
});
