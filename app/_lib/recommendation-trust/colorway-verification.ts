import type { ColorwayVerificationState } from "../market/contracts";
import { isSafePublicHttpsUrl } from "../market/listing-match";

export type AiSneakerProposal = Readonly<{
  proposedModelName: string;
  proposedColorwayName: string | null;
  proposedStyleCode: string | null;
  searchAliases: string[];
  proposedReasons: string[];
  sourceHints: { url: string; sourceType: string }[];
  confidence: "low" | "medium" | "high";
}>;

export type ColorwayEvidenceSourceType =
  | "brand_official"
  | "authorized_retailer"
  | "verified_catalog"
  | "marketplace_listing"
  | "editorial"
  | "user_supplied";

export type ColorwayEvidence = Readonly<{
  sourceType: ColorwayEvidenceSourceType;
  url: string;
  modelName: string | null;
  colorwayName: string | null;
  styleCode: string | null;
  sourceTitle: string | null;
  fetchedAt: string;
  supportsModel: boolean;
  supportsColorway: boolean;
  supportsStyleCode: boolean;
}>;

export type ColorwayVerificationResult = Readonly<{
  state: ColorwayVerificationState;
  modelName: string | null;
  colorwayName: string | null;
  styleCode: string | null;
  evidence: ColorwayEvidence[];
  conflicts: string[];
  warnings: string[];
  verifiedAt: string | null;
}>;

const INDEPENDENT_SOURCE_TYPES: ReadonlySet<ColorwayEvidenceSourceType> = new Set([
  "verified_catalog",
  "editorial",
]);

export function verifyColorwayProposal(
  proposal: AiSneakerProposal,
  inputEvidence: readonly ColorwayEvidence[],
  verifiedAt = new Date().toISOString(),
): ColorwayVerificationResult {
  const evidence = dedupeEvidence(inputEvidence).filter((item) => isSafePublicHttpsUrl(item.url));
  const conflicts = detectConflicts(proposal, evidence);
  const modelEvidence = evidence.filter((item) => item.supportsModel && sameText(item.modelName, proposal.proposedModelName));
  const modelVerified = sufficientEvidence(modelEvidence);

  const colorEvidence = proposal.proposedColorwayName
    ? evidence.filter((item) => item.supportsColorway
      && sameText(item.modelName, proposal.proposedModelName)
      && sameColor(item.colorwayName, proposal.proposedColorwayName))
    : [];
  const colorVerified = modelVerified && Boolean(proposal.proposedColorwayName)
    && !conflicts.some((item) => /カラー|colorway/iu.test(item))
    && sufficientEvidence(colorEvidence);

  const normalizedProposedStyle = normalizeStyleCode(proposal.proposedStyleCode);
  const styleEvidence = normalizedProposedStyle
    ? evidence.filter((item) => item.supportsStyleCode
      && sameText(item.modelName, proposal.proposedModelName)
      && normalizeStyleCode(item.styleCode) === normalizedProposedStyle)
    : [];
  const styleVerified = colorVerified && Boolean(normalizedProposedStyle)
    && !conflicts.some((item) => /Style Code/iu.test(item))
    && sufficientEvidence(styleEvidence);

  const state: ColorwayVerificationState = !modelVerified
    ? "unverified"
    : colorVerified && styleVerified
      ? "model_color_style_verified"
      : colorVerified
        ? "model_color_verified"
        : "model_only";
  const warnings: string[] = [];
  if (proposal.proposedColorwayName && !colorVerified) warnings.push("AIが提案したカラーは確認できなかったため表示しません。");
  if (proposal.proposedStyleCode && !styleVerified) warnings.push("Style Codeは完全一致を確認できなかったため表示しません。");
  if (evidence.length > 0 && evidence.every((item) => item.sourceType === "marketplace_listing")) {
    warnings.push("マーケットプレイスの出品情報だけでは公式カラーを確認済みにできません。");
  }
  if (proposal.confidence === "high") warnings.push("AIのconfidenceは事実確認の根拠には使用していません。");

  return {
    state,
    modelName: modelVerified ? proposal.proposedModelName : null,
    colorwayName: colorVerified ? proposal.proposedColorwayName : null,
    styleCode: styleVerified ? displayStyleCode(proposal.proposedStyleCode) : null,
    evidence,
    conflicts,
    warnings,
    verifiedAt: modelVerified ? verifiedAt : null,
  };
}

