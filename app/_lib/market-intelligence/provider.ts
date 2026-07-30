import type {
  CanonicalSneakerIdentity,
  SneakerVariant,
} from "./identity";

export type {
  CanonicalSneakerIdentity,
  SneakerVariant,
} from "./identity";

export type MarketProviderId =
  | "stockx"
  | "snkrdunk"
  | "mercari"
  | "manual_import";

export type MarketProviderAccess =
  | "official_public"
  | "official_partner"
  | "approved_account"
  | "manual_only"
  | "unavailable";

export type MarketProviderCapability = Readonly<{
  provider: MarketProviderId;
  access: MarketProviderAccess;
  catalogSearch: boolean;
  currentAsk: boolean;
  currentBid: boolean;
  soldPrice: boolean;
  listingSearch: boolean;
  historicalSeries: boolean;
  sizeSpecific: boolean;
  automatedCollectionAllowed: boolean;
  credentialsAvailable: boolean;
  termsCheckedAt: string;
}>;

export type ProviderResult<T> =
  | { status: "success"; data: T }
  | { status: "partial"; data: T; warnings: string[] }
  | { status: "not_configured" }
  | { status: "not_authorized" }
  | { status: "not_supported" }
  | { status: "rate_limited"; retryAfter: number | null }
  | { status: "timeout" }
  | { status: "network_error" }
  | { status: "schema_error" };

export type MarketCatalogQuery = Readonly<{
  query: string;
  limit?: number;
  cursor?: string;
}>;

export type MarketCatalogItem = Readonly<{
  provider: MarketProviderId;
  providerProductId: string;
  brand: string;
  modelName: string;
  colorwayName: string | null;
  styleCode: string | null;
  releaseYear: number | null;
}>;

export type MarketCatalogSearchResult = ProviderResult<Readonly<{
  items: readonly MarketCatalogItem[];
  nextCursor: string | null;
}>>;

export type CurrentMarketObservation = Readonly<{
  provider: MarketProviderId;
  amount: number;
  currency: string;
  kind: string;
  observedAt: string;
  sourceReference: string | null;
}>;

export type MarketSnapshotResult = ProviderResult<Readonly<{
  identity: CanonicalSneakerIdentity;
  variant: SneakerVariant;
  observations: readonly CurrentMarketObservation[];
}>>;

export interface MarketDataProvider {
  readonly id: MarketProviderId;
  getCapability(): MarketProviderCapability;
  searchCatalog(query: MarketCatalogQuery): Promise<MarketCatalogSearchResult>;
  getCurrentSnapshot(
    identity: CanonicalSneakerIdentity,
    variant: SneakerVariant,
  ): Promise<MarketSnapshotResult>;
  getHistoricalSeries?(
    identity: CanonicalSneakerIdentity,
    variant: SneakerVariant,
  ): Promise<MarketSnapshotResult>;
}

export type ProviderReadiness =
  | { status: "ready"; provider: MarketDataProvider }
  | { status: "not_configured" }
  | { status: "not_authorized" }
  | { status: "not_supported" };

const AUTHORIZED_ACCESS: ReadonlySet<MarketProviderAccess> = new Set([
  "official_public",
  "official_partner",
  "approved_account",
]);

function isValidAuditDate(value: string): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && /^\d{4}-\d{2}-\d{2}/u.test(value);
}

export function validateProviderCapability(
  capability: MarketProviderCapability,
): readonly string[] {
  const errors: string[] = [];

  if (!isValidAuditDate(capability.termsCheckedAt)) {
    errors.push("termsCheckedAt must be an ISO date");
  }

  if (
    capability.automatedCollectionAllowed &&
    !AUTHORIZED_ACCESS.has(capability.access)
  ) {
    errors.push("automated collection requires an authorized access mode");
  }

  if (
    capability.access === "unavailable" &&
    (
      capability.catalogSearch ||
      capability.currentAsk ||
      capability.currentBid ||
      capability.soldPrice ||
      capability.listingSearch ||
      capability.historicalSeries ||
      capability.automatedCollectionAllowed
    )
  ) {
    errors.push("unavailable providers cannot advertise network capabilities");
  }

  if (
    capability.provider === "manual_import" &&
    capability.automatedCollectionAllowed
  ) {
    errors.push("manual import cannot enable automated collection");
  }

  return errors;
}

export class MarketProviderRegistry {
  readonly #providers = new Map<MarketProviderId, MarketDataProvider>();

  register(provider: MarketDataProvider): void {
    if (this.#providers.has(provider.id)) {
      throw new Error(`market provider already registered: ${provider.id}`);
    }

    const capability = provider.getCapability();
    if (capability.provider !== provider.id) {
      throw new Error("provider id and capability provider must match");
    }

    const errors = validateProviderCapability(capability);
    if (errors.length > 0) {
      throw new Error(`invalid market provider capability: ${errors.join("; ")}`);
    }

    this.#providers.set(provider.id, provider);
  }

  get(providerId: MarketProviderId): MarketDataProvider | null {
    return this.#providers.get(providerId) ?? null;
  }

  listCapabilities(): readonly MarketProviderCapability[] {
    return [...this.#providers.values()]
      .map((provider) => provider.getCapability())
      .sort((left, right) => left.provider.localeCompare(right.provider));
  }

  getAutomatedProvider(providerId: MarketProviderId): ProviderReadiness {
    const provider = this.#providers.get(providerId);
    if (!provider) return { status: "not_supported" };

    const capability = provider.getCapability();
    if (!AUTHORIZED_ACCESS.has(capability.access)) {
      return { status: "not_authorized" };
    }
    if (
      !capability.credentialsAvailable ||
      !capability.automatedCollectionAllowed
    ) {
      return { status: "not_configured" };
    }

    return { status: "ready", provider };
  }
}
