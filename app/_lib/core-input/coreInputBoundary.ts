import type { RecommendSneakersInput } from "../../../src/core/types";

import { mapCandidateTagsToCoreTags } from "./candidateTagAdapter";
import {
  buildCoreInput,
  type CoreInputAdapterResult,
  type ResolvedCatalogItemInput,
} from "./coreInputAdapter";

export type SafeCandidateInput = {
  name?: unknown;
  candidateTagIds?: unknown;
};

export type CoreInputProfileMeta = {
  userId?: unknown;
  updatedAt?: unknown;
};

export type CoreInputBoundaryInput = {
  safeCandidateInput?: SafeCandidateInput | null;
  resolvedCatalogItem?: ResolvedCatalogItemInput | null;
  userBudgetYen?: unknown;
  profileMeta?: CoreInputProfileMeta | null;
};

export function buildCoreInputFromValidatedBoundary(
  input: CoreInputBoundaryInput
): CoreInputAdapterResult {
  const result = buildCoreInput({
    candidateTagIds: input.safeCandidateInput?.candidateTagIds,
    userId: input.profileMeta?.userId,
    updatedAt: input.profileMeta?.updatedAt,
    userBudgetYen: input.userBudgetYen,
    resolvedCatalogItem: input.resolvedCatalogItem ?? null,
  });

  if (result.status !== "ready") {
    return result;
  }

  const preferredTags = mapValidatedPreferredTags(
    input.safeCandidateInput?.candidateTagIds
  );
  const coreInput: RecommendSneakersInput =
    preferredTags === null
      ? result.coreInput
      : {
          ...result.coreInput,
          preferredTags,
        };

  return {
    status: "ready",
    coreInput,
    errors: [],
  };
}

function mapValidatedPreferredTags(value: unknown) {
  if (
    !Array.isArray(value) ||
    !value.every((tagId): tagId is string => typeof tagId === "string")
  ) {
    return null;
  }

  const mappingResult = mapCandidateTagsToCoreTags(value);

  return mappingResult.status === "mapped" ? mappingResult.coreTags : null;
}
