import { createHash } from "node:crypto";
import { canonicalSneakerKey } from "../identity/canonicalSneaker";
import type {
  ReleaseEvidence,
  ReleaseInformationState,
  ReleaseObservation,
  ReleaseSourceKind,
} from "./release";

const sourcePriority: Record<ReleaseSourceKind, number> = {
  brand_official: 700,
  authorized_retailer: 600,
  licensed_feed: 500,
  editorial_authorized: 400,
  manual_official_reference: 300,
  manual_retailer_reference: 200,
  manual_other: 100,
};

export type ReleaseIdentityMatch = "exact_style_code" | "exact_verified_identity" | "review_required" | "different";

export type ReleaseResolution = {
  informationState: ReleaseInformationState;
  releaseDate: string | null;
  observedReleaseDates: string[];
  independentSourceCount: number;
  hasConflict: boolean;
};

export function fingerprintReleaseEvidence(value: Omit<ReleaseEvidence, "contentFingerprint">): string {
  const { evidenceId: _evidenceId, fetchedAt: _fetchedAt, reviewState: _reviewState, supersedesEvidenceId: _supersedesEvidenceId, ...content } = value;
  return createHash("sha256").update(stableJson(content)).digest("hex");
}

export function countIndependentSources(evidence: readonly ReleaseEvidence[]): number {
  return new Set(evidence.map((item) => item.sourceIndependenceKey)).size;
}

export function resolveReleaseEvidence(evidence: readonly ReleaseEvidence[]): ReleaseResolution {
  const usable = evidence.filter((item) => item.reviewState === "accepted" && item.verificationState !== "unverified");
  const independent = uniqueByIndependence(usable);
  const dates = [...new Set(independent.filter((item) => item.supportsReleaseDate && item.observedReleaseDate).map((item) => item.observedReleaseDate!))].sort();
  if (dates.length > 1) {
    return {
      informationState: "conflicting_evidence",
      releaseDate: null,
      observedReleaseDates: dates,
      independentSourceCount: independent.length,
      hasConflict: true,
    };
  }
  const strongest = [...independent].sort(compareEvidence)[0];
  return {
    informationState: strongest?.observedState ?? "unknown",
    releaseDate: dates[0] ?? null,
    observedReleaseDates: dates,
    independentSourceCount: independent.length,
    hasConflict: false,
  };
}

export function compareReleaseIdentity(a: ReleaseObservation, b: ReleaseObservation): ReleaseIdentityMatch {
  const ak = canonicalSneakerKey({
    brand: a.brand,
    modelName: a.modelName,
    modelFamily: a.modelFamily,
    generation: a.generation,
    styleCode: a.styleCode,
    audience: a.audience,
  });
  const bk = canonicalSneakerKey({
    brand: b.brand,
    modelName: b.modelName,
    modelFamily: b.modelFamily,
    generation: b.generation,
    styleCode: b.styleCode,
    audience: b.audience,
  });
  if (ak.styleCode || bk.styleCode) {
    return ak.styleCode !== null && bk.styleCode !== null && ak.styleCode === bk.styleCode ? "exact_style_code" : "different";
  }
  if (ak.brandSlug !== bk.brandSlug || ak.modelFamily !== bk.modelFamily) return "different";
  if (ak.generation !== bk.generation || ak.audience !== bk.audience) return "different";
  if (normalize(a.region) !== normalize(b.region)) return "review_required";
  if (!a.colorwayName || !b.colorwayName || a.evidence.verificationState !== "verified" || b.evidence.verificationState !== "verified") return "review_required";
  if (normalize(a.colorwayName) !== normalize(b.colorwayName)) return "different";
  return "exact_verified_identity";
}

export function dedupeReleaseObservations(observations: readonly ReleaseObservation[]): ReleaseObservation[] {
  const result: ReleaseObservation[] = [];
  for (const observation of observations) {
    if (result.some((existing) => existing.evidence.contentFingerprint === observation.evidence.contentFingerprint)) continue;
    if (result.some((existing) => compareReleaseIdentity(existing, observation) === "exact_style_code" && existing.evidence.providerId === observation.evidence.providerId && existing.externalId === observation.externalId)) continue;
    result.push(observation);
  }
  return result;
}

function uniqueByIndependence(evidence: readonly ReleaseEvidence[]): ReleaseEvidence[] {
  const strongest = new Map<string, ReleaseEvidence>();
  for (const item of evidence) {
    const current = strongest.get(item.sourceIndependenceKey);
    if (!current || compareEvidence(item, current) < 0) strongest.set(item.sourceIndependenceKey, item);
  }
  return [...strongest.values()];
}

function compareEvidence(a: ReleaseEvidence, b: ReleaseEvidence): number {
  return sourcePriority[b.sourceKind] - sourcePriority[a.sourceKind]
    || b.sourceQuality - a.sourceQuality
    || b.fetchedAt.localeCompare(a.fetchedAt)
    || a.evidenceId.localeCompare(b.evidenceId);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase();
}
