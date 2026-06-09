import type { AxisImportance } from "../profile/preferenceTypes";
import { normalizeWeights } from "./scoreUtils";

export const BASE_FEATURE_WEIGHTS = {
  culture: 0.12,
  styleFit: 0.18,
  simplicity: 0.12,
  street: 0.1,
  volume: 0.08,
  comfort: 0.18,
  durability: 0.14,
  tagBonus: 0.08,
} as const;

export type AxisWeights = Record<keyof typeof BASE_FEATURE_WEIGHTS, number>;

export function calculateAxisWeights(
  axisImportance: AxisImportance
): AxisWeights {
  const raw = {
    culture: BASE_FEATURE_WEIGHTS.culture * (0.5 + axisImportance.culture / 100),
    styleFit:
      BASE_FEATURE_WEIGHTS.styleFit * (0.5 + axisImportance.styleFit / 100),
    simplicity:
      BASE_FEATURE_WEIGHTS.simplicity *
      (0.5 + axisImportance.simplicity / 100),
    street: BASE_FEATURE_WEIGHTS.street * (0.5 + axisImportance.street / 100),
    volume: BASE_FEATURE_WEIGHTS.volume * (0.5 + axisImportance.volume / 100),
    comfort: BASE_FEATURE_WEIGHTS.comfort * (0.5 + axisImportance.comfort / 100),
    durability:
      BASE_FEATURE_WEIGHTS.durability *
      (0.5 + axisImportance.durability / 100),
    tagBonus: BASE_FEATURE_WEIGHTS.tagBonus,
  };

  return normalizeWeights(raw);
}
