import type { CanonicalSneakerKey, SneakerAudience } from "../identity/canonicalSneaker";

export const releaseStates = [
  "official_announced",
  "retailer_confirmed",
  "editorial_reported",
  "rumor",
  "released",
  "restocked",
  "cancelled",
  "date_changed",
  "unknown",
  "conflicting_evidence",
] as const;

export type ReleaseInformationState = (typeof releaseStates)[number];
export type ReleaseDatePrecision = "day" | "month" | "quarter" | "unknown";
export type ReleaseVerificationState = "verified" | "model_only" | "unverified";
export type ReleaseReviewState = "pending" | "accepted" | "rejected" | "superseded";
export type ReleaseSourceKind =
  | "brand_official"
  | "authorized_retailer"
  | "licensed_feed"
  | "editorial_authorized"
  | "manual_official_reference"
  | "manual_retailer_reference"
  | "manual_other";
export type ReleaseProviderState =
  | "LIVE_NORMALIZATION_VERIFIED"
  | "IMPLEMENTED_LIVE_UNVERIFIED"
  | "APPROVAL_PENDING"
  | "CREDENTIAL_MISSING"
  | "UNAUTHORIZED"
  | "TERMS_UNCLEAR"
  | "POLICY_BLOCKED"
  | "DISABLED"
  | "NOT_SUITABLE";
export type ReleaseProviderAccessMode = "manual_import" | "fixture" | "authorized_api" | "authorized_feed" | "disabled";

export type ReleaseProviderCapability = {
  providerId: string;
  sourceKind: ReleaseSourceKind;
  accessMode: ReleaseProviderAccessMode;
  state: ReleaseProviderState;
  automaticCollectionAllowed: boolean;
  persistentMetadataAllowed: boolean;
  imageReuseAllowed: boolean;
  articleExcerptAllowed: boolean;
  minimumIntervalSeconds: number;
  termsCheckedAt: string;
  termsVersion: string | null;
};

export type ReleaseCandidate = {
  id: string;
  key: CanonicalSneakerKey;
  brand: string;
  modelName: string;
  colorwayName: string | null;
  informationState: ReleaseInformationState;
  releaseDate: string | null;
  releaseDatePrecision?: ReleaseDatePrecision;
  region?: string;
  verificationState: ReleaseVerificationState;
  sourceConfidence: number;
  evidenceCount: number;
  independentSourceCount?: number;
  lastVerifiedAt?: string | null;
  hasConflict?: boolean;
  priceJpy: number | null;
  tags: string[];
  colors: string[];
  materials: string[];
};

export type ReleaseObservation = {
  externalId: string;
  providerSourceId: string | null;
  brand: string;
  modelName: string;
  modelFamily: string;
  generation: string | null;
  audience: SneakerAudience;
  colorwayName: string | null;
  styleCode: string | null;
  gtin: string | null;
  region: string;
  releaseDate: string | null;
  releaseDatePrecision: ReleaseDatePrecision;
  informationState: Exclude<ReleaseInformationState, "conflicting_evidence">;
  evidence: ReleaseEvidence;
};

export type ReleaseEvidence = {
  evidenceId: string;
  providerId: string;
  sourceKind: ReleaseSourceKind;
  sourceUrl: string;
  sourceDomain: string;
  canonicalOriginUrl: string;
  sourceIndependenceKey: string;
  externalId: string;
  contentFingerprint: string;
  supportsModel: boolean;
  supportsStyleCode: boolean;
  supportsColorway: boolean;
  supportsReleaseDate: boolean;
  supportsRegion: boolean;
  observedReleaseDate: string | null;
  observedState: Exclude<ReleaseInformationState, "conflicting_evidence">;
  fetchedAt: string;
  verificationState: ReleaseVerificationState;
  reviewState: ReleaseReviewState;
  supersedesEvidenceId: string | null;
  sourceTitle: string;
  sourceQuality: number;
};

export type ReleaseProviderCollectRequest = {
  cursor: string | null;
  limit: number;
};

export type ReleaseProviderPage = {
  records: readonly unknown[];
  nextCursor: string | null;
};

export interface ReleaseProvider {
  readonly capability: ReleaseProviderCapability;
  collect(request: ReleaseProviderCollectRequest): Promise<ReleaseProviderPage>;
  normalize(record: unknown): ReleaseObservation;
}

export const activeReleaseProviders: readonly ReleaseProviderCapability[] = [
  {
    providerId: "fixture",
    sourceKind: "manual_other",
    accessMode: "fixture",
    state: "DISABLED",
    automaticCollectionAllowed: false,
    persistentMetadataAllowed: false,
    imageReuseAllowed: false,
    articleExcerptAllowed: false,
    minimumIntervalSeconds: 0,
    termsCheckedAt: "2026-08-18",
    termsVersion: null,
  },
  {
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
];
