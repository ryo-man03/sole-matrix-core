import {
  MarketProviderRegistry,
  validateProviderCapability,
  type MarketDataProvider,
  type MarketProviderCapability,
} from "./provider";

const stockxCapability: MarketProviderCapability = {
  provider: "stockx",
  access: "approved_account",
  catalogSearch: true,
  currentAsk: true,
  currentBid: true,
  soldPrice: false,
  listingSearch: false,
  historicalSeries: false,
  sizeSpecific: true,
  automatedCollectionAllowed: true,
  credentialsAvailable: false,
  termsCheckedAt: "2026-07-30",
};

function createProvider(
  capability: MarketProviderCapability = stockxCapability,
): MarketDataProvider {
  return {
    id: capability.provider,
    getCapability: () => capability,
    searchCatalog: async () => ({ status: "not_configured" }),
    getCurrentSnapshot: async () => ({ status: "not_configured" }),
  };
}

describe("authorized market provider architecture", () => {
  it("keeps an approved provider not configured until credentials exist", () => {
    const registry = new MarketProviderRegistry();
    registry.register(createProvider());

    expect(registry.getAutomatedProvider("stockx")).toEqual({
      status: "not_configured",
    });
  });

  it("exposes a provider only when authorization, credentials, and collection permission align", () => {
    const registry = new MarketProviderRegistry();
    const provider = createProvider({
      ...stockxCapability,
      credentialsAvailable: true,
    });
    registry.register(provider);

    expect(registry.getAutomatedProvider("stockx")).toEqual({
      status: "ready",
      provider,
    });
  });

  it("rejects network capabilities on an unavailable provider", () => {
    const errors = validateProviderCapability({
      ...stockxCapability,
      provider: "snkrdunk",
      access: "unavailable",
      catalogSearch: true,
      automatedCollectionAllowed: false,
    });

    expect(errors).toContain(
      "unavailable providers cannot advertise network capabilities",
    );
  });

  it("rejects automation for manual import", () => {
    const errors = validateProviderCapability({
      ...stockxCapability,
      provider: "manual_import",
      access: "manual_only",
      catalogSearch: false,
      currentAsk: false,
      currentBid: false,
      sizeSpecific: false,
    });

    expect(errors).toContain(
      "automated collection requires an authorized access mode",
    );
    expect(errors).toContain("manual import cannot enable automated collection");
  });

  it("rejects mismatched and duplicate registrations", () => {
    const registry = new MarketProviderRegistry();
    const provider = createProvider();
    registry.register(provider);

    expect(() => registry.register(provider)).toThrow(
      "market provider already registered",
    );
    expect(() =>
      new MarketProviderRegistry().register({
        ...provider,
        id: "mercari",
      }),
    ).toThrow("provider id and capability provider must match");
  });

  it("reports providers that were never registered as unsupported", () => {
    expect(
      new MarketProviderRegistry().getAutomatedProvider("stockx"),
    ).toEqual({ status: "not_supported" });
  });
});
