import { recommendSneakers } from "../core/recommendSneakers";
import {
  sampleOwnedSneakersByProfile,
  sampleProfiles,
  sampleSneakers,
} from "../data";
import { formatRecommendationResults } from "./formatRecommendationResult";

const DEMO_RESULT_LIMIT = 5;

function runRecommendationDemo(): void {
  const profile = sampleProfiles[0];

  if (!profile) {
    throw new Error("sampleProfiles must contain at least one profile");
  }

  const { preferredTags, ...preferenceProfile } = profile;
  const results = recommendSneakers({
    preferenceProfile,
    candidates: sampleSneakers,
    ownedSneakers: sampleOwnedSneakersByProfile[profile.userId] ?? [],
    preferredTags,
  });

  console.log("SOLE//MATRIX Core v0.2 CLI Demo");
  console.log(`profile: ${profile.userId}`);
  console.log(`candidates: ${sampleSneakers.length}`);
  console.log(`showing top ${Math.min(DEMO_RESULT_LIMIT, results.length)}`);
  console.log("");
  console.log(formatRecommendationResults(results, DEMO_RESULT_LIMIT));
}

runRecommendationDemo();
