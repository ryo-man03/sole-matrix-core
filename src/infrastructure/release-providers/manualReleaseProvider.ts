import { randomUUID } from "node:crypto";
import { canonicalSneakerKey } from "../../domain/identity/canonicalSneaker";
import { fingerprintReleaseEvidence } from "../../domain/release/releaseEvidence";
import {
  releaseStates,
  type ReleaseEvidence,
  type ReleaseInformationState,
  type ReleaseObservation,
  type ReleaseProvider,
  type ReleaseReviewState,
  type ReleaseSourceKind,
  type ReleaseVerificationState,
} from "../../domain/release/release";

const manualSourceKinds = new Set<ReleaseSourceKind>(["manual_official_reference", "manual_retailer_reference", "manual_other"]);
const marketplaces = /(^|\.)(?:amazon\.|ebay\.|rakuten\.|shopping\.yahoo\.|stockx\.com$|snkrdunk\.com$)/iu;

export type ManualReleaseRecord = {
  externalId: string;
  providerSourceId?: string | null;
  brand: string;
  modelName: string;
  modelFamily: string;
  generation?: string | null;
  audience?: "men" | "women" | "unisex" | "kids" | "unknown";
  colorwayName?: string | null;
  styleCode?: string | null;
  gtin?: string | null;
  region: string;
  releaseDate?: string | null;
  releaseDatePrecision?: "day" | "month" | "quarter" | "unknown";
  informationState: Exclude<ReleaseInformationState, "conflicting_evidence">;
  sourceKind: "manual_official_reference" | "manual_retailer_reference" | "manual_other";
  sourceUrl: string;
  canonicalOriginUrl?: string;
  sourceTitle: string;
  sourceQuality: number;
  supportsModel: boolean;
  supportsStyleCode: boolean;
  supportsColorway: boolean;
  supportsReleaseDate: boolean;
  supportsRegion: boolean;
  verificationState: ReleaseVerificationState;
  reviewState?: "pending" | "accepted";
  supersedesEvidenceId?: string | null;
  fetchedAt: string;
};

export function createManualReleaseProvider(records: readonly unknown[]): ReleaseProvider {
  return {
    capability: {
      providerId: "manual_seed",
      sourceKind: "manual_other",
      accessMode: "manual_import",
      state: "IMPLEMENTED_LIVE_UNVERIFIED",
      automaticCollectionAllowed: false,
      persistentMetadataAllowed: true,
      imageReuseAllowed: false,
      articleExcerptAllowed: false,
      minimumIntervalSeconds: 0,
      termsCheckedAt: "2026-08-18",
      termsVersion: "manual-reference-v1",
    },
    async collect({ cursor, limit }) {
      const offset = cursor === null ? 0 : parseCursor(cursor);
      const page = records.slice(offset, offset + limit);
      return { records: page, nextCursor: offset + page.length < records.length ? String(offset + page.length) : null };
    },
    normalize: normalizeManualReleaseRecord,
  };
}

