import "server-only";

import { createHash } from "node:crypto";

import type { MarketProviderResult } from "../../../app/_lib/market/contracts";
import type { ProviderObservation, ReleaseQualityInput, UserQualityInput } from "../../application/admin/quality";
import { evaluateDataQuality } from "../../application/admin/quality";
import { createSupabaseAdminClient } from "../db/supabase/admin";

const MAX_ADMIN_ROWS = 10_000;

export async function recordMarketProviderObservations(requestId: string, durationMs: number, providers: readonly MarketProviderResult[]) {
  const db = createSupabaseAdminClient();
  if (!db || !isUuid(requestId)) return false;
  const rows = providers.map((provider) => ({
    request_id: requestId,
    provider_id: provider.provider,
    operation: "market_search",
    status: provider.status,
    duration_ms: Math.max(0, Math.min(300_000, Math.round(durationMs))),
    retry_count: 0,
    cache_status: "unknown",
    normalized_count: provider.audit.normalizedCount,
    exact_count: provider.audit.exactCount,
    probable_count: provider.audit.probableCount,
    rejected_count: provider.audit.rejectedCount,
    safe_error_code: provider.status === "success" ? null : (provider.safeCode ?? provider.status).slice(0, 120),
  }));
  const { error } = await db.from("provider_observations").insert(rows);
  return !error;
}

export async function loadProviderAdminData() {
  const db = requiredAdminDb();
  const [observations, runs] = await Promise.all([
    db.from("provider_observations").select("provider_id,operation,status,duration_ms,retry_count,cache_status,normalized_count,exact_count,probable_count,rejected_count,safe_error_code,observed_at").order("observed_at", { ascending: false }).limit(500),
    db.from("release_ingestion_runs").select("id,provider_id,access_mode,status,dry_run,observed_count,accepted_count,rejected_count,conflict_count,safe_error_code,started_at,completed_at").order("started_at", { ascending: false }).limit(200),
  ]);
  if (observations.error || runs.error) throw new Error("ADMIN_READ_FAILED");
  return { observations: observations.data ?? [], ingestionRuns: runs.data ?? [] };
}

export async function loadReleaseAdminData() {
  const db = requiredAdminDb();
  const [releases, drafts] = await Promise.all([
    db.from("release_items").select("id,canonical_brand,canonical_model_name,model_family,generation,information_state,release_date,region,source_confidence,last_verified_at,updated_at,release_variants(style_code,colorway_name,audience,verification_state)").order("updated_at", { ascending: false }).limit(200),
    db.from("manual_release_drafts").select("id,canonical_brand,canonical_model_name,model_family,generation,colorway_name,style_code,release_date,region,information_state,review_state,created_at,updated_at").order("created_at", { ascending: false }).limit(200),
  ]);
  if (releases.error || drafts.error) throw new Error("ADMIN_READ_FAILED");
  return { releases: releases.data ?? [], drafts: drafts.data ?? [] };
}

export async function loadEvidenceAdminData() {
  const db = requiredAdminDb();
  const [evidence, drafts] = await Promise.all([
    db.from("release_evidence").select("id,release_item_id,provider_id,source_kind,source_url,source_title,source_domain,verification_state,review_state,source_quality,first_seen_at,last_seen_at,last_verified_at").order("last_seen_at", { ascending: false }).limit(300),
    db.from("manual_evidence_drafts").select("id,source_url,source_kind,canonical_brand,canonical_model_name,style_code,colorway_name,observed_release_date,region,information_state,review_state,created_at,updated_at").order("created_at", { ascending: false }).limit(200),
  ]);
  if (evidence.error || drafts.error) throw new Error("ADMIN_READ_FAILED");
  return { evidence: evidence.data ?? [], drafts: drafts.data ?? [] };
}

