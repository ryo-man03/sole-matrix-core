import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { CandidateProfile, DiagnosisAnswer, DiagnosisAnswerValue, RecommendationMode } from "../core-v1/types";
import { buildRyoOpinion } from "./opinion";
import { buildRyoCulturalEvaluation } from "./cultural-evaluation";
import { RYO_MODE_V4_QUESTIONS } from "./questions";
import { clampRyoScore, scoreRyoModeCandidate } from "./scoring";
import { normalizeOfficialSneakerName } from "./names";
import type { RyoCulturalEvaluation, RyoModeAnswers, RyoModeQuestionId, RyoModeScoreResult, RyoOpinion, RyoPreferenceVector, RyoSneakerFeatures } from "./types";
import { hasJapaneseText, isAbstractRecommendationName, isOfficialEnglishDisplayName, validateRyoDisplayName } from "./validation";
import { buildRyoPreferenceVector, summarizeRyoPreferenceVector } from "./vector";

export type RyoModeRecommendationContext = {
  diagnosisAnswers: DiagnosisAnswer[];
  preferenceTags: SneakerTag[];
  budgetYen?: number;
  mode: RecommendationMode;
  vector: RyoPreferenceVector;
  answers: RyoModeAnswers;
};

export type RyoModeCandidateEvaluation = {
  features: RyoSneakerFeatures;
  score: RyoModeScoreResult;
  opinion: RyoOpinion;
  culture: RyoCulturalEvaluation;
};

export function mapRyoV4AnswersToLegacyDiagnosisInput(answers: RyoModeAnswers): DiagnosisAnswer[] {
  const selected = normalizeAnswers(answers);
  return [
    legacyAnswer("trusted-classic", selected.taste === "classic" || selected.style === "amekaji" ? "like" : "neutral"),
    legacyAnswer("simple-daily", selected.taste === "simple" || selected.style === "normcore" ? "like" : selected.taste === "limited_collab" ? "dislike" : "neutral"),
    legacyAnswer("street-presence", selected.style === "street" || selected.sportOrigin === "basketball" || selected.sportOrigin === "skate" ? "like" : "neutral"),
    legacyAnswer("soft-volume", selected.wearingStyle === "volume_look" || selected.cut === "high" || selected.cut === "mid" ? "like" : selected.wearingStyle === "slim_look" ? "dislike" : "neutral"),
    legacyAnswer("walking-comfort", selected.sportOrigin === "running" || selected.materialAging === "gore_tex" ? "like" : "neutral"),
    legacyAnswer("long-use", selected.materialAging ? "like" : "neutral"),
    legacyAnswer("sporty-mood", selected.sportOrigin && selected.sportOrigin !== "no_sport" ? "like" : selected.sportOrigin === "no_sport" ? "dislike" : "neutral"),
    legacyAnswer("premium-detail", selected.budget === "premium_ok" || selected.taste === "limited_collab" ? "like" : selected.budget === "under_15000" ? "dislike" : "neutral"),
  ];
}

export function mapRyoPreferenceVectorToCoreInputTags(vector: RyoPreferenceVector): SneakerTag[] {
  const tags: SneakerTag[] = [];
  const add = (condition: boolean, tag: SneakerTag) => { if (condition && !tags.includes(tag)) tags.push(tag); };
  add(vector.taste.classic > 0, "classic");
  add(vector.style.amekaji > 0 || vector.techTolerance.heritageTechOk > 0, "heritage");
  add(vector.style.street > 0 || vector.sportOrigin.skate > 0, "street");
  add(vector.sportOrigin.basketball > 0, "basketball");
  add(vector.sportOrigin.running > 0, "running");
  add(vector.materialAging.canvasFading > 0, "canvas");
  add(vector.techTolerance.avoidTech > 0, "low_tech");
  add(vector.taste.simple > 0 || vector.style.normcore > 0, "minimal");
  add(vector.taste.limitedCollab > 0, "collab");
  add(vector.budget.premiumOk > 0, "premium");
  return tags.slice(0, 5);
}

