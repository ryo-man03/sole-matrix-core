import { describe, expect, it } from "vitest";

import type { MarketListing, MarketProviderResult } from "./contracts";
import {
  evaluateFitConfidence,
  evaluatePurchaseConfidence,
  parseFitConfidencePayload,
  type FitCandidateIdentity,
} from "./confidence";

const candidate: FitCandidateIdentity = {
  brand: "New Balance",
  modelName: "991v2",
  modelFamily: "991",
  generation: "v2",
  styleCode: "U991-GL2",
  audience: "unisex",
};

const exactCases = Array.from({ length: 20 }, (_, index) => ({
  brand: "New Balance",
  model_name: index % 2 ? "991v2" : `Other ${index}`,
  model_family: "991",
  generation: "v2",
  style_code: index % 2 ? null : "U991GL2",
  audience: "unisex",
  size_system: "JP",
  size_value: 25 + index / 10,
}));

const familyCases = Array.from({ length: 15 }, (_, index) => ({
  brand: "New Balance",
  model_name: `991 v${index + 3}`,
  model_family: "991",
  generation: `v${index + 3}`,
  style_code: `U991X${index}`,
  audience: "unisex",
  size_system: "JP",
  size_value: 26,
}));

const brandCases = Array.from({ length: 10 }, (_, index) => ({
  brand: "New Balance",
  model_name: `574 ${index}`,
  model_family: "574",
  generation: null,
  style_code: `ML574X${index}`,
  audience: "unisex",
  size_system: "JP",
  size_value: 26,
}));

describe("Fit and Purchase Confidence matrix (60+ deterministic cases)", () => {
  it.each(exactCases)("treats an exact owned reference as strong: %#", (owned) => {
    const result = evaluateFitConfidence(candidate, [owned], []);
    expect(result.state).toBe("strong_reference");
    expect(result.referenceCount).toBe(1);
  });

  it.each(familyCases)("keeps another generation as a qualified family reference: %#", (owned) => {
    const result = evaluateFitConfidence(candidate, [owned], []);
    expect(result.state).toBe("some_reference");
    expect(result.cautions.join(" ")).toContain("別世代");
  });

  it.each(brandCases)("keeps a same-brand different model as limited evidence: %#", (owned) => {
    const result = evaluateFitConfidence(candidate, [owned], []);
    expect(result.state).toBe("limited_reference");
    expect(result.reasons.join(" ")).toContain("同じブランド");
  });

  it.each(Array.from({ length: 5 }, (_, index) => index))("does not invent a fit conclusion without history: %s", () => {
    const result = evaluateFitConfidence(candidate, [], []);
    expect(result).toMatchObject({ state: "unknown", referenceCount: 0, reasons: [] });
    expect(result.cautions.join(" ")).toContain("返品条件");
  });

  it.each([
    ["model_color_style_verified", "exact", "high", "high"],
    ["model_color_verified", "probable", "medium", "medium"],
    ["model_only", "related", "medium", "low"],
    ["unverified", null, "low", "unavailable"],
    ["model_color_style_verified", "related", "high", "low"],
    ["model_color_verified", null, "medium", "unavailable"],
    ["model_only", "exact", "medium", "high"],
    ["unverified", "probable", "low", "medium"],
    ["model_color_style_verified", "probable", "high", "medium"],
    ["unverified", "related", "low", "low"],
  ] as const)("separates identity %s from market evidence %s", (verificationState, matchLevel, identity, market) => {
    const providers = matchLevel ? [provider(matchLevel)] : [];
    const result = evaluatePurchaseConfidence({
      verificationState,
      providers,
      fit: { state: "unknown", reasons: [], cautions: [], referenceCount: 0 },
    });
    expect(result.productIdentity).toBe(identity);
    expect(result.marketMatch).toBe(market);
  });

  it("reports size-system and audience conflicts as cautions, never as guarantees", () => {
    const result = evaluateFitConfidence(
      { ...candidate, audience: "men" },
      [{ ...exactCases[0], audience: "women", size_system: "US_W", size_value: 8 }],
      [{ size_system: "JP", size_value: 26, primary_size: true }],
    );
    expect(result.cautions.join(" ")).toMatch(/サイズ基準|表記体系/);
    expect(JSON.stringify(result)).not.toMatch(/保証|診断|治療|医学/);
  });

  it("parses only bounded fit payloads", () => {
    const fit = { state: "some_reference", reasons: ["同系統"], cautions: ["別世代"], referenceCount: 2 };
    expect(parseFitConfidencePayload({ ok: true, data: { fit } })).toEqual(fit);
    expect(parseFitConfidencePayload({ ok: true, data: { fit: { ...fit, referenceCount: -1 } } })).toBeNull();
  });

  it("does not mutate the recommendation or provider evidence", () => {
    const evidence = provider("exact");
    const before = JSON.stringify(evidence);
    evaluatePurchaseConfidence({
      verificationState: "model_color_style_verified",
      providers: [evidence],
      fit: { state: "strong_reference", reasons: [], cautions: [], referenceCount: 1 },
    });
    expect(JSON.stringify(evidence)).toBe(before);
  });
});

function provider(matchLevel: MarketListing["matchLevel"]): MarketProviderResult {
  const listing: MarketListing = {
    provider: "rakuten", externalId: "shop:item", title: "New Balance 991v2 Grey U991GL2",
    canonicalBrand: "New Balance", canonicalModelName: "991v2", modelFamily: "991", generation: "v2",
    colorwayName: "Grey", styleCode: "U991GL2", audience: "unisex", price: 32_800, currency: "JPY",
    shippingPrice: null, shippingKnown: false, totalDisplayedPrice: null, priceType: "current_retail_price",
    listingFormat: "fixed_price", condition: "new", providerConditionLabel: "new", sizeSystem: "JP", size: "26",
    inStock: true, imageUrl: null, itemUrl: "https://example.com/item", shopName: "Example", matchLevel,
    matchReasons: [], mismatchWarnings: [], fetchedAt: "2026-08-12T00:00:00.000Z", cacheExpiresAt: null,
  };
  return {
    provider: "rakuten", status: "success", listings: [listing], fetchedAt: listing.fetchedAt, message: "ok",
    audit: {
      provider: "rakuten", normalizedCount: 1, exactCount: matchLevel === "exact" ? 1 : 0,
      probableCount: matchLevel === "probable" ? 1 : 0, relatedCount: matchLevel === "related" ? 1 : 0,
      rejectedCount: matchLevel === "rejected" ? 1 : 0, missingStyleCodeCount: 0, missingColorwayCount: 0,
      missingSizeCount: 0, missingConditionCount: 0, missingShippingCount: 1, generationConflictCount: 0,
      audienceConflictCount: 0, sizeConflictCount: 0, currencyCount: { JPY: 1 }, schemaWarningCount: 0,
      unsafeUrlCount: 0, duplicateCount: 0,
    },
  };
}