export async function loadConflictAdminData() {
  const db = requiredAdminDb();
  const { data, error } = await db.from("release_conflicts")
    .select("id,release_item_id,conflict_field,observed_values,independent_source_count,status,resolution_note,detected_at,resolved_at")
    .order("detected_at", { ascending: false }).limit(300);
  if (error) throw new Error("ADMIN_READ_FAILED");
  return data ?? [];
}

export async function loadAuditLog() {
  const db = requiredAdminDb();
  const { data, error } = await db.from("data_steward_audit_log")
    .select("id,actor_id,action,entity_type,entity_id,request_id,before_fingerprint,after_fingerprint,created_at")
    .order("created_at", { ascending: false }).limit(300);
  if (error) throw new Error("ADMIN_READ_FAILED");
  return data ?? [];
}

export async function loadDataQuality() {
  const db = requiredAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
  const [providerResult, releaseResult, variantResult, evidenceResult, conflictResult, releaseDraftResult, evidenceDraftResult, ownedResult, sizeResult, fitResult, preferenceResult, purchaseResult, snapshotResult] = await Promise.all([
    db.from("provider_observations").select("provider_id,status,duration_ms,cache_status,normalized_count,exact_count,probable_count,rejected_count,safe_error_code").gte("observed_at", since).limit(MAX_ADMIN_ROWS),
    db.from("release_items").select("id,canonical_brand,canonical_model_name,model_family,generation,release_date,region").limit(MAX_ADMIN_ROWS),
    db.from("release_variants").select("release_item_id,style_code,colorway_name").limit(MAX_ADMIN_ROWS),
    db.from("release_evidence").select("source_kind,last_verified_at,review_state,content_fingerprint,source_independence_key").limit(MAX_ADMIN_ROWS),
    db.from("release_conflicts").select("release_item_id,status").eq("status", "open").limit(MAX_ADMIN_ROWS),
    db.from("manual_release_drafts").select("id").in("review_state", ["draft", "validated"]).limit(MAX_ADMIN_ROWS),
    db.from("manual_evidence_drafts").select("id").in("review_state", ["draft", "validated"]).limit(MAX_ADMIN_ROWS),
    db.from("owned_sneakers").select("id,brand,model_name,model_family,style_code,size_system").limit(MAX_ADMIN_ROWS),
    db.from("user_sizes").select("id,size_system").limit(MAX_ADMIN_ROWS),
    db.from("fit_feedback").select("id,purchase_report_id,owned_sneaker_id,overall_fit,toe_room,width_feel,heel_hold,instep_feel,same_size_again").limit(MAX_ADMIN_ROWS),
    db.from("user_preferences").select("user_id,budget_min_jpy,budget_max_jpy,inferred_preferences").limit(MAX_ADMIN_ROWS),
    db.from("purchase_reports").select("id,recommendation_snapshot_id").not("recommendation_snapshot_id", "is", null).limit(MAX_ADMIN_ROWS),
    db.from("recommendation_snapshots").select("id").limit(MAX_ADMIN_ROWS),
  ]);
  const results = [providerResult, releaseResult, variantResult, evidenceResult, conflictResult, releaseDraftResult, evidenceDraftResult, ownedResult, sizeResult, fitResult, preferenceResult, purchaseResult, snapshotResult];
  if (results.some((result) => result.error)) throw new Error("QUALITY_READ_FAILED");

  const releases = rows(releaseResult.data);
  const variants = rows(variantResult.data);
  const evidence = rows(evidenceResult.data);
  const releaseVariants = new Map<string, Record<string, unknown>[]>();
  for (const variant of variants) releaseVariants.set(String(variant.release_item_id), [...(releaseVariants.get(String(variant.release_item_id)) ?? []), variant]);
  const duplicateKeys = new Map<string, number>();
  for (const release of releases) {
    const key = [release.canonical_brand, release.canonical_model_name, release.model_family, release.generation, release.release_date, release.region].map(normalized).join("|");
    duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
  }
  const staleBefore = Date.now() - 30 * 24 * 60 * 60 * 1_000;
  const releaseQuality: ReleaseQualityInput = {
    releaseCount: releases.length,
    styleCodeMissingCount: releases.filter((release) => !(releaseVariants.get(String(release.id)) ?? []).some((variant) => Boolean(variant.style_code))).length,
    releaseDateMissingCount: releases.filter((release) => !release.release_date).length,
    regionMissingCount: releases.filter((release) => !release.region).length,
    colorwayMissingCount: releases.filter((release) => !(releaseVariants.get(String(release.id)) ?? []).some((variant) => Boolean(variant.colorway_name))).length,
    conflictCount: rows(conflictResult.data).length,
    duplicateCandidateCount: [...duplicateKeys.values()].reduce((count, value) => count + Math.max(0, value - 1), 0),
    evidenceCount: evidence.length,
    staleEvidenceCount: evidence.filter((item) => !item.last_verified_at || Date.parse(String(item.last_verified_at)) < staleBefore).length,
    officialEvidenceCount: evidence.filter((item) => ["brand_official", "authorized_retailer", "licensed_feed", "manual_official_reference", "manual_retailer_reference"].includes(String(item.source_kind))).length,
    manualReviewPendingCount: rows(releaseDraftResult.data).length + rows(evidenceDraftResult.data).length + evidence.filter((item) => item.review_state === "pending").length,
  };

  const owned = rows(ownedResult.data);
  const sizes = rows(sizeResult.data);
  const fit = rows(fitResult.data);
  const preferences = rows(preferenceResult.data);
  const snapshots = new Set(rows(snapshotResult.data).map((item) => String(item.id)));
  const purchases = rows(purchaseResult.data);
  const userQuality: UserQualityInput = {
    ownedCount: owned.length,
    ownedIdentityMatchCount: owned.filter((item) => Boolean(item.brand && item.model_name && item.model_family)).length,
    sizeRecordCount: owned.filter((item) => item.size_system).length + sizes.length,
    unknownSizeSystemCount: owned.filter((item) => !item.size_system || item.size_system === "UNKNOWN").length + sizes.filter((item) => item.size_system === "UNKNOWN").length,
    fitFeedbackCount: fit.length,
    completedFitFeedbackCount: fit.filter((item) => [item.overall_fit, item.toe_room, item.width_feel, item.heel_hold, item.instep_feel, item.same_size_again].filter((value) => value !== null && value !== undefined).length >= 4).length,
    orphanFeedbackCount: fit.filter((item) => !item.purchase_report_id || !item.owned_sneaker_id).length,
    preferenceCount: preferences.length,
    invalidPreferenceCount: preferences.filter((item) => typeof item.inferred_preferences !== "object" || (typeof item.budget_min_jpy === "number" && typeof item.budget_max_jpy === "number" && item.budget_min_jpy > item.budget_max_jpy)).length,
    snapshotLinkedCount: purchases.length,
    snapshotLinkErrorCount: purchases.filter((item) => !snapshots.has(String(item.recommendation_snapshot_id))).length,
  };
  const providerObservations: ProviderObservation[] = rows(providerResult.data).map((item) => ({
    providerId: String(item.provider_id), status: String(item.status), durationMs: Number(item.duration_ms),
    cacheStatus: item.cache_status as ProviderObservation["cacheStatus"], normalizedCount: Number(item.normalized_count),
    exactCount: Number(item.exact_count), probableCount: Number(item.probable_count), rejectedCount: Number(item.rejected_count),
    safeErrorCode: typeof item.safe_error_code === "string" ? item.safe_error_code : null,
  }));
  return evaluateDataQuality({ generatedAt: new Date().toISOString(), window: "provider=24h; domain rows capped at 10000", providerObservations, release: releaseQuality, user: userQuality });
}

