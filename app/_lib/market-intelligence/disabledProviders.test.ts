import {
  createDisabledMarketplaceProviders,
  readMarketplaceProviderModes,
} from "./disabledProviders";
import { importMarketData } from "./manualImport";

const validImport = {
  provider: "mercari",
  sourceReference: "user-export:row-42",
  observedAt: "2026-07-30T00:00:00.000Z",
  brand: "Nike",
  modelName: "Air Jordan 1 Retro High OG",
  colorwayName: "Chicago",
  styleCode: "DZ5485-612",
  releaseYear: 2022,
  sizeSystem: "US_M",
  sizeValue: "9",
  condition: "used",
  currency: "jpy",
  priceType: "sold_price",
  amount: 30000,
  sampleCount: 1,
  identityMatch: "exact",
  includesFees: null,
  includesShipping: false,
  includesTax: null,
};

describe("compliant marketplace provider gates", () => {
  it("never enables network access from environment flags alone", () => {
    expect(readMarketplaceProviderModes({
      SNKRDUNK_PROVIDER_MODE: "enabled",
      MERCARI_PROVIDER_MODE: "partner",
    })).toEqual({
      snkrdunk: "disabled",
      mercari: "disabled",
      configurationWarnings: [
        "SNKRDUNK_PROVIDER_MODE ignored: formal authorization is not configured",
        "MERCARI_PROVIDER_MODE ignored: general marketplace access is not authorized",
      ],
    });
  });

  it("disabled shells never invoke a network dependency", async () => {
    const providers = createDisabledMarketplaceProviders();
    for (const provider of providers) {
      expect(provider.getCapability().automatedCollectionAllowed).toBe(false);
      await expect(provider.searchCatalog({ query: "Nike" })).resolves.toEqual({
        status: "not_authorized",
      });
    }
  });

  it("accepts provenance-bearing JSON and preserves sold-price meaning", () => {
    const result = importMarketData(JSON.stringify([validImport]), "json");
    expect(result.rejected).toEqual([]);
    expect(result.accepted[0]).toMatchObject({
      provider: "mercari",
      priceType: "sold_price",
      amount: 30000,
      currency: "JPY",
      sourceQuality: "manual_import",
      sourceReference: "user-export:row-42",
    });
  });

  it("rejects manual rows without provenance or observed time", () => {
    const result = importMarketData(JSON.stringify([{
      ...validImport,
      sourceReference: "",
      observedAt: "",
    }]), "json");
    expect(result.accepted).toEqual([]);
    expect(result.rejected[0]?.errors).toEqual(
      expect.arrayContaining([
        "sourceReference is required",
        "observedAt is required",
      ]),
    );
  });

  it("rejects exact manual identity without a style code", () => {
    const result = importMarketData(JSON.stringify([{
      ...validImport,
      styleCode: null,
    }]), "json");
    expect(result.rejected[0]?.errors).toContain(
      "exact identity requires styleCode",
    );
  });

  it("rejects probable identity even when a style code is present", () => {
    const result = importMarketData(JSON.stringify([{
      ...validImport,
      identityMatch: "probable",
    }]), "json");
    expect(result.accepted).toEqual([]);
    expect(result.rejected[0]?.errors).toContain(
      "identityMatch must be exact",
    );
  });

  it.each([
    ["formula-like CSV text", { sourceReference: '=HYPERLINK("https://example.com")' }, "sourceReference contains a formula-like value"],
    ["unsupported currency", { currency: "YEN" }, "currency is invalid"],
  ])("rejects %s", (_label, override, error) => {
    const result = importMarketData(
      JSON.stringify([{ ...validImport, ...override }]),
      "json",
    );
    expect(result.accepted).toEqual([]);
    expect(result.rejected[0]?.errors).toContain(error);
  });

  it("rejects duplicate snapshots within one import", () => {
    const result = importMarketData(
      JSON.stringify([validImport, validImport]),
      "json",
    );
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected[0]?.errors).toContain(
      "duplicate snapshot in import",
    );
  });

  it("rejects oversized input before parsing", () => {
    const result = importMarketData(" ".repeat(2_000_001), "json");
    expect(result.accepted).toEqual([]);
    expect(result.rejected[0]?.errors).toContain(
      "import exceeds 2000000 byte limit",
    );
  });

  it("parses quoted CSV without confusing listing and sold prices", () => {
    const csv = [
      "provider,sourceReference,observedAt,brand,modelName,colorwayName,styleCode,releaseYear,sizeSystem,sizeValue,condition,currency,priceType,amount,sampleCount,identityMatch,includesFees,includesShipping,includesTax",
      'mercari,"user,export:1",2026-07-30T00:00:00.000Z,Nike,"Air Jordan 1 Retro High OG",Chicago,DZ5485-612,2022,US_M,9,used,JPY,listing_price,35000,1,exact,,false,',
    ].join("\n");
    const result = importMarketData(csv, "csv");
    expect(result.rejected).toEqual([]);
    expect(result.accepted[0]).toMatchObject({
      sourceReference: "user,export:1",
      priceType: "listing_price",
    });
  });
});
