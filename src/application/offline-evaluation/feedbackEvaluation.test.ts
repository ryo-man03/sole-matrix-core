import { describe, expect, it } from "vitest";

import {
  FEEDBACK_EVALUATION_DATASET_VERSION,
  evaluateFeedbackDataset,
  type FeedbackEvaluationDataset,
  type FeedbackEvaluationRecord,
} from "./feedbackEvaluation";

const records: FeedbackEvaluationRecord[] = [
  {
    eventId: "event-2", recommendationSnapshotId: "snapshot-1", canonicalExpected: "newbalance:991v2", canonicalActual: "New Balance / 991 v2",
    recommendedTopK: ["newbalance:991v2", "nike:aj1", "asics:gelkayano14"], previousTopK: ["nike:aj1", "newbalance:991v2", "adidas:samba"],
    feedback: "purchased", ryoExpectedRoles: ["evidence", "caution"], ryoActualRoles: ["caution", "evidence"], fitWarningExpected: true, fitWarningActual: true,
  },
  {
    eventId: "event-1", recommendationSnapshotId: "snapshot-2", canonicalExpected: "nike:aj1", canonicalActual: "nike:aj1",
    recommendedTopK: ["nike:aj1", "nike:dunk", "nike:airmax1"], feedback: "satisfied", ryoExpectedRoles: ["summary"], ryoActualRoles: ["summary"],
    fitWarningExpected: false, fitWarningActual: false,
  },
];

function dataset(values: readonly FeedbackEvaluationRecord[]): FeedbackEvaluationDataset {
  return { version: FEEDBACK_EVALUATION_DATASET_VERSION, generatedAt: "2026-08-18T00:00:00.000Z", records: values };
}

describe("feedback offline evaluation", () => {
  it("links feedback to snapshots and reports deterministic quality metrics", () => {
    expect(evaluateFeedbackDataset(dataset(records))).toMatchObject({
      uniqueEventCount: 2,
      linkedSnapshotCount: 2,
      canonicalAccuracy: 1,
      ryoCoherence: 1,
      fitWarningCorrectness: 1,
      topKStability: 0.5,
      diversity: 2 / 3,
    });
  });

  it("is invariant to event ordering", () => {
    expect(evaluateFeedbackDataset(dataset(records))).toEqual(evaluateFeedbackDataset(dataset([...records].reverse())));
  });

  it("does not increase aggregate counts when an event is replayed", () => {
    const aggregate = evaluateFeedbackDataset(dataset([...records, records[0]!]));
    expect(aggregate.uniqueEventCount).toBe(2);
    expect(aggregate.feedbackCounts.purchased).toBe(1);
  });

  it("rejects records without recommendation snapshot linkage", () => {
    expect(() => evaluateFeedbackDataset(dataset([{ ...records[0]!, recommendationSnapshotId: "" }]))).toThrow("UNLINKED_EVALUATION_RECORD");
  });
});
