import type { CandidateProfile } from "../core-v1/types";
import { matchesCanonicalContextName } from "../../../src/domain/identity/canonicalSneaker";
import {
  normalizeUserSneakerContext,
  type UserSneakerContext,
} from "../diagnosis/sneakerContext";
import type {
  RecommendationSetCoherence,
  RecommendationSetViolation,
  RyoAffinityTier,
  RyoCategoryGateEvaluation,
  RyoEligibilityReason,
  RyoModelAffinityProfile,
  RyoModelCategory,
  RyoPreferenceSummary,
  RyoPreferenceVector,
  RyoRoleEligibility,
  RyoRoleExplanation,
  RyoScoreBreakdownV2,
  RyoSneakerFeatures,
} from "./types";

export type RyoEligibilityInput = {
  candidate: CandidateProfile;
  vector: RyoPreferenceVector;
  userContext?: UserSneakerContext;
  preferenceSummary: RyoPreferenceSummary;
  scoreBreakdown: RyoScoreBreakdownV2;
  explicitPreferencePenalty: number;
};

export type CoherenceCandidate = {
  candidate: CandidateProfile;
  scoreBreakdownV2: RyoScoreBreakdownV2;
  ryoEligibility: RyoRoleEligibility;
};

export type CoherenceSetInput = {
  primary: CoherenceCandidate;
  practicalAlternative: CoherenceCandidate | null;
  ryoAlternative: CoherenceCandidate | null;
  userContext?: UserSneakerContext;
};

type AffinityRule = {
  pattern: RegExp;
  tier: RyoAffinityTier;
  category: RyoModelCategory;
  reason: string;
};

const AFFINITY_RULES: readonly AffinityRule[] = [
  rule(/\b(?:ASICS GEL-KAYANO 14|Nike Shox|HOKA|PUMA Speedcat|New Balance (?:1906|9060|1000))\b/iu, "excluded", "technical_running", "現代的なテクニカル表現が中心で、Ryo枠の歴史・素材・服装条件から外れます。"),
  rule(/\bConverse (?:One Star(?: J| J VTG| Leather| Suede)?|Star & Bars|Jack Purcell(?: CL| 1935| Leather)?|All Star J|All Star J VTG|Addict Chuck Taylor|TimeLine)\b/iu, "core", "canvas_classic", "履き込み、素材、古いスポーツ背景を服装と結び付けて説明しやすい中心候補です。"),
  rule(/\badidas (?:Tobacco|London|Hamburg|(?:Handball )?Spezial)\b/iu, "core", "terrace", "テラス／アーカイブの文化とスエード、細身からストレートの服装を結び付けやすい中心候補です。"),
  rule(/\bPUMA (?:Suede|Clyde|Brasil)\b/iu, "core", "basketball_classic", "古いバスケットボールとストリート文化、スエードの経年変化を説明しやすい中心候補です。"),
  rule(/\bVans (?:OG )?(?:Authentic|Era|Old Skool)\b/iu, "core", "skate", "スケート／DIY文化とキャンバスの退色を日常の服装へつなげやすい中心候補です。"),
  rule(/\bNew Balance (?:[A-Z]?990[A-Z]*v[34]|[A-Z]?(?:991v2|991|993|998|1500|1300|1400|576))[A-Z0-9-]*/iu, "adjacent", "retro_running", "ヘリテージランニング、快適性、スエード／メッシュ、用途と予算が揃う場合に限る隣接候補です。"),
  rule(/\bNike (?:WMNS )?(?:Cortez|LD-?1000|Astro Grabber|Waffle Trainer|Daybreak|Field General)\b/iu, "adjacent", "retro_running", "古いランニング背景と薄い形を服装へ結び付けられる場合の隣接候補です。"),
  rule(/\bNike Air Force 1\b/iu, "adjacent", "basketball_classic", "汎用性だけでなく、バスケットボール史、レザー、服装の追加根拠が揃う場合の隣接候補です。"),
  rule(/\b(?:Reebok Classic Leather|adidas SL ?72|adidas Country|adidas Japan)\b/iu, "adjacent", "retro_running", "実用性だけでなく、カテゴリ・素材・服装の追加根拠が揃う場合の隣接候補です。"),
  rule(/\b(?:Converse Pro Leather|Converse Weapon|Nike (?:Air Jordan 1|Blazer|Terminator)|adidas Superstar (?:Vintage|82)|PRO-Keds Royal Plus)\b/iu, "situational", "basketball_classic", "バスケットボール史、レザー、パンツのボリュームが強く一致する場合だけRyo枠になります。"),
  rule(/\b(?:Vans Half Cab|Last Resort AB VM001)\b/iu, "situational", "skate", "スケート文化、パンツ、スエードの履き込みが複数一致する場合だけRyo枠になります。"),
  rule(/\b(?:adidas Bern|adidas Gazelle|adidas Samba)\b/iu, "situational", "terrace", "テラス文化や服装の明示条件がある場合だけRyo枠として説明できます。"),
  rule(/\b(?:New Balance (?:2002R|2010|574|327|237)|Nike Air Max 95)\b/iu, "practical", "technical_running", "快適性や現代的なボリュームを重視する実用候補として扱います。"),
  rule(/\b(?:Reebok Classic Nylon|Reebok Club C|Converse All Star(?: Hi)?|Nike Air Jordan 1 Low)\b/iu, "practical", "practical_classic", "買いやすさと汎用性を優先する実用候補として扱います。"),
] as const;

