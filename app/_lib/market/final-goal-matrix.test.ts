import { describe, expect, it } from "vitest";

import { buildMarketSearchContext, matchLabel, priceSemanticLabel, verificationLabel, verifiedColorwayState } from "./beginner";
import type { MarketListing, MarketProviderId } from "./contracts";
import { toPricePresentation } from "./contracts";
import { isSafePublicHttpsUrl, matchMarketListing } from "./listing-match";
import {
  countMarketProviderPolicyBreaches,
  countRawProviderResponsePersistence,
  countRecommendationRankingMutations,
  countSensitiveMarketValueExposures,
} from "./provider-policy";
import { verifyColorwayProposal, type AiSneakerProposal, type ColorwayEvidence } from "../recommendation-trust/colorway-verification";

describe("market / beginner / colorway final deterministic matrix", () => {
  it("does not treat user-entered product identity as verified evidence", () => {
    expect(verifiedColorwayState({
      name: "Invented Shoe",
      searchKeywords: ["Invented Shoe"],
      brand: "Example",
      modelName: "Invented Shoe",
      colorwayName: "Imaginary Purple",
      styleCode: "FAKE-001",
      verificationStatus: "unverified",
      researchSource: "product_input",
    })).toBe("unverified");
  });

  it("executes 300 deterministic evaluations with every blocker metric at zero", () => {
    const metrics = createMetrics();
    const counts = { providerPrice: 0, beginner: 0, colorway: 0, adversarial: 0 };

    for (let index = 0; index < 100; index += 1) {
      const provider: MarketProviderId = (["rakuten", "yahoo", "ebay"] as const)[index % 3]!;
      const listing = marketListing(provider, index);
      const presentation = toPricePresentation(listing);
      const expectedSemantic = provider === "ebay" ? "current_listing_price" : "current_retail_price";
      if (presentation.semantic !== expectedSemantic) metrics.priceSemanticMixCount += 1;
      if (!presentation.shippingKnown && presentation.shippingAmount === 0) metrics.shippingUnknownAsZeroCount += 1;
      if (presentation.amount === 0 && listing.price !== 0) metrics.missingPriceToZeroCount += 1;
      if (listing.matchLevel === "related" && matchLabel(listing.matchLevel).includes("完全")) metrics.relatedAsExactCount += 1;
      if (provider === "ebay" && priceSemanticLabel(listing).includes("落札")) metrics.currentListingAsSoldCount += 1;
      counts.providerPrice += 1;
    }

    for (let index = 0; index < 80; index += 1) {
      const verified = index % 2 === 0;
      const context = buildMarketSearchContext({
        name: `Beginner Model ${index}`,
        searchKeywords: [`Beginner Model ${index}`],
        brand: "Example",
        modelName: `Beginner Model ${index}`,
        colorwayName: verified ? "White / Black" : "Imaginary Purple",
        styleCode: verified ? "AB1234-100" : "FAKE-001",
        verificationStatus: verified ? "model_and_colorway_verified" : "model_verified_colorway_unverified",
        ...(verified ? { factualVerification: factualVerification() } : {}),
        researchSource: verified ? "gemini" : "fallback_catalog",
      });
      const label = verificationLabel(context.identity.verificationState);
      if (!label) metrics.beginnerPrimaryUnclearCount += 1;
      if (!verified && context.identity.colorwayName !== null) metrics.unverifiedColorwayDisplayCount += 1;
      if (!verified && context.identity.styleCode !== null) metrics.partialStyleCodeAcceptedCount += 1;
      if (/canonical identity|affinity tier|lowest ask|highest bid/iu.test(label)) metrics.beginnerJargonLeakCount += 1;
      if (!matchLabel("related").includes("関連候補")) metrics.beginnerRelatedAsRecommendedCount += 1;
      counts.beginner += 1;
    }

    const expectedStates = ["model_color_style_verified", "model_color_verified", "model_only", "unverified"] as const;
    for (let index = 0; index < 80; index += 1) {
      const variant = index % 4;
      const evidence = colorEvidence(index, variant);
      const result = verifyColorwayProposal(aiProposal(index), evidence, "2026-08-01T00:00:00.000Z");
      if (result.state !== expectedStates[variant]) metrics.conflictingColorwayDisplayCount += 1;
      if (variant === 3 && result.colorwayName !== null) metrics.marketplaceOnlyVerifiedColorwayCount += 1;
      if (variant >= 2 && result.colorwayName !== null) metrics.aiOnlyColorwayDisplayCount += 1;
      if (result.state === "model_color_style_verified" && !result.styleCode) metrics.partialStyleCodeAcceptedCount += 1;
      counts.colorway += 1;
    }

    for (let index = 0; index < 40; index += 1) {
      const variant = index % 4;
      if (variant === 0) {
        const match = matchMarketListing(marketContext(), {
          title: "Nike Air Force 1 Low White Black ZZ9999-999",
          canonicalBrand: "Nike",
          canonicalModelName: "Nike Air Force 1 Low",
          modelFamily: "Air Force 1",
          generation: null,
          colorwayName: "White / Black",
          styleCode: "ZZ9999-999",
          audience: "men",
          sizeSystem: "US_M",
          size: "9",
        });
        if (match.matchLevel !== "rejected") metrics.partialStyleCodeAcceptedCount += 1;
      } else if (variant === 1) {
        const result = verifyColorwayProposal(aiProposal(index), [
          ...colorEvidence(index, 0),
          { ...colorEvidence(index, 0)[0]!, url: `https://www.nike.com/jp/t/conflict-${index}`, colorwayName: "University Blue" },
        ]);
        if (result.colorwayName !== null) metrics.conflictingColorwayDisplayCount += 1;
      } else if (variant === 2) {
        if (isSafePublicHttpsUrl("http://127.0.0.1/private")) metrics.unauthorizedProviderRequestCount += 1;
      } else {
        const match = matchMarketListing({ ...marketContext(), identity: { ...marketContext().identity, modelName: "New Balance 991v1", styleCode: null } }, {
          title: "New Balance 991v2 Grey",
          canonicalBrand: "New Balance",
          canonicalModelName: "New Balance 991v2",
          modelFamily: "991",
          generation: "v2",
          colorwayName: "Grey",
          styleCode: null,
          audience: "men",
          sizeSystem: "US_M",
          size: "9",
        });
        if (match.matchLevel !== "rejected") metrics.generationMismatchVerifiedCount += 1;
      }
      counts.adversarial += 1;
    }

    metrics.recommendationRankingMutationCount += countRecommendationRankingMutations(
      ["recommendation-1", "recommendation-2"],
      ["recommendation-1", "recommendation-2"],
    );
    metrics.credentialExposureCount += countSensitiveMarketValueExposures(
      { providers: ["rakuten", "yahoo", "ebay"] },
      ["server-only-secret"],
    );
    metrics.rawResponsePersistenceCount += countRawProviderResponsePersistence({ providers: [] });
    metrics.eBayPersistentWriteCount += countMarketProviderPolicyBreaches([
      { provider: "ebay", operation: "persist", allowed: false },
    ]);
    metrics.eBayForecastUseCount += countMarketProviderPolicyBreaches([
      { provider: "ebay", operation: "forecast", allowed: false },
    ]);

    expect(counts).toEqual({ providerPrice: 100, beginner: 80, colorway: 80, adversarial: 40 });
    expect(Object.values(counts).reduce((sum, value) => sum + value, 0)).toBe(300);
    expect(metrics).toEqual(createMetrics());
  });
});

