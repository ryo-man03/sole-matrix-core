import type {
  CandidateInputMapperOptions,
  CandidateInputMappingResult,
  CandidateUiInput,
} from "./types";

const unsupportedUiFieldNames = [
  "brand",
  "seenPriceText",
  "budgetText",
  "memo",
] as const;

export function mapCandidateUiInputToSafeDraft(
  input: CandidateUiInput,
  options: CandidateInputMapperOptions = {}
): CandidateInputMappingResult {
  const warnings: string[] = [];
  const unsupportedFields: string[] = [];
  const missingFields: string[] = [];
  const supportedCandidateTagIds = options.supportedCandidateTagIds;
  const candidateName = input.sneakerName.trim();

  if (!candidateName) {
    missingFields.push("sneakerName");
  }

  for (const fieldName of unsupportedUiFieldNames) {
    const value = input[fieldName];

    if (typeof value === "string" && value.trim()) {
      unsupportedFields.push(fieldName);
    }
  }

  const supportedTagIdSet =
    supportedCandidateTagIds === undefined
      ? undefined
      : new Set(supportedCandidateTagIds);

  const candidateTagIds: string[] = [];

  for (const tagId of input.selectedTagIds) {
    if (supportedTagIdSet?.has(tagId)) {
      candidateTagIds.push(tagId);
      continue;
    }

    warnings.push(`unsupported candidate tag: ${tagId}`);
    unsupportedFields.push(`selectedTagIds:${tagId}`);
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      safeCandidateDraft: null,
      warnings,
      unsupportedFields,
      missingFields,
    };
  }

  return {
    isValid: true,
    safeCandidateDraft: {
      name: candidateName,
      candidateTagIds,
    },
    warnings,
    unsupportedFields,
    missingFields,
  };
}
