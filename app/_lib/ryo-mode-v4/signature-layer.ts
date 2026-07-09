import { ryoModeSeed } from "../core-v1/ryoModeSeed";
import type { CandidateProfile } from "../core-v1/types";
import type { RyoModeCandidateEvaluation } from "./integration";
import type {
  RyoPreferenceVector,
  RyoRecommendationBucket,
  RyoSignatureMetadata,
} from "./types";

type SignatureLayerInput = {
  candidate: CandidateProfile;
  vector: RyoPreferenceVector;
  evaluation: RyoModeCandidateEvaluation;
};

type OwnedReference = {
  displayName: string;
  normalizedName: string;
  normalizedFamily: string;
  colorTokens: string[];
};

const ownedReferences: OwnedReference[] = ryoModeSeed.ownedModels.map((item) => ({
  displayName: item.model,
  normalizedName: normalizeName(item.model),
  normalizedFamily: normalizeName(item.family),
  colorTokens: extractColorTokens(item.model),
}));

export function applyRyoSignatureLayer(input: SignatureLayerInput): RyoSignatureMetadata {
  const obviousnessPenalty = calculateObviousnessPenalty(input);
  const ryoTwistBonus = calculateRyoTwistBonus(input);
  const adjacentDiscoveryBonus = calculateAdjacentDiscoveryBonus(input);
  const materialStoryBonus = calculateMaterialStoryBonus(input);
  const colorPersonalityBonus = calculateColorPersonalityBonus(input);
  const archiveContextBonus = calculateArchiveContextBonus(input);
  const ownedReferenceMatches = findOwnedReferenceMatches(input.candidate.name);
  const ownedDuplicatePenalty = calculateOwnedDuplicatePenalty(input, ownedReferenceMatches);
  const bucket = assignRyoRecommendationBucket({
    ...input,
    obviousnessPenalty,
    ryoTwistBonus,
    adjacentDiscoveryBonus,
    materialStoryBonus,
    colorPersonalityBonus,
    archiveContextBonus,
    ownedDuplicatePenalty,
  });
  const rawAdjustment = ryoTwistBonus + adjacentDiscoveryBonus + materialStoryBonus + colorPersonalityBonus + archiveContextBonus
    - obviousnessPenalty - ownedDuplicatePenalty;
  const simpleBeginnerCap = isSimpleBeginnerContext(input.vector)
    ? bucket === "practical_buy" || isPlainObviousClassic(normalizeName(input.candidate.name)) ? 10 : 4
    : 24;
  const totalAdjustment = round(
    clamp(
      rawAdjustment,
      -30,
      simpleBeginnerCap,
    ),
  );

  return {
    bucket,
    obviousnessPenalty,
    ryoTwistBonus,
    adjacentDiscoveryBonus,
    materialStoryBonus,
    colorPersonalityBonus,
    archiveContextBonus,
    ownedDuplicatePenalty,
    totalAdjustment,
    reasons: buildSignatureReasons({
      bucket,
      obviousnessPenalty,
      ryoTwistBonus,
      adjacentDiscoveryBonus,
      materialStoryBonus,
      colorPersonalityBonus,
      archiveContextBonus,
      ownedDuplicatePenalty,
      ownedReferenceMatches,
    }),
    ownedReferenceMatches,
  };
}

export function calculateObviousnessPenalty(input: SignatureLayerInput): number {
  const name = normalizeName(input.candidate.name);
  if (!isPlainObviousClassic(name)) return 0;

  let penalty = 5;
  if (hasStorySeekingContext(input.vector)) penalty += 4;
  if (input.vector.ryoStrength.ryoMode > 0 || input.vector.ryoStrength.ryoStrong > 0) penalty += 3;
  if (input.vector.materialAging.leatherSinking > 0 || input.vector.materialAging.suedeFadingNap > 0 || input.vector.materialAging.canvasFading > 0) {
    penalty += 2;
  }
  if (/samba og/.test(name) && input.vector.sportOrigin.football > 0) penalty -= 2;
  if (/vans authentic/.test(name) && input.vector.sportOrigin.skate > 0) penalty -= 3;
  if (/air force 1/.test(name) && input.vector.sportOrigin.basketball > 0 && input.vector.style.amekaji <= 0) penalty -= 2;

  const simpleProtection =
    (input.vector.ryoStrength.beginnerRyo > 0 ? 8 : 0)
      + (input.vector.taste.simple > 0 ? 4 : 0)
      + (input.vector.style.normcore > 0 ? 4 : 0)
      + (input.vector.budget.under15000 > 0 ? 3 : 0)
      + (input.vector.budget.under20000 > 0 ? 2 : 0);

  return round(clamp(penalty - simpleProtection, 0, 16));
}

