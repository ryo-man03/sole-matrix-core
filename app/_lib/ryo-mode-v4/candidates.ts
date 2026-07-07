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

type AnchorSignal =
  | "wide_pants" | "straight_pants" | "denim" | "work_pants" | "slim_pants"
  | "basketball" | "running" | "leather_sinking" | "suede_fading_nap" | "canvas_fading"
  | "black_white" | "amekaji" | "normcore" | "street" | "clean_casual"
  | "premium" | "avoid_tech" | "high_tech";

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
  anchor("nike-af1-low-white-white", "Nike Air Force 1 Low \"White/White\"", "汎用白レザー・バスケットボール", "歴史ある白レザー定番です。アメカジの主軸ではなく、ストリート・ノームコア・初心者向けの条件付き候補として扱います。", ["basketball", "classic", "street", "durable", "heritage"], ["basketball", "black_white", "street", "wide_pants", "high_tech"], 18_000),
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
  anchor("reebok-classic-leather", "Reebok Classic Leather", "レザー・ランニング", "ワークパンツに合わせやすい控えめなレザーモデルです。", ["running", "classic", "low_tech", "heritage"], ["work_pants", "leather_sinking", "normcore", "straight_pants", "clean_casual", "avoid_tech"], 14_000),
  anchor("nike-blazer-mid-77", "Nike Blazer Mid '77", "レザー・バスケットボール", "ワークパンツと締めたシルエットに合う古いバスケットボール由来の形です。", ["basketball", "classic", "street", "heritage"], ["work_pants", "basketball", "leather_sinking"], 15_000),
  anchor("converse-weapon", "Converse Weapon", "レザー・バスケットボール", "バスケットボールの背景とレザーの履き込みを強く出せる候補です。", ["basketball", "street", "retro", "heritage"], ["basketball", "leather_sinking"], 18_000),
  anchor("vans-authentic-black-white", "Vans Authentic Black/White", "キャンバス・スケート", "黒白キャンバスの退色を楽しめるローテク候補です。", ["classic", "canvas", "low_tech", "street"], ["black_white", "amekaji", "denim", "canvas_fading", "normcore", "straight_pants", "avoid_tech"], 8_000),
  anchor("last-resort-vm001-black-white", "Last Resort AB VM001 Black/White", "スエード・スケート", "スエードの毛並み変化とワーク寄りの服装に合うスケート由来の形です。", ["classic", "low_tech", "street"], ["suede_fading_nap", "black_white"], 15_000),
  anchor("converse-one-star-j", "Converse One Star J", "スエード・アーカイブ", "一つ星の簡潔さとスエードの育ちを評価する日本製の親モデルです。", ["classic", "low_tech", "street", "heritage"], ["amekaji", "denim", "suede_fading_nap"], 24_000),
  anchor("converse-one-star-leather", "Converse One Star Leather", "レザー・アーカイブ", "デニムへ馴染む一つ星レザーの育て枠です。", ["classic", "low_tech", "heritage"], ["amekaji", "denim", "leather_sinking"], 22_000),
  anchor("converse-one-star-suede", "Converse One Star Suede", "スエード・アーカイブ", "スエードの退色と毛並みを楽しむ一つ星です。", ["classic", "low_tech", "street", "heritage"], ["amekaji", "denim", "work_pants", "suede_fading_nap"], 18_000),
  anchor("converse-all-star-j-hi", "Converse All Star J Hi", "キャンバス・日本製", "通常現行ではなく、日本製Hiのキャンバスを履き込む定番です。", ["classic", "canvas", "low_tech", "heritage"], ["amekaji", "denim", "canvas_fading", "avoid_tech"], 14_000),
  anchor("converse-all-star-j-vtg-hi", "Converse All Star J VTG Hi", "キャンバス・復刻", "復刻仕様とHiカット、キャンバス退色を評価する上位定番です。", ["classic", "canvas", "low_tech", "heritage", "premium"], ["amekaji", "denim", "canvas_fading", "premium"], 22_000),
  anchor("converse-timeline-59-hi", "Converse All Star J VTG 59 Hi \"TimeLine\" Black", "キャンバス・TimeLine", "TimeLineの復刻背景と履き込み価値を評価します。", ["classic", "canvas", "low_tech", "heritage", "premium"], ["amekaji", "denim", "canvas_fading", "premium"], 26_000),
  anchor("converse-addict-hi", "Converse Addict Chuck Taylor Hi", "キャンバス・上位仕様", "クラシックな見た目に現代的な履き心地を入れた上位仕様です。", ["classic", "canvas", "heritage", "premium"], ["amekaji", "denim", "canvas_fading", "premium"], 30_000),
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
  anchor("vans-era-95", "Vans Era 95", "キャンバス・スケート", "skate・punk・DIYとキャンバス退色を評価します。", ["classic", "canvas", "low_tech", "street"], ["amekaji", "denim", "work_pants", "canvas_fading"], 12_000),
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
  if (vector.pantsFit.straightPants > 0) signals.add("straight_pants");
  if (vector.pantsFit.denim > 0) signals.add("denim");
  if (vector.pantsFit.workPants > 0) signals.add("work_pants");
  if (vector.pantsFit.slimPants > 0) signals.add("slim_pants");
  if (vector.sportOrigin.basketball > 0) signals.add("basketball");
  if (vector.sportOrigin.running > 0) signals.add("running");
  if (vector.materialAging.leatherSinking > 0 || vector.materialAging.leatherCreasing > 0) signals.add("leather_sinking");
  if (vector.materialAging.suedeFadingNap > 0) signals.add("suede_fading_nap");
  if (vector.materialAging.canvasFading > 0) signals.add("canvas_fading");
  if (vector.color.blackWhite > 0) signals.add("black_white");
  if (vector.style.amekaji > 0) signals.add("amekaji");
  if (vector.style.normcore > 0) signals.add("normcore");
  if (vector.style.street > 0) signals.add("street");
  if (vector.style.cleanCasual > 0) signals.add("clean_casual");
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