export function buildRyoModeContextForRecommendation(answers: RyoModeAnswers): RyoModeRecommendationContext {
  const vector = buildRyoPreferenceVector(answers);
  const summary = summarizeRyoPreferenceVector(vector);
  return {
    diagnosisAnswers: mapRyoV4AnswersToLegacyDiagnosisInput(answers),
    preferenceTags: mapRyoPreferenceVectorToCoreInputTags(vector),
    ...(summary.budgetCeilingYen === undefined ? {} : { budgetYen: summary.budgetCeilingYen }),
    mode: summary.ryoInfluence === "balanced" ? "balanced" : "ryo",
    vector,
    answers: normalizeAnswers(answers),
  };
}

export function buildRyoSneakerFeaturesFromCandidate(candidate: CandidateProfile): RyoSneakerFeatures {
  const displayNameOfficial = normalizeOfficialSneakerName(candidate.name);
  const { brandOfficial, modelOfficial } = splitOfficialName(displayNameOfficial);
  const knownTraits = inferSafeCandidateTraits(displayNameOfficial, candidate.tags);
  const isAbstractName = isAbstractRecommendationName(displayNameOfficial);
  const hasLocalizedMainName = hasJapaneseText(displayNameOfficial);
  return {
    displayNameOfficial,
    brandOfficial,
    modelOfficial,
    verified: candidate.researchSource !== "product_input"
      && candidate.readiness !== "degraded"
      && isOfficialEnglishDisplayName(displayNameOfficial),
    isAbstractName,
    hasLocalizedMainName,
    ...(candidate.priceYen === undefined ? {} : { estimatedPriceYen: candidate.priceYen }),
    traits: knownTraits,
  };
}

export function buildRyoModeCandidateEvaluation(vector: RyoPreferenceVector, candidate: CandidateProfile): RyoModeCandidateEvaluation {
  const features = buildRyoSneakerFeaturesFromCandidate(candidate);
  const displayValidation = validateRyoDisplayName(features);
  const rawScore = scoreRyoModeCandidate(vector, features);
  const culture = buildRyoCulturalEvaluation(features.displayNameOfficial, vector, features);
  const culturalFit = averagePositive(
    culture.affinities.cultureAffinity,
    culture.affinities.materialAgingAffinity,
    culture.affinities.pantsAffinity,
  );
  const recommendationScore = clampRyoScore(
    rawScore.recommendationScore * 0.78
      + culturalFit * 0.22
      - culture.affinities.cautionPenalty * 0.35,
  );
  const featureCount = Object.values(features.traits).filter((value) => value === true || typeof value === "string").length;
  const cautionSignals = [
    ...rawScore.cautionSignals,
    ...displayValidation.penalties,
    ...(featureCount === 0 ? ["候補の確定的な特徴情報が不足しています"] : []),
    ...(features.estimatedPriceYen === undefined ? ["推定価格が不明なため予算適合は加点していません"] : []),
    ...buildContextualCandidateCautions(vector, features.displayNameOfficial),
  ];
  const score = {
    ...rawScore,
    recommendationScore,
    totalRyoScore: clampRyoScore(rawScore.productScore * 0.4 + recommendationScore * 0.6),
    matchedSignals: [...new Set([...rawScore.matchedSignals, ...culture.reasons])],
    cautionSignals: [...new Set([...cautionSignals, ...culture.cautions])],
    affinities: culture.affinities,
  };
  return { features, score, opinion: buildRyoOpinion(vector, score, features), culture };
}

function averagePositive(...values: number[]): number {
  const active = values.filter((value) => value > 0);
  return active.length ? active.reduce((sum, value) => sum + value, 0) / active.length : 0;
}

function normalizeAnswers(answers: RyoModeAnswers): Partial<Record<RyoModeQuestionId, string>> {
  const raw = Array.isArray(answers)
    ? Object.fromEntries(answers.map((answer) => [answer.questionId, answer.optionId]))
    : { ...(answers as Readonly<Partial<Record<RyoModeQuestionId, string>>>) };
  return Object.fromEntries(RYO_MODE_V4_QUESTIONS.flatMap((question) => {
    const optionId = raw[question.id];
    return typeof optionId === "string" && question.options.some((option) => option.id === optionId)
      ? [[question.id, optionId]]
      : [];
  }));
}

