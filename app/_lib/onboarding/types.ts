import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";

export type OnboardingPurpose =
  | "purchase_decision"
  | "market_price"
  | "collection_overlap"
  | "outfit_fit";

export type SneakerExperience = "beginner" | "enthusiast" | "collector";

export type OnboardingBudget =
  | "under_10000"
  | "10000_20000"
  | "20000_40000"
  | "over_40000";

export type OnboardingPriority =
  | "versatility"
  | "culture"
  | "rarity"
  | "price"
  | "comfort"
  | "longevity";

export type OnboardingAnswers = {
  purpose: OnboardingPurpose;
  experience: SneakerExperience;
  budget: OnboardingBudget;
  priorities: OnboardingPriority[];
};

export type OnboardingPreferenceHint = {
  purpose: OnboardingPurpose;
  experience: SneakerExperience;
  budget: OnboardingBudget;
  preferredBudgetYen?: number;
  preferenceTags: SneakerTag[];
  decisionBoundary: "preference_context_only";
};
