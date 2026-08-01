import {
  getMarketSeriesKey,
  groupMarketSnapshots,
  validateMarketSnapshot,
  type MarketSnapshot,
} from "./snapshot";

export type MarketSeriesSummary = Readonly<{
  observations: number;
  firstObservedAt: string;
  lastObservedAt: string;
  latest: number;
  min: number;
  max: number;
  median: number;
  mean: number;
  change7d: number | null;
  change30d: number | null;
  volatility30d: number | null;
}>;

export type MarketSeriesSummaryResult =
  | { status: "success"; data: MarketSeriesSummary }
  | { status: "empty" }
  | { status: "series_mismatch" }
  | { status: "invalid_snapshot" };

function arithmeticMean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle]!;
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function roundMetric(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function changeOverDays(
  snapshots: readonly MarketSnapshot[],
  days: number,
): number | null {
  const latest = snapshots.at(-1);
  const first = snapshots[0];
  if (!latest || !first) return null;
  const targetTime =
    Date.parse(latest.observedAt) - days * 24 * 60 * 60 * 1_000;
  if (Date.parse(first.observedAt) > targetTime) return null;

  let baseline = first;
  for (const snapshot of snapshots) {
    if (Date.parse(snapshot.observedAt) > targetTime) break;
    baseline = snapshot;
  }
  return roundMetric(((latest.amount - baseline.amount) / baseline.amount) * 100);
}

function volatilityOver30Days(
  snapshots: readonly MarketSnapshot[],
): number | null {
  const latest = snapshots.at(-1);
  if (!latest) return null;
  const cutoff = Date.parse(latest.observedAt) - 30 * 24 * 60 * 60 * 1_000;
  const recent = snapshots.filter(
    (snapshot) => Date.parse(snapshot.observedAt) >= cutoff,
  );
  if (recent.length < 2) return null;

  const returns: number[] = [];
  for (let index = 1; index < recent.length; index += 1) {
    const previous = recent[index - 1]!;
    const current = recent[index]!;
    returns.push((current.amount - previous.amount) / previous.amount);
  }
  if (returns.length < 1) return null;
  const meanReturn = arithmeticMean(returns);
  const variance = returns.reduce(
    (sum, value) => sum + (value - meanReturn) ** 2,
    0,
  ) / returns.length;
  return roundMetric(Math.sqrt(variance) * 100);
}

export function calculateMarketSeriesSummary(
  input: readonly MarketSnapshot[],
): MarketSeriesSummaryResult {
  if (input.length === 0) return { status: "empty" };
  if (input.some((snapshot) => !validateMarketSnapshot(snapshot).valid)) {
    return { status: "invalid_snapshot" };
  }

  const expectedKey = getMarketSeriesKey(input[0]!);
  if (input.some((snapshot) => getMarketSeriesKey(snapshot) !== expectedKey)) {
    return { status: "series_mismatch" };
  }
  const snapshots = [...input].sort(
    (left, right) =>
      Date.parse(left.observedAt) - Date.parse(right.observedAt),
  );
  const amounts = snapshots.map((snapshot) => snapshot.amount);
  const first = snapshots[0]!;
  const latest = snapshots.at(-1)!;

  return {
    status: "success",
    data: {
      observations: snapshots.length,
      firstObservedAt: first.observedAt,
      lastObservedAt: latest.observedAt,
      latest: latest.amount,
      min: Math.min(...amounts),
      max: Math.max(...amounts),
      median: median(amounts),
      mean: roundMetric(arithmeticMean(amounts)),
      change7d: changeOverDays(snapshots, 7),
      change30d: changeOverDays(snapshots, 30),
      volatility30d: volatilityOver30Days(snapshots),
    },
  };
}

export function calculateMarketTrends(
  snapshots: readonly MarketSnapshot[],
): ReadonlyMap<string, MarketSeriesSummary> {
  const summaries = new Map<string, MarketSeriesSummary>();
  for (const [seriesKey, series] of groupMarketSnapshots(snapshots)) {
    const result = calculateMarketSeriesSummary(series);
    if (result.status === "success") {
      summaries.set(seriesKey, result.data);
    }
  }
  return summaries;
}

