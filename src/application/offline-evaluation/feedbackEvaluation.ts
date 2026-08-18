export const FEEDBACK_EVALUATION_DATASET_VERSION = "feedback-evaluation-v1.0.0" as const;

export type FeedbackEvaluationRecord = Readonly<{
  eventId: string;
  recommendationSnapshotId: string;
  canonicalExpected: string;
  canonicalActual: string;
  recommendedTopK: readonly string[];
  previousTopK?: readonly string[];
  feedback: "liked" | "disliked" | "saved" | "hidden" | "purchased" | "satisfied" | "unsatisfied";
  ryoExpectedRoles: readonly string[];
  ryoActualRoles: readonly string[];
  fitWarningExpected: boolean;
  fitWarningActual: boolean;
}>;

export type FeedbackEvaluationDataset = Readonly<{
  version: typeof FEEDBACK_EVALUATION_DATASET_VERSION;
  generatedAt: string;
  records: readonly FeedbackEvaluationRecord[];
}>;

export type FeedbackEvaluationAggregate = Readonly<{
  version: typeof FEEDBACK_EVALUATION_DATASET_VERSION;
  uniqueEventCount: number;
  linkedSnapshotCount: number;
  feedbackCounts: Readonly<Record<FeedbackEvaluationRecord["feedback"], number>>;
  topKStability: number | null;
  diversity: number | null;
  canonicalAccuracy: number | null;
  ryoCoherence: number | null;
  fitWarningCorrectness: number | null;
}>;

export function evaluateFeedbackDataset(dataset: FeedbackEvaluationDataset): FeedbackEvaluationAggregate {
  if (dataset.version !== FEEDBACK_EVALUATION_DATASET_VERSION) throw new Error("UNSUPPORTED_EVALUATION_DATASET");
  const records = dedupe(dataset.records);
  const feedbackCounts: Record<FeedbackEvaluationRecord["feedback"], number> = {
    liked: 0, disliked: 0, saved: 0, hidden: 0, purchased: 0, satisfied: 0, unsatisfied: 0,
  };
  for (const record of records) feedbackCounts[record.feedback] += 1;
  const stability = records.flatMap((record) => record.previousTopK ? [jaccard(record.previousTopK, record.recommendedTopK)] : []);
  const diversity = records.flatMap((record) => record.recommendedTopK.length
    ? [new Set(record.recommendedTopK.map((key) => key.split(":", 1)[0]?.toLocaleLowerCase("en-US"))).size / record.recommendedTopK.length]
    : []);
  return {
    version: dataset.version,
    uniqueEventCount: records.length,
    linkedSnapshotCount: new Set(records.map((record) => record.recommendationSnapshotId)).size,
    feedbackCounts,
    topKStability: average(stability),
    diversity: average(diversity),
    canonicalAccuracy: average(records.map((record) => normalized(record.canonicalExpected) === normalized(record.canonicalActual) ? 1 : 0)),
    ryoCoherence: average(records.map((record) => sameSet(record.ryoExpectedRoles, record.ryoActualRoles) ? 1 : 0)),
    fitWarningCorrectness: average(records.map((record) => record.fitWarningExpected === record.fitWarningActual ? 1 : 0)),
  };
}

function dedupe(records: readonly FeedbackEvaluationRecord[]): FeedbackEvaluationRecord[] {
  const byEvent = new Map<string, FeedbackEvaluationRecord>();
  for (const record of [...records].sort((left, right) => left.eventId.localeCompare(right.eventId))) {
    if (!record.eventId || !record.recommendationSnapshotId) throw new Error("UNLINKED_EVALUATION_RECORD");
    if (!byEvent.has(record.eventId)) byEvent.set(record.eventId, record);
  }
  return [...byEvent.values()];
}

function jaccard(left: readonly string[], right: readonly string[]): number {
  const a = new Set(left.map(normalized));
  const b = new Set(right.map(normalized));
  const union = new Set([...a, ...b]);
  if (!union.size) return 1;
  return [...a].filter((item) => b.has(item)).length / union.size;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const a = [...new Set(left.map(normalized))].sort();
  const b = [...new Set(right.map(normalized))].sort();
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "");
}

function average(values: readonly number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
