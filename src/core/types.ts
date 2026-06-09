import type { PreferenceProfile } from "../domain/profile/preferenceTypes";
import type { DemotionReason } from "../domain/recommendation/demotion";
import type { PurchaseDecision } from "../domain/recommendation/decision";
import type { ScoreBreakdown } from "../domain/recommendation/scoreBreakdown";
import type {
  OwnedSneakerSummary,
  SneakerCandidate,
  SneakerVector,
} from "../domain/sneaker/sneakerVector";
import type { SneakerTag } from "../domain/sneaker/sneakerTag";

export type Decision = PurchaseDecision;
export type Demotion = DemotionReason;
export type OwnedSneaker = OwnedSneakerSummary;

export type RecommendSneakersInput = {
  preferenceProfile: PreferenceProfile;
  candidates: SneakerCandidate[];
  ownedSneakers?: OwnedSneaker[];
  preferredTags?: SneakerTag[];
};

export type RecommendationResult = {
  sneakerId: string;
  name: string;
  inputIndex: number;
  scoreBreakdown: ScoreBreakdown;
  rawDecision: Decision;
  finalDecision: Decision;
  demotions: Demotion[];
};

export type {
  PreferenceProfile,
  ScoreBreakdown,
  SneakerCandidate,
  SneakerTag,
  SneakerVector,
};
