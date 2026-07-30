import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { SneakerVector } from "../../../src/domain/sneaker/sneakerVector";
import { researchSneakerCandidatesWithGemini } from "../ai/gemini-sneaker-research";
import type { GeminiSneakerResearchCandidate } from "../ai/gemini-sneaker-research-schema";
import type { UntrustedUserMemoryContext } from "../user-memory/types";
import { auditRecommendationExplanation } from "../recommendation-trust/explanation-audit";
import {
  createFactualVerification,
  createRecommendationTrustEvaluation,
} from "../recommendation-trust/evaluation";
import {
  buildScoredShortlist,
  buildTrustedCandidatePool,
  createTrustedCandidateFunnel,
} from "../recommendation-trust/trusted-pipeline";
import { normalizeUserSneakerContext } from "../diagnosis/sneakerContext";
import {
  buildRecommendationDisplayReasons,
  createRyoModeCandidateAnchors,
  getRerankingWeights,
  mergeRyoModeCandidatePool,
  normalizeCandidateOfficialName,
  rerankRyoModeCandidates,
  selectRecommendationDisplaySet,
  type CoreScoredCandidate,
  type RyoRerankedCandidate,
} from "../ryo-mode-v4/candidates";
import { buildRyoModeCandidateEvaluation } from "../ryo-mode-v4/integration";
import { buildRyoPreferenceVector, summarizeRyoPreferenceVector } from "../ryo-mode-v4/vector";
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
import {
  createGeminiExplanationReadiness,
  createGeminiResearchReadiness,
} from "./readiness";
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
  const externalProvidersDisabled = dependencies.env
    ? dependencies.env["EXTERNAL_PROVIDERS_DISABLED"] === "true"
    : process.env.EXTERNAL_PROVIDERS_DISABLED === "true";
  const providerEnv = externalProvidersDisabled
    ? {
        ...env,
        GEMINI_API_KEY: undefined,
        RAKUTEN_APPLICATION_ID: undefined,
        RAKUTEN_ACCESS_KEY: undefined,
        RAKUTEN_AFFILIATE_ID: undefined,
      }
    : env;
  const candidateRepository = dependencies.candidateRepository ?? mockCandidateRepository;
  const preferenceVector = createPreferenceVector({
    answers: input.diagnosisAnswers,
    tags: input.preferenceTags,
  });
  const candidateInput = input.budgetYen === undefined ? {} : { budgetYen: input.budgetYen };
  const isProductJudgement = hasProductContext(input);
  const ryoPreferenceVector = buildRyoPreferenceVector(input.ryoModeAnswers ?? {});
  const ryoSummary = summarizeRyoPreferenceVector(ryoPreferenceVector);
  const userSneakerContext = normalizeUserSneakerContext({
    purchasePurpose: input.purchasePurpose,
    ownedModels: input.ownedModels,
    dislikedModels: input.dislikedModels,
    dislikedSignals: input.dislikedSignals,
  });
  const ryoRerankingEnabled = !isProductJudgement && input.ryoModeAnswers !== undefined;
  const rakutenCandidateProvider = dependencies.rakutenCandidateProvider ??
    ((providerInput) => fetchRakutenCandidates(providerInput, { env: providerEnv }));

  const [rawFallbackCandidates, rakutenResult, geminiResearch] = await Promise.all([
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
            answersSummary: Object.entries(input.ryoModeAnswers ?? {})
              .map(([questionId, optionId]) => `${questionId}: ${optionId}`)
              .join("\n") || input.diagnosisAnswers
              .map((answer) => `${answer.questionId}: ${answer.value}`)
              .join("\n"),
            preferenceVector,
            purchasePurpose: userSneakerContext.purchasePurpose,
            ownedModels: userSneakerContext.ownedModels,
            dislikedModels: userSneakerContext.dislikedModels,
            dislikedSignals: userSneakerContext.dislikedSignals,
            budget: input.budgetYen === undefined ? null : `${input.budgetYen}円まで`,
            mode: input.mode ?? "balanced",
          },
          {
            ...(providerEnv["GEMINI_API_KEY"] ? { apiKey: providerEnv["GEMINI_API_KEY"] } : {}),
            ...(providerEnv["GEMINI_RESEARCH_MODEL"] ? { model: providerEnv["GEMINI_RESEARCH_MODEL"] } : {}),
            ...(providerEnv["GEMINI_RESEARCH_FALLBACK_MODEL"] ? { fallbackModel: providerEnv["GEMINI_RESEARCH_FALLBACK_MODEL"] } : {}),
            ...(dependencies.geminiFetcher ? { fetcher: dependencies.geminiFetcher } : {}),
          },
        ),
  ]);
  const fallbackCandidates = rawFallbackCandidates.map(normalizeCandidateOfficialName);
  const ryoAnchorCandidates = ryoRerankingEnabled
    ? createRyoModeCandidateAnchors(ryoPreferenceVector, input.budgetYen)
    : [];

  let candidates: CandidateProfile[];
  let candidateResearch: RecommendationResult["candidateResearch"];

  if (isProductJudgement) {
    candidates = [normalizeCandidateOfficialName(createProductInputCandidate(input))];
    candidateResearch = {
      source: "product_input",
      status: "not_checked",
      reasonCode: null,
      validCandidateCount: 0,
      coreReevaluated: false,
      modelUsed: null,
      usedFallbackModel: false,
      stages: {
        grounding: { status: "not_checked", evidenceUrlCount: 0 },
        normalization: { status: "not_checked", repairAttempted: false, candidateCount: 0 },
      },
      detail: "商品判断では入力商品をCore評価の対象に固定するため、Gemini候補調査は実行していません。",
    };
  } else if (geminiResearch?.status === "ready") {
    const geminiCandidates = geminiResearch.result.candidates.map((candidate, index) =>
      mapGeminiCandidate(candidate, index, input.budgetYen),
    );
    candidates = ryoRerankingEnabled
      ? mergeRyoModeCandidatePool(geminiCandidates, fallbackCandidates, ryoAnchorCandidates)
      : geminiCandidates.map(normalizeCandidateOfficialName);
    candidateResearch = {
      source: "gemini",
      status: "ready",
      reasonCode: geminiResearch.reasonCode,
      validCandidateCount: geminiCandidates.length,
      coreReevaluated: false,
      modelUsed: geminiResearch.modelUsed,
      usedFallbackModel: geminiResearch.usedFallbackModel,
      stages: geminiResearch.stages,
      detail: "Gemini候補調査を検証し、Core再評価後の結果を表示しています。",
    };
  } else {
    candidates = mergeRyoModeCandidatePool(fallbackCandidates, ryoAnchorCandidates);
    const reasonCode = geminiResearch?.reasonCode ?? "api_error";
    const status = geminiResearch?.status ?? "error";
    candidateResearch = {
      source: "fallback_catalog",
      status,
      reasonCode,
      validCandidateCount: 0,
      coreReevaluated: false,
      modelUsed: geminiResearch?.modelUsed ?? null,
      usedFallbackModel: geminiResearch?.usedFallbackModel ?? false,
      stages: geminiResearch?.stages ?? {
        grounding: { status: "not_checked", evidenceUrlCount: 0 },
        normalization: { status: "not_checked", repairAttempted: false, candidateCount: 0 },
      },
      detail: reasonCode === "missing_api_key"
        ? "Gemini候補調査は未設定のため、アプリ内の確認済み候補から推薦しています。"
        : `Gemini候補調査は利用できなかったため、アプリ内の確認済み候補から推薦しています。（理由: ${reasonCode}）`,
    };
  }

  let scoredCandidates = candidates.map((candidate) => {
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

  if (candidateResearch.source === "gemini") {
    const geminiScoredCandidates = scoredCandidates.filter((entry) => entry.candidate.researchSource === "gemini");
    const coreReevaluated = geminiScoredCandidates.length === candidateResearch.validCandidateCount && geminiScoredCandidates.every((entry) =>
      Number.isFinite(entry.balancedScore.total) &&
      Number.isFinite(entry.ryoScore.total) &&
      Boolean(entry.decision) &&
      entry.candidate.researchSource === "gemini",
    );
    if (coreReevaluated) {
      candidateResearch = { ...candidateResearch, coreReevaluated: true };
    } else {
      candidates = mergeRyoModeCandidatePool(fallbackCandidates, ryoAnchorCandidates);
      scoredCandidates = candidates.map((candidate) => {
        const balancedScore = calculateBalancedScore({ preferenceVector, candidate, preferredTags: input.preferenceTags });
        const ryoScore = calculateRyoScore({ preferenceVector, candidate });
        const decision = decideRecommendation({ balancedScore, ryoScore, budgetFit: candidate.budgetFit, risk: candidate.risk, informationCompleteness: candidate.informationCompleteness, readiness: candidate.readiness });
        return { candidate, balancedScore, ryoScore, decision };
      });
      candidateResearch = {
        ...candidateResearch,
        source: "fallback_catalog",
        status: "fallback",
        reasonCode: "core_reevaluation_failed",
        validCandidateCount: 0,
        coreReevaluated: false,
        detail: "Gemini候補をCoreで再評価できなかったため、アプリ内の確認済み候補から推薦しています。（理由: core_reevaluation_failed）",
      };
    }
  }

  const trustedPool = buildTrustedCandidatePool(candidates);
  const trustedIds = new Set(trustedPool.candidates.map((candidate) => candidate.id));
  candidates = trustedPool.candidates;
  scoredCandidates = buildScoredShortlist(
    scoredCandidates.filter((entry) => trustedIds.has(entry.candidate.id)),
    input.mode,
  );

  const rankedRyoCandidates = ryoRerankingEnabled
    ? rerankRyoModeCandidates(scoredCandidates, ryoPreferenceVector, input.mode, userSneakerContext)
    : [];
  const recommendationDisplaySet = ryoRerankingEnabled
    ? selectRecommendationDisplaySet(rankedRyoCandidates, userSneakerContext)
    : null;
  const best = ryoRerankingEnabled
    ? recommendationDisplaySet?.primary
    : scoredCandidates.sort((left, right) => {
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
        ...(providerEnv["GEMINI_API_KEY"] ? { apiKey: providerEnv["GEMINI_API_KEY"] } : {}),
        ...(dependencies.geminiFetcher ? { fetcher: dependencies.geminiFetcher } : {}),
      });
  const researchExplanation = addResearchContext(generatedExplanation, best.candidate);
  const explanation = isRyoRerankedCandidate(best) && best.contextReasons.length
    ? {
        ...researchExplanation,
        cautions: [...new Set([...best.contextReasons, ...researchExplanation.cautions])].slice(0, 6),
      }
    : researchExplanation;
  const geminiConfigured = Boolean(providerEnv["GEMINI_API_KEY"]);
  const selectedRyoEvaluation = buildRyoModeCandidateEvaluation(ryoPreferenceVector, best.candidate);
  const rerankingWeights = getRerankingWeights(ryoSummary);
  const selectedExplicitPreferencePenalty = "explicitPreferencePenalty" in best
    && typeof best.explicitPreferencePenalty === "number"
    ? best.explicitPreferencePenalty
    : 0;
  const selectedExplicitPreferenceReasons = "explicitPreferenceReasons" in best
    && Array.isArray(best.explicitPreferenceReasons)
    ? best.explicitPreferenceReasons.filter((reason): reason is string => typeof reason === "string")
    : [];
  const selectedRyoSignature = isRyoRerankedCandidate(best) ? best.ryoSignature : undefined;
  const selectedScoreBreakdownV2 = isRyoRerankedCandidate(best) ? best.scoreBreakdownV2 : undefined;
  const selectedStrengthBlend = isRyoRerankedCandidate(best) ? best.strengthBlend : undefined;
  const selectedContextReasons = isRyoRerankedCandidate(best) ? best.contextReasons : undefined;
  const explanationAudit = auditRecommendationExplanation({
    candidate: best.candidate,
    explanation,
    ...(selectedScoreBreakdownV2 ? { scoreBreakdown: selectedScoreBreakdownV2 } : {}),
    context: userSneakerContext,
    ...(input.budgetYen === undefined ? {} : { budgetYen: input.budgetYen }),
  });
  const safeExplanation = sanitizeExplanationForDisplay(explanation, explanationAudit.displayClaims);
  const factualVerification = best.candidate.factualVerification ?? createFactualVerification({
    model: best.candidate.researchSource === "fallback_catalog" || best.candidate.researchSource === "ryo_anchor"
      ? "partially_verified"
      : "unverified",
    colorway: "unverified",
    styleCode: "unverified",
    modelEvidence: [],
    colorwayEvidence: [],
    styleCodeEvidence: [],
    unsupportedClaims: [],
    contradictions: [],
  });
  const trustEvaluation = createRecommendationTrustEvaluation({
    factual: factualVerification,
    diagnosisFitScore: selectedScoreBreakdownV2?.userFitScore ?? best.balancedScore.total,
    ryoAuthenticity: {
      historyFit: selectedRyoEvaluation.score.breakdown.historyOrigin,
      materialStoryFit: selectedRyoEvaluation.score.breakdown.materialAging,
      outfitFit: Math.round((
        selectedRyoEvaluation.score.breakdown.silhouetteCutWearing
        + selectedRyoEvaluation.score.breakdown.pantsCompatibility
      ) / 2),
      culturalFit: selectedRyoEvaluation.score.breakdown.styleSportContext,
      adjacentDiscoveryFit: selectedScoreBreakdownV2?.explorationScore
        ?? selectedRyoEvaluation.score.breakdown.playfulness,
      collectionRoleFit: selectedRyoEvaluation.score.recommendationScore,
      wearableColorFit: selectedRyoEvaluation.score.breakdown.colorTaste,
      tooSafePenalty: selectedRyoSignature?.obviousnessPenalty ?? 0,
      hypeOnlyPenalty: selectedRyoEvaluation.score.penalties.some((penalty) => /人気|hype/iu.test(penalty))
        ? 15
        : 0,
      contextMismatchPenalty: selectedRyoSignature?.contextMismatchPenalty ?? 0,
      total: selectedRyoEvaluation.score.totalRyoScore,
      rubricVersion: "trusted-ryo-v1",
      reasons: selectedRyoEvaluation.score.matchedSignals,
      penalties: selectedRyoEvaluation.score.penalties,
      matchedGoldRules: selectedContextReasons ?? [],
    },
    explanationTrust: explanationAudit.evaluation,
  });
  const displayCandidateCount = recommendationDisplaySet
    ? [
        recommendationDisplaySet.primary,
        recommendationDisplaySet.practicalAlternative,
        recommendationDisplaySet.ryoAlternative,
      ].filter(Boolean).length
    : 1;
  const cautionCount = recommendationDisplaySet?.cautionCandidate ? 1 : 0;

  return {
    recommendationId: `core-v1:${best.candidate.id}`,
    preferenceVector,
    ...best,
    candidate: {
      ...best.candidate,
      factualVerification,
      trustEvaluation,
      ryoMetadata: {
        ...selectedRyoEvaluation.culture.metadata,
        ...(selectedRyoSignature ? {
          recommendationBucket: selectedRyoSignature.bucket,
          ryoSignature: selectedRyoSignature,
        } : {}),
      },
    },
    explanation: safeExplanation,
    explanationTrust: explanationAudit.evaluation,
    candidateFunnel: createTrustedCandidateFunnel(
      trustedPool.counts,
      scoredCandidates.length,
      displayCandidateCount,
      cautionCount,
    ),
    candidateResearch,
    ryoReranking: {
      applied: ryoRerankingEnabled,
      strength: ryoSummary.ryoInfluence,
      existingCoreWeight: ryoRerankingEnabled ? rerankingWeights.existingCoreWeight : 1,
      recommendationWeight: ryoRerankingEnabled ? rerankingWeights.recommendationWeight : 0,
      candidatePoolSize: scoredCandidates.length,
      selectedSource: best.candidate.researchSource ?? "fallback_catalog",
      selectedRecommendationScore: selectedRyoEvaluation.score.recommendationScore,
      selectedExplicitPreferencePenalty,
      selectedExplicitPreferenceReasons,
      ...(selectedRyoSignature ? {
        selectedBucket: selectedRyoSignature.bucket,
        selectedRyoSignature,
      } : {}),
      ...(selectedScoreBreakdownV2 ? { selectedScoreBreakdownV2 } : {}),
      ...(selectedStrengthBlend ? { strengthBlend: selectedStrengthBlend } : {}),
      ...(selectedContextReasons?.length ? { selectedContextReasons } : {}),
    },
    ...(recommendationDisplaySet ? {
      recommendationDisplaySet: {
        practicalAlternative: recommendationDisplaySet.practicalAlternative
          ? toDisplayCandidate(recommendationDisplaySet.practicalAlternative, "practical")
          : null,
        ryoAlternative: recommendationDisplaySet.ryoAlternative
          ? toDisplayCandidate(recommendationDisplaySet.ryoAlternative, "ryo")
          : null,
        cautionCandidate: recommendationDisplaySet.cautionCandidate
          ? toDisplayCandidate(recommendationDisplaySet.cautionCandidate, "caution")
          : null,
      },
    } : {}),
    readiness: {
      geminiResearch: createGeminiResearchReadiness(candidateResearch),
      geminiExplanation: createGeminiExplanationReadiness(explanation, geminiConfigured),
      rakuten: rakutenResult.readiness,
    },
    externalEvidence: {
      listings: rakutenResult.evidence,
      feedbackPatterns: [],
    },
  };
}

function sanitizeExplanationForDisplay(
  explanation: RecommendationExplanation,
  displayClaims: readonly { text: string }[],
): RecommendationExplanation {
  const allowed = new Set(displayClaims.map((claim) => claim.text));
  const safeReasons = explanation.reasons.filter((reason) => allowed.has(reason));
  const safeCautions = explanation.cautions.filter((caution) => allowed.has(caution));
  const fallbackReason = "診断回答とCoreのスコアを照合して、この候補を選びました。";
  const fallbackCaution = "価格・在庫・サイズ・真贋は販売元で確認してください。";
  return {
    ...explanation,
    summary: allowed.has(explanation.summary) ? explanation.summary : fallbackReason,
    reasons: safeReasons.length ? safeReasons : [fallbackReason],
    cautions: safeCautions.length ? safeCautions : [fallbackCaution],
  };
}

function toDisplayCandidate(
  entry: RyoRerankedCandidate,
  role: "practical" | "ryo" | "caution",
) {
  return {
    candidate: entry.candidate,
    finalRecommendationScore: entry.finalRecommendationScore,
    scoreBreakdownV2: entry.scoreBreakdownV2,
    reasons: buildRecommendationDisplayReasons(entry, role),
  };
}

function mapGeminiCandidate(
  candidate: GeminiSneakerResearchCandidate,
  index: number,
  budgetYen: number | undefined,
): CandidateProfile {
  const tags = inferTags(`${candidate.modelName} ${candidate.modelType}`);
  const vector = createVectorFromTags(tags, candidate.modelName);
  return {
    id: `gemini-${index + 1}-${slug(candidate.modelName)}`,
    name: candidate.modelName,
    source: "local",
    description: candidate.reason,
    tags: [...tags],
    vector: { ...vector },
    budgetFit: calculateLocalBudgetFit(budgetYen, vector.priceLevel),
    risk: "medium",
    informationCompleteness: 76,
    readiness: "ready_external",
    modelType: candidate.modelType,
    brand: candidate.brand,
    modelName: candidate.modelName,
    colorwayName: candidate.colorwayName,
    styleCode: candidate.styleCode,
    modelEvidenceUrls: [...candidate.modelEvidenceUrls],
    colorwayEvidenceUrls: [...candidate.colorwayEvidenceUrls],
    styleCodeEvidenceUrls: [...candidate.styleCodeEvidenceUrls],
    verificationStatus: candidate.verificationStatus,
    sourceQuality: candidate.sourceQuality,
    factualVerification: candidate.factualVerification,
    searchKeywords: [...candidate.searchKeywords],
    evidenceUrls: [...candidate.evidenceUrls],
    evidenceLinks: candidate.evidenceLinks.map((link) => ({ ...link })),
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
  const signature = candidate.ryoMetadata?.ryoSignature;
  return {
    ...explanation,
    reasons: [...new Set([
      candidate.researchReason,
      ...(signature ? buildRyoSignatureContextReasons(signature) : []),
      ...explanation.reasons,
    ].filter((item): item is string => Boolean(item)))].slice(0, 6),
    cautions: [...new Set([
      ...(candidate.researchCautions ?? []),
      ...(signature?.ownedReferenceMatches.length ? [`Owned reference overlap: ${signature.ownedReferenceMatches.join(" / ")}`] : []),
      ...explanation.cautions,
    ])].slice(0, 6),
  };
}

function buildRyoSignatureContextReasons(
  signature: NonNullable<NonNullable<CandidateProfile["ryoMetadata"]>["ryoSignature"]>,
): string[] {
  const details = [
    signature.ryoTwistBonus + signature.archiveContextBonus > 0 ? "復刻・アーカイブ文脈" : null,
    signature.materialStoryBonus > 0 ? "素材の育ち" : null,
    signature.adjacentDiscoveryBonus > 0 ? "定番から少し近い別軸" : null,
    signature.colorPersonalityBonus > 0 ? "履ける範囲の色の面白さ" : null,
    signature.contextMismatchPenalty > 0 ? "回答とのズレを減点" : null,
    signature.obviousnessPenalty > 0 ? "分かりやすすぎる定番を抑制" : null,
  ].filter((item): item is string => Boolean(item));
  const signedAdjustment = signature.totalAdjustment >= 0 ? `+${signature.totalAdjustment}` : String(signature.totalAdjustment);
  return [`Ryo Signature補正: ${formatRyoSignatureBucket(signature.bucket)} (${signedAdjustment})。${details.slice(0, 3).join(" / ") || "役割のみ"}。`];
}

function formatRyoSignatureBucket(
  bucket: NonNullable<NonNullable<CandidateProfile["ryoMetadata"]>["recommendationBucket"]>,
): string {
  switch (bucket) {
    case "anchor_classic": return "軸になる定番";
    case "ryo_signature": return "Ryoらしいズラし";
    case "adjacent_discovery": return "近い系統の発見";
    case "practical_buy": return "買いやすい候補";
    case "wildcard": return "攻め候補";
  }
}

function hasProductContext(input: RecommendRequestInput): boolean {
  return Boolean(input.sneakerName || input.brand || input.color || input.urlNameHint);
}

function isRyoRerankedCandidate(entry: CoreScoredCandidate | RyoRerankedCandidate): entry is RyoRerankedCandidate {
  return "ryoSignature" in entry;
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
