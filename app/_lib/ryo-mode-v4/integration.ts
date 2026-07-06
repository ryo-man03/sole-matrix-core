import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { CandidateProfile, DiagnosisAnswer, DiagnosisAnswerValue, RecommendationMode } from "../core-v1/types";
import { buildRyoOpinion } from "./opinion";
import { RYO_MODE_V4_QUESTIONS } from "./questions";
import { scoreRyoModeCandidate } from "./scoring";
import type { RyoModeAnswers, RyoModeQuestionId, RyoModeScoreResult, RyoOpinion, RyoPreferenceVector, RyoSneakerFeatures } from "./types";
import { hasJapaneseText, isAbstractRecommendationName, isOfficialEnglishDisplayName, validateRyoDisplayName } from "./validation";
import { buildRyoPreferenceVector, summarizeRyoPreferenceVector } from "./vector";

export type RyoModeRecommendationContext = {
  diagnosisAnswers: DiagnosisAnswer[];
  preferenceTags: SneakerTag[];
  budgetYen?: number;
  mode: RecommendationMode;
  vector: RyoPreferenceVector;
};

export type RyoModeCandidateEvaluation = {
  features: RyoSneakerFeatures;
  score: RyoModeScoreResult;
  opinion: RyoOpinion;
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
  };
}

export function buildRyoSneakerFeaturesFromCandidate(candidate: CandidateProfile): RyoSneakerFeatures {
  const displayNameOfficial = candidate.name.trim();
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
  const featureCount = Object.values(features.traits).filter((value) => value === true || typeof value === "string").length;
  const cautionSignals = [
    ...rawScore.cautionSignals,
    ...displayValidation.penalties,
    ...(featureCount === 0 ? ["候補の確定的な特徴情報が不足しています"] : []),
    ...(features.estimatedPriceYen === undefined ? ["推定価格が不明なため予算適合は加点していません"] : []),
  ];
  const score = { ...rawScore, cautionSignals: [...new Set(cautionSignals)] };
  return { features, score, opinion: buildRyoOpinion(vector, score, features) };
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
  set(/Nike\s+Air\s+Force\s+1\s+Low/i.test(displayName), { leather: true });
  set(/Air\s+Jordan\s+1\s+High/i.test(displayName), { leather: true, tiedSilhouetteGood: true });
  set(/PUMA\s+(?:Suede|Clyde)/i.test(displayName), { suede: true });
  set(/adidas\s+Superstar/i.test(displayName), { leather: true, oldShape: true });
  set(/adidas\s+Samba\s+OG/i.test(displayName), { oldShape: true });
  set(/New\s+Balance\s+991/i.test(displayName), { oldShape: true });
  return traits;
}
