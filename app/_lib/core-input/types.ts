export type CandidateUiInput = {
  sneakerName: string;
  brand?: string;
  seenPriceText?: string;
  budgetText?: string;
  memo?: string;
  selectedTagIds: string[];
};

export type CandidateInputMapperOptions = {
  supportedCandidateTagIds?: readonly string[];
};

export type CandidateInputMappingResult = {
  isValid: boolean;
  safeCandidateDraft: {
    name: string;
    candidateTagIds: string[];
  } | null;
  warnings: string[];
  unsupportedFields: string[];
  missingFields: string[];
};