export function getRyoModelAffinityProfile(
  candidate: Pick<CandidateProfile, "name" | "tags" | "priceYen" | "modelType">,
): RyoModelAffinityProfile {
  const matched = AFFINITY_RULES.find((item) => item.pattern.test(candidate.name));
  const category = matched?.category ?? inferCategory(candidate);
  const affinityTier = matched?.tier ?? "practical";
  const categoryProfile = categoryMetadata(category);
  return {
    affinityTier,
    category,
    historicalContext: [...categoryProfile.historicalContext],
    culturalContexts: [...categoryProfile.culturalContexts],
    materialCharacter: inferMaterialCharacter(candidate, category),
    agingPotential: inferAgingPotential(candidate, category),
    wardrobeMatches: [...categoryProfile.wardrobeMatches],
    purposeMatches: purposeMatches(affinityTier, category),
    comfortProfile: inferComfortProfile(category),
    silhouetteProfile: inferSilhouette(candidate.name, category),
    budgetBand: inferBudgetBand(candidate.priceYen, candidate.name),
    reasonForTier: matched?.reason ?? "文化・素材の絶対条件より、日常での実用性を中心に評価する候補です。",
    disqualifyingConditions: disqualifyingConditions(affinityTier, category),
    promotionConditions: promotionConditions(affinityTier, category),
  };
}

export function evaluateRyoCategoryGate(
  category: RyoModelCategory,
  vector: RyoPreferenceVector,
  userContext: UserSneakerContext | undefined,
  candidate: Pick<CandidateProfile, "priceYen" | "budgetFit">,
): RyoCategoryGateEvaluation {
  const context = normalizeUserSneakerContext(userContext);
  const budgetCeiling = getBudgetCeiling(vector);
  const budgetMatch = budgetCeiling === undefined
    || candidate.priceYen === undefined
    || candidate.priceYen <= budgetCeiling;
  const evidence: Array<[boolean, string]> = categoryEvidence(category, vector, context, budgetMatch);
  const matchedEvidence = evidence.filter(([matched]) => matched).map(([, label]) => label);
  const missingEvidence = evidence.filter(([matched]) => !matched).map(([, label]) => label);
  const requiredMatches = requiredCategoryMatches(category);
  const categoryInterest = explicitCategoryInterest(category, vector);
  const passed = matchedEvidence.length >= requiredMatches
    && (!requiresExplicitCategoryInterest(category) || categoryInterest);
  return {
    category,
    passed,
    matchedEvidence,
    missingEvidence,
    score: Math.round((matchedEvidence.length / Math.max(1, evidence.length)) * 100),
    requiredMatches,
    categoryInterest,
  };
}

