import type { SneakerTag } from "./sneakerTag";

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
