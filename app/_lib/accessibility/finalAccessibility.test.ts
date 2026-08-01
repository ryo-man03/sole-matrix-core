import { readFileSync } from "node:fs";
import path from "node:path";

describe("final keyboard, motion, and progressive rendering quality", () => {
  const layout = readFileSync(
    path.join(process.cwd(), "app", "layout.tsx"),
    "utf8",
  );
  const mainContainer = readFileSync(
    path.join(process.cwd(), "app", "_components", "MainContainer.tsx"),
    "utf8",
  );
  const recommendationPanel = readFileSync(
    path.join(process.cwd(), "app", "_components", "CoreV1RecommendationPanel.tsx"),
    "utf8",
  );
  const css = readFileSync(
    path.join(process.cwd(), "app", "globals.css"),
    "utf8",
  ).replace(/\r\n/g, "\n");

  it("offers a keyboard skip target and visible focus treatment", () => {
    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain("本文へ移動");
    expect(mainContainer).toContain('id="main-content"');
    expect(css).toMatch(/\.skip-to-content:focus\s*\{[^}]*transform:\s*translateY\(0\)/s);
    expect(css).toMatch(/:where\(a, button, input, textarea, select\):focus-visible\s*\{/s);
  });

  it("announces loading and respects reduced motion", () => {
    expect(recommendationPanel).toContain("aria-busy={isLoading}");
    expect(recommendationPanel).toContain('role="status"');
    expect(recommendationPanel).toContain('aria-live="polite"');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation-duration: 0.01ms !important");
  });

  it("defers below-fold paint without hiding semantic content", () => {
    expect(css).toContain("@supports (content-visibility: auto)");
    expect(css).toContain("content-visibility: auto");
    expect(css).toContain("contain-intrinsic-size: auto 320px");
    expect(css).not.toMatch(/display:\s*none[^}]*core-v1-result/s);
  });
});
