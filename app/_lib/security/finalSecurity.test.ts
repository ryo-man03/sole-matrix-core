import { readFileSync } from "node:fs";

describe("final application security boundary", () => {
  it("applies browser hardening headers to every route", () => {
    const configSource = readFileSync(
      new URL("../../../next.config.ts", import.meta.url),
      "utf8",
    );
    expect(configSource).toContain('source: "/:path*"');
    expect(configSource).toContain('"X-Content-Type-Options", value: "nosniff"');
    expect(configSource).toContain('"X-Frame-Options", value: "DENY"');
    expect(configSource).toContain('"Referrer-Policy", value: "strict-origin-when-cross-origin"');
    expect(configSource).toContain('"Cross-Origin-Opener-Policy", value: "same-origin"');
    expect(configSource).toContain("camera=(), microphone=(), geolocation=(), payment=()");
  });

  it("keeps provider credentials server-only and out of browser source", () => {
    const clientSources = [
      "../../_components/CoreV1RecommendationPanel.tsx",
      "../../_components/RecommendationWorkspace.tsx",
      "../../_components/RakutenMarketFind.tsx",
      "../apiClient.ts",
    ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

    expect(clientSources).not.toMatch(/GEMINI_API_KEY|RAKUTEN_ACCESS_KEY|SUPABASE_SERVICE/);
    expect(clientSources).not.toMatch(/NEXT_PUBLIC_(?:GEMINI|RAKUTEN|SUPABASE_SERVICE)/);
  });
});
