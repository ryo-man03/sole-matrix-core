import type { UserSneakerContext } from "../diagnosis/sneakerContext";
import type { CoreScoredCandidate } from "./candidates";
import type { RyoModeCandidateEvaluation } from "./integration";
import type {
  RyoPreferenceSummary,
  RyoScoreBreakdownV2,
  RyoSignatureMetadata,
  RyoStrengthBlend,
} from "./types";

export const RYO_STRENGTH_BLENDS: Readonly<Record<RyoPreferenceSummary["ryoInfluence"], RyoStrengthBlend>> = {
  balanced: { userFit: 0.5, ryoIdentity: 0.15, practicalFit: 0.25, exploration: 0.1 },
  light: { userFit: 0.47, ryoIdentity: 0.2, practicalFit: 0.2, exploration: 0.13 },
  standard: { userFit: 0.38, ryoIdentity: 0.32, practicalFit: 0.16, exploration: 0.14 },
  strong: { userFit: 0.28, ryoIdentity: 0.38, practicalFit: 0.1, exploration: 0.24 },
  beginner: { userFit: 0.45, ryoIdentity: 0.12, practicalFit: 0.35, exploration: 0.08 },
};

export type ContextPenaltyResult = {
  penalty: number;
  reasons: string[];
  exactOwnedMatch: boolean;
};

export function buildRyoScoreBreakdownV2(input: {
  core: CoreScoredCandidate;
  evaluation: RyoModeCandidateEvaluation;
  signature: RyoSignatureMetadata;
  summary: RyoPreferenceSummary;
  context: UserSneakerContext;
  explicitPreferencePenalty: number;
}): { breakdown: RyoScoreBreakdownV2; contextReasons: string[]; blend: RyoStrengthBlend } {
  const { core, evaluation, signature, summary, context } = input;
  const score = evaluation.score;
  const affinities = evaluation.culture.affinities;
  const userFitScore = clamp(average(
    core.balancedScore.featureFit,
    score.breakdown.silhouetteCutWearing,
    score.breakdown.pantsCompatibility,
    score.breakdown.colorTaste,
    score.breakdown.styleSportContext,
    score.breakdown.materialAging,
  ));
  const ryoIdentityScore = clamp(average(
    score.breakdown.historyOrigin,
    score.breakdown.materialAging,
    score.breakdown.playfulness,
    affinities.parentModelAffinity,
    affinities.cultureAffinity,
    affinities.materialAgingAffinity,
  ) + purposeIdentityBonus(context));
  const practicalFitScore = clamp(average(
    core.balancedScore.budgetFit,
    core.balancedScore.versatility,
    score.breakdown.affordability,
    score.breakdown.pantsCompatibility,
  ) + purposePracticalBonus(context));
  const explorationScore = clamp(
    42
      + signature.ryoTwistBonus
      + signature.adjacentDiscoveryBonus
      + signature.colorPersonalityBonus
      + signature.archiveContextBonus
      + purposeExplorationBonus(context),
  );
  const contextual = calculateUserContextPenalty(core.candidate.name, evaluation, context);
  const contextPenalty = clampPenalty(
    contextual.penalty
      + signature.contextMismatchPenalty
      + signature.ownedDuplicatePenalty
      + input.explicitPreferencePenalty,
  );
  const blend = RYO_STRENGTH_BLENDS[summary.ryoInfluence];
  const componentScore =
    userFitScore * blend.userFit
    + ryoIdentityScore * blend.ryoIdentity
    + practicalFitScore * blend.practicalFit
    + explorationScore * blend.exploration;
  const existingCoreScore = summary.ryoInfluence === "balanced"
    ? core.balancedScore.total
    : core.ryoScore.total;
  const legacyBlend = legacyRerankingBlend(summary.ryoInfluence);
  const legacyIntegratedScore =
    existingCoreScore * legacyBlend.existingCore
    + evaluation.score.recommendationScore * legacyBlend.recommendation
    + signature.totalAdjustment
    - input.explicitPreferencePenalty;
  const finalRecommendationScore = clamp(
    legacyIntegratedScore * 0.6
      + componentScore * 0.4
      - contextual.penalty,
  );
  return {
    breakdown: {
      userFitScore: round(userFitScore),
      ryoIdentityScore: round(ryoIdentityScore),
      practicalFitScore: round(practicalFitScore),
      explorationScore: round(explorationScore),
      contextPenalty: round(contextPenalty),
      finalRecommendationScore: round(finalRecommendationScore),
    },
    contextReasons: contextual.reasons,
    blend,
  };
}

