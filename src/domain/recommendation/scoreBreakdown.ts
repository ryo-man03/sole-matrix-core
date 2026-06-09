export type ScoreBreakdown = {
  cultureScore: number;
  styleScore: number;
  simplicityScore: number;
  streetScore: number;
  volumeScore: number;
  comfortScore: number;
  durabilityScore: number;
  tagBonus: number;
  featureFitScore: number;
  priceScore: number;
  overlapPenalty: number;
  nonOverlapScore: number;
  finalScore: number;
  axisWeightsApplied: Record<string, number>;
};
