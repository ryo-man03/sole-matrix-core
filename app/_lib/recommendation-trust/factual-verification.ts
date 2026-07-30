import {
  classifyEvidenceSourceQuality,
  normalizeStyleCode,
  validateEvidenceUrls,
  type ColorwayVerificationStatus,
  type EvidenceSourceQuality,
} from "../ai/gemini-sneaker-research-schema";
import { createFactualVerification } from "./evaluation";
import type {
  FactualVerification,
  VerificationEvidence,
  VerificationLevel,
  VerificationSubject,
} from "./types";

export type FactualCandidateInput = {
  brand: string;
  modelName: string;
  colorwayName: string | null;
  styleCode: string | null;
  modelEvidenceUrls: readonly string[];
  colorwayEvidenceUrls: readonly string[];
  styleCodeEvidenceUrls: readonly string[];
  evidenceDetails?: readonly Omit<VerificationEvidence, "domain" | "sourceQuality">[];
  expectedAudience?: "mens" | "womens" | "kids" | "unisex";
  evidenceAudience?: "mens" | "womens" | "kids" | "unisex";
  groundingText?: string;
};

export type FactualCandidateResult = {
  factual: FactualVerification;
  colorwayName: string | null;
  styleCode: string | null;
  verificationStatus: ColorwayVerificationStatus;
  acceptedForRecommendation: boolean;
};

const exclusionPattern = /\b(?:custom|inspired|replica|fake|type|bootleg|unauthorized)\b|風(?:商品|モデル)|架空/iu;
const rumorPattern = /\b(?:rumou?r|unreleased|sample only|concept)\b|未発売|リーク|噂/iu;
const knownBrands = [
  "adidas",
  "asics",
  "converse",
  "hoka",
  "new balance",
  "nike",
  "puma",
  "reebok",
  "vans",
] as const;

export function evaluateFactualCandidate(input: FactualCandidateInput): FactualCandidateResult {
  const contradictions = detectCandidateContradictions(input);
  const modelEvidence = buildEvidence("model", input.modelEvidenceUrls, input);
  const rawColorEvidence = buildEvidence("colorway", input.colorwayEvidenceUrls, input);
  const rawStyleCodeEvidence = buildEvidence("style_code", input.styleCodeEvidenceUrls, input);
  const rejected = contradictions.some((reason) =>
    /除外語|ブランド不一致|Kids|未発売|噂|架空/u.test(reason));

  const model = rejected ? "rejected" : verificationLevel(modelEvidence);
  const colorEvidence = input.colorwayName && !hasColorwayMismatch(input)
    ? rawColorEvidence
    : [];
  const colorway = input.colorwayName
    ? rejected ? "rejected" : verificationLevel(colorEvidence)
    : "unverified";
  const normalizedStyleCode = normalizeStyleCode(input.styleCode);
  const styleEvidence = normalizedStyleCode && !hasStyleCodeMismatch(input)
    ? rawStyleCodeEvidence
    : [];
  const styleCode = normalizedStyleCode
    ? rejected ? "rejected" : verificationLevel(styleEvidence)
    : "unverified";
  const factual = createFactualVerification({
    model,
    colorway,
    styleCode,
    modelEvidence,
    colorwayEvidence: colorEvidence,
    styleCodeEvidence: styleEvidence,
    unsupportedClaims: [
      ...(input.colorwayName && !isVerified(colorway) ? [`未確認カラー: ${input.colorwayName}`] : []),
      ...(input.styleCode && !isVerified(styleCode) ? [`未確認Style Code: ${input.styleCode}`] : []),
    ],
    contradictions,
  });

  const acceptedForRecommendation = isVerified(model) && !rejected;
  return {
    factual,
    colorwayName: isVerified(colorway) ? input.colorwayName : null,
    styleCode: isVerified(styleCode) ? normalizedStyleCode : null,
    verificationStatus: acceptedForRecommendation
      ? isVerified(colorway)
        ? "model_and_colorway_verified"
        : "model_verified_colorway_unverified"
      : "unverified",
    acceptedForRecommendation,
  };
}

