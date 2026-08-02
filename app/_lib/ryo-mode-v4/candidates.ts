import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { SneakerVector } from "../../../src/domain/sneaker/sneakerVector";
import { matchesCanonicalContextName } from "../../../src/domain/identity/canonicalSneaker";
import { calculateLocalBudgetFit } from "../core-v1/repository";
import type { BalancedScore, CandidateProfile, Decision, RyoScore } from "../core-v1/types";
import {
  normalizeUserSneakerContext,
  type UserSneakerContext,
} from "../diagnosis/sneakerContext";
import { buildRyoModeCandidateEvaluation } from "./integration";
import type { RyoModeCandidateEvaluation } from "./integration";
import { normalizeCandidateOfficialName, normalizeOfficialSneakerName } from "./names";
export { normalizeCandidateOfficialName, normalizeOfficialSneakerName } from "./names";
import { applyRyoSignatureLayer } from "./signature-layer";
import { buildRyoScoreBreakdownV2 } from "./score-breakdown";
import {
  applyRyoRoleSeparation,
  buildRyoRoleExplanation as createRyoRoleExplanation,
  evaluateRecommendationSetCoherence,
  evaluateRyoRoleEligibility,
  getRyoModelAffinityProfile,
  modelFamily,
  ryoEmptyStateReason,
} from "./role-policy";
import type {
  RecommendationSetCoherence,
  RyoModelAffinityProfile,
  RyoPreferenceSummary,
  RyoPreferenceVector,
  RyoRoleEligibility,
  RyoRoleExplanation,
  RyoScoreBreakdownV2,
  RyoSignatureMetadata,
  RyoStrengthBlend,
} from "./types";
import { summarizeRyoPreferenceVector } from "./vector";

type AnchorSignal =
  | "wide_pants" | "straight_pants" | "denim" | "work_pants" | "slim_pants"
  | "basketball" | "skate" | "running" | "leather_sinking" | "suede_fading_nap" | "canvas_fading"
  | "black_white" | "amekaji" | "normcore" | "street" | "clean_casual"
  | "high" | "low" | "mid" | "simple" | "loose_fit" | "volume_look"
  | "under_15000" | "premium" | "avoid_tech" | "high_tech";

type AnchorDefinition = {
  id: string;
  name: string;
  modelType: string;
  description: string;
  tags: SneakerTag[];
  signals: AnchorSignal[];
  priceYen: number;
};

export type CoreScoredCandidate = {
  candidate: CandidateProfile;
  balancedScore: BalancedScore;
  ryoScore: RyoScore;
  decision: Decision;
};

export type RyoRerankedCandidate = CoreScoredCandidate & {
  ryoEvaluation: RyoModeCandidateEvaluation;
  ryoSignature: RyoSignatureMetadata;
  finalRecommendationScore: number;
  explicitPreferencePenalty: number;
  explicitPreferenceReasons: string[];
  scoreBreakdownV2: RyoScoreBreakdownV2;
  strengthBlend: RyoStrengthBlend;
  contextReasons: string[];
  ryoEligibility: RyoRoleEligibility;
};

export type RecommendationDisplaySet = {
  primary: RyoRerankedCandidate;
  practicalAlternative: RyoRerankedCandidate | null;
  ryoAlternative: RyoRerankedCandidate | null;
  cautionCandidate: RyoRerankedCandidate | null;
  ryoEmptyReason: string | null;
  coherence: RecommendationSetCoherence;
};

export type ExplicitPreferenceGuard = {
  penalty: number;
  reasons: string[];
};

