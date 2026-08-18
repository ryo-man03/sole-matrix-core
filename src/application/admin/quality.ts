export type QualityState = "healthy" | "degraded" | "blocked" | "unknown";
export type ProviderObservation = Readonly<{
  providerId: string;
  status: string;
  durationMs: number;
  cacheStatus: "hit" | "miss" | "stale" | "bypass" | "single_flight_hit" | "unknown";
  normalizedCount: number;
  exactCount: number;
  probableCount: number;
  rejectedCount: number;
  safeErrorCode: string | null;
}>;
export type QualityMetric = Readonly<{
  id: string;
  domain: "provider" | "release" | "user";
  providerId?: string;
  observation: Readonly<{ numerator: number; denominator: number | null; sampleSize: number }>;
  value: number | null;
  unit: "count" | "rate" | "milliseconds";
  threshold: Readonly<{ direction: "min" | "max"; degraded: number; blocked: number; minimumSample: number }>;
  state: QualityState;
  reasons: string[];
}>;
export type ReleaseQualityInput = Readonly<{
  releaseCount: number;
  styleCodeMissingCount: number;
  releaseDateMissingCount: number;
  regionMissingCount: number;
  colorwayMissingCount: number;
  conflictCount: number;
  duplicateCandidateCount: number;
  evidenceCount: number;
  staleEvidenceCount: number;
  officialEvidenceCount: number;
  manualReviewPendingCount: number;
}>;
export type UserQualityInput = Readonly<{
  ownedCount: number;
  ownedIdentityMatchCount: number;
  sizeRecordCount: number;
  unknownSizeSystemCount: number;
  fitFeedbackCount: number;
  completedFitFeedbackCount: number;
  orphanFeedbackCount: number;
  preferenceCount: number;
  invalidPreferenceCount: number;
  snapshotLinkedCount: number;
  snapshotLinkErrorCount: number;
}>;
export type DataQualitySnapshot = Readonly<{
  generatedAt: string;
  window: string;
  metrics: QualityMetric[];
  state: QualityState;
  reasons: string[];
  alerts: ReadonlyArray<{ code: string; state: "degraded" | "blocked"; reason: string }>;
  notificationsSent: false;
}>;

export function evaluateDataQuality(input: Readonly<{
  generatedAt: string;
  window: string;
  providerObservations: readonly ProviderObservation[];
  release: ReleaseQualityInput;
  user: UserQualityInput;
}>): DataQualitySnapshot {
  const metrics = [
    ...providerMetrics(input.providerObservations),
    ...releaseMetrics(input.release),
    ...userMetrics(input.user),
  ];
  const state = worst(metrics.map((metric) => metric.state));
  const reasons = metrics.filter((metric) => metric.state === "blocked" || metric.state === "degraded").map((metric) => metric.reasons[0]!).filter(Boolean);
  const alerts = metrics.flatMap((metric) => metric.state === "degraded" || metric.state === "blocked"
    ? [{ code: `${metric.id}:${metric.state}`, state: metric.state, reason: metric.reasons[0] ?? metric.id }]
    : []);
  return { generatedAt: input.generatedAt, window: input.window, metrics, state, reasons, alerts, notificationsSent: false };
}

