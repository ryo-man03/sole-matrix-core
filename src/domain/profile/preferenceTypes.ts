export type TasteAxis =
  | "culture"
  | "styleFit"
  | "simplicity"
  | "street"
  | "volume";

export type QualityAxis = "comfort" | "durability";

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