export function evaluateRyoRoleEligibility(input: RyoEligibilityInput): RyoRoleEligibility {
  const context = normalizeUserSneakerContext(input.userContext);
  const profile = getRyoModelAffinityProfile(input.candidate);
  const categoryGate = evaluateRyoCategoryGate(profile.category, input.vector, context, input.candidate);
  const hardFailures: RyoEligibilityReason[] = [];
  const softWarnings: RyoEligibilityReason[] = [];
  const positiveReasons: RyoEligibilityReason[] = [];
  const candidateName = input.candidate.name;
  const traits = inferPolicyTraits(input.candidate, profile);
  const budgetCeiling = getBudgetCeiling(input.vector);
  const budgetKnown = budgetCeiling !== undefined && input.candidate.priceYen !== undefined;
  const budgetFits = !budgetKnown || (input.candidate.priceYen ?? 0) <= (budgetCeiling ?? Number.MAX_SAFE_INTEGER);

  const wardrobeMatchScore = calculateWardrobeMatch(input.vector, traits, profile);
  const purposeMatchScore = calculatePurposeMatch(context, profile, input.candidate);
  const cultureMatchScore = calculateCultureMatch(input.vector, profile);
  const materialMatchScore = calculateMaterialMatch(input.vector, traits);
  const contextMatchScore = Math.round((
    wardrobeMatchScore
    + purposeMatchScore
    + cultureMatchScore
    + materialMatchScore
    + categoryGate.score
  ) / 5);

  addReason(positiveReasons, tierPositiveCode(profile.affinityTier), profile.reasonForTier);
  if (categoryGate.categoryInterest) addReason(positiveReasons, "category_interest", "回答でこのカテゴリへの関心が確認できます。", categoryGate.matchedEvidence);
  if (categoryGate.passed) addReason(positiveReasons, "category_gate_passed", "カテゴリ固有の条件が複数一致しました。", categoryGate.matchedEvidence);
  else addReason(softWarnings, "category_gate_failed", "カテゴリ固有の根拠が不足しています。", categoryGate.missingEvidence);
  if (wardrobeMatchScore >= 45) addReason(positiveReasons, "wardrobe_match", "パンツと服装の条件に一致します。", profile.wardrobeMatches);
  else addReason(softWarnings, "wardrobe_mismatch", "服装との一致根拠が不足しています。");
  if (purposeMatchScore >= 45) addReason(positiveReasons, "purpose_match", "購入目的に合う役割があります。", profile.purposeMatches);
  else addReason(softWarnings, "purpose_mismatch", "購入目的との一致が弱い候補です。");
  if (cultureMatchScore >= 45) addReason(positiveReasons, "culture_match", "回答と文化的背景を結び付けられます。", profile.culturalContexts);
  if (materialMatchScore >= 45) addReason(positiveReasons, "material_match", "回答した素材の育ち方と一致します。", profile.materialCharacter);
  if (profile.historicalContext.length > 0 && (cultureMatchScore >= 45 || categoryGate.categoryInterest)) {
    addReason(positiveReasons, "history_match", "競技・開発背景を今回の選び方へ結び付けられます。", profile.historicalContext);
  }

  if (isContextMatch(candidateName, context.ownedModels)) addReason(hardFailures, "owned_duplicate", "所有済みまたはほぼ同一のモデルです。");
  if (isContextMatch(candidateName, context.dislikedModels)) addReason(hardFailures, "disliked_model", "避けたいモデルに一致します。");
  if (matchesDislikedSignal(input.candidate, context.dislikedSignals)) addReason(hardFailures, "hard_constraint", "避けたい特徴に一致します。");
  if (input.explicitPreferencePenalty > 18) addReason(hardFailures, "hard_constraint", "明示した回答条件との強い矛盾があります。");
  if (!budgetFits || input.candidate.budgetFit < 45) addReason(hardFailures, "budget_violation", "確認できる価格が回答予算を超えます。");
  else if (budgetKnown) addReason(positiveReasons, "budget_match", "確認できる参考価格が回答予算に収まります。");
  else addReason(softWarnings, "budget_unknown", "価格が未確認のため、購入前の予算確認が必要です。");
  if (profile.affinityTier === "excluded") addReason(hardFailures, "affinity_excluded", profile.reasonForTier);
  if (profile.affinityTier === "practical") addReason(hardFailures, "affinity_practical", "原則として実用枠で評価するモデルです。");
  if (input.scoreBreakdown.finalRecommendationScore < 45) addReason(hardFailures, "score_below_floor", "総合推薦スコアがRyo枠の最低基準に届きません。");
  if (input.scoreBreakdown.userFitScore < 20) addReason(hardFailures, "user_fit_below_floor", "回答との適合がRyo枠の最低基準に届きません。");
  if (input.scoreBreakdown.ryoIdentityScore < 28) addReason(hardFailures, "ryo_identity_below_floor", "Ryo枠として説明できる文化・素材の強度が不足しています。");
  if (wardrobeMatchScore < 45) addReason(hardFailures, "wardrobe_mismatch", "Ryo枠に必要な服装一致がありません。");
  if (purposeMatchScore < 45) addReason(hardFailures, "purpose_mismatch", "Ryo枠に必要な用途一致がありません。");
  if (Math.max(cultureMatchScore, materialMatchScore) < 45) {
    addReason(hardFailures, "culture_match", "文化・歴史・素材のいずれにも十分な根拠がありません。");
  }

  if (profile.affinityTier === "adjacent") {
    if (!categoryGate.passed || contextMatchScore < 55) {
      addReason(hardFailures, "category_gate_failed", "隣接候補に必要な高いカテゴリ一致がありません。", categoryGate.missingEvidence);
    }
  } else if (profile.affinityTier === "situational") {
    if (!categoryGate.passed || categoryGate.matchedEvidence.length < 3 || contextMatchScore < 52) {
      addReason(hardFailures, "category_gate_failed", "条件付き候補に必要な複数の強い一致がありません。", categoryGate.missingEvidence);
    }
  } else if (profile.affinityTier === "core" && !categoryGate.passed) {
    addReason(hardFailures, "category_gate_failed", "中心候補でも、今回の回答条件との複数一致が必要です。", categoryGate.missingEvidence);
  }

  if (positiveReasons.some((reason) => reason.code === "culture_match" || reason.code === "material_match" || reason.code === "history_match")) {
    addReason(positiveReasons, "role_explanation_available", "内部の一致理由から役割説明を生成できます。");
  } else {
    addReason(hardFailures, "role_explanation_available", "根拠に基づくRyo役割説明を生成できません。");
  }

  return {
    eligible: dedupeReasons(hardFailures).length === 0,
    affinityTier: profile.affinityTier,
    hardFailures: dedupeReasons(hardFailures),
    softWarnings: dedupeReasons(softWarnings),
    positiveReasons: dedupeReasons(positiveReasons),
    contextMatchScore,
    wardrobeMatchScore,
    purposeMatchScore,
    cultureMatchScore,
    materialMatchScore,
    categoryGate,
  };
}

export function applyRyoRoleSeparation(
  eligibility: RyoRoleEligibility,
  candidate: CandidateProfile,
  primary: CandidateProfile,
  practical: CandidateProfile | null,
): RyoRoleEligibility {
  const hardFailures = [...eligibility.hardFailures];
  if (sameModelFamily(candidate.name, primary.name)) {
    addReason(hardFailures, "role_overlap_primary", "Primaryと同じモデルファミリーで役割差を作れません。");
  }
  if (practical && sameModelFamily(candidate.name, practical.name)) {
    addReason(hardFailures, "role_overlap_practical", "実用候補と同じモデルファミリーで役割差を作れません。");
  }
  return {
    ...eligibility,
    eligible: dedupeReasons(hardFailures).length === 0,
    hardFailures: dedupeReasons(hardFailures),
  };
}