export function detectCandidateContradictions(input: FactualCandidateInput): string[] {
  const combined = `${input.brand} ${input.modelName} ${input.colorwayName ?? ""} ${input.groundingText ?? ""}`;
  const contradictions: string[] = [];
  if (exclusionPattern.test(combined)) contradictions.push("custom / inspired / replica / fake等の除外語を検出しました。");
  if (rumorPattern.test(combined)) contradictions.push("未発売または噂段階の候補です。");

  const brand = comparable(input.brand);
  const modelLeadingBrand = knownBrands.find((candidate) =>
    comparable(input.modelName).startsWith(candidate.replace(/\s+/gu, "")));
  if (modelLeadingBrand && !brand.includes(modelLeadingBrand.replace(/\s+/gu, ""))) {
    contradictions.push(`ブランド不一致: ${input.brand} / ${modelLeadingBrand}`);
  }
  if (
    input.expectedAudience &&
    input.evidenceAudience &&
    input.expectedAudience !== "unisex" &&
    input.evidenceAudience !== "unisex" &&
    input.expectedAudience !== input.evidenceAudience &&
    (input.expectedAudience === "kids" || input.evidenceAudience === "kids")
  ) {
    contradictions.push(`Kids区分の不一致: ${input.expectedAudience} / ${input.evidenceAudience}`);
  }
  if (hasColorwayMismatch(input)) contradictions.push("カラー証拠が別モデルまたは別カラーを指しています。");
  if (hasStyleCodeMismatch(input)) contradictions.push("Style Code証拠が別モデルまたは別コードを指しています。");
  return [...new Set(contradictions)];
}

function buildEvidence(
  subject: VerificationSubject,
  urls: readonly string[],
  input: FactualCandidateInput,
): VerificationEvidence[] {
  const safeUrls = validateEvidenceUrls([...urls]);
  return safeUrls.map((url) => {
    const detail = input.evidenceDetails?.find((item) =>
      item.subject === subject && item.url === url);
    return {
      subject,
      url,
      domain: domainOf(url),
      sourceQuality: classifyEvidenceSourceQuality([url]),
      ...(detail?.supportedText ? { supportedText: detail.supportedText } : {}),
      ...(detail?.modelName ? { modelName: detail.modelName } : {}),
      ...(detail && "colorwayName" in detail ? { colorwayName: detail.colorwayName } : {}),
      ...(detail && "styleCode" in detail ? { styleCode: detail.styleCode } : {}),
    };
  });
}

function verificationLevel(evidence: readonly VerificationEvidence[]): VerificationLevel {
  if (evidence.some(({ sourceQuality }) => sourceQuality === "official")) {
    return "officially_verified";
  }
  if (evidence.some(({ sourceQuality }) =>
    sourceQuality === "authorized_retailer" ||
    sourceQuality === "reputable_retailer" ||
    sourceQuality === "reputable_media")) {
    return "independently_verified";
  }
  const independentDomains = new Set(evidence
    .filter(({ sourceQuality }) => sourceQuality !== "marketplace" && sourceQuality !== "unknown")
    .map(({ domain }) => domain));
  return independentDomains.size >= 2 ? "independently_verified" : "unverified";
}

function hasColorwayMismatch(input: FactualCandidateInput): boolean {
  if (!input.colorwayName) return false;
  return input.evidenceDetails?.some((detail) =>
    detail.subject === "colorway" && (
      Boolean(detail.modelName && !sameIdentity(detail.modelName, input.modelName)) ||
      Boolean(detail.colorwayName && !sameIdentity(detail.colorwayName, input.colorwayName!))
    )) ?? false;
}

function hasStyleCodeMismatch(input: FactualCandidateInput): boolean {
  if (!input.styleCode) return false;
  const normalized = normalizeStyleCode(input.styleCode);
  return input.evidenceDetails?.some((detail) =>
    detail.subject === "style_code" && (
      Boolean(detail.modelName && !sameIdentity(detail.modelName, input.modelName)) ||
      Boolean(detail.styleCode && normalizeStyleCode(detail.styleCode) !== normalized)
    )) ?? false;
}

function isVerified(level: VerificationLevel): boolean {
  return level === "officially_verified" || level === "independently_verified";
}

function sameIdentity(left: string, right: string): boolean {
  return comparable(left) === comparable(right);
}

function comparable(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function domainOf(value: string): string {
  try {
    return new URL(value).hostname.toLocaleLowerCase("en-US").replace(/^www\./u, "");
  } catch {
    return "";
  }
}

export function classifySingleSource(url: string): EvidenceSourceQuality {
  return classifyEvidenceSourceQuality([url]);
}