export function calculateRyoTwistBonus(input: SignatureLayerInput): number {
  const name = normalizeName(input.candidate.name);
  const traits = input.evaluation.features.traits;
  let bonus = 0;

  if (traits.madeInJapan || /\bmij\b|\bj vtg\b|all star j|one star j|pro leather j/.test(name)) bonus += 4;
  if (traits.vintage || traits.timeLine || /vtg|vintage|timeline|addict|1935|aged|reissue/.test(name)) bonus += 4;
  if (/made in germany|\bmig\b|gore tex|gore-tex|vibram|charles f stead|okayama|waxed|denim/.test(name)) bonus += 3;
  if (traits.rareWearableColor || hasWearableOddColor(name)) bonus += 3;
  if (isLessObviousSibling(name)) bonus += 4;
  if (input.evaluation.culture.affinities.cultureAffinity >= 70) bonus += 2;

  return round(clamp(isSimpleBeginnerContext(input.vector) ? Math.min(bonus, 7) : bonus, 0, 16));
}

export function calculateAdjacentDiscoveryBonus(input: SignatureLayerInput): number {
  const name = normalizeName(input.candidate.name);
  const vector = input.vector;
  let bonus = 0;

  if (
    /adidas (tobacco|hamburg|london|handball spezial|spezial|bern|galapagos|japan|superstar vintage|country og)/.test(name)
    && (hasStorySeekingContext(vector) || vector.sportOrigin.football > 0 || vector.materialAging.suedeFadingNap > 0 || vector.color.creamGum > 0)
  ) {
    bonus += 8;
  }
  if (
    /converse (pro leather|star bars|star and bars|jack purcell 1935|jack purcell leather|all star j vtg|all star aged|addict|one star loafer)/.test(name)
    && (vector.style.amekaji > 0 || vector.pantsFit.denim > 0 || vector.cut.high > 0 || hasMaterialPreference(vector))
  ) {
    bonus += 7;
  }
  if (
    /vans (era 95|half cab|style 36|otw|premium|reissue|og authentic|authentic lx)/.test(name)
    && (vector.sportOrigin.skate > 0 || vector.materialAging.canvasFading > 0 || vector.style.amekaji > 0)
  ) {
    bonus += 6;
  }
  if (
    /(nike (terminator|blazer|cortez)|air jordan 1 high|converse weapon)/.test(name)
    && (vector.sportOrigin.basketball > 0 || vector.materialAging.leatherCreasing > 0 || vector.style.amekaji > 0)
  ) {
    bonus += 6;
  }
  if (
    /new balance (990v3|990v4|991|998|1500)/.test(name)
    && (vector.sportOrigin.running > 0 || vector.budget.premiumOk > 0)
  ) {
    bonus += 5;
  }

  return round(clamp(isSimpleBeginnerContext(vector) ? Math.min(bonus, 2) : bonus, 0, 12));
}

export function calculateOwnedDuplicatePenalty(
  input: SignatureLayerInput,
  ownedReferenceMatches = findOwnedReferenceMatches(input.candidate.name),
): number {
  if (ownedReferenceMatches.length === 0) return 0;
  const candidateSpecificity = calculateSpecificity(normalizeName(input.candidate.name));
  let penalty = candidateSpecificity >= 5 ? 13 : 9;
  if (input.vector.ryoStrength.ryoStrong > 0) penalty += 3;
  if (input.vector.ryoStrength.beginnerRyo > 0 || input.vector.taste.simple > 0) penalty -= 3;
  return round(clamp(penalty, 5, 18));
}

export function assignRyoRecommendationBucket(input: SignatureLayerInput & {
  obviousnessPenalty: number;
  ryoTwistBonus: number;
  adjacentDiscoveryBonus: number;
  materialStoryBonus: number;
  colorPersonalityBonus: number;
  archiveContextBonus: number;
  ownedDuplicatePenalty: number;
}): RyoRecommendationBucket {
  const candidate = input.candidate;
  const name = normalizeName(candidate.name);
  const twistTotal = input.ryoTwistBonus + input.materialStoryBonus + input.colorPersonalityBonus + input.archiveContextBonus;
  const practicalContext =
    (input.vector.ryoStrength.beginnerRyo > 0 || input.vector.taste.simple > 0 || input.vector.style.normcore > 0)
      && candidate.budgetFit >= 70
      && (candidate.priceYen === undefined || candidate.priceYen <= 20_000)
      && input.ownedDuplicatePenalty === 0
      && (!isLessObviousSibling(name) || isPlainObviousClassic(name));
  if (practicalContext && input.obviousnessPenalty <= 2) return "practical_buy";
  if (twistTotal >= 13 && input.ownedDuplicatePenalty < 14) return "ryo_signature";
  if (input.adjacentDiscoveryBonus >= 7 && input.ownedDuplicatePenalty < 12) return "adjacent_discovery";
  if (input.colorPersonalityBonus >= 5 && input.evaluation.features.verified && input.evaluation.score.recommendationScore >= 45) return "wildcard";
  return "anchor_classic";
}

