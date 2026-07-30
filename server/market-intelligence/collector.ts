import {
  matchSneakerIdentity,
  type CanonicalSneakerIdentity,
  type SneakerVariant,
} from "../../app/_lib/market-intelligence/identity";
import type {
  MarketDataProvider,
  ProviderResult,
} from "../../app/_lib/market-intelligence/provider";
import {
  getMarketSeriesKey,
  validateMarketSnapshot,
  type MarketSnapshot,
} from "../../app/_lib/market-intelligence/snapshot";
import type { MarketHistoryRepository } from "./marketHistoryRepository";

export type MarketCollectionTarget = Readonly<{
  identity: CanonicalSneakerIdentity;
  variant: SneakerVariant;
}>;

export type MarketCollectorOptions = Readonly<{
  provider: MarketDataProvider;
  repository: MarketHistoryRepository;
  targets: readonly MarketCollectionTarget[];
  limit: number;
  dryRun: boolean;
  maxRetries?: 0 | 1;
}>;

export type MarketCollectionSummary = Readonly<{
  provider: string;
  status:
    | "completed"
    | "dry_run"
    | "not_configured"
    | "not_authorized"
    | "rate_limited"
    | "disabled";
  limit: number;
  attempted: number;
  collected: number;
  saved: number;
  duplicates: number;
  rejected: number;
  failures: number;
  retries: number;
  lastObservedAt: string | null;
}>;

type MutableCollectionSummary = {
  -readonly [Key in keyof MarketCollectionSummary]: MarketCollectionSummary[Key];
};

const MAX_COLLECTION_LIMIT = 100;

function isTargetValid(target: MarketCollectionTarget): boolean {
  const selfMatch = matchSneakerIdentity(target.identity, target.identity);
  return (
    selfMatch.match === "exact" &&
    target.variant.sizeValue.trim().length > 0 &&
    target.variant.condition === "new"
  );
}

function isRetryable(
  result: ProviderResult<unknown>,
): result is { status: "timeout" } | { status: "network_error" } {
  return result.status === "timeout" || result.status === "network_error";
}

function utcDay(timestamp: string): string {
  return timestamp.slice(0, 10);
}

export async function collectMarketSnapshots(
  options: MarketCollectorOptions,
): Promise<MarketCollectionSummary> {
  const limit = Math.max(
    1,
    Math.min(MAX_COLLECTION_LIMIT, Math.floor(options.limit)),
  );
  const summary: MutableCollectionSummary = {
    provider: options.provider.id,
    status: options.dryRun ? "dry_run" : "completed",
    limit,
    attempted: 0,
    collected: 0,
    saved: 0,
    duplicates: 0,
    rejected: 0,
    failures: 0,
    retries: 0,
    lastObservedAt: null as string | null,
  };

  const capability = options.provider.getCapability();
  if (
    !capability.credentialsAvailable ||
    !capability.automatedCollectionAllowed
  ) {
    return {
      ...summary,
      status: capability.access === "unavailable" ||
        capability.access === "manual_only"
        ? "not_authorized"
        : "not_configured",
    };
  }
  if (!options.dryRun && options.repository.getStatus() === "disabled") {
    return { ...summary, status: "disabled" };
  }

  const maxRetries = options.maxRetries ?? 1;
  for (const target of options.targets.slice(0, limit)) {
    if (!isTargetValid(target)) {
      summary.rejected += 1;
      continue;
    }

    summary.attempted += 1;
    let result = await options.provider.getCurrentSnapshot(
      target.identity,
      target.variant,
    );
    if (isRetryable(result) && maxRetries === 1) {
      summary.retries += 1;
      result = await options.provider.getCurrentSnapshot(
        target.identity,
        target.variant,
      );
    }
    if (result.status === "rate_limited") {
      return { ...summary, status: "rate_limited" };
    }
    if (result.status === "not_configured") {
      return { ...summary, status: "not_configured" };
    }
    if (result.status === "not_authorized") {
      return { ...summary, status: "not_authorized" };
    }
    if (result.status !== "success" && result.status !== "partial") {
      summary.failures += 1;
      continue;
    }

    const candidates: MarketSnapshot[] = [];
    for (const snapshot of result.data.snapshots) {
      const validation = validateMarketSnapshot(snapshot);
      if (
        !validation.valid ||
        snapshot.identityMatch !== "exact" ||
        snapshot.provider !== options.provider.id
      ) {
        summary.rejected += 1;
        continue;
      }
      const existing = await options.repository.listSnapshots({
        seriesKey: getMarketSeriesKey(snapshot),
        observedFrom: `${utcDay(snapshot.observedAt)}T00:00:00.000Z`,
        observedTo: `${utcDay(snapshot.observedAt)}T23:59:59.999Z`,
      });
      if (existing.length > 0) {
        summary.duplicates += 1;
        continue;
      }
      candidates.push(snapshot);
      summary.lastObservedAt =
        summary.lastObservedAt === null ||
        Date.parse(snapshot.observedAt) > Date.parse(summary.lastObservedAt)
          ? snapshot.observedAt
          : summary.lastObservedAt;
    }
    summary.collected += candidates.length;

    if (!options.dryRun && candidates.length > 0) {
      const save = await options.repository.saveSnapshots(candidates);
      summary.saved += save.saved;
      summary.duplicates += save.duplicates;
      summary.rejected += save.rejected;
    }
  }

  return summary;
}
