import { normalizeRyoSneakerFeatures } from "./features";
import { buildParentModelExplanation, findRyoParentModelProfile, scoreRyoParentModelAffinity } from "./parent-models";
import { buildRetroRunningExplanation, findRetroRunningProfile, scoreRyoRetroRunningAffinity } from "./retro-running";
import { buildRyoTemplateExplanation, rankRyoStyleTemplates } from "./templates";
import type { RyoCulturalEvaluation, RyoPreferenceVector, RyoSneakerFeatures } from "./types";

export function buildRyoCulturalEvaluation(candidateName: string, vector: RyoPreferenceVector, rawFeatures: RyoSneakerFeatures): RyoCulturalEvaluation {
  const features = normalizeRyoSneakerFeatures(rawFeatures);
  const parentProfile = findRyoParentModelProfile(candidateName);
  const retroRunningProfile = findRetroRunningProfile(candidateName);
  const rankedTemplates = rankRyoStyleTemplates(candidateName, vector, features);
  const selectedTemplates = rankedTemplates.slice(0, 2).map((item) => item.template);
  const parentModelAffinity = scoreRyoParentModelAffinity(candidateName, vector);
  const templateAffinity = rankedTemplates[0]?.score ?? 0;
  const retroRunningAffinity = scoreRyoRetroRunningAffinity(candidateName, vector);
  const materialAgingAffinity = scoreMaterialAffinity(vector, features);
  const pantsAffinity = scorePantsAffinity(vector, features);
  const cultureAffinity = averagePositive(parentModelAffinity, templateAffinity, retroRunningAffinity);
  const cautionPenalty = calculateCautionPenalty(candidateName, vector, retroRunningProfile?.ryoCenter);
  const reasons = [
    ...(parentProfile ? [buildParentModelExplanation(candidateName, parentProfile)] : []),
    ...(selectedTemplates.length ? [buildRyoTemplateExplanation(candidateName, selectedTemplates)] : []),
    ...(retroRunningProfile ? [buildRetroRunningExplanation(candidateName, retroRunningProfile)] : []),
  ];
  const cautions = unique([
    ...(parentProfile?.cautions ?? []),
    ...(retroRunningProfile?.cautions ?? []),
    ...(cautionPenalty > 0 ? [cautionFor(candidateName, retroRunningProfile?.ryoCenter)] : []),
  ]);
  return {
    affinities: { parentModelAffinity, templateAffinity, retroRunningAffinity, cultureAffinity, materialAgingAffinity, pantsAffinity, cautionPenalty },
    metadata: {
      ...(parentProfile ? { parentModelIds: [parentProfile.id] } : {}),
      ...(selectedTemplates.length ? { templateIds: selectedTemplates.map((item) => item.id) } : {}),
      ...(retroRunningProfile ? { retroRunningProfiles: [retroRunningProfile.id], genre: retroRunningProfile.genre, subgenre: retroRunningProfile.subgenre } : parentProfile ? { genre: parentProfile.styleSignals.join("・") } : {}),
      ...(parentProfile?.cultureSignals.length ? { cultureSignals: [...parentProfile.cultureSignals] } : retroRunningProfile ? { cultureSignals: [...retroRunningProfile.cultureSignals] } : {}),
      ...(parentProfile?.musicSignals.length ? { musicSignals: [...parentProfile.musicSignals] } : {}),
      materialSignals: unique([...(parentProfile?.materialAgingSignals ?? []), ...(retroRunningProfile?.materialSignals ?? [])]),
      pantsSignals: unique([...(parentProfile?.pantsSignals ?? []), ...(retroRunningProfile?.pantsSignals ?? [])]),
      ...(cautions.length ? { cautionSignals: cautions } : {}),
      verificationStatus: features.verified ? "verified" : "needs_check",
    },
    ...(parentProfile ? { parentProfile } : {}),
    templates: selectedTemplates,
    ...(retroRunningProfile ? { retroRunningProfile } : {}),
    reasons: unique(reasons),
    cautions,
  };
}

function scoreMaterialAffinity(v: RyoPreferenceVector, f: RyoSneakerFeatures): number {
  const t = f.traits;
  const values = [
    t.leather ? Math.max(v.materialAging.leatherSinking, v.materialAging.leatherCreasing) : 0,
    t.suede ? v.materialAging.suedeFadingNap : 0,
    t.canvas ? v.materialAging.canvasFading : 0,
    t.goreTex ? v.materialAging.goreTexUtility : 0,
  ];
  return Math.max(...values, v.materialAging.overallAgingPotential > 0 ? 65 : 0);
}

function scorePantsAffinity(v: RyoPreferenceVector, f: RyoSneakerFeatures): number {
  const t = f.traits;
  return Math.max(
    t.widePantsGood ? v.pantsFit.widePants : 0,
    t.straightPantsGood ? v.pantsFit.straightPants : 0,
    t.denimGood ? v.pantsFit.denim : 0,
    t.workPantsGood ? v.pantsFit.workPants : 0,
    t.slimPantsGood ? v.pantsFit.slimPants : 0,
  );
}

function calculateCautionPenalty(name: string, v: RyoPreferenceVector, ryoCenter?: boolean): number {
  let penalty = 0;
  if (/air force 1 low/i.test(name) && v.style.amekaji > 0 && v.pantsFit.workPants > 0 && v.ryoStrength.ryoStrong > 0) penalty += 25;
  if (/air max 95|new balance (1906|9060|1000)/i.test(name) && v.techTolerance.avoidTech > 0) penalty += 30;
  if (ryoCenter === false && v.ryoStrength.ryoStrong > 0) penalty += 12;
  if (/puma speedcat|vans knu skool|new balance 990v[5-9]/i.test(name)) penalty += 18;
  return Math.min(40, penalty);
}

function cautionFor(name: string, ryoCenter?: boolean): string {
  return ryoCenter === false || /air max|1906|9060/i.test(name)
    ? "Ryo classic tasteとは別枠です。ハイテク感または現代的ボリュームを許容する場合だけ候補に残します。"
    : "Ryo Modeの中心モデルではないため、服装条件との一致を優先して判断します。";
}

function averagePositive(...values: number[]): number {
  const active = values.filter((value) => value > 0);
  return active.length ? Math.round(active.reduce((sum, value) => sum + value, 0) / active.length) : 0;
}
function unique(values: readonly string[]): string[] { return [...new Set(values.filter(Boolean))]; }
