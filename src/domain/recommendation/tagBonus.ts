import type { SneakerTag } from "../sneaker/sneakerTag";
import { clampScore } from "./scoreUtils";

export function calculateTagBonus(
  candidateTags: SneakerTag[],
  preferredTags: SneakerTag[]
): number {
  const matched = candidateTags.filter((tag) => preferredTags.includes(tag)).length;
  return clampScore(Math.min(100, matched * 25));
}