const anchorCatalog: readonly AnchorDefinition[] = [
  anchor("nike-af1-low-white-white", "Nike Air Force 1 Low \"White/White\"", "汎用白レザー・バスケットボール", "歴史ある白レザー定番です。アメカジの主軸ではなく、ストリート・ノームコア・初心者向けの条件付き候補として扱います。", ["basketball", "classic", "street", "durable", "heritage"], ["basketball", "black_white", "street", "wide_pants", "low", "high_tech"], 18_000),
  anchor("converse-jack-purcell-leather-black", "Converse Jack Purcell Leather Black", "レザー・テニス", "黒レザーを締めて履く形とワークパンツの相性を見込めます。", ["classic", "low_tech", "minimal", "heritage"], ["work_pants", "leather_sinking", "black_white"], 16_500),
  anchor("converse-one-star-j-vtg-black", "Converse One Star J VTG Black", "スエード・スケート", "毛並みの変化と低いシルエットを楽しめる日本製の候補です。", ["classic", "low_tech", "street", "heritage", "premium"], ["wide_pants", "suede_fading_nap", "black_white"], 25_000),
  anchor("puma-suede-black-white", "PUMA Suede Black/White", "クラシック・スエード", "黒白配色とスエードの変化を、ワークパンツにも合わせやすい候補です。", ["classic", "low_tech", "street", "heritage"], ["wide_pants", "work_pants", "suede_fading_nap", "black_white"], 13_000),
  anchor("puma-clyde-black-white", "PUMA Clyde Black/White", "クラシック・バスケットボール", "バスケットボール由来と細すぎないクラシックな形を両立します。", ["basketball", "classic", "low_tech", "street", "heritage"], ["wide_pants", "work_pants", "basketball", "low", "suede_fading_nap", "black_white"], 15_000),
  anchor("adidas-superstar-vintage", "adidas Superstar Vintage", "レザー・バスケットボール", "シェルトゥとレザーの履きジワを楽しめるバスケットボール由来の定番です。", ["basketball", "classic", "low_tech", "street", "heritage"], ["wide_pants", "basketball", "leather_sinking", "black_white"], 22_000),
  anchor("converse-pro-leather", "Converse Pro Leather", "レザー・バスケットボール", "レザーの沈みとバスケットボール由来の形が回答条件に合います。", ["basketball", "classic", "low_tech", "heritage"], ["denim", "high", "basketball", "leather_sinking", "black_white"], 18_000),
  anchor("nike-aj1-low-black-white", "Nike Air Jordan 1 Low Black/White", "レザー・バスケットボール", "ローカットでレザーの履きジワを楽しめるバスケットボール由来の候補です。", ["basketball", "classic", "street", "retro", "heritage"], ["basketball", "low", "leather_sinking", "black_white"], 20_000),
  anchor("nike-aj1-high-black-white", "Nike Air Jordan 1 High Black/White", "ハイカット・バスケットボール", "太めのパンツと締めたハイカットの輪郭を作りやすい候補です。", ["basketball", "street", "retro", "heritage"], ["wide_pants", "denim", "high", "volume_look", "basketball", "leather_sinking", "black_white"], 25_000),
  anchor("nike-terminator-low-black-white", "Nike Terminator Low Black/White", "レザー・バスケットボール", "大学バスケットボール由来のレトロなローカットです。", ["basketball", "classic", "street", "retro", "heritage"], ["basketball", "low", "leather_sinking", "black_white"], 18_000),
  anchor("nike-terminator-high-black-white", "Nike Terminator High Black/White", "ハイカット・バスケットボール", "ワークパンツと相性の良いレトロなバスケットボール由来の形です。", ["basketball", "street", "retro", "heritage"], ["work_pants", "denim", "high", "volume_look", "basketball", "leather_sinking", "black_white"], 20_000),
  anchor("converse-all-star-hi-black", "Converse All Star Hi Black", "キャンバス・ハイカット", "太めのパンツに締めたハイカットの輪郭を作れる定番です。", ["classic", "canvas", "low_tech", "heritage"], ["wide_pants", "black_white"], 8_000),
  anchor("vans-half-cab-black", "Vans Half Cab Black", "スエード・スケート", "ワークパンツとスエードの経年変化を楽しめるボリュームがあります。", ["classic", "street", "low_tech", "heritage"], ["wide_pants", "work_pants", "suede_fading_nap", "black_white"], 15_000),
  anchor("adidas-bern-gore-tex", "adidas Bern GORE-TEX", "テラス・機能素材", "ワークパンツに合わせやすいクラシックな形と機能素材を持ちます。", ["classic", "low_tech", "heritage", "outdoor"], ["work_pants"], 18_000),
  anchor("new-balance-993", "New Balance 993", "ヘリテージ・ランニング", "太め・ワーク系のパンツに合わせやすいランニング由来の候補です。", ["running", "comfortable", "premium", "heritage"], ["wide_pants", "work_pants"], 38_000),
  anchor("reebok-classic-leather", "Reebok Classic Leather", "レザー・ランニング", "ワークパンツに合わせやすい控えめなレザーモデルです。", ["running", "classic", "low_tech", "heritage"], ["work_pants", "leather_sinking", "normcore", "straight_pants", "clean_casual", "avoid_tech"], 14_000),
  anchor("nike-blazer-mid-77", "Nike Blazer Mid '77", "レザー・バスケットボール", "ワークパンツと締めたシルエットに合う古いバスケットボール由来の形です。", ["basketball", "classic", "street", "heritage"], ["work_pants", "denim", "mid", "high", "volume_look", "basketball", "leather_sinking"], 15_000),
  anchor("converse-weapon", "Converse Weapon", "レザー・バスケットボール", "バスケットボールの背景とレザーの履き込みを強く出せる候補です。", ["basketball", "street", "retro", "heritage"], ["denim", "high", "volume_look", "basketball", "leather_sinking"], 18_000),
  anchor("vans-authentic-black-white", "Vans Authentic Black/White", "キャンバス・スケート", "黒白キャンバスの退色を楽しめるローテク候補です。", ["classic", "canvas", "low_tech", "street"], ["black_white", "amekaji", "denim", "skate", "low", "simple", "loose_fit", "under_15000", "canvas_fading", "normcore", "straight_pants", "avoid_tech"], 8_000),
  anchor("last-resort-vm001-black-white", "Last Resort AB VM001 Black/White", "スエード・スケート", "スエードの毛並み変化とワーク寄りの服装に合うスケート由来の形です。", ["classic", "low_tech", "street"], ["suede_fading_nap", "black_white"], 15_000),
  anchor("converse-one-star-j", "Converse One Star J", "スエード・アーカイブ", "一つ星の簡潔さとスエードの育ちを評価する日本製の親モデルです。", ["classic", "low_tech", "street", "heritage"], ["amekaji", "denim", "suede_fading_nap"], 24_000),
  anchor("converse-one-star-leather", "Converse One Star Leather", "レザー・アーカイブ", "デニムへ馴染む一つ星レザーの育て枠です。", ["classic", "low_tech", "heritage"], ["amekaji", "denim", "leather_sinking"], 22_000),
  anchor("converse-one-star-suede", "Converse One Star Suede", "スエード・アーカイブ", "スエードの退色と毛並みを楽しむ一つ星です。", ["classic", "low_tech", "street", "heritage"], ["amekaji", "denim", "work_pants", "suede_fading_nap"], 18_000),
  anchor("converse-all-star-j-hi", "Converse All Star J Hi", "キャンバス・日本製", "通常現行ではなく、日本製Hiのキャンバスを履き込む定番です。", ["classic", "canvas", "low_tech", "heritage"], ["amekaji", "denim", "high", "volume_look", "canvas_fading", "avoid_tech"], 14_000),
  anchor("converse-all-star-j-vtg-hi", "Converse All Star J VTG Hi", "キャンバス・復刻", "復刻仕様とHiカット、キャンバス退色を評価する上位定番です。", ["classic", "canvas", "low_tech", "heritage", "premium"], ["amekaji", "denim", "high", "volume_look", "canvas_fading", "premium"], 22_000),
  anchor("converse-timeline-59-hi", "Converse All Star J VTG 59 Hi \"TimeLine\" Black", "キャンバス・TimeLine", "TimeLineの復刻背景と履き込み価値を評価します。", ["classic", "canvas", "low_tech", "heritage", "premium"], ["amekaji", "denim", "high", "volume_look", "canvas_fading", "premium"], 26_000),
  anchor("converse-addict-hi", "Converse Addict Chuck Taylor Hi", "キャンバス・上位仕様", "クラシックな見た目に現代的な履き心地を入れた上位仕様です。", ["classic", "canvas", "heritage", "premium"], ["amekaji", "denim", "high", "volume_look", "canvas_fading", "premium"], 30_000),
  anchor("converse-jack-purcell-cl", "Converse Jack Purcell CL", "キャンバス・クリーン", "CLは買いやすい現行本命として扱います。", ["classic", "canvas", "minimal", "low_tech"], ["normcore", "straight_pants", "clean_casual", "canvas_fading"], 8_000),
  anchor("converse-jack-purcell-1935", "Converse Jack Purcell 1935", "キャンバス・上位思想", "1935はスマイルとヒゲの思想を深めた上位枠です。", ["classic", "canvas", "minimal", "heritage", "premium"], ["normcore", "straight_pants", "clean_casual", "premium"], 18_000),
  anchor("nike-cortez", "Nike Cortez", "70s薄型ランナー", "古いNikeスポーツの薄い形をデニムやチノへ合わせます。", ["running", "classic", "low_tech", "heritage"], ["amekaji", "clean_casual", "slim_pants", "straight_pants", "avoid_tech", "running"], 13_000),
  anchor("nike-cortez-leather", "Nike Cortez Leather", "70sレザーランナー", "薄い形と革のシワを楽しむレトロランナーです。", ["running", "classic", "low_tech", "heritage"], ["clean_casual", "slim_pants", "leather_sinking", "running"], 15_000),
  anchor("nike-ld-1000", "Nike LD-1000", "70s薄型ランナー", "70sランニングの薄い形とスエードの表情を評価します。", ["running", "classic", "low_tech", "heritage"], ["amekaji", "denim", "avoid_tech", "running"], 16_000),
  anchor("nike-astro-grabber", "Nike Astro Grabber", "70s薄型ランナー", "古い競技靴の薄い形をプレミアム枠で評価します。", ["running", "classic", "heritage", "premium"], ["premium", "running", "amekaji"], 25_000),
  anchor("adidas-sl-72", "adidas SL 72", "70sナイロン・スエードランナー", "ナイロンとスエードの退色が古着へ馴染む薄型ランナーです。", ["running", "classic", "low_tech", "heritage"], ["clean_casual", "normcore", "slim_pants", "straight_pants", "avoid_tech", "running"], 14_000),
  anchor("adidas-country-og", "adidas Country OG", "アーカイブ・ランナー", "アーカイブ感と薄い形をクリーンな服装へ合わせます。", ["running", "classic", "low_tech", "heritage"], ["clean_casual", "slim_pants", "amekaji", "avoid_tech"], 16_000),
  anchor("adidas-japan", "adidas Japan", "アーカイブ・トレーニング", "薄い革の形とアーカイブ背景を評価します。", ["classic", "low_tech", "heritage"], ["clean_casual", "slim_pants", "leather_sinking"], 18_000),
  anchor("adidas-tobacco", "adidas Tobacco", "テラス・アーカイブ", "Samba流行から一歩ずらすスエードのアーカイブ枠です。", ["classic", "low_tech", "heritage"], ["amekaji", "straight_pants", "denim", "suede_fading_nap"], 18_000),
  anchor("adidas-london", "adidas London", "City Series", "UK casualとCity Seriesの文脈を評価します。", ["classic", "low_tech", "heritage"], ["clean_casual", "straight_pants", "suede_fading_nap"], 20_000),
  anchor("adidas-hamburg", "adidas Hamburg", "City Series", "ガムソールとスエードのCity Seriesです。", ["classic", "low_tech", "heritage"], ["clean_casual", "straight_pants", "suede_fading_nap"], 20_000),
  anchor("adidas-spezial", "adidas Handball Spezial", "テラス・アーカイブ", "terraceとスエードの背景を評価します。", ["classic", "low_tech", "heritage"], ["clean_casual", "straight_pants", "suede_fading_nap"], 18_000),
  anchor("vans-era-95", "Vans Era 95", "キャンバス・スケート", "skate・punk・DIYとキャンバス退色を評価します。", ["classic", "canvas", "low_tech", "street"], ["amekaji", "denim", "work_pants", "skate", "low", "simple", "loose_fit", "under_15000", "canvas_fading"], 12_000),
  anchor("new-balance-990v3", "New Balance 990v3", "プレミアム・レトロランナー", "スエードとメッシュの質感を持つプレミアム枠です。", ["running", "comfortable", "premium", "heritage"], ["premium", "running", "wide_pants"], 38_000),
  anchor("new-balance-990v4", "New Balance 990v4", "プレミアム・レトロランナー", "現代感を抑えたプレミアムNBの基準モデルです。", ["running", "comfortable", "premium", "heritage"], ["premium", "running", "wide_pants"], 40_000),
  anchor("new-balance-991", "New Balance 991", "プレミアム・レトロランナー", "Made in UK系の上質感を評価する高価格枠です。", ["running", "comfortable", "premium", "heritage"], ["premium", "running", "wide_pants"], 42_000),
  anchor("new-balance-998", "New Balance 998", "プレミアム・レトロランナー", "スエードと90sランニングの質感を評価します。", ["running", "comfortable", "premium", "heritage"], ["premium", "running", "wide_pants"], 38_000),
  anchor("new-balance-1500", "New Balance 1500", "プレミアム・レトロランナー", "Made in UK系の細身なプレミアムランナーです。", ["running", "comfortable", "premium", "heritage"], ["premium", "running", "slim_pants"], 36_000),
  anchor("new-balance-2002r", "New Balance 2002R", "現代レトロ・コンフォート", "快適性を優先する現代レトロの条件付き候補です。", ["running", "comfortable", "retro", "street"], ["street", "wide_pants", "high_tech", "running"], 18_000),
  anchor("new-balance-2010", "New Balance 2010", "現代レトロ・コンフォート", "現代的なボリュームを許容する別枠です。", ["running", "comfortable", "retro", "street"], ["street", "wide_pants", "high_tech", "running"], 20_000),
  anchor("new-balance-1906", "New Balance 1906", "ハイテクランニング", "Ryo classicとは別のハイテク許容枠です。", ["running", "comfortable", "street"], ["street", "wide_pants", "high_tech", "running"], 19_000),
  anchor("nike-air-max-95", "Nike Air Max 95", "ハイテクランニング", "streetとハイテク許容が明示された場合だけ残す別軸です。", ["running", "comfortable", "street"], ["street", "wide_pants", "high_tech", "running"], 20_000),
  anchor("reebok-classic-nylon", "Reebok Classic Nylon", "80sナイロンランナー", "買いやすさと日常の合わせやすさを重視する枠です。", ["running", "classic", "low_tech", "heritage"], ["normcore", "straight_pants", "avoid_tech", "running"], 9_000),
  anchor("reebok-club-c", "Reebok Club C", "クラシックテニス", "retro runningではなくclassic tennisとして扱います。", ["classic", "minimal", "low_tech", "heritage"], ["normcore", "clean_casual", "straight_pants", "leather_sinking"], 12_000),
  anchor("pro-keds-royal-plus", "PRO-Keds Royal Plus", "オールドバスケットボール", "NYと初期hip hopの背景を持つバスケット由来モデルです。", ["basketball", "classic", "low_tech", "heritage"], ["amekaji", "work_pants", "basketball"], 15_000),
];

