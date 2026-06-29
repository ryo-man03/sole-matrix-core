import { ryoModeSeed, type RyoModeSeedProfile, type RyoSeedSneaker } from "./ryoModeSeed";
import type {
  BalancedScore,
  CandidateProfile,
  ModeAwareRecommendation,
  ModeDecision,
  RecommendationMode,
  RyoScore,
} from "./types";

export type ModeRecommendationInput = {
  mode: RecommendationMode;
  candidate: CandidateProfile;
  balancedScore: BalancedScore;
  ryoScore: RyoScore;
  seedProfile?: RyoModeSeedProfile;
};

export function createModeAwareRecommendation(
  input: ModeRecommendationInput,
): ModeAwareRecommendation {
  const seedProfile = input.seedProfile ?? ryoModeSeed;
  const overlapWithOwned = findRelatedModels(
    input.candidate,
    seedProfile.ownedModels,
  );
  const relatedWishlistModels = findRelatedModels(
    input.candidate,
    seedProfile.wishlistModels,
  );
  const cautions = createCautions(input, overlapWithOwned);
  const balancedScore = calculateModeBalancedScore(input);
  const ryoScore = calculateModeRyoScore(
    input,
    overlapWithOwned,
    relatedWishlistModels,
  );
  const activeScore = input.mode === "ryo" ? ryoScore : balancedScore;

  return {
    mode: input.mode,
    decision: decideForMode(input.candidate, activeScore),
    balancedScore,
    ryoScore,
    modeReason: createModeReason(
      input.mode,
      overlapWithOwned,
      relatedWishlistModels,
    ),
    overlapWithOwned,
    relatedWishlistModels,
    cautions,
  };
}

function calculateModeBalancedScore(input: ModeRecommendationInput): number {
  const { candidate, balancedScore } = input;
  const riskPenalty = candidate.risk === "high" ? 16 : candidate.risk === "medium" ? 7 : 0;
  const readinessPenalty = candidate.readiness === "not_ready" ? 30 : candidate.readiness === "degraded" ? 10 : 0;
  const total =
    balancedScore.total * 0.55 +
    balancedScore.versatility * 0.15 +
    balancedScore.budgetFit * 0.18 +
    balancedScore.informationConfidence * 0.12 -
    riskPenalty -
    readinessPenalty;

  return roundScore(total);
}

function calculateModeRyoScore(
  input: ModeRecommendationInput,
  overlapWithOwned: readonly string[],
  relatedWishlistModels: readonly string[],
): number {
  const wishlistBonus = Math.min(10, relatedWishlistModels.length * 6);
  const overlapPenalty = Math.min(18, overlapWithOwned.length * 10);
  const contextBonus = input.candidate.tags.some((tag) =>
    ["heritage", "retro", "classic", "basketball", "low_tech"].includes(tag),
  )
    ? 5
    : 0;
  const total =
    input.ryoScore.total * 0.7 +
    input.ryoScore.culturalFit * 0.12 +
    input.ryoScore.enthusiastValue * 0.18 +
    wishlistBonus +
    contextBonus -
    overlapPenalty;

  return roundScore(total);
}

function decideForMode(
  candidate: CandidateProfile,
  activeScore: number,
): ModeDecision {
  if (
    candidate.readiness === "not_ready" ||
    candidate.informationCompleteness < 35 ||
    (candidate.risk === "high" && activeScore < 58)
  ) {
    return "skip";
  }

  if (candidate.budgetFit < 45 || activeScore < 58) {
    return "wait";
  }

  if (
    activeScore >= 82 &&
    candidate.budgetFit >= 70 &&
    candidate.risk === "low"
  ) {
    return "strong_buy";
  }

  return "buy";
}

function createModeReason(
  mode: RecommendationMode,
  overlapWithOwned: readonly string[],
  relatedWishlistModels: readonly string[],
): string {
  if (mode === "balanced") {
    return "価格、汎用性、情報の確かさ、サイズや購入リスクを均等に評価しました。";
  }

  if (overlapWithOwned.length > 0) {
    return `文化的背景を評価しつつ、所有済みの${overlapWithOwned.join("、")}との役割重複を差し引きました。`;
  }

  if (relatedWishlistModels.length > 0) {
    return `ブランドの歴史と文化的背景に加え、wishlistの${relatedWishlistModels.join("、")}とのつながりを評価しました。`;
  }

  return "文化的背景、ブランドの歴史、素材、既存コレクションに加わる新しい役割を評価しました。";
}

function createCautions(
  input: ModeRecommendationInput,
  overlapWithOwned: readonly string[],
): string[] {
  const cautions: string[] = [];

  if (overlapWithOwned.length > 0) {
    cautions.push(`所有済みの${overlapWithOwned.join("、")}と役割が重なる可能性があります。`);
  }
  if (input.candidate.budgetFit < 60) {
    cautions.push("予算との適合度が低いため、価格が落ち着くまで待つ選択も検討してください。");
  }
  if (input.candidate.risk !== "low") {
    cautions.push(
      input.candidate.risk === "high"
        ? "サイズ、プレ値、販売元を含む購入リスクが高い候補です。"
        : "サイズ感と販売条件を購入前に確認してください。",
    );
  }
  if (input.candidate.informationCompleteness < 60) {
    cautions.push("候補情報が十分ではないため、商品仕様を追加確認してください。");
  }

  return cautions;
}

function findRelatedModels(
  candidate: CandidateProfile,
  seedModels: readonly RyoSeedSneaker[],
): string[] {
  const candidateText = normalizeText(
    `${candidate.name} ${candidate.description} ${candidate.note ?? ""}`,
  );

  return seedModels
    .filter((seedModel) => {
      const brand = normalizeText(seedModel.brand);
      const model = normalizeText(seedModel.model);
      const family = normalizeText(seedModel.family);
      const aliases = seedModel.aliases
        .map(normalizeText)
        .filter((name) => name.length >= 3);
      const hasModelMatch =
        candidateText.includes(model) ||
        (candidateText.length >= 8 && model.includes(candidateText));
      const hasBrandAndFamilyMatch =
        candidateText.includes(brand) &&
        family.length >= 4 &&
        candidateText.includes(family);
      const hasSpecificAliasMatch = aliases.some(
        (alias) => candidateText.includes(alias),
      );

      return hasModelMatch || hasBrandAndFamilyMatch || hasSpecificAliasMatch;
    })
    .map((seedModel) => seedModel.model)
    .slice(0, 6);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]+/gu, " ")
    .trim();
}

function roundScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}