export async function createManualReleaseDraft(actorId: string, input: Record<string, unknown>, requestId: string) {
  const db = requiredAdminDb();
  const { data, error } = await db.from("manual_release_drafts").insert({ ...input, created_by: actorId }).select("*").single();
  if (error || !data) throw new Error("DRAFT_WRITE_FAILED");
  await writeAudit(db, actorId, "manual_release_draft_created", "manual_release_draft", String(data.id), requestId, null, fingerprint(data));
  return data;
}

export async function createManualEvidenceDraft(actorId: string, input: Record<string, unknown>, requestId: string) {
  const db = requiredAdminDb();
  const { data, error } = await db.from("manual_evidence_drafts").insert({ ...input, created_by: actorId }).select("*").single();
  if (error || !data) throw new Error("DRAFT_WRITE_FAILED");
  await writeAudit(db, actorId, "manual_evidence_draft_created", "manual_evidence_draft", String(data.id), requestId, null, fingerprint(data));
  return data;
}

export async function reviewReleaseEvidence(actorId: string, evidenceId: string, reviewState: "accepted" | "rejected", reasonCode: string, requestId: string) {
  const db = requiredAdminDb();
  const { data: before, error: readError } = await db.from("release_evidence").select("id,review_state,verification_state,content_fingerprint").eq("id", evidenceId).maybeSingle();
  if (readError || !before) throw new Error("EVIDENCE_NOT_FOUND");
  if (reviewState === "accepted" && before.verification_state === "unverified") throw new Error("UNVERIFIED_EVIDENCE_CANNOT_BE_ACCEPTED");
  const { data: after, error } = await db.from("release_evidence").update({ review_state: reviewState }).eq("id", evidenceId).select("id,review_state,verification_state,content_fingerprint").single();
  if (error || !after) throw new Error("EVIDENCE_REVIEW_FAILED");
  const history = await db.from("release_evidence_status_history").insert({ release_evidence_id: evidenceId, from_review_state: before.review_state, to_review_state: reviewState, reason_code: reasonCode, changed_by: actorId });
  if (history.error) throw new Error("EVIDENCE_HISTORY_FAILED");
  await writeAudit(db, actorId, "release_evidence_reviewed", "release_evidence", evidenceId, requestId, fingerprint(before), fingerprint(after));
  return after;
}