export function createRyoModeCandidateAnchors(vector: RyoPreferenceVector, budgetYen?: number): CandidateProfile[] {
  const activeSignals = getActiveSignals(vector);
  if (activeSignals.size === 0) return [];
  return anchorCatalog
    .filter((definition) => definition.signals.some((signal) => activeSignals.has(signal)))
    .sort((left, right) => countMatches(right.signals, activeSignals) - countMatches(left.signals, activeSignals))
    .map((definition) => createAnchorCandidate(definition, budgetYen));
}

export function mergeRyoModeCandidatePool(...candidateGroups: readonly CandidateProfile[][]): CandidateProfile[] {
  const merged = new Map<string, CandidateProfile>();
  for (const rawCandidate of candidateGroups.flat()) {
    const candidate = normalizeCandidateOfficialName(rawCandidate);
    const key = comparableName(candidate.name);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, candidate);
      continue;
    }
    merged.set(key, {
      ...existing,
      tags: [...new Set([...existing.tags, ...candidate.tags])].slice(0, 6),
      ...(existing.priceYen === undefined && candidate.priceYen !== undefined ? { priceYen: candidate.priceYen } : {}),
    });
  }
  return [...merged.values()];
}

export function rerankRyoModeCandidates(
  candidates: readonly CoreScoredCandidate[],
  vector: RyoPreferenceVector,
  mode: "ryo" | "balanced" | undefined,
  userContext?: UserSneakerContext,
): RyoRerankedCandidate[] {
  const summary = summarizeRyoPreferenceVector(vector);
  const context = normalizeUserSneakerContext(userContext);
  let ranked: RyoRerankedCandidate[] = candidates.map((entry): RyoRerankedCandidate => {
    const ryoEvaluation = buildRyoModeCandidateEvaluation(vector, entry.candidate);
    const guard = evaluateExplicitPreferenceGuards(vector, ryoEvaluation);
    const ryoSignature = applyRyoSignatureLayer({
      candidate: entry.candidate,
      vector,
      evaluation: ryoEvaluation,
    });
    const v2 = buildRyoScoreBreakdownV2({
      core: entry,
      evaluation: ryoEvaluation,
      signature: ryoSignature,
      summary,
      context,
      explicitPreferencePenalty: guard.penalty,
    });
    const affinity = getRyoModelAffinityProfile(entry.candidate);
    const contextAdjustment = displayRoleContextAdjustment(affinity, vector, context);
    const finalRecommendationScore = round(Math.max(
      0,
      Math.min(100, v2.breakdown.finalRecommendationScore + contextAdjustment),
    ));
    const adjustedBreakdown = {
      ...v2.breakdown,
      finalRecommendationScore,
    };
    const ryoEligibility = evaluateRyoRoleEligibility({
      candidate: entry.candidate,
      vector,
      userContext: context,
      preferenceSummary: summary,
      scoreBreakdown: adjustedBreakdown,
      explicitPreferencePenalty: guard.penalty,
    });
    return {
      ...entry,
      candidate: {
        ...entry.candidate,
        ryoMetadata: {
          ...ryoEvaluation.culture.metadata,
          recommendationBucket: ryoSignature.bucket,
          ryoSignature,
          affinityTier: affinity.affinityTier,
          category: affinity.category,
          affinityReason: affinity.reasonForTier,
        },
      },
      ryoEvaluation,
      ryoSignature,
      explicitPreferencePenalty: guard.penalty,
      explicitPreferenceReasons: guard.reasons,
      finalRecommendationScore,
      scoreBreakdownV2: adjustedBreakdown,
      strengthBlend: v2.blend,
      contextReasons: v2.contextReasons,
      ryoEligibility,
    };
  });

  ranked = enforceHighCutWinnerGuard(vector, ranked);
  return ranked.sort((left, right) =>
    Number(isDisplayHardBlocked(left)) - Number(isDisplayHardBlocked(right))
    || right.finalRecommendationScore - left.finalRecommendationScore
    || right.ryoEvaluation.score.recommendationScore - left.ryoEvaluation.score.recommendationScore
    || (mode === "ryo" ? right.ryoScore.total - left.ryoScore.total : right.balancedScore.total - left.balancedScore.total),
  );
}

