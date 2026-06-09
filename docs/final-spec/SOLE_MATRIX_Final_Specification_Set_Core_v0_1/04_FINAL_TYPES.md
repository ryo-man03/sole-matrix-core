# 04. FINAL TYPES

```ts
export type TasteAxis =
  | "culture"
  | "styleFit"
  | "simplicity"
  | "street"
  | "volume";

export type QualityAxis =
  | "comfort"
  | "durability";

export type PreferenceVector = {
  culture: number;
  styleFit: number;
  simplicity: number;
  street: number;
  volume: number;
  comfort: number;
  durability: number;
};

export type PreferencePolicy = {
  priceSensitivity: number;
  overlapSensitivity: number;
  explorationTolerance: number;
};

export type AxisImportance = {
  culture: number;
  styleFit: number;
  simplicity: number;
  street: number;
  volume: number;
  comfort: number;
  durability: number;
};

export type PreferenceProfile = {
  userId: string;
  vector: PreferenceVector;
  policy: PreferencePolicy;
  axisImportance: AxisImportance;
  sourceConfidence: {
    diagnosis: number;
    ownedSneakers: number;
    wantedSneakers: number;
    feedback: number;
  };
  profileVersion: number;
  updatedAt: string;
};

export type SneakerVector = {
  culture: number;
  styleFit: number;
  simplicity: number;
  street: number;
  volume: number;
  comfort: number;
  durability: number;
  priceLevel: number;
};

export type SneakerTag =
  | "classic"
  | "low_tech"
  | "canvas"
  | "minimal"
  | "street"
  | "chunky"
  | "basketball"
  | "running"
  | "comfortable"
  | "durable"
  | "retro"
  | "collab"
  | "trail"
  | "outdoor"
  | "premium"
  | "heritage";

export type SneakerCandidate = {
  sneakerId: string;
  name: string;
  vector: SneakerVector;
  tags: SneakerTag[];
  budgetFit: number;
};

export type OwnedSneakerSummary = {
  sneakerId: string;
  roleTags: SneakerTag[];
  wearFrequency: "high" | "medium" | "low";
};

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

export type PurchaseDecision =
  | "STRONG_BUY"
  | "BUY"
  | "WAIT"
  | "WATCH"
  | "SKIP";

export type DemotionReason =
  | "HIGH_CLOSET_OVERLAP"
  | "LOW_PRICE_FIT"
  | "LOW_COMFORT"
  | "LOW_DURABILITY";

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
```
