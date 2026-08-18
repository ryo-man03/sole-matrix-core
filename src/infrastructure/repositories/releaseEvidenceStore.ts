import "server-only";
import type { ReleaseEvidenceStore, ReleaseObservationGroup } from "../../application/release-ingestion/ingestReleases";
import { resolveReleaseEvidence, type ReleaseResolution } from "../../domain/release/releaseEvidence";
import type { ReleaseEvidence, ReleaseObservation } from "../../domain/release/release";
import { createSupabaseAdminClient } from "../db/supabase/admin";

export function createReleaseEvidenceStore(): ReleaseEvidenceStore {
  const db = createSupabaseAdminClient();
  if (!db) throw new Error("ADMIN_NOT_CONFIGURED");
  return {
    async beginRun(input) {
      const { data, error } = await db.from("release_ingestion_runs").insert({
        provider_id: input.providerId,
        access_mode: input.accessMode,
        idempotency_key: input.idempotencyKey,
        cursor_before: input.cursorBefore,
        dry_run: input.dryRun,
        status: "running",
      }).select("id").single();
      if (!error && data) return { runId: data.id as string, replayed: false };
      if (error?.code === "23505") {
        const existing = await db.from("release_ingestion_runs").select("id").eq("provider_id", input.providerId).eq("idempotency_key", input.idempotencyKey).single();
        if (existing.error || !existing.data) throw new Error("INGESTION_RUN_READ_FAILED");
        return { runId: existing.data.id as string, replayed: true };
      }
      throw new Error("INGESTION_RUN_WRITE_FAILED");
    },
    async persistGroup(runId, group) {
      return persistGroup(db, runId, group);
    },
    async completeRun(runId, result) {
      const { error } = await db.from("release_ingestion_runs").update({
        status: result.dryRun ? "dry_run" : "succeeded",
        cursor_after: result.cursorAfter,
        observed_count: result.observedCount,
        accepted_count: result.acceptedCount,
        rejected_count: result.rejectedCount,
        conflict_count: result.conflictCount,
        completed_at: new Date().toISOString(),
      }).eq("id", runId);
      if (error) throw new Error("INGESTION_RUN_COMPLETE_FAILED");
    },
    async failRun(runId, safeErrorCode) {
      await db.from("release_ingestion_runs").update({ status: "failed", safe_error_code: safeErrorCode, completed_at: new Date().toISOString() }).eq("id", runId);
    },
  };
}

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

async function persistGroup(db: AdminClient, runId: string, group: ReleaseObservationGroup): Promise<ReleaseResolution> {
  const representative = group.observations[0]!;
  const existing = await findRelease(db, representative);
  let releaseItemId = existing?.releaseItemId;
  let variantId = existing?.variantId;

  if (!releaseItemId) {
    const { data, error } = await db.from("release_items").insert({
      canonical_brand: representative.brand,
      canonical_model_name: representative.modelName,
      model_family: representative.modelFamily,
      generation: representative.generation,
      information_state: "unknown",
      release_date: null,
      release_date_precision: "unknown",
      region: representative.region,
      source_confidence: 0,
      first_seen_at: representative.evidence.fetchedAt,
      last_verified_at: null,
    }).select("id").single();
    if (error || !data) throw new Error("RELEASE_ITEM_WRITE_FAILED");
    releaseItemId = data.id as string;
  }

  if (!variantId) {
    const { data, error } = await db.from("release_variants").insert({
      release_item_id: releaseItemId,
      colorway_name: representative.colorwayName,
      style_code: representative.styleCode,
      audience: representative.audience,
      region: representative.region,
      verification_state: representative.evidence.verificationState,
    }).select("id").single();
    if (error || !data) throw new Error("RELEASE_VARIANT_WRITE_FAILED");
    variantId = data.id as string;
  }

  for (const observation of group.observations) await persistEvidence(db, runId, releaseItemId, variantId, observation);
  const stored = await loadAcceptedEvidence(db, releaseItemId);
  const resolution = resolveReleaseEvidence(stored);
  const confidence = stored.length ? Math.max(...stored.map((item) => item.sourceQuality)) : 0;
  const lastVerifiedAt = stored.length ? [...stored].sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt))[0]!.fetchedAt : null;
  const { error: updateError } = await db.from("release_items").update({
    information_state: resolution.informationState,
    release_date: resolution.releaseDate,
    release_date_precision: resolution.releaseDate ? representative.releaseDatePrecision : "unknown",
    source_confidence: confidence,
    last_verified_at: lastVerifiedAt,
  }).eq("id", releaseItemId);
  if (updateError) throw new Error("RELEASE_ITEM_UPDATE_FAILED");

  if (resolution.hasConflict) {
    const current = await db.from("release_conflicts").select("id").eq("release_item_id", releaseItemId).eq("conflict_field", "release_date").eq("status", "open").maybeSingle();
    if (current.error) throw new Error("RELEASE_CONFLICT_READ_FAILED");
    const payload = { observed_values: resolution.observedReleaseDates, independent_source_count: resolution.independentSourceCount, detected_at: new Date().toISOString() };
    const { error } = current.data
      ? await db.from("release_conflicts").update(payload).eq("id", current.data.id)
      : await db.from("release_conflicts").insert({ release_item_id: releaseItemId, conflict_field: "release_date", status: "open", ...payload });
    if (error) throw new Error("RELEASE_CONFLICT_WRITE_FAILED");
  } else {
    await db.from("release_conflicts").update({ status: "resolved", resolved_at: new Date().toISOString(), resolution_note: "evidence_converged" }).eq("release_item_id", releaseItemId).eq("conflict_field", "release_date").eq("status", "open");
  }
  return resolution;
}

