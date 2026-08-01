import type {
  CanonicalSneakerIdentity,
  SneakerVariant,
} from "./identity";
import type { MarketProviderId } from "./provider";

export type MarketPriceType =
  | "lowest_ask"
  | "highest_bid"
  | "listing_price"
  | "sold_price"
  | "recommended_sell"
  | "recommended_buy";

export type MarketSourceQuality =
  | "official_api"
  | "partner_api"
  | "manual_import";

export type MarketSnapshot = Readonly<{
  provider: MarketProviderId;
  identity: CanonicalSneakerIdentity;
  variant: SneakerVariant;
  priceType: MarketPriceType;
  amount: number;
  currency: string;
  observedAt: string;
  sourceReference: string | null;
  sampleCount: number | null;
  identityMatch: "exact" | "probable";
  sourceQuality: MarketSourceQuality;
  includesFees: boolean | null;
  includesShipping: boolean | null;
  includesTax: boolean | null;
}>;

export const MARKET_PRICE_TYPES = [
  "lowest_ask",
  "highest_bid",
  "listing_price",
  "sold_price",
  "recommended_sell",
  "recommended_buy",
] as const satisfies readonly MarketPriceType[];

export const MARKET_PRICE_LABELS: Readonly<Record<MarketPriceType, string>> = {
  lowest_ask: "最低出品額",
  highest_bid: "最高入札額",
  listing_price: "出品価格",
  sold_price: "成約価格",
  recommended_sell: "推奨売却価格",
  recommended_buy: "推奨購入価格",
};

export type SnapshotValidationResult =
  | { valid: true; snapshot: MarketSnapshot }
  | { valid: false; errors: readonly string[] };

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function validateMarketSnapshot(
  snapshot: MarketSnapshot,
): SnapshotValidationResult {
  const errors: string[] = [];

  if (!Number.isFinite(snapshot.amount) || snapshot.amount <= 0) {
    errors.push("amount must be a finite positive number");
  }
  if (!/^[A-Z]{3}$/u.test(snapshot.currency)) {
    errors.push("currency must be an uppercase ISO 4217 code");
  }
  if (
    !hasText(snapshot.observedAt) ||
    !Number.isFinite(Date.parse(snapshot.observedAt))
  ) {
    errors.push("observedAt must be a valid timestamp");
  }
  if (
    snapshot.sampleCount !== null &&
    (
      !Number.isSafeInteger(snapshot.sampleCount) ||
      snapshot.sampleCount < 1
    )
  ) {
    errors.push("sampleCount must be null or a positive integer");
  }
  if (!hasText(snapshot.identity.brand)) {
    errors.push("identity brand is required");
  }
  if (!hasText(snapshot.identity.modelName)) {
    errors.push("identity model name is required");
  }
  if (!hasText(snapshot.variant.sizeValue)) {
    errors.push("variant size is required");
  }
  if (
    snapshot.sourceReference !== null &&
    !hasText(snapshot.sourceReference)
  ) {
    errors.push("sourceReference must be null or non-empty");
  }

  return errors.length === 0
    ? { valid: true, snapshot }
    : { valid: false, errors };
}

function normalizeKeyPart(value: string | number | null): string {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .trim()
    .replace(/\|/gu, "%7C");
}

export function getMarketSeriesKey(snapshot: MarketSnapshot): string {
  return [
    snapshot.provider,
    snapshot.identity.styleCode ??
      [
        snapshot.identity.brand,
        snapshot.identity.modelName,
        snapshot.identity.colorwayName,
        snapshot.identity.releaseYear,
      ].map(normalizeKeyPart).join(":"),
    snapshot.variant.sizeSystem,
    snapshot.variant.sizeValue,
    snapshot.variant.condition,
    snapshot.priceType,
    snapshot.currency,
  ].map(normalizeKeyPart).join("|");
}

export function groupMarketSnapshots(
  snapshots: readonly MarketSnapshot[],
): ReadonlyMap<string, readonly MarketSnapshot[]> {
  const grouped = new Map<string, MarketSnapshot[]>();

  for (const snapshot of snapshots) {
    const validation = validateMarketSnapshot(snapshot);
    if (!validation.valid) continue;

    const key = getMarketSeriesKey(snapshot);
    const series = grouped.get(key) ?? [];
    series.push(snapshot);
    grouped.set(key, series);
  }

  for (const series of grouped.values()) {
    series.sort(
      (left, right) =>
        Date.parse(left.observedAt) - Date.parse(right.observedAt),
    );
  }

  return grouped;
}

