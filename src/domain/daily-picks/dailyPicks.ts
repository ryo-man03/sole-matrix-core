import { compareCanonicalSneakers, type CanonicalSneakerKey } from "../identity/canonicalSneaker";
import type { ReleaseCandidate } from "../release/release";

export const DAILY_PICK_ALGORITHM_VERSION = "daily-picks-v1.0.0";
export type DailyPickScore = { tasteAffinity: number; explicitPreferenceFit: number; collectionNovelty: number; releaseUrgency: number; availabilityConfidence: number; evidenceConfidence: number; budgetFit: number | null; negativeFeedbackPenalty: number; duplicatePenalty: number; total: number };
export type DailyPickContext = { favoriteBrands: string[]; avoidedBrands: string[]; favoriteColors: string[]; avoidedColors: string[]; favoriteMaterials: string[]; avoidedMaterials: string[]; budgetMaxJpy: number | null; budgetIsHardLimit: boolean; owned: CanonicalSneakerKey[]; disliked: CanonicalSneakerKey[]; wishlist: CanonicalSneakerKey[] };
export type ScoredDailyPick = { candidate: ReleaseCandidate; score: DailyPickScore; explanation: { reasons: string[]; cautions: string[] } };

export function scoreDailyPick(candidate: ReleaseCandidate, context: DailyPickContext): ScoredDailyPick | null {
  const disliked = context.disliked.some((key) => ["exact_style_code", "exact_model"].includes(compareCanonicalSneakers(candidate.key, key)));
  if (disliked) return null;
  const ownedMatches = context.owned.map((key) => compareCanonicalSneakers(candidate.key, key));
  const exactOwned = ownedMatches.some((match) => match === "exact_style_code" || match === "exact_model");
  if (context.budgetIsHardLimit && context.budgetMaxJpy !== null && candidate.priceJpy !== null && candidate.priceJpy > context.budgetMaxJpy) return null;
  const brandPreferred = context.favoriteBrands.some((value) => norm(value) === norm(candidate.brand));
  const brandAvoided = context.avoidedBrands.some((value) => norm(value) === norm(candidate.brand));
  const preferredColors = overlap(candidate.colors, context.favoriteColors);
  const avoidedColors = overlap(candidate.colors, context.avoidedColors);
  const preferredMaterials = overlap(candidate.materials, context.favoriteMaterials);
  const avoidedMaterials = overlap(candidate.materials, context.avoidedMaterials);
  const tasteAffinity = clamp(55 + preferredColors * 12 + preferredMaterials * 12 - avoidedColors * 18 - avoidedMaterials * 18);
  const explicitPreferenceFit = clamp(50 + (brandPreferred ? 25 : 0) - (brandAvoided ? 40 : 0) + preferredColors * 8 + preferredMaterials * 8 - avoidedColors * 20 - avoidedMaterials * 20);
  const collectionNovelty = exactOwned ? 0 : ownedMatches.includes("family_related") ? 62 : 90;
  const urgency = releaseUrgency(candidate);
  const availability = availabilityConfidence(candidate);
  const evidence = evidenceConfidence(candidate);
  const budgetFit = candidate.priceJpy === null || context.budgetMaxJpy === null ? null : clamp(100 - (Math.max(0, candidate.priceJpy - context.budgetMaxJpy) / Math.max(1, context.budgetMaxJpy)) * 100);
  const negativeFeedbackPenalty = 0;
  const duplicatePenalty = exactOwned ? 75 : 0;
  const total = round(clamp(tasteAffinity * .30 + explicitPreferenceFit * .20 + collectionNovelty * .15 + urgency * .10 + availability * .10 + evidence * .15 - negativeFeedbackPenalty - duplicatePenalty));
  const reasons = [
    brandPreferred ? "登録した好きなブランドです。" : null,
    preferredColors ? "登録した色の好みに近いです。" : null,
    preferredMaterials ? "登録した素材の好みに合います。" : null,
    context.wishlist.some((key) => compareCanonicalSneakers(candidate.key, key) !== "none") ? "Wishlist に近い候補です。" : null,
    !exactOwned ? "所有済みの同一モデルではありません。" : null,
  ].filter((value): value is string => Boolean(value)).slice(0, 3);
  const cautions = [
    candidate.informationState === "rumor" ? "未確認情報で、公式発表ではありません。" : null,
    candidate.informationState === "conflicting_evidence" || candidate.hasConflict ? "発売日は情報源によって異なります" : null,
    candidate.verificationState !== "verified" ? "配色は確認中です。" : null,
    candidate.priceJpy === null ? "予算との比較に必要な価格は未確認です。" : null,
    exactOwned ? "所有済みと同一のため優先度を下げました。" : null,
  ].filter((value): value is string => Boolean(value)).slice(0, 3);
  return { candidate, score: { tasteAffinity, explicitPreferenceFit, collectionNovelty, releaseUrgency: urgency, availabilityConfidence: availability, evidenceConfidence: evidence, budgetFit, negativeFeedbackPenalty, duplicatePenalty, total }, explanation: { reasons, cautions } };
}