export function selectRecommendationDisplaySet(
  ranked: readonly RyoRerankedCandidate[],
  userContext?: UserSneakerContext,
): RecommendationDisplaySet | null {
  const primary = ranked[0];
  if (!primary) return null;

  const context = normalizeUserSneakerContext(userContext);
  const remaining = ranked.filter((entry) =>
    entry.candidate.id !== primary.candidate.id &&
    !isExactContextMatch(entry.candidate.name, context.ownedModels) &&
    !isExactContextMatch(entry.candidate.name, context.dislikedModels)
  );
  const practicalFloor = Math.max(35, primary.finalRecommendationScore - 18);
  const practicalPool = remaining.filter((entry) =>
    modelFamily(entry.candidate.name) !== modelFamily(primary.candidate.name) &&
    entry.candidate.budgetFit >= 45 &&
    entry.finalRecommendationScore >= practicalFloor &&
    entry.scoreBreakdownV2.practicalFitScore >= 38 &&
    entry.scoreBreakdownV2.contextPenalty <= 25 &&
    entry.explicitPreferencePenalty <= 16
  );
  const practicalAlternative = chooseDiverseCandidate(practicalPool, [primary], "practical");

  const ryoPool = remaining.filter((entry) =>
    entry.candidate.id !== practicalAlternative?.candidate.id &&
    entry.ryoEligibility.eligible
  ).map((entry) => ({
    ...entry,
    ryoEligibility: applyRyoRoleSeparation(
      entry.ryoEligibility,
      entry.candidate,
      primary.candidate,
      practicalAlternative?.candidate ?? null,
    ),
  })).filter((entry) => entry.ryoEligibility.eligible);
  let ryoAlternative = chooseRyoCandidate(ryoPool);

  let selectedIds = new Set([
    primary.candidate.id,
    practicalAlternative?.candidate.id,
    ryoAlternative?.candidate.id,
  ].filter((id): id is string => Boolean(id)));
  let cautionCandidate = ranked.find((entry) =>
    !selectedIds.has(entry.candidate.id) &&
    (entry.scoreBreakdownV2.contextPenalty > 25 || entry.explicitPreferencePenalty > 16)
  ) ?? null;

  let coherence = evaluateRecommendationSetCoherence({
    primary,
    practicalAlternative,
    ryoAlternative,
    userContext: context,
  });
  if (ryoAlternative && !coherence.coherent && coherence.violations.some((violation) =>
    violation.candidateId === ryoAlternative?.candidate.id
  )) {
    ryoAlternative = null;
    selectedIds = new Set([
      primary.candidate.id,
      practicalAlternative?.candidate.id,
    ].filter((id): id is string => Boolean(id)));
    cautionCandidate = ranked.find((entry) =>
      !selectedIds.has(entry.candidate.id) &&
      (entry.scoreBreakdownV2.contextPenalty > 25
        || entry.explicitPreferencePenalty > 16
        || entry.ryoEligibility.hardFailures.length > 0)
    ) ?? null;
    coherence = evaluateRecommendationSetCoherence({
      primary,
      practicalAlternative,
      ryoAlternative,
      userContext: context,
    });
  }

  return {
    primary,
    practicalAlternative,
    ryoAlternative,
    cautionCandidate,
    ryoEmptyReason: ryoAlternative ? null : ryoEmptyStateReason(remaining.map((entry) => entry.ryoEligibility)),
    coherence,
  };
}