function legacyAnswer(questionId: string, value: DiagnosisAnswerValue): DiagnosisAnswer {
  return { questionId, value };
}

function splitOfficialName(displayName: string): { brandOfficial: string; modelOfficial: string } {
  const brands = ["New Balance", "Air Jordan", "Last Resort AB", "Nike", "adidas", "PUMA", "Converse", "Vans", "Reebok", "ASICS", "HOKA", "PRO-Keds"];
  const brand = brands.find((item) => displayName.toLocaleLowerCase("en-US").startsWith(item.toLocaleLowerCase("en-US")));
  if (brand) return { brandOfficial: brand, modelOfficial: displayName.slice(brand.length).trim() || displayName };
  const [first = displayName, ...rest] = displayName.split(/\s+/u);
  return { brandOfficial: first, modelOfficial: rest.join(" ") || displayName };
}

function inferSafeCandidateTraits(displayName: string, tags: readonly SneakerTag[]): RyoSneakerFeatures["traits"] {
  const traits: RyoSneakerFeatures["traits"] = {};
  const set = (condition: boolean, values: Partial<RyoSneakerFeatures["traits"]>) => { if (condition) Object.assign(traits, values); };
  set(tags.includes("canvas"), { canvas: true });
  set(/black\s*[/ -]\s*white|white\s*[/ -]\s*white/i.test(displayName), { blackWhite: true });
  set(/Nike\s+Air\s+Force\s+1\s+Low/i.test(displayName), { leather: true, oldShape: true, lowCut: true, tiedSilhouetteGood: true });
  set(/Air\s+Jordan\s+1\s+High/i.test(displayName), { leather: true, oldShape: true, highCut: true, tiedSilhouetteGood: true });
  set(/Air\s+Jordan\s+1\s+Low/i.test(displayName), { leather: true, oldShape: true, lowCut: true, tiedSilhouetteGood: true });
  set(/Converse\s+Jack\s+Purcell\s+Leather/i.test(displayName), { leather: true, oldShape: true, lowCut: true, oxCut: true, tiedSilhouetteGood: true });
  set(/Converse\s+Jack\s+Purcell(?!.*Leather)/i.test(displayName), { canvas: true, oldShape: true, lowCut: true, oxCut: true, tiedSilhouetteGood: true });
  set(/Converse\s+One\s+Star/i.test(displayName), { suede: true, oldShape: true, oxCut: true, tiedSilhouetteGood: true, madeInJapan: /\bJ\b|Made in Japan/i.test(displayName), vintage: /VTG|Vintage/i.test(displayName) });
  set(/Converse\s+(?:All\s+Star|Addict\s+Chuck\s+Taylor)/i.test(displayName), { canvas: true, oldShape: true, highCut: /\bHi\b|High/i.test(displayName), oxCut: /\bOX\b/i.test(displayName), tiedSilhouetteGood: true, madeInJapan: /All\s+Star\s+J\b/i.test(displayName), vintage: /VTG|Vintage|Addict/i.test(displayName), timeLine: /TimeLine/i.test(displayName) });
  set(/PUMA\s+(?:Suede|Clyde)/i.test(displayName), { suede: true, oldShape: true, lowCut: true, tiedSilhouetteGood: true });
  set(/adidas\s+Superstar/i.test(displayName), { leather: true, oldShape: true, lowCut: true, tiedSilhouetteGood: true, vintage: /Vintage/i.test(displayName), madeInGermany: /Made in Germany/i.test(displayName) });
  set(/Converse\s+(?:Pro\s+Leather|Weapon)/i.test(displayName), { leather: true, oldShape: true, tiedSilhouetteGood: true });
  set(/Nike\s+(?:Terminator|Blazer)/i.test(displayName), { leather: true, oldShape: true, tiedSilhouetteGood: true, highCut: /High|Mid/i.test(displayName), lowCut: /Low/i.test(displayName) });
  set(/Reebok\s+Classic\s+Leather/i.test(displayName), { leather: true, oldShape: true, lowCut: true });
  set(/Reebok\s+Classic\s+Nylon/i.test(displayName), { suede: true, oldShape: true, lowCut: true, sportOrigin: "running" });
  set(/Reebok\s+Club\s+C/i.test(displayName), { leather: true, oldShape: true, lowCut: true, sportOrigin: "tennis" });
  set(/Vans\s+Half\s+Cab/i.test(displayName), { suede: true, oldShape: true, midCut: true, tiedSilhouetteGood: true });
  set(/Vans\s+(?:Authentic|Era)/i.test(displayName), { canvas: true, oldShape: true, lowCut: true, tiedSilhouetteGood: true, sportOrigin: "skate" });
  set(/Last\s+Resort\s+AB\s+VM001/i.test(displayName), { suede: true, lowCut: true, tiedSilhouetteGood: true });
  set(/adidas\s+Samba\s+OG/i.test(displayName), { oldShape: true, lowCut: true, sportOrigin: "football", betterRyoAlternativeExists: true });
  set(/New\s+Balance\s+CM996/i.test(displayName), { oldShape: true, lowCut: true, sportOrigin: "running", betterRyoAlternativeExists: true });
  set(/Nike\s+(?:Cortez|LD-?1000|Astro\s+Grabber|Waffle\s+Trainer|Daybreak|Field\s+General)/i.test(displayName), { oldShape: true, lowCut: true, sportOrigin: "running", leather: /Leather/i.test(displayName), suede: !/Leather/i.test(displayName) });
  set(/adidas\s+(?:SL\s*72|Dragon)/i.test(displayName), { oldShape: true, lowCut: true, sportOrigin: "running", suede: true });
  set(/adidas\s+(?:Tobacco|London|Hamburg|Spezial|Handball\s+Spezial|Gazelle)/i.test(displayName), { oldShape: true, lowCut: true, suede: true, sportOrigin: "football" });
  set(/adidas\s+(?:Japan|Country|BW\s+Army)/i.test(displayName), { oldShape: true, lowCut: true, leather: true });
  set(/New\s+Balance\s+(?:990v[34]|991|993|998|1500|1300|1400|576)/i.test(displayName), { oldShape: true, suede: true, sportOrigin: "running" });
  set(/New\s+Balance\s+(?:2002R|2010|574|327|237)/i.test(displayName), { suede: true, sportOrigin: "running", techAllowedModel: true });
  set(/Nike\s+Air\s+Max\s+95|New\s+Balance\s+(?:1906|9060|1000)/i.test(displayName), { tooTechnical: true, sportOrigin: "running", techAllowedModel: true });
  set(/PRO-Keds\s+Royal\s+Plus/i.test(displayName), { suede: /Suede/i.test(displayName), leather: !/Suede/i.test(displayName), oldShape: true, sportOrigin: "basketball" });
  set(/ASICS\s+GEL-KAYANO\s+14|Nike\s+Shox|\bHOKA\b|PUMA\s+Speedcat/i.test(displayName), { tooTechnical: true, ryoDiscouragedModel: true });
  return traits;
}

function buildContextualCandidateCautions(vector: RyoPreferenceVector, displayName: string): string[] {
  const strongWorkwearContext = vector.ryoStrength.ryoStrong > 0
    && vector.style.amekaji > 0
    && vector.pantsFit.workPants > 0;
  if (!strongWorkwearContext) return [];
  if (/Nike\s+Air\s+Force\s+1\s+Low/i.test(displayName)) {
    return ["AF1は歴史ある白レザー定番ですが、Ryo Strongのアメカジ文脈では主軸ではなく、汎用白レザーの条件付き候補です"];
  }
  if (/adidas\s+Samba\s+OG/i.test(displayName) || /New\s+Balance\s+CM996/i.test(displayName)) {
    return ["SambaやNew Balanceが悪いのではなく、今回のwork pants・leather aging・basketball・tied silhouette条件では中心から少し外れます"];
  }
  return [];
}
