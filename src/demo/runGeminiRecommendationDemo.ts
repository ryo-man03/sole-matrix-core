import type { GeminiExplanationOutput } from "../ai";
import { generateGeminiExplanation } from "../ai";
import { recommendSneakers } from "../core/recommendSneakers";
import type { RecommendationResult } from "../core/types";
import {
  sampleOwnedSneakersByProfile,
  sampleProfiles,
  sampleSneakers,
} from "../data";
import { createRuleBasedExplanation } from "../explanation";
import {
  formatGeminiRecommendationDemo,
  type GeminiRecommendationDemoItem,
} from "./formatGeminiRecommendationDemo";

const DEMO_RESULT_LIMIT = 3;

async function runGeminiRecommendationDemo(): Promise<void> {
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

  const visibleResults = results.slice(0, DEMO_RESULT_LIMIT);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const canUseGemini = Boolean(apiKey);

  const demoItems = await Promise.all(
    visibleResults.map((result) =>
      createGeminiRecommendationDemoItem(result, canUseGemini ? apiKey : undefined)
    )
  );

  console.log("SOLE//MATRIX Core v0.2 Gemini CLI Demo");
  console.log(`profile: ${profile.userId}`);
  console.log(`candidates: ${sampleSneakers.length}`);
  console.log(`showing top ${Math.min(DEMO_RESULT_LIMIT, results.length)}`);

  if (!canUseGemini) {
    console.log("GEMINI_API_KEY not set; using rule-based fallback.");
  }

  console.log("");
  console.log(formatGeminiRecommendationDemo(demoItems, DEMO_RESULT_LIMIT));
}

async function createGeminiRecommendationDemoItem(
  result: RecommendationResult,
  apiKey: string | undefined
): Promise<GeminiRecommendationDemoItem> {
  const fallback = createRuleBasedExplanation(result);
  const explanation: GeminiExplanationOutput = apiKey
    ? await generateGeminiExplanation({ result, fallback }, { apiKey })
    : {
        provider: "rule-based",
        sneakerId: result.sneakerId,
        name: result.name,
        summary: fallback.summary,
        reasons: [...fallback.reasons],
        cautions: [...fallback.cautions],
      };

  return { result, explanation };
}

runGeminiRecommendationDemo().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Gemini demo failed: ${message}`);
  process.exitCode = 1;
});