function displayRoleContextAdjustment(
  affinity: RyoModelAffinityProfile,
  vector: RyoPreferenceVector,
  context: UserSneakerContext,
): number {
  let adjustment = 0;
  if (affinity.category === "technical_running" && vector.techTolerance.airMaxNbOk > 0) {
    adjustment += 12;
  }
  if (affinity.category === "retro_running" && vector.techTolerance.avoidTech > 0) {
    adjustment += 4;
  }
  if (context.purchasePurpose === "first_pair") {
    if (affinity.affinityTier === "practical") adjustment += 8;
    if (affinity.affinityTier === "adjacent") adjustment -= 4;
    if (affinity.budgetBand === "premium") adjustment -= 10;
  }
  if (context.purchasePurpose === "second_pair") {
    if (affinity.affinityTier === "core") adjustment += 6;
    if (affinity.affinityTier === "adjacent") adjustment -= 2;
  }
  if (context.purchasePurpose === "archive_collection" && affinity.historicalContext.length > 0) {
    adjustment += affinity.affinityTier === "core" ? 6 : 2;
  }
  return adjustment;
}

function isDisplayHardBlocked(entry: RyoRerankedCandidate): boolean {
  const blockingCodes = new Set(["budget_violation", "owned_duplicate", "disliked_model", "hard_constraint"]);
  return entry.ryoEligibility.hardFailures.some((reason) => blockingCodes.has(reason.code));
}

