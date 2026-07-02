import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { SneakerVector } from "../../../src/domain/sneaker/sneakerVector";
import { researchSneakerCandidatesWithGemini } from "../ai/gemini-sneaker-research";
import type { GeminiSneakerResearchCandidate } from "../ai/gemini-sneaker-research-schema";
import { sneakerFallbackCatalog } from "../ai/sneaker-fallback-catalog";
import type { UntrustedUserMemoryContext } from "../user-memory/types";
import { decideRecommendation } from "./decision";
import type { ExplanationInput } from "./explanation";
import { generateCoreV1Explanation } from "./geminiExplanation";
import { createPreferenceVector } from "./preferenceVector";
import {
  fetchRakutenCandidates,
  type RakutenCandidateProvider,
  type RakutenCandidateProviderResult,
} from "./rakutenProvider";
import { createRakutenProviderReadiness } from "./rakutenReadiness";
import { createGeminiFallbackReadiness } from "./readiness";
import {
  calculateLocalBudgetFit,
  mockCandidateRepository,
  type CandidateRepository,
} from "./repository";
import { calculateBalancedScore, calculateRyoScore } from "./scoring";
import type {
  CandidateProfile,
  RecommendationExplanation,
  RecommendationResult,
} from "./types";
import type { RecommendRequestInput } from "./validation";

export type ExplanationProvider = (input: ExplanationInput) => Promise<RecommendationExplanation>;

export type RecommendCoreV1Dependencies = {
  candidateRepository?: CandidateRepository;
  explanationProvider?: ExplanationProvider;
  rakutenCandidateProvider?: RakutenCandidateProvider;
  geminiFetcher?: typeof fetch;
  env?: Record<string, string | undefined>;
  userMemoryContext?: UntrustedUserMemoryContext;
};

