import type { OwnedSneakerSummary } from "../sneaker/sneakerVector";
import type { SneakerTag } from "../sneaker/sneakerTag";
import { clampScore } from "./scoreUtils";

export function calculateOverlapPenalty(input: {
  candidateTags: SneakerTag[];
  ownedSneakers: OwnedSneakerSummary[];
  overlapSensitivity: number;
}): number {
  const maxOverlap = Math.max(
    0,
    ...input.ownedSneakers.map((owned) => {
      const overlapCount = input.candidateTags.filter((tag) =>
        owned.roleTags.includes(tag)
      ).length;

      const base = Math.min(100, overlapCount * 25);

      const wearFrequencyFactor =
        owned.wearFrequency === "high"
          ? 1.0
          : owned.wearFrequency === "medium"
            ? 0.8
            : 0.6;

      return base * wearFrequencyFactor;
    })
  );

  const sensitivityFactor = 0.5 + input.overlapSensitivity / 100;
  return clampScore(maxOverlap * sensitivityFactor);
}
