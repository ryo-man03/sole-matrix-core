import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { SneakerVector } from "../../../src/domain/sneaker/sneakerVector";
import { calculateLocalBudgetFit } from "../core-v1/repository";
import type { BalancedScore, CandidateProfile, Decision, RyoScore } from "../core-v1/types";
import { buildRyoModeCandidateEvaluation } from "./integration";
import type { RyoModeCandidateEvaluation } from "./integration";
import { normalizeCandidateOfficialName, normalizeOfficialSneakerName } from "./names";
export { normalizeCandidateOfficialName, normalizeOfficialSneakerName } from "./names";
import type { RyoPreferenceSummary, RyoPreferenceVector } from "./types";
import { summarizeRyoPreferenceVector } from "./vector";

type AnchorSignal = "wide_pants" | "work_pants" | "basketball" | "leather_sinking" | "suede_fading_nap" | "black_white";

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
  finalRecommendationScore: number;
};

const anchorCatalog: readonly AnchorDefinition[] = [
  anchor("nike-af1-low-white-white", "Nike Air Force 1 Low \"White/White\"", "汎用白レザー・バスケットボール", "歴史ある白レザー定番です。アメカジの主軸ではなく、ストリート・ノームコア・初心者向けの条件付き候補として扱います。", ["basketball", "classic", "street", "durable", "heritage"], ["basketball", "black_white"], 18_000),
  anchor("converse-jack-purcell-leather-black", "Converse Jack Purcell Leather Black", "レザー・テニス", "黒レザーを締めて履く形とワークパンツの相性を見込めます。", ["classic", "low_tech", "minimal", "heritage"], ["work_pants", "leather_sinking", "black_white"], 16_500),
  anchor("converse-one-star-j-vtg-black", "Converse One Star J VTG Black", "スエード・スケート", "毛並みの変化と低いシルエットを楽しめる日本製の候補です。", ["classic", "low_tech", "street", "heritage", "premium"], ["wide_pants", "suede_fading_nap", "black_white"], 25_000),
  anchor("puma-suede-black-white", "PUMA Suede Black/White", "クラシック・スエード", "黒白配色とスエードの変化を、ワークパンツにも合わせやすい候補です。", ["classic", "low_tech", "street", "heritage"], ["wide_pants", "work_pants", "suede_fading_nap", "black_white"], 13_000),
  anchor("puma-clyde-black-white", "PUMA Clyde Black/White", "クラシック・バスケットボール", "バスケットボール由来と細すぎないクラシックな形を両立します。", ["basketball", "classic", "low_tech", "street", "heritage"], ["wide_pants", "work_pants", "basketball", "suede_fading_nap", "black_white"], 15_000),
  anchor("adidas-superstar-vintage", "adidas Superstar Vintage", "レザー・バスケットボール", "シェルトゥとレザーの履きジワを楽しめるバスケットボール由来の定番です。", ["basketball", "classic", "low_tech", "street", "heritage"], ["wide_pants", "basketball", "leather_sinking", "black_white"], 22_000),
  anchor("converse-pro-leather", "Converse Pro Leather", "レザー・バスケットボール", "レザーの沈みとバスケットボール由来の形が回答条件に合います。", ["basketball", "classic", "low_tech", "heritage"], ["basketball", "leather_sinking", "black_white"], 18_000),
  anchor("nike-aj1-low-black-white", "Nike Air Jordan 1 Low Black/White", "レザー・バスケットボール", "ローカットでレザーの履きジワを楽しめるバスケットボール由来の候補です。", ["basketball", "classic", "street", "retro", "heritage"], ["basketball", "leather_sinking", "black_white"], 20_000),
  anchor("nike-aj1-high-black-white", "Nike Air Jordan 1 High Black/White", "ハイカット・バスケットボール", "太めのパンツと締めたハイカットの輪郭を作りやすい候補です。", ["basketball", "street", "retro", "heritage"], ["wide_pants", "basketball", "leather_sinking", "black_white"], 25_000),
  anchor("nike-terminator-low-black-white", "Nike Terminator Low Black/White", "レザー・バスケットボール", "大学バスケットボール由来のレトロなローカットです。", ["basketball", "classic", "street", "retro", "heritage"], ["basketball", "leather_sinking", "black_white"], 18_000),
  anchor("nike-terminator-high-black-white", "Nike Terminator High Black/White", "ハイカット・バスケットボール", "ワークパンツと相性の良いレトロなバスケットボール由来の形です。", ["basketball", "street", "retro", "heritage"], ["work_pants", "basketball", "leather_sinking", "black_white"], 20_000),
  anchor("converse-all-star-hi-black", "Converse All Star Hi Black", "キャンバス・ハイカット", "太めのパンツに締めたハイカットの輪郭を作れる定番です。", ["classic", "canvas", "low_tech", "heritage"], ["wide_pants", "black_white"], 8_000),
  anchor("vans-half-cab-black", "Vans Half Cab Black", "スエード・スケート", "ワークパンツとスエードの経年変化を楽しめるボリュームがあります。", ["classic", "street", "low_tech", "heritage"], ["wide_pants", "work_pants", "suede_fading_nap", "black_white"], 15_000),
  anchor("adidas-bern-gore-tex", "adidas Bern GORE-TEX", "テラス・機能素材", "ワークパンツに合わせやすいクラシックな形と機能素材を持ちます。", ["classic", "low_tech", "heritage", "outdoor"], ["work_pants"], 18_000),
  anchor("new-balance-993", "New Balance 993", "ヘリテージ・ランニング", "太め・ワーク系のパンツに合わせやすいランニング由来の候補です。", ["running", "comfortable", "premium", "heritage"], ["wide_pants", "work_pants"], 38_000),
  anchor("reebok-classic-leather", "Reebok Classic Leather", "レザー・ランニング", "ワークパンツに合わせやすい控えめなレザーモデルです。", ["running", "classic", "low_tech", "heritage"], ["work_pants", "leather_sinking"], 14_000),
  anchor("nike-blazer-mid-77", "Nike Blazer Mid '77", "レザー・バスケットボール", "ワークパンツと締めたシルエットに合う古いバスケットボール由来の形です。", ["basketball", "classic", "street", "heritage"], ["work_pants", "basketball", "leather_sinking"], 15_000),
  anchor("converse-weapon", "Converse Weapon", "レザー・バスケットボール", "バスケットボールの背景とレザーの履き込みを強く出せる候補です。", ["basketball", "street", "retro", "heritage"], ["basketball", "leather_sinking"], 18_000),
  anchor("vans-authentic-black-white", "Vans Authentic Black/White", "キャンバス・スケート", "黒白キャンバスの退色を楽しめるローテク候補です。", ["classic", "canvas", "low_tech", "street"], ["black_white"], 8_000),
  anchor("last-resort-vm001-black-white", "Last Resort AB VM001 Black/White", "スエード・スケート", "スエードの毛並み変化とワーク寄りの服装に合うスケート由来の形です。", ["classic", "low_tech", "street"], ["suede_fading_nap", "black_white"], 15_000),
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
): RyoRerankedCandidate[] {
  const summary = summarizeRyoPreferenceVector(vector);
  const weights = getRerankingWeights(summary);
  return candidates.map((entry) => {
    const ryoEvaluation = buildRyoModeCandidateEvaluation(vector, entry.candidate);
    const existingCoreScore = mode === "ryo" ? entry.ryoScore.total : entry.balancedScore.total;
    return {
      ...entry,
      ryoEvaluation,
      finalRecommendationScore: round(existingCoreScore * weights.existingCoreWeight + ryoEvaluation.score.recommendationScore * weights.recommendationWeight),
    };
  }).sort((left, right) =>
    right.finalRecommendationScore - left.finalRecommendationScore ||
    right.ryoEvaluation.score.recommendationScore - left.ryoEvaluation.score.recommendationScore ||
    (mode === "ryo" ? right.ryoScore.total - left.ryoScore.total : right.balancedScore.total - left.balancedScore.total),
  );
}

