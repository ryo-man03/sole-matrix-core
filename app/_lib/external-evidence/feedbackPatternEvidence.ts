import type { GlobalFeedbackCorpusReference } from "../recommendation-feedback/globalFeedbackCorpus";
import type { ExternalFeedbackPatternEvidence } from "./types";

export function createExternalFeedbackPatternEvidence(
  reference: GlobalFeedbackCorpusReference,
): ExternalFeedbackPatternEvidence[] {
  if (
    reference.instructionsTrusted ||
    reference.canOverrideCoreDecision ||
    reference.entries.length === 0
  ) {
    return [];
  }
  const samples = reference.entries.slice(-10);
  const patterns = [
    ...new Set(
      samples
        .map((entry) => entry.inferredRequirementPattern)
        .filter(Boolean),
    ),
  ].slice(0, 6);
  if (patterns.length === 0) return [];

  return [
    {
      kind: "recommendation_feedback_patterns",
      source: "global_anonymized_corpus",
      sampleSize: samples.length,
      patterns,
      trust: "reference_only",
      coreDecisionImpact: "none",
    },
  ];
}
