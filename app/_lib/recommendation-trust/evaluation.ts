import type {
  ExplanationClaim,
  ExplanationTrustEvaluation,
  FactualVerification,
  RecommendationTrustEvaluation,
  RecommendationTrustStatus,
  RyoAuthenticityEvaluation,
  VerificationEvidence,
  VerificationLevel,
} from "./types";

const verifiedLevels = new Set<VerificationLevel>([
  "officially_verified",
  "independently_verified",
]);

export function clampTrustScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;
}

export function createFactualVerification(input: Omit<FactualVerification, "evidenceCount">): FactualVerification {
  const modelEvidence = uniqueEvidence(input.modelEvidence);
  const colorwayEvidence = uniqueEvidence(input.colorwayEvidence);
  const styleCodeEvidence = uniqueEvidence(input.styleCodeEvidence);
  return {
    ...input,
    modelEvidence,
    colorwayEvidence,
    styleCodeEvidence,
    unsupportedClaims: uniqueText(input.unsupportedClaims),
    contradictions: uniqueText(input.contradictions),
    evidenceCount: new Set([
      ...modelEvidence,
      ...colorwayEvidence,
      ...styleCodeEvidence,
    ].map((evidence) => evidence.url)).size,
  };
}

export function createExplanationTrustEvaluation(
  claims: readonly ExplanationClaim[],
): ExplanationTrustEvaluation {
  const normalized = dedupeClaims(claims);
  return {
    claims: normalized,
    verifiedFactCount: normalized.filter((claim) => claim.kind === "verified_fact").length,
    inferenceCount: normalized.filter((claim) => claim.kind === "core_inference").length,
    editorialCount: normalized.filter((claim) => claim.kind === "ryo_editorial").length,
    unsupportedCount: normalized.filter((claim) => claim.kind === "unsupported").length,
    contradictionCount: normalized.reduce(
      (total, claim) => total + claim.contradictionReasons.length,
      0,
    ),
  };
}

export function createRyoAuthenticityEvaluation(
  input: RyoAuthenticityEvaluation,
): RyoAuthenticityEvaluation {
  return {
    ...input,
    historyFit: clampTrustScore(input.historyFit),
    materialStoryFit: clampTrustScore(input.materialStoryFit),
    outfitFit: clampTrustScore(input.outfitFit),
    culturalFit: clampTrustScore(input.culturalFit),
    adjacentDiscoveryFit: clampTrustScore(input.adjacentDiscoveryFit),
    collectionRoleFit: clampTrustScore(input.collectionRoleFit),
    wearableColorFit: clampTrustScore(input.wearableColorFit),
    tooSafePenalty: clampTrustScore(input.tooSafePenalty),
    hypeOnlyPenalty: clampTrustScore(input.hypeOnlyPenalty),
    contextMismatchPenalty: clampTrustScore(input.contextMismatchPenalty),
    total: clampTrustScore(input.total),
    rubricVersion: input.rubricVersion.trim() || "unversioned",
    reasons: uniqueText(input.reasons),
    penalties: uniqueText(input.penalties),
    matchedGoldRules: uniqueText(input.matchedGoldRules),
  };
}

export function createRecommendationTrustEvaluation(input: Omit<
  RecommendationTrustEvaluation,
  "status" | "reviewReasons"
>): RecommendationTrustEvaluation {
  const diagnosisFitScore = clampTrustScore(input.diagnosisFitScore);
  const ryoAuthenticity = createRyoAuthenticityEvaluation(input.ryoAuthenticity);
  const { status, reviewReasons } = deriveRecommendationTrustStatus({
    factual: input.factual,
    diagnosisFitScore,
    explanationTrust: input.explanationTrust,
  });
  return {
    ...input,
    diagnosisFitScore,
    ryoAuthenticity,
    status,
    reviewReasons,
  };
}

export function deriveRecommendationTrustStatus(input: {
  factual: FactualVerification;
  diagnosisFitScore: number;
  explanationTrust: ExplanationTrustEvaluation;
}): { status: RecommendationTrustStatus; reviewReasons: string[] } {
  const { factual, explanationTrust } = input;
  const diagnosisFitScore = clampTrustScore(input.diagnosisFitScore);
  const reasons: string[] = [];

  if (factual.model === "rejected") {
    return { status: "rejected", reviewReasons: ["モデルの実在性に重大な矛盾があります。"] };
  }
  if (!verifiedLevels.has(factual.model)) reasons.push("モデルの実在証拠が不足しています。");
  if (factual.colorway === "unverified") reasons.push("カラーは未確認です。");
  if (factual.styleCode === "unverified") reasons.push("Style Codeは未確認です。");
  if (factual.contradictions.length || explanationTrust.contradictionCount) {
    reasons.push("候補情報または説明に矛盾があります。");
  }
  if (explanationTrust.unsupportedCount) reasons.push("裏付けを確認できない説明があります。");
  if (diagnosisFitScore < 45) reasons.push("診断条件との一致が基準未満です。");
  if (onlyWeakEvidence(factual.modelEvidence)) reasons.push("出典品質の追加確認が必要です。");

  if (!verifiedLevels.has(factual.model) || factual.contradictions.length || diagnosisFitScore < 45) {
    return { status: "needs_review", reviewReasons: uniqueText(reasons) };
  }
  const colorwayVerified = verifiedLevels.has(factual.colorway);
  const hasFatalExplanationIssue =
    explanationTrust.contradictionCount > 0 || explanationTrust.unsupportedCount > 0;
  if (colorwayVerified && !hasFatalExplanationIssue) {
    return { status: "verified", reviewReasons: [] };
  }
  return {
    status: "partially_verified",
    reviewReasons: uniqueText(reasons.length ? reasons : ["一部の項目は未確認です。"]),
  };
}

export function deriveLegacyVerificationStatus(
  factual: FactualVerification,
): "model_and_colorway_verified" | "model_verified_colorway_unverified" | "unverified" {
  if (!verifiedLevels.has(factual.model)) return "unverified";
  return verifiedLevels.has(factual.colorway)
    ? "model_and_colorway_verified"
    : "model_verified_colorway_unverified";
}

function onlyWeakEvidence(evidence: readonly VerificationEvidence[]): boolean {
  return evidence.length > 0 && evidence.every(({ sourceQuality }) =>
    sourceQuality === "marketplace" || sourceQuality === "unknown");
}

function uniqueEvidence(evidence: readonly VerificationEvidence[]): VerificationEvidence[] {
  const seen = new Set<string>();
  return evidence.filter((item) => {
    const key = `${item.subject}:${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((item) => ({ ...item }));
}

function dedupeClaims(claims: readonly ExplanationClaim[]): ExplanationClaim[] {
  const seen = new Set<string>();
  return claims.filter((claim) => {
    const key = `${claim.kind}:${claim.text.trim().toLocaleLowerCase("ja-JP")}`;
    if (!claim.text.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((claim) => ({
    ...claim,
    text: claim.text.trim(),
    evidenceUrls: uniqueText(claim.evidenceUrls),
    supportingScoreKeys: uniqueText(claim.supportingScoreKeys),
    supportingCandidateFields: uniqueText(claim.supportingCandidateFields),
    contradictionReasons: uniqueText(claim.contradictionReasons),
  }));
}

function uniqueText(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
