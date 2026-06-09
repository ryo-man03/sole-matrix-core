import type { PreferenceProfile } from "../profile/preferenceTypes";
import type {
  OwnedSneakerSummary,
  SneakerCandidate,
} from "../sneaker/sneakerVector";
import type { SneakerTag } from "../sneaker/sneakerTag";
import type { DemotionReason } from "./demotion";
import type { PurchaseDecision } from "./decision";
import type { ScoreBreakdown } from "./scoreBreakdown";

export const FIXED_TEST_NOW = "2026-06-09T00:00:00Z";

export type RecommendationSnapshot = {
  snapshotVersion: "core-v0.1-final-lock";
  profile: PreferenceProfile;
  candidate: SneakerCandidate;
  ownedSneakers: OwnedSneakerSummary[];
  preferredTags: SneakerTag[];
  scoreBreakdown: ScoreBreakdown;
  rawDecision: PurchaseDecision;
  finalDecision: PurchaseDecision;
  demotions: DemotionReason[];
  createdAt: string;
};

export function createRecommendationSnapshot(input: {
  profile: PreferenceProfile;
  candidate: SneakerCandidate;
  ownedSneakers: OwnedSneakerSummary[];
  preferredTags: SneakerTag[];
  scoreBreakdown: ScoreBreakdown;
  rawDecision: PurchaseDecision;
  finalDecision: PurchaseDecision;
  demotions: DemotionReason[];
  createdAt: string;
}): RecommendationSnapshot {
  return {
    snapshotVersion: "core-v0.1-final-lock",
    profile: input.profile,
    candidate: input.candidate,
    ownedSneakers: input.ownedSneakers,
    preferredTags: input.preferredTags,
    scoreBreakdown: input.scoreBreakdown,
    rawDecision: input.rawDecision,
    finalDecision: input.finalDecision,
    demotions: input.demotions,
    createdAt: input.createdAt,
  };
}
