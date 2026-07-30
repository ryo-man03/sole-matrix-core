import type {
  MarketCatalogQuery,
  MarketCatalogSearchResult,
  MarketDataProvider,
  MarketProviderCapability,
  MarketSnapshotResult,
} from "./provider";
import type {
  CanonicalSneakerIdentity,
  SneakerVariant,
} from "./identity";

type DisabledMarketplaceId = "snkrdunk" | "mercari";

const DISABLED_CAPABILITIES: Readonly<
  Record<DisabledMarketplaceId, MarketProviderCapability>
> = {
  snkrdunk: {
    provider: "snkrdunk",
    access: "unavailable",
    catalogSearch: false,
    currentAsk: false,
    currentBid: false,
    soldPrice: false,
    listingSearch: false,
    historicalSeries: false,
    sizeSpecific: false,
    automatedCollectionAllowed: false,
    credentialsAvailable: false,
    termsCheckedAt: "2026-07-30",
  },
  mercari: {
    provider: "mercari",
    access: "manual_only",
    catalogSearch: false,
    currentAsk: false,
    currentBid: false,
    soldPrice: false,
    listingSearch: false,
    historicalSeries: false,
    sizeSpecific: false,
    automatedCollectionAllowed: false,
    credentialsAvailable: false,
    termsCheckedAt: "2026-07-30",
  },
};

export class DisabledMarketplaceProvider implements MarketDataProvider {
  readonly id: DisabledMarketplaceId;

  constructor(id: DisabledMarketplaceId) {
    this.id = id;
  }

  getCapability(): MarketProviderCapability {
    return DISABLED_CAPABILITIES[this.id];
  }

  async searchCatalog(
    _query: MarketCatalogQuery,
  ): Promise<MarketCatalogSearchResult> {
    return { status: "not_authorized" };
  }

  async getCurrentSnapshot(
    _identity: CanonicalSneakerIdentity,
    _variant: SneakerVariant,
  ): Promise<MarketSnapshotResult> {
    return { status: "not_authorized" };
  }
}

export type MarketplaceProviderModes = Readonly<{
  snkrdunk: "disabled";
  mercari: "disabled";
  configurationWarnings: readonly string[];
}>;

export function readMarketplaceProviderModes(
  env: Readonly<Record<string, string | undefined>>,
): MarketplaceProviderModes {
  const warnings: string[] = [];
  if (
    env.SNKRDUNK_PROVIDER_MODE &&
    env.SNKRDUNK_PROVIDER_MODE !== "disabled"
  ) {
    warnings.push(
      "SNKRDUNK_PROVIDER_MODE ignored: formal authorization is not configured",
    );
  }
  if (
    env.MERCARI_PROVIDER_MODE &&
    env.MERCARI_PROVIDER_MODE !== "disabled"
  ) {
    warnings.push(
      "MERCARI_PROVIDER_MODE ignored: general marketplace access is not authorized",
    );
  }
  return { snkrdunk: "disabled", mercari: "disabled", configurationWarnings: warnings };
}

export function createDisabledMarketplaceProviders(): readonly MarketDataProvider[] {
  return [
    new DisabledMarketplaceProvider("snkrdunk"),
    new DisabledMarketplaceProvider("mercari"),
  ];
}

