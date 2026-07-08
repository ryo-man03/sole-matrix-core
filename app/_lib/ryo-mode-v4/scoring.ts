import { normalizeRyoSneakerFeatures } from "./features";
import type {
  RyoModeScoreBreakdown,
  RyoModeScoreResult,
  RyoPreferenceVector,
  RyoSneakerFeatures,
} from "./types";
import { normalizeRyoPreferenceVector, summarizeRyoPreferenceVector } from "./vector";

const CAPS: RyoModeScoreBreakdown = {
  historyOrigin: 18,
  materialAging: 20,
  silhouetteCutWearing: 18,
  pantsCompatibility: 14,
  colorTaste: 12,
  styleSportContext: 8,
  affordability: 8,
  playfulness: 2,
};

export function clampRyoScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

export function scoreRyoModeCandidate(
  rawVector: RyoPreferenceVector,
  rawFeatures: RyoSneakerFeatures,
): RyoModeScoreResult {
  const vector = normalizeRyoPreferenceVector(rawVector);
  const features = normalizeRyoSneakerFeatures(rawFeatures);
  const traits = features.traits;
  const bonuses: string[] = [];
  const penalties: string[] = [];
  const matchedSignals: string[] = [];
  const cautionSignals: string[] = [];

  const productBreakdown = buildProductBreakdown(features);
  const breakdown = buildRecommendationBreakdown(vector, features, productBreakdown, matchedSignals);
  let productScore = sumBreakdown(productBreakdown);
  let recommendationScore = sumBreakdown(breakdown);

  if (traits.oldShape || traits.vintage || traits.timeLine || traits.madeInJapan) {
    bonuses.push("heritage construction: old shape / VTG / TimeLine / Made in Japan");
  }
  if (traits.leather) bonuses.push("leather sinking and creasing potential");
  if (traits.suede) bonuses.push("suede fading and nap texture");
  if (traits.canvas) bonuses.push("canvas fading potential");
  if (traits.tiedSilhouetteGood) bonuses.push("tied silhouette compatibility");
  if (pantsTraitCount(traits) > 0) bonuses.push("pants compatibility");
  if (traits.rareWearableColor) bonuses.push("rare but wearable color");
  if (traits.tooCommon === false) bonuses.push("not too common");
  if (features.estimatedPriceYen !== undefined && features.estimatedPriceYen <= 20_000) {
    bonuses.push("under 20000 yen beginner fit");
  }
  if (traits.airForce1WhiteWhite) {
    bonuses.push("Nike Air Force 1 Low White/White historical staple");
    matchedSignals.push("1982 basketball origin, white leather aging, and broad pants compatibility");
  }

  const productDeductions = collectProductDeductions(features, penalties, cautionSignals);
  const recommendationDeductions = collectRecommendationDeductions(vector, features, penalties, cautionSignals);
  productScore = clampRyoScore(productScore - productDeductions);
  recommendationScore = clampRyoScore(recommendationScore - recommendationDeductions);

  return {
    productScore,
    recommendationScore,
    // Recommendation fit is the primary signal for future decisions; product merit remains material.
    totalRyoScore: clampRyoScore(productScore * 0.4 + recommendationScore * 0.6),
    breakdown,
    bonuses: unique(bonuses),
    penalties: unique(penalties),
    matchedSignals: unique(matchedSignals),
    cautionSignals: unique(cautionSignals),
  };
}

function buildProductBreakdown(features: RyoSneakerFeatures): RyoModeScoreBreakdown {
  const t = features.traits;
  const manufacturing = countTrue(t.madeInJapan, t.madeInGermany, t.madeInUsa);
  const historyOrigin = capped(
    (t.oldShape ? 5 : 0) + (t.vintage ? 4 : 0) + (t.timeLine ? 4 : 0)
      + Math.min(5, manufacturing * 4) + (t.sportOrigin && t.sportOrigin !== "none" ? 2 : 0)
      + (t.airForce1WhiteWhite ? 8 : 0),
    CAPS.historyOrigin,
  );
  const materialAging = capped(
    (t.leather ? 12 : 0) + (t.suede ? 10 : 0) + (t.canvas ? 6 : 0) + (t.goreTex ? 5 : 0),
    CAPS.materialAging,
  );
  const hasKnownCut = Boolean(t.highCut || t.lowCut || t.oxCut || t.midCut);
  const silhouetteCutWearing = capped(
    (t.tiedSilhouetteGood ? 10 : 0) + (hasKnownCut ? 6 : 0) + (t.oldShape ? 2 : 0),
    CAPS.silhouetteCutWearing,
  );
  const pantsCount = pantsTraitCount(t);
  const pantsCompatibility = pantsCount === 0 ? 0 : capped(6 + pantsCount * 2, CAPS.pantsCompatibility);
  const colorTaste = capped((t.rareWearableColor ? 9 : 0) + (t.blackWhite ? 8 : 0) + (t.tooCommon === false ? 3 : 0), CAPS.colorTaste);
  const styleSportContext = capped(
    (t.sportOrigin && t.sportOrigin !== "none" ? 5 : 0) + (t.vintage || t.oldShape ? 3 : 0),
    CAPS.styleSportContext,
  );
  const affordability = productAffordability(features.estimatedPriceYen);
  const playfulness = t.rareWearableColor ? 2 : 0;
  return { historyOrigin, materialAging, silhouetteCutWearing, pantsCompatibility, colorTaste, styleSportContext, affordability, playfulness };
}