export async function reviewReleaseConflict(actorId: string, conflictId: string, status: "resolved" | "dismissed", resolutionNote: string, requestId: string) {
  const db = requiredAdminDb();
  const { data: before, error: readError } = await db.from("release_conflicts").select("*").eq("id", conflictId).maybeSingle();
  if (readError || !before) throw new Error("CONFLICT_NOT_FOUND");
  if (before.status !== "open") throw new Error("CONFLICT_ALREADY_REVIEWED");
  const { data: after, error } = await db.from("release_conflicts").update({ status, resolution_note: resolutionNote, resolved_at: new Date().toISOString() }).eq("id", conflictId).eq("status", "open").select("*").single();
  if (error || !after) throw new Error("CONFLICT_REVIEW_FAILED");
  await writeAudit(db, actorId, "release_conflict_reviewed", "release_conflict", conflictId, requestId, fingerprint(before), fingerprint(after));
  return after;
}

async function writeAudit(db: ReturnType<typeof requiredAdminDb>, actorId: string, action: string, entityType: string, entityId: string, requestId: string, beforeFingerprint: string | null, afterFingerprint: string | null) {
  if (!isUuid(actorId) || !isUuid(requestId)) throw new Error("INVALID_AUDIT_IDENTITY");
  const { error } = await db.from("data_steward_audit_log").insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId.slice(0, 200), request_id: requestId, before_fingerprint: beforeFingerprint, after_fingerprint: afterFingerprint });
  if (error) throw new Error("AUDIT_WRITE_FAILED");
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item)) : [];
}

function normalized(value: unknown): string {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

function requiredAdminDb() {
  const db = createSupabaseAdminClient();
  if (!db) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  return db;
}