export function selectDiverseDailyPicks(candidates: ScoredDailyPick[], options = { maxTotal: 8, maxPerBrand: 3, maxPerModelFamily: 2, minimumOfficialCount: 2, maximumRumorCount: 2 }) {
  const sorted = [...candidates].sort((a, b) => b.score.total - a.score.total || a.candidate.id.localeCompare(b.candidate.id));
  const chosen: ScoredDailyPick[] = [];
  const brands = new Map<string, number>();
  const families = new Map<string, number>();
  let rumors = 0;
  const add = (item: ScoredDailyPick) => {
    const brand = item.candidate.key.brandSlug;
    const family = item.candidate.key.modelFamily;
    if ((brands.get(brand) ?? 0) >= options.maxPerBrand || (families.get(family) ?? 0) >= options.maxPerModelFamily) return false;
    if (item.candidate.informationState === "rumor" && rumors >= options.maximumRumorCount) return false;
    if (item.score.duplicatePenalty > 0) return false;
    chosen.push(item);
    brands.set(brand, (brands.get(brand) ?? 0) + 1);
    families.set(family, (families.get(family) ?? 0) + 1);
    if (item.candidate.informationState === "rumor") rumors += 1;
    return true;
  };
  const official = sorted.filter((item) => ["official_announced", "retailer_confirmed", "released", "restocked", "date_changed"].includes(item.candidate.informationState));
  for (const item of official) {
    if (chosen.length >= Math.min(options.minimumOfficialCount, official.length)) break;
    add(item);
  }
  for (const item of sorted) {
    if (chosen.length >= options.maxTotal) break;
    if (!chosen.includes(item)) add(item);
  }
  return chosen;
}

function releaseUrgency(candidate: ReleaseCandidate) {
  if (candidate.informationState === "cancelled") return 0;
  if (candidate.informationState === "conflicting_evidence") return 20;
  if (["released", "restocked"].includes(candidate.informationState)) return 90;
  if (!candidate.releaseDate) return 35;
  const days = Math.ceil((Date.parse(candidate.releaseDate) - Date.now()) / 86_400_000);
  return days < 0 ? 40 : days <= 7 ? 100 : days <= 30 ? 80 : 55;
}
function availabilityConfidence(candidate: ReleaseCandidate) {
  if (candidate.informationState === "conflicting_evidence") return 20;
  if (candidate.informationState === "official_announced") return 90;
  if (candidate.informationState === "retailer_confirmed") return 85;
  if (candidate.informationState === "released" || candidate.informationState === "restocked") return 95;
  if (candidate.informationState === "rumor") return 20;
  return 50;
}
function evidenceConfidence(candidate: ReleaseCandidate) {
  const capped = clamp(candidate.sourceConfidence);
  if (candidate.informationState === "rumor") return Math.min(35, capped);
  if (candidate.informationState === "conflicting_evidence") return Math.min(60, capped);
  return candidate.verificationState === "verified" ? capped : Math.min(65, capped);
}
function overlap(a: string[], b: string[]) { const set = new Set(b.map(norm)); return a.filter((value) => set.has(norm(value))).length; }
function norm(value: string) { return value.normalize("NFKC").toLowerCase().trim(); }
function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function round(value: number) { return Math.round(value * 10) / 10; }