function calculateMaterialStoryBonus(input: SignatureLayerInput): number {
  const traits = input.evaluation.features.traits;
  let bonus = 0;
  if ((input.vector.materialAging.leatherSinking > 0 || input.vector.materialAging.leatherCreasing > 0) && traits.leather) bonus += 5;
  if (input.vector.materialAging.suedeFadingNap > 0 && traits.suede) bonus += 5;
  if (input.vector.materialAging.canvasFading > 0 && traits.canvas) bonus += 4;
  if (input.vector.materialAging.goreTexUtility > 0 && traits.goreTex) bonus += 3;
  if (/gum|aged sole|waxed|denim|washed|vibram|gore tex|gore-tex/i.test(input.candidate.name)) bonus += 2;
  return round(clamp(bonus, 0, 10));
}

function calculateColorPersonalityBonus(input: SignatureLayerInput): number {
  const name = normalizeName(input.candidate.name);
  const wantsColor =
    input.vector.taste.rareColor > 0
      || input.vector.color.rareColor > 0
      || input.vector.color.oddColor > 0
      || input.vector.color.warmAccent > 0
      || input.vector.color.earthTone > 0
      || input.vector.color.creamGum > 0;
  if (!wantsColor && !hasWearableOddColor(name) && !input.evaluation.features.traits.rareWearableColor) return 0;

  let bonus = input.evaluation.features.traits.rareWearableColor ? 4 : 0;
  if (hasWearableOddColor(name)) bonus += wantsColor ? 5 : 3;
  if (/black white|white black|white white/.test(name) && !/cream|gum|sail|aged/.test(name)) bonus -= 2;
  return round(clamp(bonus, 0, 8));
}

function calculateArchiveContextBonus(input: SignatureLayerInput): number {
  const name = normalizeName(input.candidate.name);
  const traits = input.evaluation.features.traits;
  let bonus = 0;
  if (traits.madeInJapan || traits.madeInGermany || traits.madeInUsa) bonus += 3;
  if (traits.vintage || traits.timeLine || /vtg|vintage|timeline|addict|1935|reissue|og|aged/.test(name)) bonus += 4;
  if (/city series|tobacco|hamburg|london|bern|galapagos|japan|superstar vintage|pro leather|terminator|blazer|half cab/.test(name)) bonus += 3;
  if (traits.sportOrigin && traits.sportOrigin !== "none") bonus += 2;
  return round(clamp(isSimpleBeginnerContext(input.vector) ? Math.min(bonus, 4) : bonus, 0, 12));
}

function findOwnedReferenceMatches(candidateName: string): string[] {
  const candidate = normalizeName(candidateName);
  const candidateColors = extractColorTokens(candidateName);
  const candidateSpecificity = calculateSpecificity(candidate);
  const candidateIsSpecific = candidateSpecificity >= 4;
  if (!candidateIsSpecific) return [];

  return ownedReferences
    .filter((owned) => {
      if (candidate === owned.normalizedName) return true;
      if (candidate.length >= 14 && (owned.normalizedName.includes(candidate) || candidate.includes(owned.normalizedName))) return true;
      if (!owned.normalizedFamily || !candidate.includes(owned.normalizedFamily)) return false;
      const sharedColors = candidateColors.filter((token) => owned.colorTokens.includes(token));
      return sharedColors.length > 0 && hasSpecificVersionOverlap(candidate, owned.normalizedName);
    })
    .map((owned) => owned.displayName)
    .slice(0, 3);
}

