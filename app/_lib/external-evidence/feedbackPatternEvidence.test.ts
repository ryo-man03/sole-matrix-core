import type { GlobalFeedbackCorpusReference } from "../recommendation-feedback/globalFeedbackCorpus";
import { createExternalFeedbackPatternEvidence } from "./feedbackPatternEvidence";

describe("global feedback pattern evidence", () => {
  it("exposes only bounded reference patterns with no Core impact", () => {
    const reference = {
      kind: "recommendation_feedback_reference_examples",
      instructionsTrusted: false,
      canOverrideCoreDecision: false,
      entries: [
        { inferredRequirementPattern: "accepted_pattern: classic, canvas" },
        { inferredRequirementPattern: "accepted_pattern: classic, canvas" },
        { inferredRequirementPattern: "mismatch_pattern: premium" },
      ],
    } as GlobalFeedbackCorpusReference;
    const evidence = createExternalFeedbackPatternEvidence(reference);

    expect(evidence).toEqual([
      {
        kind: "recommendation_feedback_patterns",
        source: "global_anonymized_corpus",
        sampleSize: 3,
        patterns: [
          "accepted_pattern: classic, canvas",
          "mismatch_pattern: premium",
        ],
        trust: "reference_only",
        coreDecisionImpact: "none",
      },
    ]);
  });
});