function providerMetrics(observations: readonly ProviderObservation[]): QualityMetric[] {
  const providers = new Map<string, ProviderObservation[]>();
  for (const observation of observations) providers.set(observation.providerId, [...(providers.get(observation.providerId) ?? []), observation]);
  if (!providers.size) return [metric("request_count", "provider", 0, null, "count", min(1, 0, 1), "No provider observations in the window.", undefined, 0)];
  return [...providers.entries()].sort(([left], [right]) => left.localeCompare(right)).flatMap(([providerId, rows]) => {
    const total = rows.length;
    const normalized = sum(rows.map((row) => row.normalizedCount));
    const matchDenominator = normalized + sum(rows.map((row) => row.rejectedCount));
    const durations = rows.map((row) => row.durationMs).sort((left, right) => left - right);
    const cacheObserved = rows.filter((row) => ["hit", "miss", "stale", "single_flight_hit"].includes(row.cacheStatus));
    const errorRate = (pattern: RegExp) => rows.filter((row) => pattern.test(`${row.status} ${row.safeErrorCode ?? ""}`)).length;
    return [
      metric("request_count", "provider", total, null, "count", min(1, 0, 1), "Provider has no requests.", providerId),
      metric("success_rate", "provider", count(rows, "success"), total, "rate", min(0.95, 0.70, 1), "Provider success rate is below threshold.", providerId),
      metric("empty_rate", "provider", count(rows, "empty"), total, "rate", max(0.70, 0.95, 1), "Provider empty rate is above threshold.", providerId),
      metric("401_rate", "provider", errorRate(/401|unauthorized/iu), total, "rate", max(0, 0.20, 1), "Provider authentication is degraded (401).", providerId),
      metric("403_rate", "provider", errorRate(/403|forbidden/iu), total, "rate", max(0, 0.20, 1), "Provider authorization is degraded (403).", providerId),
      metric("429_rate", "provider", errorRate(/429|rate_limited/iu), total, "rate", max(0.05, 0.20, 1), "Provider rate limiting is above threshold.", providerId),
      metric("timeout_rate", "provider", errorRate(/timeout/iu), total, "rate", max(0.10, 0.30, 1), "Provider timeouts are above threshold.", providerId),
      metric("schema_error_rate", "provider", errorRate(/schema/iu), total, "rate", max(0.02, 0.10, 1), "Provider contract errors are above threshold.", providerId),
      metric("median_latency", "provider", percentile(durations, 0.5) ?? 0, durations.length || null, "milliseconds", max(2_000, 5_000, 1), "Provider median latency is above threshold.", providerId, durations.length ? undefined : 1),
      metric("p95_latency", "provider", percentile(durations, 0.95) ?? 0, durations.length || null, "milliseconds", max(4_000, 8_000, 20), "Provider p95 latency is above threshold.", providerId),
      metric("normalized_count", "provider", normalized, total, "count", min(1, 0, 1), "Provider normalized no records.", providerId),
      metric("exact_match_rate", "provider", sum(rows.map((row) => row.exactCount)), matchDenominator, "rate", min(0.30, 0.05, 1), "Exact match rate is below threshold.", providerId),
      metric("probable_match_rate", "provider", sum(rows.map((row) => row.probableCount)), matchDenominator, "rate", min(0.20, 0.02, 1), "Probable match rate is below threshold.", providerId),
      metric("rejected_rate", "provider", sum(rows.map((row) => row.rejectedCount)), matchDenominator, "rate", max(0.50, 0.80, 1), "Rejected result rate is above threshold.", providerId),
      metric("cache_hit_rate", "provider", cacheObserved.filter((row) => row.cacheStatus === "hit" || row.cacheStatus === "single_flight_hit").length, cacheObserved.length, "rate", min(0.05, 0, 1), "Cache hit rate is below threshold.", providerId),
      metric("single_flight_hit_rate", "provider", cacheObserved.filter((row) => row.cacheStatus === "single_flight_hit").length, cacheObserved.length, "rate", min(0, 0, 1), "Single-flight reuse was not observed.", providerId),
    ];
  });
}

function releaseMetrics(input: ReleaseQualityInput): QualityMetric[] {
  return [
    metric("style_code_missing_rate", "release", input.styleCodeMissingCount, input.releaseCount, "rate", max(0.20, 0.50, 1), "Release Style Code missing rate is high."),
    metric("release_date_missing_rate", "release", input.releaseDateMissingCount, input.releaseCount, "rate", max(0.20, 0.50, 1), "Release date missing rate is high."),
    metric("region_missing_rate", "release", input.regionMissingCount, input.releaseCount, "rate", max(0.05, 0.20, 1), "Release region missing rate is high."),
    metric("colorway_missing_rate", "release", input.colorwayMissingCount, input.releaseCount, "rate", max(0.20, 0.50, 1), "Release colorway missing rate is high."),
    metric("conflict_rate", "release", input.conflictCount, input.releaseCount, "rate", max(0.05, 0.20, 1), "Release conflict spike requires review."),
    metric("duplicate_candidate_rate", "release", input.duplicateCandidateCount, input.releaseCount, "rate", max(0.02, 0.10, 1), "Duplicate release candidates require review."),
    metric("stale_evidence_rate", "release", input.staleEvidenceCount, input.evidenceCount, "rate", max(0.20, 0.50, 1), "Stale release evidence rate is high."),
    metric("manual_review_pending", "release", input.manualReviewPendingCount, null, "count", max(25, 100, 1), "Manual review backlog is above threshold."),
    metric("official_source_rate", "release", input.officialEvidenceCount, input.evidenceCount, "rate", min(0.50, 0.20, 1), "Official or authorized source rate is below threshold."),
  ];
}

