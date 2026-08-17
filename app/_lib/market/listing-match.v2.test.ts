import { describe, expect, it } from "vitest";

import type { MarketSearchContext } from "./contracts";
import { matchMarketListing, normalizeStyleCode, styleCodeFromTitle } from "./listing-match";

const styleVariations = Array.from({ length: 20 }, (_, index) => ({
  label: `style separator variant ${index}`,
  expected: index % 2 ? "U991-BB2" : "u991 bb2",
  observed: index % 3 ? "U991BB2" : "u991-bb2",
}));

const partialStyles = Array.from({ length: 15 }, (_, index) => ({
  label: `partial style ${index}`,
  expected: `AB${String(1200 + index)}CD`,
  observed: `AB${String(1200 + index)}`,
}));

const generationCases = Array.from({ length: 20 }, (_, index) => [
  ["New Balance 991", "New Balance 991v2"],
  ["New Balance 991v2", "New Balance 991"],
  ["New Balance 990v3", "New Balance 990v4"],
  ["adidas Samba OG", "adidas Samba ADV"],
  ["Vans Authentic", "Vans Authentic 44 DX"],
  ["Air Jordan 1 Low", "Air Jordan 1 Low Golf"],
][index % 6] as [string, string]);

const audienceCases = Array.from({ length: 15 }, (_, index) => ({
  expected: (["men", "women", "kids"] as const)[index % 3]!,
  observed: (["women", "kids", "men"] as const)[index % 3]!,
}));

const modelCases = Array.from({ length: 10 }, (_, index) => ({
  color: index % 2 ? "Grey" : "Navy",
  expected: index % 2 ? "probable" : "related",
} as const));

describe("Market Intelligence V2 deterministic listing matching", () => {
  it.each(styleVariations)("accepts complete $label", ({ expected, observed }) => {
    const result = matchMarketListing(context({ styleCode: expected }), listing({ styleCode: observed, title: `New Balance 991v2 Grey ${observed}` }));
    expect(result.matchLevel).toBe("exact");
    expect(normalizeStyleCode(expected)).toBe(normalizeStyleCode(observed));
  });

  it.each(partialStyles)("rejects $label", ({ expected, observed }) => {
    expect(styleCodeFromTitle(`New Balance Model ${observed}`, expected)).toBeNull();
    expect(matchMarketListing(context({ styleCode: expected }), listing({ styleCode: observed })).matchLevel).toBe("rejected");
  });

  it.each(generationCases)("rejects generation or derivative mismatch: %s / %s", (expected, observed) => {
    const result = matchMarketListing(
      context({ modelName: expected, styleCode: null, colorwayName: null, brand: brandOf(expected) }),
      listing({ title: observed, canonicalBrand: brandOf(observed), canonicalModelName: observed, generation: null, styleCode: null, colorwayName: null }),
    );
    expect(result.matchLevel).toBe("rejected");
    expect(result.warnings).toContain("generation_conflict");
  });

  it.each(audienceCases)("rejects $expected vs $observed audience", ({ expected, observed }) => {
    const result = matchMarketListing({ ...context(), gender: expected }, listing({ audience: observed }));
    expect(result.matchLevel).toBe("rejected");
    expect(result.warnings).toContain("gender_conflict");
  });

  it.each(modelCases)("keeps model-only match classification separate $expected $color", ({ expected, color }) => {
    const result = matchMarketListing(
      context({ styleCode: null, colorwayName: "Grey", verificationState: "model_color_verified" }),
      listing({ styleCode: null, colorwayName: color, title: `New Balance 991v2 ${color}` }),
    );
    expect(result.matchLevel).toBe(expected);
  });
});

function context(identity: Partial<MarketSearchContext["identity"]> = {}): MarketSearchContext {
  return {
    query: "New Balance 991v2 Grey U991BB2",
    identity: {
      brand: "New Balance",
      modelName: "New Balance 991v2",
      colorwayName: "Grey",
      styleCode: "U991BB2",
      verificationState: "model_color_style_verified",
      ...identity,
    },
    gender: "unisex",
    sizeSystem: "UNKNOWN",
    size: null,
    condition: "unknown",
  };
}

function listing(overrides: Record<string, unknown> = {}) {
  return {
    title: "New Balance 991v2 Grey U991BB2",
    canonicalBrand: "New Balance",
    canonicalModelName: "New Balance 991v2",
    modelFamily: "991",
    generation: "v2",
    colorwayName: "Grey",
    styleCode: "U991BB2",
    audience: "unisex" as const,
    sizeSystem: "UNKNOWN" as const,
    size: null,
    ...overrides,
  } as never;
}

function brandOf(model: string): string {
  if (/new balance/iu.test(model)) return "New Balance";
  if (/adidas/iu.test(model)) return "adidas";
  if (/vans/iu.test(model)) return "Vans";
  return "Nike";
}