function legacyRerankingBlend(
  influence: RyoPreferenceSummary["ryoInfluence"],
): { existingCore: number; recommendation: number } {
  switch (influence) {
    case "light": return { existingCore: 0.65, recommendation: 0.35 };
    case "standard": return { existingCore: 0.4, recommendation: 0.6 };
    case "strong": return { existingCore: 0.3, recommendation: 0.7 };
    case "beginner": return { existingCore: 0.45, recommendation: 0.55 };
    default: return { existingCore: 0.45, recommendation: 0.55 };
  }
}

export function calculateUserContextPenalty(
  candidateName: string,
  evaluation: RyoModeCandidateEvaluation,
  context: UserSneakerContext,
): ContextPenaltyResult {
  const candidate = comparable(candidateName);
  const family = modelFamily(candidate);
  const reasons: string[] = [];
  let penalty = 0;
  let exactOwnedMatch = false;
  for (const owned of context.ownedModels) {
    const normalized = comparable(owned);
    if (!normalized) continue;
    if (candidate === normalized || candidate.includes(normalized) || normalized.includes(candidate)) {
      exactOwnedMatch = true;
      penalty = Math.max(penalty, context.purchasePurpose === "second_pair" ? 34 : 26);
      reasons.push(`所有モデルと重複: ${owned}`);
    } else if (modelFamily(normalized) === family) {
      penalty = Math.max(penalty, context.purchasePurpose === "second_pair" ? 16 : 10);
      reasons.push(`所有モデルと近い系統: ${owned}`);
    }
  }
  for (const disliked of context.dislikedModels) {
    const normalized = comparable(disliked);
    if (normalized && (candidate.includes(normalized) || normalized.includes(candidate))) {
      penalty += 50;
      reasons.push(`避けたいモデルに一致: ${disliked}`);
    }
  }
  for (const signal of context.dislikedSignals) {
    const matched = dislikedSignalMatches(signal, evaluation);
    if (!matched) continue;
    penalty += matched.penalty;
    reasons.push(matched.reason);
  }
  return { penalty: clampPenalty(penalty), reasons: [...new Set(reasons)], exactOwnedMatch };
}

function dislikedSignalMatches(
  signal: string,
  evaluation: RyoModeCandidateEvaluation,
): { penalty: number; reason: string } | null {
  const normalized = signal.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/\s+/gu, "");
  const traits = evaluation.features.traits;
  if ((normalized.includes("流行") || normalized.includes("人気")) && (traits.trendOnly || traits.tooCommon)) {
    return { penalty: 22, reason: "避けたい傾向「流行りすぎ」に該当" };
  }
  if ((normalized.includes("真っ白") || normalized === "白") && traits.whiteWhite) {
    return { penalty: 32, reason: "避けたい傾向「真っ白」に該当" };
  }
  if ((normalized.includes("大きいn") || normalized.includes("nロゴ")) && traits.largeNLogo) {
    return { penalty: 26, reason: "避けたい傾向「大きいN」に該当" };
  }
  if ((normalized.includes("厚底") || normalized.includes("ボリューム")) && evaluation.features.traits.overlyFuturistic) {
    return { penalty: 24, reason: "避けたいボリューム傾向に該当" };
  }
  if (normalized.includes("ハイテク") && traits.tooTechnical) {
    return { penalty: 36, reason: "避けたい傾向「ハイテク」に該当" };
  }
  if (normalized.includes("ローカット") && traits.lowCut) {
    return { penalty: 30, reason: "避けたい傾向「ローカット」に該当" };
  }
  if (normalized.includes("ハイカット") && traits.highCut) {
    return { penalty: 30, reason: "避けたい傾向「ハイカット」に該当" };
  }
  return null;
}

function purposeIdentityBonus(context: UserSneakerContext): number {
  return context.purchasePurpose === "archive_collection" ? 12 : context.purchasePurpose === "second_pair" ? 4 : 0;
}

function purposePracticalBonus(context: UserSneakerContext): number {
  return context.purchasePurpose === "first_pair" ? 12 : context.purchasePurpose === "daily_rotation" ? 7 : 0;
}

function purposeExplorationBonus(context: UserSneakerContext): number {
  if (context.purchasePurpose === "second_pair") return 14;
  if (context.purchasePurpose === "archive_collection") return 12;
  if (context.purchasePurpose === "first_pair") return -12;
  return -2;
}

function comparable(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/gu, " ").trim();
}

function modelFamily(value: string): string {
  return value
    .replace(/\b(?:black|white|navy|olive|red|orange|cream|gum|grey|gray|brown|burgundy)\b/gu, "")
    .replace(/\b(?:high|hi|mid|low|ox|vtg|vintage|j|made in japan|made in usa|made in uk)\b/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function average(...values: number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function clampPenalty(value: number): number {
  return Math.max(0, Math.min(80, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