export function normalizeManualReleaseRecord(raw: unknown): ReleaseObservation {
  if (!isRecord(raw)) throw new Error("RELEASE_RECORD_INVALID");
  const sourceKind = requiredString(raw.sourceKind) as ReleaseSourceKind;
  if (!manualSourceKinds.has(sourceKind)) throw new Error("RELEASE_SOURCE_KIND_DENIED");
  const sourceUrl = safeSourceUrl(requiredString(raw.sourceUrl));
  const canonicalOriginUrl = safeSourceUrl(optionalString(raw.canonicalOriginUrl) ?? sourceUrl);
  const sourceDomain = new URL(sourceUrl).hostname.toLowerCase();
  const canonicalOriginDomain = new URL(canonicalOriginUrl).hostname.toLowerCase();
  if (marketplaces.test(sourceDomain) || marketplaces.test(canonicalOriginDomain)) throw new Error("MARKETPLACE_RELEASE_SOURCE_DENIED");

  const informationState = requiredString(raw.informationState) as ReleaseInformationState;
  if (!releaseStates.includes(informationState) || informationState === "conflicting_evidence") throw new Error("RELEASE_STATE_INVALID");
  const releaseDate = optionalString(raw.releaseDate);
  if (releaseDate !== null && !/^\d{4}-\d{2}-\d{2}$/u.test(releaseDate)) throw new Error("RELEASE_DATE_INVALID");
  const fetchedAt = requiredString(raw.fetchedAt);
  if (!Number.isFinite(Date.parse(fetchedAt))) throw new Error("FETCHED_AT_INVALID");

  const brand = bounded(requiredString(raw.brand), 100);
  const modelName = bounded(requiredString(raw.modelName), 200);
  const modelFamily = bounded(requiredString(raw.modelFamily), 150);
  const key = canonicalSneakerKey({
    brand,
    modelName,
    modelFamily,
    generation: optionalString(raw.generation),
    styleCode: optionalString(raw.styleCode),
    audience: audience(raw.audience),
  });
  const sourceQuality = Number(raw.sourceQuality);
  if (!Number.isFinite(sourceQuality) || sourceQuality < 0 || sourceQuality > 100) throw new Error("SOURCE_QUALITY_INVALID");
  const verificationState = verification(raw.verificationState);
  const reviewState = review(raw.reviewState);
  const externalId = bounded(requiredString(raw.externalId), 200);
  const providerSourceId = optionalString(raw.providerSourceId);
  const evidenceWithoutFingerprint: Omit<ReleaseEvidence, "contentFingerprint"> = {
    evidenceId: randomUUID(),
    providerId: "manual_seed",
    sourceKind,
    sourceUrl,
    sourceDomain,
    canonicalOriginUrl,
    sourceIndependenceKey: `${canonicalOriginDomain}:${providerSourceId ?? (new URL(canonicalOriginUrl).pathname.replace(/\/$/u, "") || "/")}`,
    externalId,
    supportsModel: bool(raw.supportsModel),
    supportsStyleCode: bool(raw.supportsStyleCode),
    supportsColorway: bool(raw.supportsColorway),
    supportsReleaseDate: bool(raw.supportsReleaseDate),
    supportsRegion: bool(raw.supportsRegion),
    observedReleaseDate: releaseDate,
    observedState: informationState,
    fetchedAt,
    verificationState,
    reviewState,
    supersedesEvidenceId: optionalUuid(raw.supersedesEvidenceId),
    sourceTitle: bounded(requiredString(raw.sourceTitle), 300),
    sourceQuality,
  };
  return {
    externalId,
    providerSourceId,
    brand,
    modelName,
    modelFamily,
    generation: key.generation,
    audience: key.audience,
    colorwayName: optionalString(raw.colorwayName),
    styleCode: key.styleCode,
    gtin: optionalString(raw.gtin),
    region: bounded(requiredString(raw.region), 12).toUpperCase(),
    releaseDate,
    releaseDatePrecision: precision(raw.releaseDatePrecision),
    informationState,
    evidence: { ...evidenceWithoutFingerprint, contentFingerprint: fingerprintReleaseEvidence(evidenceWithoutFingerprint) },
  };
}

function parseCursor(value: string): number {
  if (!/^\d{1,8}$/u.test(value)) throw new Error("RELEASE_CURSOR_INVALID");
  return Number(value);
}

function safeSourceUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("RELEASE_SOURCE_URL_INVALID");
  url.hash = "";
  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("RELEASE_FIELD_REQUIRED");
  return value.normalize("NFKC").trim();
}
function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requiredString(value);
}
function bounded(value: string, length: number): string {
  if (value.length > length) throw new Error("RELEASE_FIELD_TOO_LONG");
  return value;
}
function bool(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("RELEASE_BOOLEAN_REQUIRED");
  return value;
}
function audience(value: unknown): "men" | "women" | "unisex" | "kids" | "unknown" {
  if (value === undefined) return "unknown";
  if (["men", "women", "unisex", "kids", "unknown"].includes(String(value))) return value as never;
  throw new Error("RELEASE_AUDIENCE_INVALID");
}
function precision(value: unknown): "day" | "month" | "quarter" | "unknown" {
  if (value === undefined) return "unknown";
  if (["day", "month", "quarter", "unknown"].includes(String(value))) return value as never;
  throw new Error("RELEASE_PRECISION_INVALID");
}
function verification(value: unknown): ReleaseVerificationState {
  if (["verified", "model_only", "unverified"].includes(String(value))) return value as ReleaseVerificationState;
  throw new Error("RELEASE_VERIFICATION_INVALID");
}
function review(value: unknown): ReleaseReviewState {
  if (value === undefined) return "pending";
  if (value === "pending" || value === "accepted") return value;
  throw new Error("RELEASE_REVIEW_INVALID");
}
function optionalUuid(value: unknown): string | null {
  const string = optionalString(value);
  if (string === null) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(string)) throw new Error("RELEASE_EVIDENCE_ID_INVALID");
  return string;
}