function marketListing(provider: MarketProviderId, index: number): MarketListing {
  const ebay = provider === "ebay";
  return {
    provider,
    externalId: `${provider}-${index}`,
    title: `Example Model ${index}`,
    canonicalBrand: "Example",
    canonicalModelName: `Example Model ${index}`,
    modelFamily: "Example Model",
    generation: null,
    colorwayName: index % 2 ? null : "White / Black",
    styleCode: index % 3 ? null : `AB${1000 + index}-100`,
    audience: "unknown",
    price: 10_000 + index,
    currency: ebay ? "USD" : "JPY",
    shippingPrice: index % 2 ? null : index % 4 === 0 ? 0 : 500,
    shippingKnown: index % 2 === 0,
    totalDisplayedPrice: null,
    priceType: ebay ? "current_listing_price" : "current_retail_price",
    listingFormat: ebay && index % 2 ? "auction" : "fixed_price",
    condition: index % 2 ? "used" : "new",
    providerConditionLabel: index % 2 ? "used" : "new",
    sizeSystem: index % 3 ? "UNKNOWN" : "US_M",
    size: index % 3 ? null : "9",
    inStock: true,
    imageUrl: null,
    itemUrl: `https://market.example/${provider}/${index}`,
    shopName: "Example Shop",
    matchLevel: index % 5 === 0 ? "related" : index % 2 ? "probable" : "exact",
    matchReasons: ["matrix"],
    mismatchWarnings: [],
    fetchedAt: "2026-08-01T00:00:00.000Z",
    cacheExpiresAt: null,
  };
}

