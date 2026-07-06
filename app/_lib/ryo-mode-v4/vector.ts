import { RYO_MODE_V4_QUESTIONS } from "./questions";
import type {
  RyoModeAnswers,
  RyoModeQuestionId,
  RyoPreferenceSummary,
  RyoPreferenceVector,
} from "./types";

type MutableRecord = Record<string, number>;

export function createEmptyRyoPreferenceVector(): RyoPreferenceVector {
  return {
    style: { amekaji: 0, normcore: 0, street: 0, cleanCasual: 0, undecided: 0 },
    pantsFit: { widePants: 0, straightPants: 0, denim: 0, workPants: 0, slimPants: 0, undecided: 0 },
    taste: { classic: 0, simple: 0, mutedColor: 0, rareColor: 0, limitedCollab: 0 },
    sportOrigin: { basketball: 0, tennis: 0, football: 0, skate: 0, running: 0, noSportPreference: 0 },
    cut: { high: 0, low: 0, ox: 0, mid: 0, dependsOnModel: 0 },
    wearingStyle: { tiedSilhouette: 0, looseFit: 0, slimLook: 0, volumeLook: 0, noPreference: 0 },
    materialAging: { leatherSinking: 0, leatherCreasing: 0, suedeFadingNap: 0, canvasFading: 0, goreTexUtility: 0, overallAgingPotential: 0 },
    color: { blackWhite: 0, earthTone: 0, warmAccent: 0, oddColor: 0, creamGum: 0, rareColor: 0 },
    budget: { under15000: 0, under20000: 0, under25000: 0, under35000: 0, premiumOk: 0 },
    techTolerance: { avoidTech: 0, heritageTechOk: 0, oldTechLookOk: 0, pureCoolOk: 0, airMaxNbOk: 0 },
    ryoStrength: { balanced: 0, ryoLight: 0, ryoMode: 0, ryoStrong: 0, beginnerRyo: 0 },
  };
}

const optionTargets: Record<RyoModeQuestionId, Record<string, readonly string[]>> = {
  style: { amekaji: ["amekaji"], normcore: ["normcore"], street: ["street"], clean_casual: ["cleanCasual"], undecided: ["undecided"] },
  pantsFit: { wide_pants: ["widePants"], straight_pants: ["straightPants"], denim: ["denim"], work_pants: ["workPants"], slim_pants: ["slimPants"], undecided: ["undecided"] },
  taste: { classic: ["classic"], simple: ["simple"], muted_color: ["mutedColor"], rare_color: ["rareColor"], limited_collab: ["limitedCollab"] },
  sportOrigin: { basketball: ["basketball"], tennis: ["tennis"], football: ["football"], skate: ["skate"], running: ["running"], no_sport: ["noSportPreference"] },
  cut: { high: ["high"], low: ["low"], ox: ["ox"], mid: ["mid"], depends_on_model: ["dependsOnModel"] },
  wearingStyle: { tied_silhouette: ["tiedSilhouette"], loose_fit: ["looseFit"], slim_look: ["slimLook"], volume_look: ["volumeLook"], no_preference: ["noPreference"] },
  materialAging: { leather_sinking: ["leatherSinking", "leatherCreasing"], suede_fading_nap: ["suedeFadingNap"], canvas_fading: ["canvasFading"], gore_tex: ["goreTexUtility"], aging_material: ["overallAgingPotential"] },
  color: { black_white: ["blackWhite"], earth_tone: ["earthTone"], warm_accent: ["warmAccent"], odd_color: ["oddColor"], cream_gum: ["creamGum"], rare_color: ["rareColor"] },
  budget: { under_15000: ["under15000"], under_20000: ["under20000"], under_25000: ["under25000"], under_35000: ["under35000"], premium_ok: ["premiumOk"] },
  techTolerance: { avoid_tech: ["avoidTech"], heritage_tech_ok: ["heritageTechOk"], old_tech_look_ok: ["oldTechLookOk"], pure_cool_ok: ["pureCoolOk"], airmax_nb_ok: ["airMaxNbOk"] },
  ryoStrength: { balanced: ["balanced"], ryo_light: ["ryoLight"], ryo_mode: ["ryoMode"], ryo_strong: ["ryoStrong"], beginner_ryo: ["beginnerRyo"] },
};

export function buildRyoPreferenceVector(answers: RyoModeAnswers): RyoPreferenceVector {
  const vector = createEmptyRyoPreferenceVector();
  const normalizedAnswers = Array.isArray(answers)
    ? Object.fromEntries(answers.map((answer) => [answer.questionId, answer.optionId]))
    : answers;

  for (const question of RYO_MODE_V4_QUESTIONS) {
    const rawOption = (normalizedAnswers as Readonly<Record<string, unknown>>)[question.id];
    if (typeof rawOption !== "string") continue;
    const targets = optionTargets[question.id][rawOption];
    if (!targets) continue;
    const axis = vector[question.id] as MutableRecord;
    for (const target of targets) axis[target] = 100;
  }

  return normalizeRyoPreferenceVector(vector);
}

export function normalizeRyoPreferenceVector(vector: RyoPreferenceVector): RyoPreferenceVector {
  const normalized = createEmptyRyoPreferenceVector();
  for (const axisName of Object.keys(normalized) as (keyof RyoPreferenceVector)[]) {
    const target = normalized[axisName] as MutableRecord;
    const source = vector[axisName] as MutableRecord;
    for (const key of Object.keys(target)) target[key] = clampVectorValue(source[key]);
  }
  return normalized;
}

export function summarizeRyoPreferenceVector(vector: RyoPreferenceVector): RyoPreferenceSummary {
  const normalized = normalizeRyoPreferenceVector(vector);
  const labels: Record<string, string> = {
    widePants: "wide pants", straightPants: "straight pants", denim: "denim", workPants: "work pants",
    classic: "classic", rareColor: "rare wearable color", tiedSilhouette: "tied silhouette",
    leatherSinking: "leather aging", suedeFadingNap: "suede aging", canvasFading: "canvas aging",
  };
  const dominantSignals = Object.values(normalized)
    .flatMap((axis) => Object.entries(axis))
    .filter(([key, value]) => value >= 60 && labels[key])
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => labels[key]!)
    .slice(0, 6);
  const budgetCeilingYen = normalized.budget.under15000 > 0 ? 15_000
    : normalized.budget.under20000 > 0 || normalized.ryoStrength.beginnerRyo > 0 ? 20_000
      : normalized.budget.under25000 > 0 ? 25_000
        : normalized.budget.under35000 > 0 ? 35_000 : undefined;
  const ryoInfluence = normalized.ryoStrength.ryoStrong > 0 ? "strong"
    : normalized.ryoStrength.ryoMode > 0 ? "standard"
      : normalized.ryoStrength.ryoLight > 0 ? "light"
        : normalized.ryoStrength.beginnerRyo > 0 ? "beginner" : "balanced";

  return {
    dominantSignals,
    ...(budgetCeilingYen === undefined ? {} : { budgetCeilingYen }),
    allowsTechnicalModels: normalized.techTolerance.airMaxNbOk > 0 || normalized.techTolerance.pureCoolOk > 0,
    ryoInfluence,
  };
}

function clampVectorValue(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}