export async function recommendCoreV1(
  input: RecommendRequestInput,
  dependencies: RecommendCoreV1Dependencies = {},
): Promise<RecommendationResult> {
  const env = dependencies.env ?? process.env;
  const candidateRepository = dependencies.candidateRepository ?? mockCandidateRepository;
  const preferenceVector = createPreferenceVector({
    answers: input.diagnosisAnswers,
    tags: input.preferenceTags,
  });
  const candidateInput = input.budgetYen === undefined ? {} : { budgetYen: input.budgetYen };
  const isProductJudgement = hasProductContext(input);
  const rakutenCandidateProvider = dependencies.rakutenCandidateProvider ??
    ((providerInput) => fetchRakutenCandidates(providerInput, { env }));

  const [fallbackCandidates, rakutenResult, geminiResearch] = await Promise.all([
    candidateRepository.listCandidates(candidateInput),
    loadRakutenCandidatesSafely(rakutenCandidateProvider, {
      ...candidateInput,
      preferenceTags: input.preferenceTags,
      ...(input.sneakerName ? { sneakerName: input.sneakerName } : {}),
      ...(input.brand ? { brand: input.brand } : {}),
      ...(input.color ? { color: input.color } : {}),
      ...(input.urlNameHint ? { urlNameHint: input.urlNameHint } : {}),
    }),
    isProductJudgement
      ? Promise.resolve(null)
      : researchSneakerCandidatesWithGemini(
          {
            answersSummary: input.diagnosisAnswers
              .map((answer) => `${answer.questionId}: ${answer.value}`)
              .join("\n"),
            preferenceVector,
            budget: input.budgetYen === undefined ? null : `${input.budgetYen}円まで`,
            mode: input.mode ?? "balanced",
          },
          {
            ...(env["GEMINI_API_KEY"] ? { apiKey: env["GEMINI_API_KEY"] } : {}),
            ...(dependencies.geminiFetcher ? { fetcher: dependencies.geminiFetcher } : {}),
          },
        ),
  ]);

  let candidates: CandidateProfile[];
  let candidateResearch: RecommendationResult["candidateResearch"];

  if (isProductJudgement) {
    candidates = [createProductInputCandidate(input)];
    candidateResearch = {
      source: "product_input",
      validCandidateCount: 1,
      detail: "入力された商品をCore評価の対象に固定し、AIは補助説明だけに使用します。",
    };
  } else if (geminiResearch?.candidates.length) {
    candidates = geminiResearch.candidates.map((candidate, index) =>
      mapGeminiCandidate(candidate, index, input.budgetYen),
    );
    candidateResearch = {
      source: "gemini",
      validCandidateCount: candidates.length,
      detail: "Gemini候補をschema・抽象名・参考URLで検証し、Coreで再スコアリングしました。",
    };
  } else {
    candidates = fallbackCandidates;
    candidateResearch = {
      source: "fallback_catalog",
      validCandidateCount: candidates.length,
      detail: "AI調査結果を安全に確認できなかったため、アプリ内の確認済み候補から推薦しています。",
    };
  }

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

  const best = scoredCandidates.sort((left, right) => {
    if (input.mode === "ryo") return right.ryoScore.total - left.ryoScore.total;
    if (input.mode === "balanced") return right.balancedScore.total - left.balancedScore.total;
    return right.balancedScore.total + right.ryoScore.total - left.balancedScore.total - left.ryoScore.total;
  })[0];
  if (!best) throw new Error("CANDIDATE_UNAVAILABLE");

  const explanationInput: ExplanationInput = {
    ...best,
    preferenceVector,
    inputTags: [...input.preferenceTags],
    ...(input.budgetYen === undefined ? {} : { budgetYen: input.budgetYen }),
    ...(dependencies.userMemoryContext ? { userMemoryContext: dependencies.userMemoryContext } : {}),
  };
  const generatedExplanation = dependencies.explanationProvider
    ? await dependencies.explanationProvider(explanationInput)
    : await generateCoreV1Explanation(explanationInput, {
        ...(env["GEMINI_API_KEY"] ? { apiKey: env["GEMINI_API_KEY"] } : {}),
        ...(dependencies.geminiFetcher ? { fetcher: dependencies.geminiFetcher } : {}),
      });
  const explanation = addResearchContext(generatedExplanation, best.candidate);
  const geminiReady = candidateResearch.source === "gemini" || explanation.source === "gemini";

  return {
    recommendationId: `core-v1:${best.candidate.id}`,
    preferenceVector,
    ...best,
    explanation,
    candidateResearch,
    readiness: {
      gemini: geminiReady
        ? {
            provider: "gemini",
            status: "ready",
            detail: candidateResearch.source === "gemini"
              ? "Gemini候補調査を検証し、Core再評価後の結果を表示しています。"
              : "Geminiの補助説明を検証して表示しています。最終DecisionはCoreが決定します。",
          }
        : createGeminiFallbackReadiness(Boolean(env["GEMINI_API_KEY"])),
      rakuten: rakutenResult.readiness,
    },
    externalEvidence: {
      listings: rakutenResult.evidence,
      feedbackPatterns: [],
    },
  };
}

function mapGeminiCandidate(
  candidate: GeminiSneakerResearchCandidate,
  index: number,
  budgetYen: number | undefined,
): CandidateProfile {
  const catalogMatch = sneakerFallbackCatalog.find((entry) =>
    normalize(entry.modelName) === normalize(candidate.modelName),
  );
  const tags = catalogMatch?.tags ?? inferTags(`${candidate.modelName} ${candidate.modelType}`);
  const vector = catalogMatch?.vector ?? createVectorFromTags(tags, candidate.modelName);
  return {
    id: `gemini-${index + 1}-${slug(candidate.modelName)}`,
    name: candidate.modelName,
    source: "local",
    description: candidate.reason,
    tags: [...tags],
    vector: { ...vector },
    budgetFit: calculateLocalBudgetFit(budgetYen, vector.priceLevel),
    risk: catalogMatch?.risk ?? "medium",
    informationCompleteness: catalogMatch?.informationCompleteness ?? 76,
    readiness: "ready_external",
    modelType: candidate.modelType,
    searchKeywords: [...candidate.searchKeywords],
    evidenceUrls: [...candidate.evidenceUrls],
    researchReason: candidate.reason,
    researchCautions: [...candidate.cautions],
    researchSource: "gemini",
  };
}

