import type { SessionStorage } from "../auth-session/types";
import {
  TEMPORARY_ONBOARDING_KEY,
  createOnboardingPreferenceHint,
  createUserOnboardingProfilePatch,
  readTemporaryOnboardingHint,
  writeTemporaryOnboardingHint,
} from "./onboardingProfile";

function memoryStorage(): SessionStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

describe("product onboarding profile", () => {
  it("maps onboarding to bounded preference context", () => {
    const hint = createOnboardingPreferenceHint({
      purpose: "purchase_decision",
      experience: "beginner",
      budget: "10000_20000",
      priorities: ["versatility", "comfort", "longevity"],
    });

    expect(hint).toEqual({
      purpose: "purchase_decision",
      experience: "beginner",
      budget: "10000_20000",
      preferredBudgetYen: 20_000,
      preferenceTags: ["minimal", "classic", "comfortable", "durable"],
      decisionBoundary: "preference_context_only",
    });
    expect(hint).not.toHaveProperty("decision");
  });

  it("keeps guest onboarding in temporary session storage only", () => {
    const storage = memoryStorage();
    const hint = createOnboardingPreferenceHint({
      purpose: "outfit_fit",
      experience: "enthusiast",
      budget: "under_10000",
      priorities: ["versatility"],
    });

    writeTemporaryOnboardingHint(storage, hint);
    expect(readTemporaryOnboardingHint(storage)).toEqual(hint);
    expect(storage.values.size).toBe(1);
    expect(storage.values.has(TEMPORARY_ONBOARDING_KEY)).toBe(true);
    expect([...storage.values.keys()]).not.toContain("sole-matrix:guest-session:v1");
  });

  it("prepares a safe user profile patch without a Core Decision", () => {
    const hint = createOnboardingPreferenceHint({
      purpose: "collection_overlap",
      experience: "collector",
      budget: "over_40000",
      priorities: ["culture", "rarity"],
    });
    const patch = createUserOnboardingProfilePatch(hint);

    expect(patch.onboarding.preferenceTags).toEqual(
      expect.arrayContaining(["heritage", "retro", "collab", "premium"]),
    );
    expect(JSON.stringify(patch)).not.toContain("decision");
  });
});