async function loadAcceptedEvidence(db: AdminClient, releaseItemId: string): Promise<ReleaseEvidence[]> {
  const result = await db.from("release_evidence").select("id,provider_id,source_kind,source_url,source_domain,canonical_origin_url,source_independence_key,external_item_id,content_fingerprint,supports_model,supports_style_code,supports_colorway,supports_release_date,supports_region,observed_release_date,observed_state,fetched_at,verification_state,review_state,supersedes_evidence_id,source_title,source_quality").eq("release_item_id", releaseItemId).eq("review_state", "accepted").neq("verification_state", "unverified");
  if (result.error) throw new Error("RELEASE_EVIDENCE_READ_FAILED");
  return (result.data ?? []).filter((row) => typeof row.observed_state === "string").map((row) => ({
    evidenceId: String(row.id),
    providerId: String(row.provider_id),
    sourceKind: row.source_kind as ReleaseEvidence["sourceKind"],
    sourceUrl: String(row.source_url ?? ""),
    sourceDomain: String(row.source_domain ?? ""),
    canonicalOriginUrl: String(row.canonical_origin_url ?? row.source_url ?? ""),
    sourceIndependenceKey: String(row.source_independence_key ?? `${row.provider_id}:${row.id}`),
    externalId: String(row.external_item_id ?? row.id),
    contentFingerprint: String(row.content_fingerprint),
    supportsModel: Boolean(row.supports_model),
    supportsStyleCode: Boolean(row.supports_style_code),
    supportsColorway: Boolean(row.supports_colorway),
    supportsReleaseDate: Boolean(row.supports_release_date),
    supportsRegion: Boolean(row.supports_region),
    observedReleaseDate: typeof row.observed_release_date === "string" ? row.observed_release_date : null,
    observedState: row.observed_state as ReleaseEvidence["observedState"],
    fetchedAt: String(row.fetched_at),
    verificationState: row.verification_state as ReleaseEvidence["verificationState"],
    reviewState: "accepted",
    supersedesEvidenceId: typeof row.supersedes_evidence_id === "string" ? row.supersedes_evidence_id : null,
    sourceTitle: String(row.source_title),
    sourceQuality: Number(row.source_quality),
  }));
}