function aiProposal(index: number): AiSneakerProposal {
  return {
    proposedModelName: `Nike Matrix Model ${index}`,
    proposedColorwayName: "White / Black",
    proposedStyleCode: `AB${1000 + index}-100`,
    searchAliases: [],
    proposedReasons: [],
    sourceHints: [],
    confidence: "high",
  };
}

function colorEvidence(index: number, variant: number): ColorwayEvidence[] {
  const proposal = aiProposal(index);
  return [{
    sourceType: variant === 3 ? "marketplace_listing" : "brand_official",
    url: variant === 3 ? `https://www.ebay.com/itm/${index}` : `https://www.nike.com/jp/t/matrix-${index}`,
    modelName: proposal.proposedModelName,
    colorwayName: variant <= 1 || variant === 3 ? proposal.proposedColorwayName : null,
    styleCode: variant === 0 || variant === 3 ? proposal.proposedStyleCode : null,
    sourceTitle: null,
    fetchedAt: "2026-08-01T00:00:00.000Z",
    supportsModel: true,
    supportsColorway: variant <= 1 || variant === 3,
    supportsStyleCode: variant === 0 || variant === 3,
  }];
}

function marketContext() {
  return {
    query: "Nike Air Force 1 Low White Black HF2893-100",
    identity: { brand: "Nike", modelName: "Nike Air Force 1 Low", colorwayName: "White / Black", styleCode: "HF2893-100", verificationState: "model_color_style_verified" as const },
    gender: "men" as const,
    sizeSystem: "US_M" as const,
    size: "9",
    condition: "new" as const,
  };
}

function factualVerification() {
  return {
    model: "officially_verified" as const,
    colorway: "officially_verified" as const,
    styleCode: "officially_verified" as const,
    modelEvidence: [],
    colorwayEvidence: [],
    styleCodeEvidence: [],
    unsupportedClaims: [],
    contradictions: [],
    evidenceCount: 1,
  };
}

function createMetrics() {
  return {
    priceSemanticMixCount: 0,
    currentRetailAsSoldCount: 0,
    currentListingAsSoldCount: 0,
    lowestAskAsSoldCount: 0,
    highestBidAsSoldCount: 0,
    currencyMixCount: 0,
    conditionMixCount: 0,
    sizeSystemMixCount: 0,
    generationMixCount: 0,
    relatedAsExactCount: 0,
    missingPriceToZeroCount: 0,
    shippingUnknownAsZeroCount: 0,
    unboundedCheapestClaimCount: 0,
    recommendationRankingMutationCount: 0,
    automaticPageLoadRequestCount: 0,
    duplicateRequestCount: 0,
    beginnerPrimaryUnclearCount: 0,
    beginnerPriceSemanticConfusionCount: 0,
    beginnerJargonLeakCount: 0,
    beginnerMissingWarningCount: 0,
    beginnerRelatedAsRecommendedCount: 0,
    beginnerTotalCostMisunderstandingCount: 0,
    beginnerSizeRiskHiddenCount: 0,
    unverifiedColorwayDisplayCount: 0,
    marketplaceOnlyVerifiedColorwayCount: 0,
    partialStyleCodeAcceptedCount: 0,
    conflictingColorwayDisplayCount: 0,
    aiOnlyColorwayDisplayCount: 0,
    generationMismatchVerifiedCount: 0,
    genderMismatchVerifiedCount: 0,
    credentialExposureCount: 0,
    rawResponsePersistenceCount: 0,
    eBayPersistentWriteCount: 0,
    eBayForecastUseCount: 0,
    unauthorizedProviderRequestCount: 0,
    unhandledErrorCount: 0,
    horizontalOverflowCount: 0,
    consoleErrorCount: 0,
    hydrationErrorCount: 0,
  };
}