function buildRecommendationBreakdown(
  vector: RyoPreferenceVector,
  features: RyoSneakerFeatures,
  product: RyoModeScoreBreakdown,
  matchedSignals: string[],
): RyoModeScoreBreakdown {
  const t = features.traits;
  const materialPreference = max(
    t.leather ? max(vector.materialAging.leatherSinking, vector.materialAging.leatherCreasing) : 0,
    t.suede ? vector.materialAging.suedeFadingNap : 0,
    t.canvas ? vector.materialAging.canvasFading : 0,
    t.goreTex ? vector.materialAging.goreTexUtility : 0,
    vector.materialAging.overallAgingPotential,
  );
  const activeMaterialPreference = max(
    vector.materialAging.leatherSinking,
    vector.materialAging.leatherCreasing,
    vector.materialAging.suedeFadingNap,
    vector.materialAging.canvasFading,
    vector.materialAging.goreTexUtility,
    vector.materialAging.overallAgingPotential,
  );
  const cutPreference = max(
    t.highCut ? vector.cut.high : 0,
    t.lowCut ? vector.cut.low : 0,
    t.oxCut ? vector.cut.ox : 0,
    t.midCut ? vector.cut.mid : 0,
    vector.cut.dependsOnModel,
  );
  const activeCutWearingPreference = max(
    vector.cut.high,
    vector.cut.low,
    vector.cut.ox,
    vector.cut.mid,
    vector.cut.dependsOnModel,
    vector.wearingStyle.tiedSilhouette,
    vector.wearingStyle.looseFit,
    vector.wearingStyle.slimLook,
    vector.wearingStyle.volumeLook,
  );
  const wearingPreference = max(
    t.tiedSilhouetteGood ? vector.wearingStyle.tiedSilhouette : 0,
    t.lowCut ? vector.wearingStyle.looseFit : 0,
    t.slimPantsGood || t.lowCut ? vector.wearingStyle.slimLook : 0,
    t.highCut || t.midCut ? vector.wearingStyle.volumeLook : 0,
  );
  const pantsPreference = max(
    t.widePantsGood ? vector.pantsFit.widePants : 0,
    t.straightPantsGood ? vector.pantsFit.straightPants : 0,
    t.denimGood ? vector.pantsFit.denim : 0,
    t.workPantsGood ? vector.pantsFit.workPants : 0,
    t.slimPantsGood ? vector.pantsFit.slimPants : 0,
    vector.pantsFit.undecided,
  );
  const activePantsPreference = max(
    vector.pantsFit.widePants,
    vector.pantsFit.straightPants,
    vector.pantsFit.denim,
    vector.pantsFit.workPants,
    vector.pantsFit.slimPants,
  );
  const sportPreference = t.sportOrigin && t.sportOrigin !== "none"
    ? vector.sportOrigin[t.sportOrigin]
    : vector.sportOrigin.noSportPreference;
  const activeSportPreference = max(
    vector.sportOrigin.basketball,
    vector.sportOrigin.tennis,
    vector.sportOrigin.football,
    vector.sportOrigin.skate,
    vector.sportOrigin.running,
  );
  const colorPreference = t.rareWearableColor
    ? max(vector.taste.rareColor, vector.color.rareColor, vector.color.oddColor, vector.color.warmAccent)
    : t.blackWhite
      ? max(vector.taste.classic, vector.taste.simple, vector.color.blackWhite)
      : max(vector.taste.classic, vector.taste.simple, vector.color.earthTone, vector.color.creamGum);
  const styleSportPreference = max(sportPreference, vector.style.normcore, vector.style.street);
  const activeStyleSportPreference = max(activeSportPreference, vector.style.normcore, vector.style.street);

  pushMatch(materialPreference, "preferred material and aging behavior", matchedSignals);
  pushMatch(max(cutPreference, wearingPreference), "preferred cut and wearing silhouette", matchedSignals);
  pushMatch(pantsPreference, "selected pants compatibility", matchedSignals);
  pushMatch(sportPreference, "selected sports origin", matchedSignals);
  pushMatch(colorPreference, "selected color and taste", matchedSignals);

  return {
    historyOrigin: fitAxis(product.historyOrigin, max(vector.taste.classic, vector.style.amekaji), CAPS.historyOrigin),
    materialAging: fitPreferenceAxis(product.materialAging, materialPreference, activeMaterialPreference, CAPS.materialAging, 0.45),
    silhouetteCutWearing: fitPreferenceAxis(product.silhouetteCutWearing, max(cutPreference, wearingPreference), activeCutWearingPreference, CAPS.silhouetteCutWearing, 0.5),
    pantsCompatibility: fitPreferenceAxis(product.pantsCompatibility, pantsPreference, activePantsPreference, CAPS.pantsCompatibility, 0.35),
    colorTaste: fitAxis(product.colorTaste, colorPreference, CAPS.colorTaste),
    styleSportContext: fitPreferenceAxis(product.styleSportContext, styleSportPreference, activeStyleSportPreference, CAPS.styleSportContext, 0.45),
    affordability: recommendationAffordability(features.estimatedPriceYen, vector),
    playfulness: fitAxis(product.playfulness, max(vector.taste.rareColor, vector.taste.limitedCollab, vector.color.oddColor), CAPS.playfulness),
  };
}