export function buildRyoRoleExplanation(
  candidate: CandidateProfile,
  eligibility: RyoRoleEligibility,
): RyoRoleExplanation {
  const profile = getRyoModelAffinityProfile(candidate);
  const evidence = eligibility.positiveReasons
    .flatMap((reason) => reason.evidence ?? [])
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 4);
  const matchedAnswers = eligibility.categoryGate.matchedEvidence.slice(0, 4);
  const caution = eligibility.softWarnings[0]?.message
    ?? "価格・在庫・サイズは販売元で確認してください。";
  return {
    whyRyo: eligibility.eligible
      ? `${profile.reasonForTier} 今回は${matchedAnswers.slice(0, 2).join("、")}が一致しています。`
      : "今回の条件では、Ryo枠として必要な絶対条件を満たしていません。",
    matchedAnswers,
    evidence,
    whyNotPrimary: "Primaryは回答全体への適合を優先し、この候補は文化・素材の別軸を深める役割だからです。",
    whyNotPractical: "実用性だけではなく、文化・素材・服装の複数根拠で選ぶ候補だからです。",
    caution,
    affinityTier: eligibility.affinityTier,
    eligible: eligibility.eligible,
  };
}

export function evaluateRecommendationSetCoherence(input: CoherenceSetInput): RecommendationSetCoherence {
  const context = normalizeUserSneakerContext(input.userContext);
  const entries = [
    { role: "primary" as const, entry: input.primary },
    ...(input.practicalAlternative ? [{ role: "practical" as const, entry: input.practicalAlternative }] : []),
    ...(input.ryoAlternative ? [{ role: "ryo" as const, entry: input.ryoAlternative }] : []),
  ];
  const violations: RecommendationSetViolation[] = [];
  const familyKeys = new Map<string, string>();
  for (const { role, entry } of entries) {
    const family = modelFamily(entry.candidate.name);
    const existing = familyKeys.get(family);
    if (existing) {
      violations.push({ code: "duplicate_model_family", message: `${existing}と${role}が同じモデルファミリーです。`, candidateId: entry.candidate.id });
    } else {
      familyKeys.set(family, role);
    }
    if (isContextMatch(entry.candidate.name, context.ownedModels)) {
      violations.push({ code: "ownership_duplicate", message: "所有済みモデルが表示セットへ漏れています。", candidateId: entry.candidate.id });
    }
    if (isContextMatch(entry.candidate.name, context.dislikedModels)) {
      violations.push({ code: "disliked_leak", message: "避けたいモデルが表示セットへ漏れています。", candidateId: entry.candidate.id });
    }
    if (entry.candidate.budgetFit < 45) {
      violations.push({ code: "budget_violation", message: "予算不適合候補が表示セットへ漏れています。", candidateId: entry.candidate.id });
    }
  }

  if (input.practicalAlternative && input.practicalAlternative.scoreBreakdownV2.practicalFitScore < 38) {
    violations.push({ code: "role_mismatch", message: "実用候補のpractical fitが役割基準に届きません。", candidateId: input.practicalAlternative.candidate.id });
  }
  if (input.ryoAlternative) {
    const ryo = input.ryoAlternative;
    if (!ryo.ryoEligibility.eligible) {
      violations.push({ code: "forced_slot", message: "絶対適格条件を満たさない候補がRyo枠へ入っています。", candidateId: ryo.candidate.id });
    }
    if (ryo.ryoEligibility.affinityTier === "practical" || ryo.ryoEligibility.affinityTier === "excluded") {
      violations.push({ code: "practical_model_in_ryo_role", message: "実用／除外tierがRyo枠へ入っています。", candidateId: ryo.candidate.id });
    }
    if (ryo.ryoEligibility.affinityTier === "adjacent" && !ryo.ryoEligibility.categoryGate.passed) {
      violations.push({ code: "adjacent_overpromotion", message: "隣接候補がカテゴリ条件なしで昇格しています。", candidateId: ryo.candidate.id });
    }
    const primaryCategory = getRyoModelAffinityProfile(input.primary.candidate).category;
    const ryoCategory = getRyoModelAffinityProfile(ryo.candidate).category;
    if (primaryCategory !== ryoCategory && ryo.ryoEligibility.categoryGate.score < 50) {
      violations.push({ code: "unexplained_category_jump", message: "カテゴリ移動を説明する回答根拠が不足しています。", candidateId: ryo.candidate.id });
    }
    if (ryo.ryoEligibility.wardrobeMatchScore < 45) {
      violations.push({ code: "wardrobe_mismatch", message: "Ryo候補の服装一致が不足しています。", candidateId: ryo.candidate.id });
    }
    if (ryo.ryoEligibility.purposeMatchScore < 45) {
      violations.push({ code: "purpose_mismatch", message: "Ryo候補の用途一致が不足しています。", candidateId: ryo.candidate.id });
    }
  }

  const uniqueBrands = new Set(entries.map(({ entry }) => candidateBrand(entry.candidate.name))).size;
  const categories = entries.map(({ entry }) => getRyoModelAffinityProfile(entry.candidate).category);
  const categoryChanges = categories.slice(1).filter((category, index) => category !== categories[index]).length;
  const roleSeparationScore = clampScore(100 - violations.filter((item) => item.code === "role_mismatch" || item.code === "duplicate_model_family" || item.code === "forced_slot").length * 35);
  const categoryContinuityScore = clampScore(100 - categoryChanges * 12 - violations.filter((item) => item.code === "unexplained_category_jump").length * 40);
  const purposefulDiversityScore = entries.length <= 1 ? 100 : clampScore(55 + uniqueBrands * 12 - violations.filter((item) => item.code === "duplicate_model_family").length * 30);
  const narrativeScore = clampScore(Math.round((roleSeparationScore + categoryContinuityScore + purposefulDiversityScore) / 3));
  return {
    coherent: violations.length === 0,
    narrativeScore,
    purposefulDiversityScore,
    roleSeparationScore,
    categoryContinuityScore,
    violations,
  };
}

