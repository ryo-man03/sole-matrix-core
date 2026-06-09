import { clampScore } from "./scoreUtils";

export function calculateTasteAxisScore(
  userValue: number,
  sneakerValue: number
): number {
  return clampScore(100 - Math.abs(userValue - sneakerValue));
}

export function calculateQualityAxisScore(sneakerValue: number): number {
  return clampScore(sneakerValue);
}