export function buildRecommendationDisplayReasons(
  entry: RyoRerankedCandidate,
  role: "practical" | "ryo" | "caution",
): string[] {
  if (role === "caution") {
    return unique([
      ...entry.contextReasons,
      ...entry.explicitPreferenceReasons,
    ]).slice(0, 3);
  }

  const reasons = role === "practical"
    ? [
        entry.scoreBreakdownV2.userFitScore >= 50 ? "11問の回答との相性" : null,
        entry.scoreBreakdownV2.practicalFitScore >= 50 ? "予算と日常での選びやすさ" : null,
        entry.candidate.budgetFit >= 70 ? "購入予算への収まりやすさ" : null,
      ]
    : entry.ryoEligibility.positiveReasons
        .filter((reason) =>
          reason.code === "category_gate_passed"
          || reason.code === "wardrobe_match"
          || reason.code === "purpose_match"
          || reason.code === "culture_match"
          || reason.code === "material_match"
          || reason.code === "history_match"
        )
        .map((reason) => reason.message);
  const displayReasons = unique(reasons.filter((reason): reason is string => Boolean(reason))).slice(0, 3);
  return displayReasons.length ? displayReasons : ["内部根拠を確認できる別の文化・素材軸"];
}

export function buildRyoAlternativeExplanation(entry: RyoRerankedCandidate): RyoRoleExplanation {
  return createRyoRoleExplanation(entry.candidate, entry.ryoEligibility);
}

export function getRyoModeAnchorAffinityAudit(): Array<{
  id: string;
  name: string;
  profile: RyoModelAffinityProfile;
}> {
  return anchorCatalog.map((definition) => ({
    id: definition.id,
    name: definition.name,
    profile: getRyoModelAffinityProfile({
      name: definition.name,
      tags: definition.tags,
      priceYen: definition.priceYen,
      modelType: definition.modelType,
    }),
  }));
}

function chooseDiverseCandidate(
  candidates: readonly RyoRerankedCandidate[],
  selected: readonly RyoRerankedCandidate[],
  role: "practical" | "ryo",
): RyoRerankedCandidate | null {
  if (!candidates.length) return null;
  return [...candidates].sort((left, right) => {
    const diversityDifference =
      diversityScore(right, selected) - diversityScore(left, selected);
    if (diversityDifference !== 0) return diversityDifference;
    const roleDifference = role === "practical"
      ? right.scoreBreakdownV2.practicalFitScore - left.scoreBreakdownV2.practicalFitScore
      : (right.scoreBreakdownV2.ryoIdentityScore + right.scoreBreakdownV2.explorationScore)
        - (left.scoreBreakdownV2.ryoIdentityScore + left.scoreBreakdownV2.explorationScore);
    return roleDifference ||
      right.finalRecommendationScore - left.finalRecommendationScore ||
      left.candidate.id.localeCompare(right.candidate.id, "en");
  })[0] ?? null;
}

function chooseRyoCandidate(
  candidates: readonly RyoRerankedCandidate[],
): RyoRerankedCandidate | null {
  const tierPriority: Record<RyoRoleEligibility["affinityTier"], number> = {
    core: 5,
    adjacent: 4,
    situational: 3,
    practical: 1,
    excluded: 0,
  };
  return [...candidates].sort((left, right) =>
    tierPriority[right.ryoEligibility.affinityTier] - tierPriority[left.ryoEligibility.affinityTier]
    || right.ryoEligibility.contextMatchScore - left.ryoEligibility.contextMatchScore
    || right.scoreBreakdownV2.ryoIdentityScore - left.scoreBreakdownV2.ryoIdentityScore
    || right.finalRecommendationScore - left.finalRecommendationScore
    || left.candidate.id.localeCompare(right.candidate.id, "en")
  )[0] ?? null;
}

function diversityScore(
  candidate: RyoRerankedCandidate,
  selected: readonly RyoRerankedCandidate[],
): number {
  return selected.reduce((score, entry) => {
    const parentOverlap = sharesParentModel(candidate, entry);
    const sameBrand = candidateBrand(candidate.candidate) === candidateBrand(entry.candidate);
    return score + (parentOverlap ? 0 : 3) + (sameBrand ? 0 : 2);
  }, 0);
}

