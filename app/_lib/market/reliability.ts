import type { MarketProviderId, MarketProviderStatus } from "./contracts";

type CircuitState = { failures: number; openUntil: number };
type CacheEntry<T> = { value: T; expiresAt: number };

const flights = new Map<string, Promise<unknown>>();
const circuits = new Map<MarketProviderId, CircuitState>();
const cache = new Map<string, CacheEntry<unknown>>();

export type ProviderMetricEvent = Readonly<{
  provider: MarketProviderId;
  status: MarketProviderStatus | "cache_hit" | "single_flight_hit" | "circuit_open";
  latencyMs: number;
  responseBytes: number;
  normalizedCount: number;
  at: string;
}>;

const recentMetrics: ProviderMetricEvent[] = [];

export async function providerSingleFlight<T>(key: string, operation: () => Promise<T>, onReuse?: () => void): Promise<T> {
  const active = flights.get(key) as Promise<T> | undefined;
  if (active) {
    onReuse?.();
    return active;
  }
  const promise = operation().finally(() => flights.delete(key));
  flights.set(key, promise);
  return promise;
}

export function isProviderCircuitOpen(provider: MarketProviderId, now = Date.now()): boolean {
  const state = circuits.get(provider);
  if (!state) return false;
  if (state.openUntil <= now) {
    circuits.delete(provider);
    return false;
  }
  return true;
}

export function recordProviderOutcome(provider: MarketProviderId, status: MarketProviderStatus, now = Date.now()): void {
  if (status === "success" || status === "empty") {
    circuits.delete(provider);
    return;
  }
  if (status !== "timeout" && status !== "temporarily_unavailable") return;
  const current = circuits.get(provider) ?? { failures: 0, openUntil: 0 };
  const failures = current.failures + 1;
  circuits.set(provider, { failures, openUntil: failures >= 3 ? now + 30_000 : 0 });
}

export function getMarketCache<T>(key: string, now = Date.now()): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setMarketCache<T>(key: string, value: T, ttlMs = 60_000, now = Date.now()): void {
  cache.set(key, { value, expiresAt: now + Math.max(1, Math.min(ttlMs, 300_000)) });
}

export function recordProviderMetric(event: Omit<ProviderMetricEvent, "at">): void {
  recentMetrics.push({ ...event, at: new Date().toISOString() });
  if (recentMetrics.length > 200) recentMetrics.splice(0, recentMetrics.length - 200);
}

export function providerMetricsSnapshot(): readonly ProviderMetricEvent[] {
  return recentMetrics.map((event) => ({ ...event }));
}

export function resetMarketReliabilityForTests(): void {
  flights.clear();
  circuits.clear();
  cache.clear();
  recentMetrics.splice(0);
}