async function findRelease(db: AdminClient, observation: ReleaseObservation): Promise<{ releaseItemId: string; variantId: string | null } | null> {
  if (observation.styleCode) {
    const result = await db.from("release_variants").select("id,release_item_id").eq("style_code", observation.styleCode).eq("region", observation.region).limit(1).maybeSingle();
    if (result.error) throw new Error("RELEASE_IDENTITY_READ_FAILED");
    return result.data ? { releaseItemId: result.data.release_item_id as string, variantId: result.data.id as string } : null;
  }
  let query = db.from("release_items").select("id").eq("canonical_brand", observation.brand).eq("canonical_model_name", observation.modelName).eq("model_family", observation.modelFamily).eq("region", observation.region);
  query = observation.generation === null ? query.is("generation", null) : query.eq("generation", observation.generation);
  const items = await query.limit(20);
  if (items.error) throw new Error("RELEASE_IDENTITY_READ_FAILED");
  if (observation.evidence.verificationState !== "verified" || !observation.colorwayName) return null;
  for (const item of items.data ?? []) {
    const variant = await db.from("release_variants").select("id").eq("release_item_id", item.id).eq("audience", observation.audience).eq("region", observation.region).eq("colorway_name", observation.colorwayName).eq("verification_state", "verified").limit(1).maybeSingle();
    if (variant.error) throw new Error("RELEASE_IDENTITY_READ_FAILED");
    if (variant.data) return { releaseItemId: item.id as string, variantId: variant.data.id as string };
  }
  return null;
}

async function persistEvidence(db: AdminClient, runId: string, releaseItemId: string, variantId: string, observation: ReleaseObservation): Promise<void> {
  const evidence = observation.evidence;
  const existing = await db.from("release_evidence").select("id,review_state,last_seen_at").eq("provider_id", evidence.providerId).eq("external_item_id", observation.externalId).eq("content_fingerprint", evidence.contentFingerprint).limit(1).maybeSingle();
  if (existing.error) throw new Error("RELEASE_EVIDENCE_READ_FAILED");
  if (existing.data) {
    const { error } = await db.from("release_evidence").update({ last_seen_at: evidence.fetchedAt, provider_run_id: runId }).eq("id", existing.data.id);
    if (error) throw new Error("RELEASE_EVIDENCE_UPDATE_FAILED");
    return;
  }
  const { data, error } = await db.from("release_evidence").insert({
    id: evidence.evidenceId,
    release_item_id: releaseItemId,
    release_variant_id: variantId,
    source_kind: evidence.sourceKind,
    source_url: evidence.sourceUrl,
    source_title: evidence.sourceTitle,
    supports_model: evidence.supportsModel,
    supports_colorway: evidence.supportsColorway,
    supports_style_code: evidence.supportsStyleCode,
    supports_release_date: evidence.supportsReleaseDate,
    supports_region: evidence.supportsRegion,
    fetched_at: evidence.fetchedAt,
    source_quality: evidence.sourceQuality,
    provider_id: evidence.providerId,
    provider_source_id: observation.providerSourceId,
    external_item_id: observation.externalId,
    content_fingerprint: evidence.contentFingerprint,
    source_domain: evidence.sourceDomain,
    source_independence_key: evidence.sourceIndependenceKey,
    canonical_origin_url: evidence.canonicalOriginUrl,
    observed_release_date: evidence.observedReleaseDate,
    observed_state: evidence.observedState,
    verification_state: evidence.verificationState,
    review_state: evidence.reviewState,
    supersedes_evidence_id: evidence.supersedesEvidenceId,
    provider_run_id: runId,
    first_seen_at: evidence.fetchedAt,
    last_seen_at: evidence.fetchedAt,
    last_verified_at: evidence.reviewState === "accepted" && evidence.verificationState !== "unverified" ? evidence.fetchedAt : null,
    provenance: { providerId: evidence.providerId, externalId: observation.externalId },
  }).select("id").single();
  if (error || !data) throw new Error("RELEASE_EVIDENCE_WRITE_FAILED");
  const history = await db.from("release_evidence_status_history").insert({ release_evidence_id: data.id, from_review_state: null, to_review_state: evidence.reviewState, reason_code: "provider_ingestion" });
  if (history.error) throw new Error("RELEASE_EVIDENCE_HISTORY_FAILED");
  if (evidence.supersedesEvidenceId) {
    const previous = await db.from("release_evidence").select("review_state").eq("id", evidence.supersedesEvidenceId).maybeSingle();
    if (previous.data) {
      await db.from("release_evidence").update({ review_state: "superseded" }).eq("id", evidence.supersedesEvidenceId);
      await db.from("release_evidence_status_history").insert({ release_evidence_id: evidence.supersedesEvidenceId, from_review_state: previous.data.review_state, to_review_state: "superseded", reason_code: "superseded_by_new_evidence" });
    }
  }
}
