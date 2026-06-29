import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { SessionStorage } from "../auth-session/types";
import type {
  OnboardingAnswers,
  OnboardingPreferenceHint,
  OnboardingPriority,
} from "./types";

export const TEMPORARY_ONBOARDING_KEY = "sole-matrix:onboarding-session:v1";

const priorityTags: Record<OnboardingPriority, SneakerTag[]> = {
  versatility: ["minimal", "classic"],
  culture: ["heritage", "retro"],
  rarity: ["collab", "premium"],
  price: ["classic"],
  comfort: ["comfortable"],
  longevity: ["durable"],
};

const preferredBudgetYen = {
  under_10000: 10_000,
  "10000_20000": 20_000,
  "20000_40000": 40_000,
  over_40000: undefined,
} as const;

export function createOnboardingPreferenceHint(
  answers: OnboardingAnswers,
): OnboardingPreferenceHint {
  const tags = new Set<SneakerTag>();
  for (const priority of answers.priorities.slice(0, 3)) {
    for (const tag of priorityTags[priority]) tags.add(tag);
  }

  const budgetHint = preferredBudgetYen[answers.budget];
  return {
    purpose: answers.purpose,
    experience: answers.experience,
    budget: answers.budget,
    ...(budgetHint === undefined ? {} : { preferredBudgetYen: budgetHint }),
    preferenceTags: [...tags].slice(0, 5),
    decisionBoundary: "preference_context_only",
  };
}

export function writeTemporaryOnboardingHint(
  storage: SessionStorage | undefined,
  hint: OnboardingPreferenceHint,
): void {
  if (!storage) return;
  try {
    storage.setItem(TEMPORARY_ONBOARDING_KEY, JSON.stringify(hint));
  } catch {
    // Restricted browsers can continue without cross-page onboarding state.
  }
}

export function readTemporaryOnboardingHint(
  storage: SessionStorage | undefined,
): OnboardingPreferenceHint | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(TEMPORARY_ONBOARDING_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isOnboardingPreferenceHint(value) ? value : null;
  } catch {
    return null;
  }
}

export function createUserOnboardingProfilePatch(
  hint: OnboardingPreferenceHint,
) {
  return {
    onboarding: {
      purpose: hint.purpose,
      experience: hint.experience,
      budget: hint.budget,
      preferenceTags: [...hint.preferenceTags],
    },
  };
}

function isOnboardingPreferenceHint(
  value: unknown,
): value is OnboardingPreferenceHint {
  if (!isRecord(value)) return false;
  const allowedPurposes = new Set([
    "purchase_decision",
    "market_price",
    "collection_overlap",
    "outfit_fit",
  ]);
  const allowedExperiences = new Set(["beginner", "enthusiast", "collector"]);
  const allowedBudgets = new Set([
    "under_10000",
    "10000_20000",
    "20000_40000",
    "over_40000",
  ]);
  const allowedTags = new Set<SneakerTag>([
    "classic", "low_tech", "canvas", "minimal", "street", "chunky",
    "basketball", "running", "comfortable", "durable", "retro", "collab",
    "trail", "outdoor", "premium", "heritage",
  ]);
  return (
    typeof value["purpose"] === "string" &&
    allowedPurposes.has(value["purpose"]) &&
    typeof value["experience"] === "string" &&
    allowedExperiences.has(value["experience"]) &&
    typeof value["budget"] === "string" &&
    allowedBudgets.has(value["budget"]) &&
    Array.isArray(value["preferenceTags"]) &&
    value["preferenceTags"].length <= 5 &&
    value["preferenceTags"].every(
      (tag) => typeof tag === "string" && allowedTags.has(tag as SneakerTag),
    ) &&
    (value["preferredBudgetYen"] === undefined ||
      (typeof value["preferredBudgetYen"] === "number" &&
        Number.isFinite(value["preferredBudgetYen"]) &&
        value["preferredBudgetYen"] > 0)) &&
    value["decisionBoundary"] === "preference_context_only"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