function userMetrics(input: UserQualityInput): QualityMetric[] {
  return [
    metric("owned_identity_match_rate", "user", input.ownedIdentityMatchCount, input.ownedCount, "rate", min(0.90, 0.50, 1), "Owned sneaker identity match rate is below threshold."),
    metric("unknown_size_system_rate", "user", input.unknownSizeSystemCount, input.sizeRecordCount, "rate", max(0.10, 0.40, 1), "Unknown size-system rate is high."),
    metric("fit_feedback_completion_rate", "user", input.completedFitFeedbackCount, input.fitFeedbackCount, "rate", min(0.60, 0.20, 1), "Fit feedback completion rate is below threshold."),
    metric("orphan_feedback_count", "user", input.orphanFeedbackCount, null, "count", max(0, 0, 1), "Orphan feedback violates the owner/link boundary.", undefined, 1, true),
    metric("invalid_preference_count", "user", input.invalidPreferenceCount, input.preferenceCount, "count", max(0, 0, 1), "Invalid preference rows violate the schema contract.", undefined, 1, true),
    metric("snapshot_link_error_count", "user", input.snapshotLinkErrorCount, input.snapshotLinkedCount, "count", max(0, 0, 1), "Recommendation snapshot linkage is invalid.", undefined, 1, true),
  ];
}

function metric(
  id: string,
  domain: QualityMetric["domain"],
  numerator: number,
  denominator: number | null,
  unit: QualityMetric["unit"],
  threshold: QualityMetric["threshold"],
  reason: string,
  providerId?: string,
  forcedSample?: number,
  critical = false,
): QualityMetric {
  const sampleSize = forcedSample ?? (denominator ?? 1);
  const value = denominator === null ? numerator : denominator > 0 ? numerator / denominator : null;
  let state: QualityState = value === null || sampleSize < threshold.minimumSample ? "unknown" : "healthy";
  if (value !== null && sampleSize >= threshold.minimumSample) {
    const blocked = threshold.direction === "max" ? value > threshold.blocked : value < threshold.blocked;
    const degraded = threshold.direction === "max" ? value > threshold.degraded : value < threshold.degraded;
    state = blocked || (critical && value > 0) ? "blocked" : degraded ? "degraded" : "healthy";
  }
  const reasons = state === "unknown" ? ["Sample is insufficient; quality state is unknown."] : state === "healthy" ? ["Observed value is within the configured threshold."] : [reason];
  return { id: providerId ? `provider.${providerId}.${id}` : `${domain}.${id}`, domain, ...(providerId ? { providerId } : {}), observation: { numerator, denominator, sampleSize }, value, unit, threshold, state, reasons };
}

function min(degraded: number, blocked: number, minimumSample: number): QualityMetric["threshold"] {
  return { direction: "min", degraded, blocked, minimumSample };
}

function max(degraded: number, blocked: number, minimumSample: number): QualityMetric["threshold"] {
  return { direction: "max", degraded, blocked, minimumSample };
}

function count(rows: readonly ProviderObservation[], status: string): number {
  return rows.filter((row) => row.status === status).length;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function percentile(sorted: readonly number[], quantile: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))]!;
}

function worst(states: readonly QualityState[]): QualityState {
  if (states.includes("blocked")) return "blocked";
  if (states.includes("degraded")) return "degraded";
  if (states.length && states.every((state) => state === "unknown")) return "unknown";
  return states.includes("healthy") ? "healthy" : "unknown";
}