function sharesParentModel(
  left: RyoRerankedCandidate,
  right: RyoRerankedCandidate,
): boolean {
  const leftParents = new Set(left.candidate.ryoMetadata?.parentModelIds ?? []);
  return (right.candidate.ryoMetadata?.parentModelIds ?? []).some((id) => leftParents.has(id));
}

function candidateBrand(candidate: CandidateProfile): string {
  const name = candidate.brand?.trim() || candidate.name.trim();
  const knownBrand = name.match(/^(New Balance|Last Resort AB|PRO-Keds|Nike|adidas|Converse|PUMA|Vans|Reebok)\b/iu)?.[1];
  return (knownBrand ?? name.split(/\s+/u)[0] ?? "").toLocaleLowerCase("en-US");
}

function isExactContextMatch(candidateName: string, contextNames: readonly string[]): boolean {
  return contextNames.some((name) => matchesCanonicalContextName(candidateName, name));
}

export function evaluateExplicitPreferenceGuards(
  vector: RyoPreferenceVector,
  evaluation: RyoModeCandidateEvaluation,
): ExplicitPreferenceGuard {
  const traits = evaluation.features.traits;
  const reasons: string[] = [];
  let penalty = 0;
  const add = (condition: boolean | undefined, value: number, reason: string) => {
    if (!condition) return;
    penalty += value;
    reasons.push(reason);
  };

  add(
    vector.cut.high > 0 && traits.lowCut && !traits.highCut && !traits.midCut,
    28,
    "High指定に対してLow専用モデル",
  );
  add(
    vector.cut.high > 0 && !traits.highCut && !traits.midCut && !traits.lowCut,
    20,
    "High指定に対してカットを確認できないモデル",
  );
  add(
    vector.cut.low > 0 && (traits.highCut || traits.midCut) && !traits.lowCut,
    22,
    "Low selected but candidate is High/Mid",
  );
  add(
    vector.color.blackWhite > 0 && traits.whiteWhite && !traits.blackBased,
    16,
    "Black / White指定に対してWhite / White配色",
  );
  add(
    vector.color.blackWhite > 0 && !traits.blackWhite && !traits.blackBased && !traits.whiteWhite,
    4,
    "Black / White配色をモデル名から確認できない",
  );
  add(
    vector.style.amekaji > 0 && traits.airForce1WhiteWhite,
    10,
    "アメカジ指定で主軸外のAF1 Low",
  );
  add(
    (vector.materialAging.leatherSinking > 0 || vector.materialAging.leatherCreasing > 0)
      && traits.canvas && !traits.leather && !traits.suede,
    8,
    "レザー経年変化指定に対してキャンバス素材",
  );
  add(
    vector.materialAging.canvasFading > 0
      && traits.leather && !traits.canvas,
    20,
    "キャンバスの退色指定に対してレザー主体のモデル",
  );

  return { penalty, reasons };
}

export function getRerankingWeights(summary: RyoPreferenceSummary): { existingCoreWeight: number; recommendationWeight: number } {
  switch (summary.ryoInfluence) {
    case "light": return { existingCoreWeight: 0.65, recommendationWeight: 0.35 };
    case "standard": return { existingCoreWeight: 0.4, recommendationWeight: 0.6 };
    case "strong": return { existingCoreWeight: 0.3, recommendationWeight: 0.7 };
    case "beginner": return { existingCoreWeight: 0.45, recommendationWeight: 0.55 };
    default: return { existingCoreWeight: 0.45, recommendationWeight: 0.55 };
  }
}

function enforceHighCutWinnerGuard(
  vector: RyoPreferenceVector,
  candidates: RyoRerankedCandidate[],
): RyoRerankedCandidate[] {
  if (vector.cut.high <= 0) return candidates;
  const compatible = candidates.filter((entry) => {
    const traits = entry.ryoEvaluation.features.traits;
    return (traits.highCut || traits.midCut)
      && entry.ryoEvaluation.features.verified
      && entry.ryoEvaluation.score.recommendationScore >= 55;
  });
  if (compatible.length === 0) return candidates;

  const compatibleFloor = Math.max(...compatible.map((entry) => entry.finalRecommendationScore));
  return candidates.map((entry) => {
    const traits = entry.ryoEvaluation.features.traits;
    const lowOnly = traits.lowCut && !traits.highCut && !traits.midCut;
    if (!lowOnly || entry.finalRecommendationScore < compatibleFloor) return entry;
    const additionalPenalty = round(entry.finalRecommendationScore - compatibleFloor + 0.1);
    return {
      ...entry,
      explicitPreferencePenalty: round(entry.explicitPreferencePenalty + additionalPenalty),
      explicitPreferenceReasons: [...new Set([
        ...entry.explicitPreferenceReasons,
        "妥当なHigh/Mid候補があるためLow専用モデルを1位から除外",
      ])],
      finalRecommendationScore: round(Math.max(0, compatibleFloor - 0.1)),
      scoreBreakdownV2: {
        ...entry.scoreBreakdownV2,
        finalRecommendationScore: round(Math.max(0, compatibleFloor - 0.1)),
      },
    };
  });
}

