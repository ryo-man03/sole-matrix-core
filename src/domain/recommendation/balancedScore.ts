import type { PreferenceProfile } from "../profile/preferenceTypes";
import type {
  OwnedSneakerSummary,
  SneakerCandidate,
} from "../sneaker/sneakerVector";
import type { SneakerTag } from "../sneaker/sneakerTag";
import { calculateTasteAxisScore, calculateQualityAxisScore } from "./axes";
import { calculateAxisWeights } from "./axisWeights";
import { decideFromScore, type PurchaseDecision } from "./decision";
import { applyDemotions, type DemotionReason } from "./demotion";
import { calculateOverlapPenalty } from "./overlapPenalty";
import { calculatePriceScore } from "./priceScore";
import type { ScoreBreakdown } from "./scoreBreakdown";
import { clampScore, roundScore, roundWeight } from "./scoreUtils";
import { calculateTagBonus } from "./tagBonus";

export function calculateBalancedScore(input: {
  profile: PreferenceProfile;
  candidate: SneakerCandidate;
  ownedSneakers: OwnedSneakerSummary[];
  preferredTags: SneakerTag[];
}): {
  scoreBreakdown: ScoreBreakdown;
  rawDecision: PurchaseDecision;
  finalDecision: PurchaseDecision;
  demotions: DemotionReason[];
} {
  const { profile, candidate } = input;

  const cultureScore = calculateTasteAxisScore(
    profile.vector.culture,
    candidate.vector.culture
  );
  const styleScore = calculateTasteAxisScore(
    profile.vector.styleFit,
    candidate.vector.styleFit
  );
  const simplicityScore = calculateTasteAxisScore(
    profile.vector.simplicity,
    candidate.vector.simplicity
  );
  const streetScore = calculateTasteAxisScore(
    profile.vector.street,
    candidate.vector.street
  );
  const volumeScore = calculateTasteAxisScore(
    profile.vector.volume,
    candidate.vector.volume
  );
  const comfortScore = calculateQualityAxisScore(candidate.vector.comfort);
  const durabilityScore = calculateQualityAxisScore(candidate.vector.durability);
  const tagBonus = calculateTagBonus(candidate.tags, input.preferredTags);
  const weights = calculateAxisWeights(profile.axisImportance);

  const featureFitScore =
    cultureScore * weights.culture +
    styleScore * weights.styleFit +
    simplicityScore * weights.simplicity +
    streetScore * weights.street +
    volumeScore * weights.volume +
    comfortScore * weights.comfort +
    durabilityScore * weights.durability +
    tagBonus * weights.tagBonus;

  const priceScore = calculatePriceScore({
    priceSensitivity: profile.policy.priceSensitivity,
    priceLevel: candidate.vector.priceLevel,
    budgetFit: candidate.budgetFit,
  });

  const overlapPenalty = calculateOverlapPenalty({
    candidateTags: candidate.tags,
    ownedSneakers: input.ownedSneakers,
    overlapSensitivity: profile.policy.overlapSensitivity,
  });
  const nonOverlapScore = 100 - overlapPenalty;
  const rawFinalScore = clampScore(
    featureFitScore * 0.72 + priceScore * 0.18 + nonOverlapScore * 0.1
  );
  const rawDecision = decideFromScore(rawFinalScore);
  const axisWeightsApplied = {
    culture: roundWeight(weights.culture),
    styleFit: roundWeight(weights.styleFit),
    simplicity: roundWeight(weights.simplicity),
    street: roundWeight(weights.street),
    volume: roundWeight(weights.volume),
    comfort: roundWeight(weights.comfort),
    durability: roundWeight(weights.durability),
    tagBonus: roundWeight(weights.tagBonus),
  };
  const storedFeatureFitScore =
    cultureScore * axisWeightsApplied.culture +
    styleScore * axisWeightsApplied.styleFit +
    simplicityScore * axisWeightsApplied.simplicity +
    streetScore * axisWeightsApplied.street +
    volumeScore * axisWeightsApplied.volume +
    comfortScore * axisWeightsApplied.comfort +
    durabilityScore * axisWeightsApplied.durability +
    tagBonus * axisWeightsApplied.tagBonus;
  const storedFinalScore = clampScore(
    storedFeatureFitScore * 0.72 +
      priceScore * 0.18 +
      nonOverlapScore * 0.1
  );

  const scoreBreakdown: ScoreBreakdown = {
    cultureScore: roundScore(cultureScore),
    styleScore: roundScore(styleScore),
    simplicityScore: roundScore(simplicityScore),
    streetScore: roundScore(streetScore),
    volumeScore: roundScore(volumeScore),
    comfortScore: roundScore(comfortScore),
    durabilityScore: roundScore(durabilityScore),
    tagBonus: roundScore(tagBonus),
    featureFitScore: roundScore(storedFeatureFitScore),
    priceScore: roundScore(priceScore),
    overlapPenalty: roundScore(overlapPenalty),
    nonOverlapScore: roundScore(nonOverlapScore),
    finalScore: roundScore(storedFinalScore),
    axisWeightsApplied,
  };

  const { finalDecision, demotions } = applyDemotions({
    rawDecision,
    scoreBreakdown,
  });

  return {
    scoreBreakdown,
    rawDecision,
    finalDecision,
    demotions,
  };
}