export function colorwaySourceTypeFromQuality(
  quality: "official" | "authorized_retailer" | "reputable_retailer" | "reputable_media" | "marketplace" | "unknown",
): ColorwayEvidenceSourceType {
  if (quality === "official") return "brand_official";
  if (quality === "authorized_retailer") return "authorized_retailer";
  if (quality === "reputable_retailer") return "verified_catalog";
  if (quality === "reputable_media") return "editorial";
  if (quality === "marketplace") return "marketplace_listing";
  return "user_supplied";
}

export function normalizeStyleCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.normalize("NFKC").toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/gu, "");
  return normalized.length >= 5 && normalized.length <= 16 ? normalized : null;
}

function displayStyleCode(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.normalize("NFKC").toLocaleUpperCase("en-US")
    .replace(/[‐‑‒–—―]/gu, "-").replace(/\s+/gu, "").trim();
  return normalized || null;
}

function sufficientEvidence(evidence: readonly ColorwayEvidence[]): boolean {
  if (evidence.some((item) => item.sourceType === "brand_official" || item.sourceType === "authorized_retailer")) return true;
  const independentDomains = new Set(evidence
    .filter((item) => INDEPENDENT_SOURCE_TYPES.has(item.sourceType))
    .map((item) => hostname(item.url))
    .filter(Boolean));
  return independentDomains.size >= 2;
}

function detectConflicts(proposal: AiSneakerProposal, evidence: readonly ColorwayEvidence[]): string[] {
  const conflicts: string[] = [];
  for (const item of evidence) {
    if (item.supportsModel && item.modelName && !sameText(item.modelName, proposal.proposedModelName)) {
      conflicts.push(`モデル不一致: ${item.modelName}`);
    }
    if (item.supportsColorway && item.colorwayName && proposal.proposedColorwayName
      && !sameColor(item.colorwayName, proposal.proposedColorwayName)) {
      conflicts.push(`カラー不一致: ${item.colorwayName}`);
    }
    if (item.supportsStyleCode && item.styleCode && proposal.proposedStyleCode
      && normalizeStyleCode(item.styleCode) !== normalizeStyleCode(proposal.proposedStyleCode)) {
      conflicts.push(`Style Code不一致: ${item.styleCode}`);
    }
  }
  const colors = new Set(evidence.filter((item) => item.supportsColorway && item.colorwayName).map((item) => comparableColor(item.colorwayName!)));
  if (colors.size > 1) conflicts.push("複数の異なるカラー名が見つかりました。");
  const styles = new Set(evidence.filter((item) => item.supportsStyleCode && item.styleCode).map((item) => normalizeStyleCode(item.styleCode)).filter(Boolean));
  if (styles.size > 1) conflicts.push("複数の異なるStyle Codeが見つかりました。");
  return [...new Set(conflicts)];
}

function dedupeEvidence(evidence: readonly ColorwayEvidence[]): ColorwayEvidence[] {
  const seen = new Set<string>();
  return evidence.filter((item) => {
    const key = [item.url, item.modelName, item.colorwayName, normalizeStyleCode(item.styleCode), item.supportsModel, item.supportsColorway, item.supportsStyleCode].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sameText(left: string | null, right: string | null): boolean {
  return Boolean(left && right && comparable(left) === comparable(right));
}

function sameColor(left: string | null, right: string | null): boolean {
  return Boolean(left && right && comparableColor(left) === comparableColor(right));
}

function comparable(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function comparableColor(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US")
    .split(/[\s/,&+_-]+/gu).filter(Boolean).sort().join("");
}

function hostname(value: string): string {
  try { return new URL(value).hostname.toLocaleLowerCase("en-US").replace(/^www\./u, ""); } catch { return ""; }
}
