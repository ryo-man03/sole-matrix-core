import { calculateBalancedScore } from "../domain/recommendation/balancedScore";
import type { SneakerTag } from "../domain/sneaker/sneakerTag";
import type {
  RecommendationResult,
  RecommendSneakersInput,
} from "./types";

export function recommendSneakers(
  input: RecommendSneakersInput
): RecommendationResult[] {
  const ownedSneakers = input.ownedSneakers ?? [];
  const preferredTags: SneakerTag[] = input.preferredTags ?? [];

  // Snapshot creation stays outside this list API because v0.1 snapshots
  // require a caller-owned createdAt for immutable record keeping.
  return input.candidates
    .map((candidate, inputIndex): RecommendationResult => {
      const result = calculateBalancedScore({
        profile: input.preferenceProfile,
        candidate,
        ownedSneakers,
        preferredTags,
      });

      return {
        sneakerId: candidate.sneakerId,
        name: candidate.name,
        inputIndex,
        scoreBreakdown: result.scoreBreakdown,
        rawDecision: result.rawDecision,
        finalDecision: result.finalDecision,
        demotions: result.demotions,
      };
    })
    .sort((left, right) => {
      const scoreDelta =
        right.scoreBreakdown.finalScore - left.scoreBreakdown.finalScore;

      return scoreDelta === 0 ? left.inputIndex - right.inputIndex : scoreDelta;
    });
}
