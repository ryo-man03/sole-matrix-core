import type { CandidateInputMappingResult } from "./types";

export type CoreRecommendationDryRunStatus = "blocked" | "ready";

export type CoreRecommendationDryRunCheck = {
  status: CoreRecommendationDryRunStatus;
  canDryRun: boolean;
  missingCoreFields: string[];
  blockedReasons: string[];
  warnings: string[];
};

const requiredMissingCoreFields = [
  "preferenceProfile",
  "candidates[].sneakerId",
  "candidates[].vector",
  "candidates[].tags",
  "candidates[].budgetFit",
] as const;

const requiredCoreFieldReasons = [
  "preferenceProfile has not been created",
  "sneakerId has not been created for the candidate",
  "candidateVector has not been created",
  "priceLevel has not been created",
  "candidateTagIds are UI-derived tag IDs and have not been mapped to Core tags",
  "budgetFit has not been created",
] as const;

export function checkCoreRecommendationDryRunReadiness(
  mappingResult: CandidateInputMappingResult
): CoreRecommendationDryRunCheck {
  const missingCoreFields = [...requiredMissingCoreFields];
  const blockedReasons = [
    "safeCandidateDraft is not a complete Core input",
    ...requiredCoreFieldReasons,
  ];

  if (!mappingResult.isValid) {
    blockedReasons.unshift("candidate input mapping is invalid");
  }

  if (mappingResult.safeCandidateDraft === null) {
    blockedReasons.unshift("safeCandidateDraft is missing");
  }

  return {
    status: "blocked",
    canDryRun: false,
    missingCoreFields: uniqueStrings(missingCoreFields),
    blockedReasons: uniqueStrings(blockedReasons),
    warnings: [...mappingResult.warnings],
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