function collectProductDeductions(features: RyoSneakerFeatures, penalties: string[], cautions: string[]): number {
  const t = features.traits;
  let deduction = 0;
  deduction += recordPenalty(t.trendOnly, 15, "trend-only recommendation", penalties, cautions);
  deduction += recordPenalty(t.overlyFuturistic, 10, "overly futuristic look", penalties, cautions);
  deduction += recordPenalty(t.largeNLogo, 10, "large N on New Balance 990 v5+", penalties, cautions);
  deduction += recordPenalty(t.poorPantsCompatibility, 8, "poor pants compatibility", penalties, cautions);
  deduction += recordPenalty(t.poorAgingPotential, 6, "poor aging potential", penalties, cautions);
  return deduction;
}

function collectRecommendationDeductions(
  vector: RyoPreferenceVector,
  features: RyoSneakerFeatures,
  penalties: string[],
  cautions: string[],
): number {
  const t = features.traits;
  let deduction = 0;
  deduction += recordPenalty(!features.verified, 25, "unverified model", penalties, cautions);
  deduction += recordPenalty(features.isAbstractName, 20, "abstract recommendation name", penalties, cautions);
  deduction += recordPenalty(features.hasLocalizedMainName, 18, "localized Japanese display name as main title", penalties, cautions);
  deduction += recordPenalty(t.resaleTooExpensiveForBeginner, 12, "resale too expensive for beginner", penalties, cautions);
  deduction += recordPenalty(t.popularityOnlyReason, 6, "Air Force 1 recommended only because it is popular", penalties, cautions);
  deduction += recordPenalty(t.flashyColorWithoutWearability, 5, "flashy colorway without wearability", penalties, cautions);

  const strengthFactor = ryoPenaltyStrength(vector);
  const airForceContextPenalty = calculateAirForce1ContextPenalty(vector, features, strengthFactor);
  deduction += recordPenalty(airForceContextPenalty > 0, airForceContextPenalty, "AF1 is a conditional staple outside the amekaji core", penalties, cautions);
  const alternativePenalty = Math.round(18 * strengthFactor);
  deduction += recordPenalty(t.betterRyoAlternativeExists, alternativePenalty, "better Ryo alternative exists for this answer", penalties, cautions);
  const techToleranceFactor = vector.techTolerance.pureCoolOk > 0 ? 0.25
    : t.techAllowedModel && vector.techTolerance.airMaxNbOk > 0 ? 0
      : vector.techTolerance.heritageTechOk > 0 || vector.techTolerance.oldTechLookOk > 0 ? 0.55 : 1;
  if (t.tooTechnical && !(t.techAllowedModel && vector.techTolerance.airMaxNbOk > 0)) {
    const value = Math.round(10 * strengthFactor * techToleranceFactor);
    deduction += recordPenalty(value > 0, value, "too technical for Ryo Mode", penalties, cautions);
  }
  if (t.ryoDiscouragedModel) {
    const value = Math.round(10 * strengthFactor * techToleranceFactor);
    deduction += recordPenalty(value > 0, value, "model sits outside the classic Ryo axis", penalties, cautions);
  }
  const highCutMismatch = vector.cut.high > 0 && t.lowCut && !t.highCut && !t.midCut;
  deduction += recordPenalty(highCutMismatch, Math.round(10 * strengthFactor), "high cut selected but candidate is low-cut", penalties, cautions);

  const basketballMismatch = vector.sportOrigin.basketball > 0
    && t.sportOrigin !== undefined
    && t.sportOrigin !== "basketball"
    && t.canvas
    && t.lowCut;
  deduction += recordPenalty(basketballMismatch, Math.round(8 * strengthFactor), "basketball origin selected but candidate is from another sport context", penalties, cautions);

  const leatherAgingSelected = vector.materialAging.leatherSinking > 0 || vector.materialAging.leatherCreasing > 0;
  const canvasPrimaryWithoutCanvasRequest = leatherAgingSelected && t.canvas && !t.leather && !t.suede && vector.materialAging.canvasFading <= 0;
  deduction += recordPenalty(canvasPrimaryWithoutCanvasRequest, Math.round(8 * strengthFactor), "leather aging selected but candidate is canvas-primary", penalties, cautions);

  const lowCanvasVolumeMismatch = vector.wearingStyle.volumeLook > 0 && t.lowCut && t.canvas && !t.highCut && !t.midCut;
  deduction += recordPenalty(lowCanvasVolumeMismatch, Math.round(6 * strengthFactor), "volume look selected but candidate is low canvas", penalties, cautions);
  return deduction;
}