export function ryoEmptyStateReason(rankedEligibility: readonly RyoRoleEligibility[]): string {
  if (rankedEligibility.length === 0) {
    return "今回の条件では、Ryo枠として検討できる別候補がありませんでした。";
  }
  const failures = rankedEligibility.flatMap((item) => item.hardFailures.map((reason) => reason.code));
  if (failures.includes("budget_violation")) {
    return "候補はありましたが、今回の服装・用途・予算を同時に満たすRyo枠はありませんでした。";
  }
  if (failures.includes("owned_duplicate") || failures.includes("disliked_model")) {
    return "所有済み・避けたいモデルを除くと、Ryo枠として十分に説明できる別候補はありませんでした。";
  }
  return "今回の条件では、Ryo枠として十分に説明できる別候補は見つかりませんでした。";
}

export function modelFamily(value: string): string {
  const comparableValue = comparable(value);
  const patterns = [
    /new balance (?:990v3|990v4|991|993|998|1500|1300|1400|576)/u,
    /converse one star/u,
    /converse (?:all star|addict chuck taylor)/u,
    /converse jack purcell/u,
    /nike air force 1/u,
    /nike air jordan 1/u,
    /puma (?:suede|clyde)/u,
    /vans (?:authentic|era)/u,
  ];
  const familyPattern = patterns.find((pattern) => pattern.test(comparableValue));
  if (familyPattern) return familyPattern.source;
  return comparableValue
    .replace(/\b(?:black|white|cream|gum|leather|suede|canvas|low|high|hi|mid|og|vtg|vintage)\b/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function categoryEvidence(
  category: RyoModelCategory,
  vector: RyoPreferenceVector,
  context: UserSneakerContext,
  budgetMatch: boolean,
): Array<[boolean, string]> {
  switch (category) {
    case "retro_running":
      return [
        [vector.sportOrigin.running > 0, "レトロランニングへの関心"],
        [vector.techTolerance.heritageTechOk > 0 || vector.techTolerance.oldTechLookOk > 0 || vector.techTolerance.airMaxNbOk > 0, "履き心地とヘリテージ技術"],
        [vector.materialAging.suedeFadingNap > 0, "スエード／メッシュの質感"],
        [vector.pantsFit.widePants > 0 || vector.pantsFit.workPants > 0 || vector.pantsFit.denim > 0, "太いデニム／軍パン系との相性"],
        [context.purchasePurpose === "second_pair" || context.purchasePurpose === "daily_rotation", "二足目またはローテーション用途"],
        [budgetMatch, "予算適合"],
      ];
    case "terrace":
      return [
        [vector.sportOrigin.football > 0, "フットボール／テラス文化"],
        [vector.style.cleanCasual > 0, "UKカジュアルに近い服装"],
        [vector.pantsFit.slimPants > 0 || vector.pantsFit.straightPants > 0, "細身／ストレートパンツ"],
        [vector.materialAging.suedeFadingNap > 0, "スエードの質感"],
        [vector.cut.low > 0 || vector.cut.ox > 0, "薄いロープロファイル"],
      ];
    case "skate":
      return [
        [vector.sportOrigin.skate > 0, "スケート文化"],
        [vector.style.street > 0 || vector.style.amekaji > 0, "ストリート／古着の服装"],
        [vector.pantsFit.widePants > 0 || vector.pantsFit.workPants > 0 || vector.pantsFit.denim > 0, "太いパンツ／デニム"],
        [vector.materialAging.canvasFading > 0 || vector.materialAging.suedeFadingNap > 0, "キャンバス／スエードの履き込み"],
        [vector.techTolerance.avoidTech > 0, "ローテク志向"],
      ];
    case "basketball_classic":
      return [
        [vector.sportOrigin.basketball > 0, "バスケットボール史"],
        [vector.style.street > 0 || vector.style.amekaji > 0, "ストリート／アメカジ"],
        [vector.materialAging.leatherSinking > 0 || vector.materialAging.leatherCreasing > 0 || vector.materialAging.suedeFadingNap > 0, "レザー／スエードの履き込み"],
        [vector.pantsFit.widePants > 0 || vector.pantsFit.denim > 0 || vector.wearingStyle.volumeLook > 0, "ボリュームを受けるパンツ"],
        [budgetMatch, "予算適合"],
      ];
    case "canvas_classic":
      return [
        [vector.materialAging.canvasFading > 0, "キャンバスの退色"],
        [vector.style.amekaji > 0 || vector.style.normcore > 0, "アメカジ／ノームコア"],
        [vector.pantsFit.denim > 0 || vector.pantsFit.workPants > 0 || vector.pantsFit.straightPants > 0, "デニム／ワーク／ストレートパンツ"],
        [vector.techTolerance.avoidTech > 0, "ローテク志向"],
        [vector.taste.classic > 0 || vector.taste.simple > 0, "クラシックな形"],
      ];
    case "workwear_heritage":
      return [
        [vector.materialAging.leatherSinking > 0 || vector.materialAging.leatherCreasing > 0 || vector.materialAging.suedeFadingNap > 0, "革／スエードの経年変化"],
        [vector.pantsFit.denim > 0 || vector.pantsFit.workPants > 0, "デニム／軍パン／ワークパンツ"],
        [vector.style.amekaji > 0, "アメカジ"],
        [context.purchasePurpose === "daily_rotation" || context.purchasePurpose === "archive_collection", "長期使用／アーカイブ用途"],
        [budgetMatch, "予算適合"],
      ];
    case "technical_running":
      return [
        [vector.sportOrigin.running > 0, "ランニング関心"],
        [vector.techTolerance.airMaxNbOk > 0, "現代的な技術とボリュームを許容"],
        [vector.style.street > 0, "ストリート"],
        [vector.pantsFit.widePants > 0, "太いパンツ"],
        [budgetMatch, "予算適合"],
      ];
    case "practical_classic":
      return [
        [vector.taste.simple > 0 || vector.taste.classic > 0, "シンプル／定番"],
        [context.purchasePurpose === "first_pair" || context.purchasePurpose === "daily_rotation", "最初の一足／普段使い"],
        [budgetMatch, "予算適合"],
      ];
  }
}

function calculateWardrobeMatch(vector: RyoPreferenceVector, traits: PolicyTraits, profile: RyoModelAffinityProfile): number {
  let score = 20;
  if (vector.pantsFit.widePants > 0 && (traits.volume || profile.wardrobeMatches.includes("wide pants"))) score += 30;
  if (vector.pantsFit.denim > 0 && profile.wardrobeMatches.includes("denim")) score += 30;
  if (vector.pantsFit.workPants > 0 && profile.wardrobeMatches.includes("work pants")) score += 30;
  if (vector.pantsFit.straightPants > 0 && profile.wardrobeMatches.includes("straight pants")) score += 30;
  if (vector.pantsFit.slimPants > 0 && (traits.slim || profile.wardrobeMatches.includes("slim pants"))) score += 30;
  if (vector.style.amekaji > 0 && profile.wardrobeMatches.some((item) => item === "denim" || item === "work pants")) score += 15;
  if (vector.style.cleanCasual > 0 && profile.wardrobeMatches.some((item) => item === "straight pants" || item === "slim pants")) score += 15;
  return clampScore(score);
}

function calculatePurposeMatch(
  context: UserSneakerContext,
  profile: RyoModelAffinityProfile,
  candidate: Pick<CandidateProfile, "priceYen" | "tags">,
): number {
  const matches = profile.purposeMatches;
  let score = matches.includes(context.purchasePurpose) ? 75 : 35;
  if (context.purchasePurpose === "first_pair" && profile.budgetBand === "premium") score -= 30;
  if (context.purchasePurpose === "daily_rotation" && (candidate.tags.includes("comfortable") || candidate.tags.includes("durable"))) score += 15;
  if (context.purchasePurpose === "second_pair" && profile.affinityTier !== "practical") score += 10;
  if (context.purchasePurpose === "archive_collection" && profile.historicalContext.length > 0) score += 10;
  return clampScore(score);
}

function calculateCultureMatch(vector: RyoPreferenceVector, profile: RyoModelAffinityProfile): number {
  let score = 20;
  if (profile.category === "skate" && vector.sportOrigin.skate > 0) score += 65;
  if (profile.category === "terrace" && vector.sportOrigin.football > 0) score += 65;
  if (profile.category === "retro_running" && vector.sportOrigin.running > 0) score += 65;
  if (profile.category === "basketball_classic" && vector.sportOrigin.basketball > 0) score += 65;
  if ((profile.category === "canvas_classic" || profile.category === "workwear_heritage") && vector.style.amekaji > 0) score += 45;
  if (vector.sportOrigin.noSportPreference > 0 && profile.category === "practical_classic") score += 30;
  return clampScore(score);
}

function calculateMaterialMatch(vector: RyoPreferenceVector, traits: PolicyTraits): number {
  let score = 15;
  if ((vector.materialAging.leatherSinking > 0 || vector.materialAging.leatherCreasing > 0) && traits.leather) score += 70;
  if (vector.materialAging.suedeFadingNap > 0 && traits.suede) score += 70;
  if (vector.materialAging.canvasFading > 0 && traits.canvas) score += 70;
  if (vector.materialAging.goreTexUtility > 0 && traits.technical) score += 55;
  return clampScore(score);
}

type PolicyTraits = {
  leather: boolean;
  suede: boolean;
  canvas: boolean;
  technical: boolean;
  slim: boolean;
  volume: boolean;
};

function inferPolicyTraits(candidate: CandidateProfile, profile: RyoModelAffinityProfile): PolicyTraits {
  const value = `${candidate.name} ${candidate.modelType ?? ""} ${candidate.tags.join(" ")}`.toLocaleLowerCase("en-US");
  return {
    leather: /leather|レザー|革/u.test(value) || profile.materialCharacter.includes("leather"),
    suede: /suede|スエード/u.test(value) || profile.materialCharacter.includes("suede"),
    canvas: /canvas|キャンバス/u.test(value) || profile.materialCharacter.includes("canvas"),
    technical: /gore|technical|ハイテク|air max|1906|9060/u.test(value),
    slim: profile.silhouetteProfile === "slim",
    volume: profile.silhouetteProfile === "volume",
  };
}

function inferCategory(candidate: Pick<CandidateProfile, "name" | "tags" | "modelType">): RyoModelCategory {
  const value = `${candidate.name} ${candidate.modelType ?? ""}`.toLocaleLowerCase("en-US");
  if (candidate.tags.includes("running")) return /air max|1906|9060|2002r|2010/u.test(value) ? "technical_running" : "retro_running";
  if (candidate.tags.includes("basketball")) return "basketball_classic";
  if (candidate.tags.includes("canvas")) return candidate.tags.includes("street") ? "skate" : "canvas_classic";
  if (/terrace|football|samba|tobacco|hamburg|london|spezial/u.test(value)) return "terrace";
  if (/work|heritage/u.test(value)) return "workwear_heritage";
  return "practical_classic";
}

function categoryMetadata(category: RyoModelCategory): Pick<RyoModelAffinityProfile, "historicalContext" | "culturalContexts" | "wardrobeMatches"> {
  switch (category) {
    case "retro_running": return { historicalContext: ["競技用ランニングから街履きへの変化"], culturalContexts: ["heritage running"], wardrobeMatches: ["denim", "work pants", "straight pants", "wide pants"] };
    case "terrace": return { historicalContext: ["競技・トレーニング靴からテラス文化への移行"], culturalContexts: ["football terrace", "UK casual"], wardrobeMatches: ["slim pants", "straight pants", "denim"] };
    case "skate": return { historicalContext: ["競技用ではない実用靴がスケートへ定着した背景"], culturalContexts: ["skate", "punk", "DIY"], wardrobeMatches: ["denim", "work pants", "wide pants", "straight pants"] };
    case "basketball_classic": return { historicalContext: ["バスケットボール競技靴から街履きへの変化"], culturalContexts: ["basketball", "street", "hip hop"], wardrobeMatches: ["denim", "work pants", "wide pants"] };
    case "canvas_classic": return { historicalContext: ["古いスポーツ由来の簡潔なキャンバス構造"], culturalContexts: ["vintage sportswear", "workwear"], wardrobeMatches: ["denim", "work pants", "straight pants"] };
    case "workwear_heritage": return { historicalContext: ["耐久性を重視した古いスポーツ／作業靴の背景"], culturalContexts: ["workwear", "heritage sportswear"], wardrobeMatches: ["denim", "work pants"] };
    case "technical_running": return { historicalContext: ["現代的なランニング技術の街履き化"], culturalContexts: ["modern running", "street"], wardrobeMatches: ["wide pants"] };
    case "practical_classic": return { historicalContext: ["日常定番として定着したスポーツ由来モデル"], culturalContexts: ["daily classic"], wardrobeMatches: ["straight pants", "slim pants"] };
  }
}

function inferMaterialCharacter(
  candidate: Pick<CandidateProfile, "name" | "tags" | "modelType">,
  category: RyoModelCategory,
): string[] {
  const value = `${candidate.name} ${candidate.modelType ?? ""}`.toLocaleLowerCase("en-US");
  const materials = [
    /canvas|キャンバス/u.test(value) || candidate.tags.includes("canvas") ? "canvas" : null,
    /suede|スエード/u.test(value) || category === "terrace" || category === "retro_running" ? "suede" : null,
    /leather|レザー/u.test(value) || category === "basketball_classic" ? "leather" : null,
    category === "retro_running" || category === "technical_running" ? "mesh" : null,
  ].filter((item): item is string => Boolean(item));
  return materials.length ? [...new Set(materials)] : ["mixed material"];
}

function inferAgingPotential(
  candidate: Pick<CandidateProfile, "name" | "tags" | "modelType">,
  category: RyoModelCategory,
): string[] {
  const materials = inferMaterialCharacter(candidate, category);
  return materials.map((material) =>
    material === "canvas" ? "canvas fading"
      : material === "suede" ? "suede nap and fading"
        : material === "leather" ? "leather creasing"
          : material === "mesh" ? "mesh patina"
            : "wear over time"
  );
}

function purposeMatches(tier: RyoAffinityTier, category: RyoModelCategory): string[] {
  if (tier === "excluded") return [];
  if (tier === "practical" || category === "technical_running") return ["first_pair", "daily_rotation"];
  if (category === "retro_running") return ["daily_rotation", "second_pair"];
  if (tier === "core") return ["daily_rotation", "second_pair", "archive_collection"];
  return ["second_pair", "archive_collection"];
}

function disqualifyingConditions(tier: RyoAffinityTier, category: RyoModelCategory): string[] {
  const common = ["budget violation", "owned duplicate", "disliked model", "wardrobe mismatch", "purpose mismatch"];
  if (tier === "excluded") return [...common, "excluded affinity tier"];
  if (tier === "practical") return [...common, "practical-only role"];
  if (category === "retro_running") return [...common, "no running interest", "insufficient category evidence"];
  return [...common, "insufficient category evidence"];
}

function promotionConditions(tier: RyoAffinityTier, category: RyoModelCategory): string[] {
  if (tier === "core") return ["wardrobe match", "purpose match", "material or culture match"];
  if (tier === "adjacent") return ["explicit category interest", "high context match", "wardrobe match", "purpose match"];
  if (tier === "situational") return ["three or more category signals", "strong context match"];
  if (category === "technical_running") return ["practical role only"];
  return [];
}

function inferComfortProfile(category: RyoModelCategory): RyoModelAffinityProfile["comfortProfile"] {
  if (category === "retro_running" || category === "technical_running") return "comfort_first";
  if (category === "canvas_classic" || category === "skate") return "low_tech";
  return "balanced";
}

function inferSilhouette(name: string, category: RyoModelCategory): RyoModelAffinityProfile["silhouetteProfile"] {
  if (/high|mid|half cab|air jordan|weapon|990v|991|993|2002r|2010|air max/iu.test(name)) return "volume";
  if (category === "terrace" || /cortez|ld-?1000|sl ?72|country|japan/iu.test(name)) return "slim";
  return "balanced";
}

function inferBudgetBand(priceYen: number | undefined, name: string): RyoModelAffinityProfile["budgetBand"] {
  if ((priceYen ?? 0) >= 25_000 || /timeLine|addict|990v|991|993|998|1500/iu.test(name)) return "premium";
  if ((priceYen ?? 20_000) <= 15_000) return "value";
  return "standard";
}

function getBudgetCeiling(vector: RyoPreferenceVector): number | undefined {
  if (vector.budget.under15000 > 0) return 15_000;
  if (vector.budget.under20000 > 0) return 20_000;
  if (vector.budget.under25000 > 0) return 25_000;
  if (vector.budget.under35000 > 0) return 35_000;
  if (vector.budget.premiumOk > 0) return 60_000;
  return undefined;
}

function requiredCategoryMatches(category: RyoModelCategory): number {
  if (category === "retro_running") return 4;
  if (category === "terrace" || category === "skate" || category === "basketball_classic") return 3;
  if (category === "canvas_classic" || category === "workwear_heritage") return 2;
  return 3;
}

function requiresExplicitCategoryInterest(category: RyoModelCategory): boolean {
  return category === "retro_running" || category === "terrace" || category === "skate" || category === "basketball_classic" || category === "technical_running";
}

function explicitCategoryInterest(category: RyoModelCategory, vector: RyoPreferenceVector): boolean {
  if (category === "retro_running" || category === "technical_running") return vector.sportOrigin.running > 0;
  if (category === "terrace") return vector.sportOrigin.football > 0;
  if (category === "skate") return vector.sportOrigin.skate > 0;
  if (category === "basketball_classic") return vector.sportOrigin.basketball > 0;
  if (category === "canvas_classic") return vector.materialAging.canvasFading > 0 || vector.style.amekaji > 0;
  if (category === "workwear_heritage") return vector.style.amekaji > 0;
  return true;
}

function tierPositiveCode(tier: RyoAffinityTier): RyoEligibilityReason["code"] {
  if (tier === "core") return "affinity_core";
  if (tier === "adjacent") return "affinity_adjacent";
  if (tier === "situational") return "affinity_situational";
  if (tier === "excluded") return "affinity_excluded";
  return "affinity_practical";
}

function matchesDislikedSignal(candidate: CandidateProfile, dislikedSignals: readonly string[]): boolean {
  const name = candidate.name.toLocaleLowerCase("ja-JP");
  return dislikedSignals.some((signal) => {
    const normalized = signal.toLocaleLowerCase("ja-JP");
    if (normalized.includes("ハイテク")) return /air max|1906|9060|2002r|2010|technical|ハイテク/u.test(name);
    if (normalized.includes("大きいn")) return /new balance/u.test(name);
    if (normalized.includes("真っ白")) return /white[ /-]*white|triple white/u.test(name);
    if (normalized.includes("ハイカット")) return /high|\bhi\b|mid/u.test(name);
    if (normalized.includes("ローカット")) return /low|\box\b/u.test(name);
    return false;
  });
}

function addReason(
  target: RyoEligibilityReason[],
  code: RyoEligibilityReason["code"],
  message: string,
  evidence?: string[],
): void {
  target.push({ code, message, ...(evidence?.length ? { evidence: [...evidence] } : {}) });
}

function dedupeReasons(reasons: readonly RyoEligibilityReason[]): RyoEligibilityReason[] {
  const seen = new Set<string>();
  return reasons.filter((reason) => {
    const key = `${reason.code}:${reason.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isContextMatch(candidateName: string, contextNames: readonly string[]): boolean {
  return contextNames.some((name) => matchesCanonicalContextName(candidateName, name));
}

function sameModelFamily(left: string, right: string): boolean {
  return modelFamily(left) === modelFamily(right);
}

function candidateBrand(value: string): string {
  return comparable(value).split(" ")[0] ?? comparable(value);
}

function comparable(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function rule(
  pattern: RegExp,
  tier: RyoAffinityTier,
  category: RyoModelCategory,
  reason: string,
): AffinityRule {
  return { pattern, tier, category, reason };
}