function buildSignatureReasons(input: {
  bucket: RyoRecommendationBucket;
  obviousnessPenalty: number;
  ryoTwistBonus: number;
  adjacentDiscoveryBonus: number;
  materialStoryBonus: number;
  colorPersonalityBonus: number;
  archiveContextBonus: number;
  ownedDuplicatePenalty: number;
  ownedReferenceMatches: string[];
}): string[] {
  const reasons: string[] = [`bucket:${input.bucket}`];
  if (input.ryoTwistBonus > 0) reasons.push(`Ryo twist bonus +${input.ryoTwistBonus}`);
  if (input.adjacentDiscoveryBonus > 0) reasons.push(`adjacent discovery bonus +${input.adjacentDiscoveryBonus}`);
  if (input.materialStoryBonus > 0) reasons.push(`material story bonus +${input.materialStoryBonus}`);
  if (input.colorPersonalityBonus > 0) reasons.push(`color personality bonus +${input.colorPersonalityBonus}`);
  if (input.archiveContextBonus > 0) reasons.push(`archive context bonus +${input.archiveContextBonus}`);
  if (input.obviousnessPenalty > 0) reasons.push(`obvious safe-classic penalty -${input.obviousnessPenalty}`);
  if (input.ownedDuplicatePenalty > 0) reasons.push(`owned reference penalty -${input.ownedDuplicatePenalty}`);
  if (input.ownedReferenceMatches.length > 0) reasons.push(`owned reference: ${input.ownedReferenceMatches.join(" / ")}`);
  return [...new Set(reasons)];
}

function isPlainObviousClassic(name: string): boolean {
  return /nike air force 1 low.*white white/.test(name)
    || /^adidas samba og(?:\b|$)/.test(name)
    || /^vans authentic(?: black white| white black| black black)?$/.test(name)
    || /^converse all star (hi|ox|low|black|white|canvas)/.test(name) && !/\b(j|vtg|timeline|addict|aged|waxed|okayama|made in japan)\b/.test(name)
    || /^puma suede(?: black white| white black)?$/.test(name)
    || /^adidas superstar(?: black white| white black)?$/.test(name);
}

function isLessObviousSibling(name: string): boolean {
  return /tobacco|hamburg|london|spezial|bern|galapagos|adidas japan|superstar vintage|pro leather|star bars|star and bars|jack purcell 1935|all star j vtg|addict|terminator|blazer|cortez|era 95|half cab|style 36|990v3|990v4|991|998|1500/.test(name);
}

function hasStorySeekingContext(vector: RyoPreferenceVector): boolean {
  return vector.style.amekaji > 0
    || vector.taste.classic > 0
    || vector.taste.rareColor > 0
    || vector.ryoStrength.ryoMode > 0
    || vector.ryoStrength.ryoStrong > 0
    || hasMaterialPreference(vector);
}

function isSimpleBeginnerContext(vector: RyoPreferenceVector): boolean {
  return vector.ryoStrength.beginnerRyo > 0
    || (vector.taste.simple > 0 && (vector.style.normcore > 0 || vector.budget.under15000 > 0 || vector.budget.under20000 > 0));
}

function hasMaterialPreference(vector: RyoPreferenceVector): boolean {
  return vector.materialAging.leatherSinking > 0
    || vector.materialAging.leatherCreasing > 0
    || vector.materialAging.suedeFadingNap > 0
    || vector.materialAging.canvasFading > 0
    || vector.materialAging.overallAgingPotential > 0;
}

function hasWearableOddColor(name: string): boolean {
  return /\b(red|orange|burgundy|maroon|navy|indigo|brown|olive|green|gold|mustard|purple|wine|mesa|gum|cream|sail|aged|antique|sky blue)\b/.test(name);
}

function hasSpecificVersionOverlap(candidate: string, owned: string): boolean {
  const versionTokens = ["j", "vtg", "timeline", "addict", "1935", "mij", "made in japan", "gore tex", "gore-tex", "vibram", "aged", "waxed", "denim", "made in germany", "mig", "premium"];
  return versionTokens.some((token) => candidate.includes(token) && owned.includes(token));
}

function calculateSpecificity(normalizedName: string): number {
  const tokens = normalizedName.split(" ").filter(Boolean);
  const versionWeight = hasSpecificVersionOverlap(normalizedName, normalizedName) ? 2 : 0;
  const colorWeight = extractColorTokens(normalizedName).length > 0 ? 1 : 0;
  return tokens.length + versionWeight + colorWeight;
}

function extractColorTokens(value: string): string[] {
  const normalized = normalizeName(value);
  const colors = [
    "black", "white", "red", "orange", "burgundy", "maroon", "navy", "indigo", "brown", "olive",
    "green", "gold", "silver", "blue", "purple", "cream", "gum", "mesa", "sail", "gray", "grey",
  ];
  return colors.filter((color) => normalized.includes(color));
}

function normalizeName(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