function createProductInputCandidate(input: RecommendRequestInput): CandidateProfile {
  const name = input.sneakerName ?? input.urlNameHint ??
    ([input.brand, input.color].filter(Boolean).join(" ") || "画像から解析したスニーカー");
  const tags = inferTags(name);
  const vector = createVectorFromTags(tags, name);
  return {
    id: `input-${slug(name)}`,
    name,
    source: "local",
    description: "入力された商品情報を対象に、Coreの同じ評価境界で購入判断を整理します。",
    tags,
    vector,
    budgetFit: calculateLocalBudgetFit(input.budgetYen, vector.priceLevel),
    risk: "medium",
    // External image/URL-derived fields must not change Core completeness or score.
    informationCompleteness: input.sneakerName || input.urlNameHint ? 70 : 60,
    readiness: input.sneakerName || input.urlNameHint ? "ready_local" : "degraded",
    researchSource: "product_input",
    researchReason: "商品名・URL metadata・画像分析を補助情報として使用しています。",
    researchCautions: ["価格・在庫・サイズ・真贋は販売元で確認してください。"],
  };
}

function inferTags(value: string): SneakerTag[] {
  const text = normalize(value);
  const tags = new Set<SneakerTag>();
  if (/samba|suede|era|jack purcell|all star|chuck|classic|クラシック|ローテク/.test(text)) {
    ["classic", "low_tech", "heritage", "minimal"].forEach((tag) => tags.add(tag as SneakerTag));
  }
  if (/jordan|air force|basketball|street|ストリート|バスケット/.test(text)) {
    ["basketball", "street", "retro", "durable"].forEach((tag) => tags.add(tag as SneakerTag));
  }
  if (/new balance|991|2002r|kayano|asics|running|runner|ランナー|ランニング/.test(text)) {
    ["running", "comfortable", "retro", "durable"].forEach((tag) => tags.add(tag as SneakerTag));
  }
  if (/canvas|キャンバス/.test(text)) tags.add("canvas");
  if (/premium|プレミアム/.test(text)) tags.add("premium");
  if (tags.size === 0) ["minimal", "comfortable", "durable"].forEach((tag) => tags.add(tag as SneakerTag));
  return [...tags].slice(0, 6);
}

function createVectorFromTags(tags: readonly SneakerTag[], name: string): SneakerVector {
  const has = (tag: SneakerTag) => tags.includes(tag);
  return {
    culture: has("heritage") || has("classic") ? 84 : 66,
    styleFit: 78,
    simplicity: has("minimal") || has("low_tech") ? 88 : 58,
    street: has("street") || has("basketball") ? 88 : 58,
    volume: has("chunky") || has("basketball") ? 78 : 48,
    comfort: has("comfortable") || has("running") ? 90 : 70,
    durability: has("durable") ? 86 : 74,
    priceLevel: /991|jordan|kayano|premium/i.test(name) ? 70 : 52,
  };
}

function addResearchContext(
  explanation: RecommendationExplanation,
  candidate: CandidateProfile,
): RecommendationExplanation {
  return {
    ...explanation,
    reasons: [...new Set([candidate.researchReason, ...explanation.reasons].filter((item): item is string => Boolean(item)))].slice(0, 6),
    cautions: [...new Set([...(candidate.researchCautions ?? []), ...explanation.cautions])].slice(0, 6),
  };
}

function hasProductContext(input: RecommendRequestInput): boolean {
  return Boolean(input.sneakerName || input.brand || input.color || input.urlNameHint);
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
      evidence: [],
      readiness: createRakutenProviderReadiness("network_or_http_error"),
      networkAttempted: true,
      responseOk: false,
      shapeValid: false,
    };
  }
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/\s+/g, " ").trim();
}

function slug(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "sneaker";
}
