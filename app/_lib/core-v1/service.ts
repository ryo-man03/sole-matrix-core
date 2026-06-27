import { decideRecommendation } from "./decision";
import type { ExplanationInput } from "./explanation";
import { createGeminiFallbackReadiness } from "./readiness";
import { generateCoreV1Explanation } from "./geminiExplanation";
import {
  fetchRakutenCandidates,
  type RakutenCandidateProvider,
  type RakutenCandidateProviderResult,
} from "./rakutenProvider";
import { createRakutenProviderReadiness } from "./rakutenReadiness";
import {
  mockCandidateRepository,
  type CandidateRepository,
} from "./repository";
import { createPreferenceVector } from "./preferenceVector";
import { calculateBalancedScore, calculateRyoScore } from "./scoring";
import type {
  RecommendationExplanation,
  RecommendationResult,
} from "./types";
import type { RecommendRequestInput } from "./validation";

export type ExplanationProvider = (
  input: ExplanationInput,
) => Promise<RecommendationExplanation>;

export type RecommendCoreV1Dependencies = {
  candidateRepository?: CandidateRepository;
  explanationProvider?: ExplanationProvider;
  rakutenCandidateProvider?: RakutenCandidateProvider;
  geminiFetcher?: typeof fetch;
  env?: Record<string, string | undefined>;
};

export async function recommendCoreV1(
  input: RecommendRequestInput,
  dependencies: RecommendCoreV1Dependencies = {},
): Promise<RecommendationResult> {
  const candidateRepository =
    dependencies.candidateRepository ?? mockCandidateRepository;
  const env = dependencies.env ?? process.env;
  const preferenceVector = createPreferenceVector({
    answers: input.diagnosisAnswers,
    tags: input.preferenceTags,
  });
  const candidateInput = {
    ...(input.budgetYen === undefined ? {} : { budgetYen: input.budgetYen }),
  };
  const rakutenCandidateProvider =
    dependencies.rakutenCandidateProvider ??
    ((providerInput) =>
      fetchRakutenCandidates(providerInput, {
        env,
      }));
  const [localCandidates, rakutenResult] = await Promise.all([
    candidateRepository.listCandidates(candidateInput),
    loadRakutenCandidatesSafely(rakutenCandidateProvider, {
      ...candidateInput,
      preferenceTags: input.preferenceTags,
    }),
  ]);
  const candidates = [...localCandidates, ...rakutenResult.candidates];

  const scoredCandidates = candidates.map((candidate) => {
    const balancedScore = calculateBalancedScore({
      preferenceVector,
      candidate,
      preferredTags: input.preferenceTags,
    });
    const ryoScore = calculateRyoScore({ preferenceVector, candidate });
    const decision = decideRecommendation({
      balancedScore,
      ryoScore,
      budgetFit: candidate.budgetFit,
      risk: candidate.risk,
      informationCompleteness: candidate.informationCompleteness,
      readiness: candidate.readiness,
    });

    return { candidate, balancedScore, ryoScore, decision };
  });
  const best = scoredCandidates.sort(
    (left, right) =>
      right.balancedScore.total + right.ryoScore.total -
      (left.balancedScore.total + left.ryoScore.total),
  )[0];

  if (!best) {
    throw new Error("CANDIDATE_UNAVAILABLE");
  }

  const explanationInput: ExplanationInput = {
    ...best,
    preferenceVector,
    inputTags: [...input.preferenceTags],
    ...(input.budgetYen === undefined ? {} : { budgetYen: input.budgetYen }),
  };
  const explanation = dependencies.explanationProvider
    ? await dependencies.explanationProvider(explanationInput)
    : await generateCoreV1Explanation(explanationInput, {
        ...(env["GEMINI_API_KEY"]
          ? { apiKey: env["GEMINI_API_KEY"] }
          : {}),
        ...(dependencies.geminiFetcher
          ? { fetcher: dependencies.geminiFetcher }
          : {}),
      });

  return {
    recommendationId: `core-v1:${best.candidate.id}`,
    preferenceVector,
    ...best,
    explanation,
    readiness: {
      gemini:
        explanation.source === "gemini"
          ? {
              provider: "gemini",
              status: "ready",
              detail: "AI補助による説明を表示しています。",
            }
          : createGeminiFallbackReadiness(Boolean(env["GEMINI_API_KEY"])),
      rakuten: rakutenResult.readiness,
    },
  };
}

async function loadRakutenCandidatesSafely(
  provider: RakutenCandidateProvider,
  input: Parameters<RakutenCandidateProvider>[0],
): Promise<RakutenCandidateProviderResult> {
  try {
    return await provider(input);
  } catch {
    return {
      status: "network_or_http_error",
      candidates: [],
      readiness: createRakutenProviderReadiness("network_or_http_error"),
      networkAttempted: true,
      responseOk: false,
      shapeValid: false,
    };
  }
}