function createAnchorCandidate(definition: AnchorDefinition, budgetYen?: number): CandidateProfile {
  const vector = createVector(definition.tags, definition.name);
  const identity = splitStaticCandidateName(definition.name);
  return {
    id: `ryo-anchor-${definition.id}`,
    name: definition.name,
    source: "local",
    description: definition.description,
    tags: [...definition.tags],
    vector,
    budgetFit: calculateLocalBudgetFit(budgetYen, vector.priceLevel),
    risk: "low",
    informationCompleteness: 86,
    readiness: "ready_local",
    priceYen: definition.priceYen,
    modelType: definition.modelType,
    modelName: identity.modelName,
    colorwayName: identity.colorwayName,
    styleCode: null,
    modelEvidenceUrls: [],
    colorwayEvidenceUrls: [],
    styleCodeEvidenceUrls: [],
    verificationStatus: "unverified",
    sourceQuality: "unknown",
    searchKeywords: [definition.name],
    evidenceUrls: [`https://www.google.com/search?q=${encodeURIComponent(definition.name)}`],
    researchReason: `Ryo candidate anchorの候補シグナル: ${definition.signals.join(" / ")}。実際の順位は回答との再評価で決めています。`,
    researchCautions: ["価格・在庫・サイズ・購入可能性は販売元で確認してください。"],
    researchSource: "ryo_anchor",
  };
}

function splitStaticCandidateName(name: string): { modelName: string; colorwayName: string | null } {
  const quotedColor = name.match(/^(.*)\s+"([^"]+)"$/u);
  if (quotedColor?.[1] && quotedColor[2] && /(?:black|white|grey|gray|orange|red|blue|green|brown|cream|gum|navy|olive|burgundy)/iu.test(quotedColor[2])) {
    return { modelName: quotedColor[1].trim(), colorwayName: quotedColor[2].trim() };
  }
  const suffixColor = name.match(/^(.*)\s+(Black\s*\/\s*White|White\s*\/\s*Black|Black\s*\/\s*Grey|Black)$/iu);
  if (suffixColor?.[1] && suffixColor[2]) {
    return { modelName: suffixColor[1].trim(), colorwayName: suffixColor[2].replace(/\s*\/\s*/gu, "/").trim() };
  }
  return { modelName: name, colorwayName: null };
}

function getActiveSignals(vector: RyoPreferenceVector): Set<AnchorSignal> {
  const signals = new Set<AnchorSignal>();
  if (vector.pantsFit.widePants > 0) signals.add("wide_pants");
  if (vector.pantsFit.straightPants > 0) signals.add("straight_pants");
  if (vector.pantsFit.denim > 0) signals.add("denim");
  if (vector.pantsFit.workPants > 0) signals.add("work_pants");
  if (vector.pantsFit.slimPants > 0) signals.add("slim_pants");
  if (vector.sportOrigin.basketball > 0) signals.add("basketball");
  if (vector.sportOrigin.skate > 0) signals.add("skate");
  if (vector.sportOrigin.running > 0) signals.add("running");
  if (vector.materialAging.leatherSinking > 0 || vector.materialAging.leatherCreasing > 0) signals.add("leather_sinking");
  if (vector.materialAging.suedeFadingNap > 0) signals.add("suede_fading_nap");
  if (vector.materialAging.canvasFading > 0) signals.add("canvas_fading");
  if (vector.color.blackWhite > 0) signals.add("black_white");
  if (vector.style.amekaji > 0) signals.add("amekaji");
  if (vector.style.normcore > 0) signals.add("normcore");
  if (vector.style.street > 0) signals.add("street");
  if (vector.style.cleanCasual > 0) signals.add("clean_casual");
  if (vector.cut.high > 0) signals.add("high");
  if (vector.cut.low > 0) signals.add("low");
  if (vector.cut.mid > 0) signals.add("mid");
  if (vector.taste.simple > 0) signals.add("simple");
  if (vector.wearingStyle.looseFit > 0) signals.add("loose_fit");
  if (vector.wearingStyle.volumeLook > 0) signals.add("volume_look");
  if (vector.budget.under15000 > 0) signals.add("under_15000");
  if (vector.budget.premiumOk > 0) signals.add("premium");
  if (vector.techTolerance.avoidTech > 0) signals.add("avoid_tech");
  if (vector.techTolerance.airMaxNbOk > 0 || vector.techTolerance.pureCoolOk > 0) signals.add("high_tech");
  return signals;
}

function createVector(tags: readonly SneakerTag[], name: string): SneakerVector {
  const has = (tag: SneakerTag) => tags.includes(tag);
  return {
    culture: has("heritage") || has("classic") ? 88 : 72,
    styleFit: 82,
    simplicity: has("low_tech") || has("minimal") ? 88 : 68,
    street: has("street") || has("basketball") ? 88 : 62,
    volume: /high|mid|weapon|half cab/i.test(name) ? 78 : 56,
    comfort: has("comfortable") || has("running") ? 88 : 72,
    durability: has("durable") || has("basketball") ? 86 : 78,
    priceLevel: /993|vtg|vintage|jordan 1 high/i.test(name) ? 68 : 48,
  };
}

function anchor(id: string, name: string, modelType: string, description: string, tags: SneakerTag[], signals: AnchorSignal[], priceYen: number): AnchorDefinition {
  return { id, name, modelType, description, tags, signals, priceYen };
}

function countMatches(signals: readonly AnchorSignal[], active: ReadonlySet<AnchorSignal>): number {
  return signals.filter((signal) => active.has(signal)).length;
}

function comparableName(value: string): string {
  return normalizeOfficialSneakerName(value).toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim();
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