function calculateAirForce1ContextPenalty(
  vector: RyoPreferenceVector,
  features: RyoSneakerFeatures,
  strengthFactor: number,
): number {
  if (!features.traits.airForce1WhiteWhite || vector.style.amekaji <= 0) return 0;
  let penalty = 8;
  if (vector.pantsFit.workPants > 0) penalty += 6;
  if (vector.ryoStrength.ryoStrong > 0) penalty += 8;
  if (vector.taste.mutedColor > 0 || vector.taste.rareColor > 0 || vector.materialAging.suedeFadingNap > 0) penalty += 4;
  return Math.round(penalty * strengthFactor);
}

function fitAxis(base: number, preference: number, cap: number): number {
  if (preference <= 0) return base;
  return capped(base + (cap - base) * (preference / 100) * 0.45, cap);
}

function fitPreferenceAxis(base: number, matchedPreference: number, activePreference: number, cap: number, mismatchFactor: number): number {
  if (activePreference <= 0) return base;
  if (matchedPreference > 0) return fitAxis(base, matchedPreference, cap);
  return capped(base * mismatchFactor, cap);
}

function productAffordability(price?: number): number {
  if (price === undefined || !Number.isFinite(price) || price < 0) return 0;
  if (price <= 20_000) return 8;
  if (price <= 25_000) return 6;
  if (price <= 35_000) return 4;
  return 2;
}

function recommendationAffordability(price: number | undefined, vector: RyoPreferenceVector): number {
  if (price === undefined || !Number.isFinite(price) || price < 0) return 0;
  const summary = summarizeRyoPreferenceVector(vector);
  if (summary.budgetCeilingYen === undefined) return vector.budget.premiumOk > 0 ? 8 : productAffordability(price);
  if (price <= summary.budgetCeilingYen) return 8;
  const ratio = summary.budgetCeilingYen / price;
  return capped(Math.round(8 * ratio * ratio * 10) / 10, 8);
}

function ryoPenaltyStrength(vector: RyoPreferenceVector): number {
  if (vector.ryoStrength.ryoStrong > 0) return 1;
  if (vector.ryoStrength.ryoMode > 0) return 0.75;
  if (vector.ryoStrength.beginnerRyo > 0) return 0.7;
  if (vector.ryoStrength.ryoLight > 0) return 0.5;
  return 0.25;
}

function recordPenalty(condition: boolean | undefined, value: number, label: string, penalties: string[], cautions: string[]): number {
  if (!condition || value <= 0) return 0;
  penalties.push(`${label} (-${value})`);
  cautions.push(label);
  return value;
}

function pantsTraitCount(t: RyoSneakerFeatures["traits"]): number {
  return countTrue(t.widePantsGood, t.straightPantsGood, t.denimGood, t.workPantsGood, t.slimPantsGood);
}

function countTrue(...values: (boolean | undefined)[]): number {
  return values.filter(Boolean).length;
}

function pushMatch(value: number, label: string, signals: string[]): void {
  if (value >= 60) signals.push(label);
}

function max(...values: number[]): number {
  return Math.max(0, ...values);
}

function capped(value: number, cap: number): number {
  return Math.min(cap, Math.max(0, Math.round(value * 10) / 10));
}

function sumBreakdown(value: RyoModeScoreBreakdown): number {
  return Object.values(value).reduce((sum, score) => sum + score, 0);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