export function getRerankingWeights(summary: RyoPreferenceSummary): { existingCoreWeight: number; recommendationWeight: number } {
  switch (summary.ryoInfluence) {
    case "light": return { existingCoreWeight: 0.7, recommendationWeight: 0.3 };
    case "standard": return { existingCoreWeight: 0.5, recommendationWeight: 0.5 };
    case "strong": return { existingCoreWeight: 0.35, recommendationWeight: 0.65 };
    case "beginner": return { existingCoreWeight: 0.4, recommendationWeight: 0.6 };
    default: return { existingCoreWeight: 0.9, recommendationWeight: 0.1 };
  }
}

function createAnchorCandidate(definition: AnchorDefinition, budgetYen?: number): CandidateProfile {
  const vector = createVector(definition.tags, definition.name);
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
    searchKeywords: [definition.name],
    evidenceUrls: [`https://www.google.com/search?q=${encodeURIComponent(definition.name)}`],
    researchReason: `11問回答に対応するRyo candidate anchor（${definition.signals.join(" / ")}）です。`,
    researchCautions: ["価格・在庫・サイズ・購入可能性は販売元で確認してください。"],
    researchSource: "ryo_anchor",
  };
}

function getActiveSignals(vector: RyoPreferenceVector): Set<AnchorSignal> {
  const signals = new Set<AnchorSignal>();
  if (vector.pantsFit.widePants > 0) signals.add("wide_pants");
  if (vector.pantsFit.workPants > 0) signals.add("work_pants");
  if (vector.sportOrigin.basketball > 0) signals.add("basketball");
  if (vector.materialAging.leatherSinking > 0 || vector.materialAging.leatherCreasing > 0) signals.add("leather_sinking");
  if (vector.materialAging.suedeFadingNap > 0) signals.add("suede_fading_nap");
  if (vector.color.blackWhite > 0) signals.add("black_white");
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
